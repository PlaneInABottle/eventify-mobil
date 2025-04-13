import { IAnyModelType, Instance, SnapshotIn, SnapshotOut, flow, types } from "mobx-state-tree"
import * as ImagePicker from "expo-image-picker"
import { supabase } from "@/services/auth/supabase"
import { handleError } from "@/utils/errorHandler"
import { handleSuccess } from "@/utils/successHandler"
import { getRootStore } from "@/models/helpers/getRootStore"
import { withSetPropAction } from "@/models/helpers/withSetPropAction"

export const UserProfileModel = types.model("UserProfile").props({
  id: types.identifier,
  display_name: types.maybeNull(types.string),
  avatar_url: types.maybeNull(types.string),
  email: types.string,
  about: types.maybeNull(types.string),
  age: types.maybeNull(types.number),
})

export const UserProfileStoreModel: IAnyModelType = types

  .model("UserProfileStore")
  .props({
    profile: types.maybe(UserProfileModel),
  })
  .volatile(() => ({
    isUploading: false,
  }))
  .actions(withSetPropAction)
  .actions((store) => ({
    clearUser() {
      store.profile = undefined
    },
    setUploading(value: boolean) {
      store.isUploading = value
    },
  }))
  .actions((store) => ({
    fetchProfile: flow(function* (userIdProp: string) {
      try {
        if (!userIdProp) throw Error("errors:notFound")

        const { data: profile, error } = yield supabase
          .from("profiles")
          .select("*")
          .eq("id", userIdProp)
          .single()

        if (error) throw error

        if (!profile) throw new Error("errors:notFound")

        store.setProp("profile", profile)
        return true
      } catch (error) {
        handleError(error)
        return false
      }
    }),
    updateProfile: flow(function* (updates: Partial<IUserProfile>) {
      if (!store.profile?.id) throw Error("errors:notFound")

      try {
        const { error } = yield supabase.from("profiles").update(updates).eq("id", store.profile.id)

        if (error) throw error

        store.setProp("profile", { ...store.profile, ...updates })
        return true
      } catch (error) {
        handleError(error)
        return false
      }
    }),
  }))
  .actions((store) => ({
    uploadAvatar: flow(function* () {
      if (!store.profile?.id) throw Error("errors:notFound")

      try {
        const result = yield ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"], // Restrict to only images
          allowsMultipleSelection: false, // Can only select one image
          allowsEditing: true, // Allows the user to crop / rotate their photo before uploading it
          quality: 1,
          exif: false, // We don't want nor need that data.
        })

        if (result.canceled || !result.assets || result.assets.length === 0) {
          return false
        }

        const image = result.assets[0]
        const fileExt = image.uri?.split(".").pop()?.toLowerCase() ?? "jpeg"
        const path = `${store.profile.id}/${Date.now()}.${fileExt}`
        const arraybuffer = yield fetch(image.uri).then((res) => res.arrayBuffer())
        const { data, error: uploadError } = yield supabase.storage
          .from("avatars")
          .upload(path, arraybuffer, {
            contentType: image.mimeType ?? "image/jpeg",
            upsert: true,
          })

        if (uploadError) {
          throw uploadError
        }
        yield store.updateProfile({ avatar_url: data.path })
        return true
      } catch (error) {
        return handleError(error).message
      }
    }),
  }))
  .actions((store) => ({
    report: flow(function* (reportedItemId: string, reportType: string, reason: string) {
      try {
        const { error } = yield supabase.from("reports").insert({
          reporter_id: getRootStore(store).userStore.userId,
          report_type: reportType,
          reported_id: reportedItemId,
          reason,
        })
        if (error) throw error
        handleSuccess("success:reportSent", {
          duration: 6000,
        })
      } catch (error) {
        handleError(error)
      }
    }),
    deleteProfile: flow(function* () {
      try {
        const { error } = yield supabase.rpc("delete_user")

        if (error) throw Error("errors:profile.deleteFailed")

        getRootStore(store).resetAllStores()
      } catch (e) {
        handleError(e)
      }
    }),
  }))

export interface IUserProfile extends Instance<typeof UserProfileModel> {}
export interface IUserProfileSnapshotOut extends SnapshotOut<typeof UserProfileModel> {}
export interface IUserProfileSnapshotIn extends SnapshotIn<typeof UserProfileModel> {}

export interface IUserProfileStore extends Instance<typeof UserProfileStoreModel> {}
export interface IUserProfileStoreSnapshotOut extends SnapshotOut<typeof UserProfileStoreModel> {}
export interface IUserProfileStoreSnapshotIn extends SnapshotIn<typeof UserProfileStoreModel> {}
