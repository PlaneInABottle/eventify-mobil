import { Instance, SnapshotOut, types, flow, SnapshotIn, IAnyModelType } from "mobx-state-tree"
import { User, UserModel } from "./User"
import { supabase } from "@/services/auth/supabase"
import * as ImagePicker from "expo-image-picker"
import { withSetPropAction } from "./helpers/withSetPropAction"
import { getRootStore } from "./helpers/getRootStore"
import { handleError } from "@/utils/errorHandler"
export const UserStoreModel: IAnyModelType = types
  .model("UserStore")
  .props({
    user: types.maybe(UserModel),
  })
  .volatile(() => ({
    isLoading: false,
    isUploading: false,
  }))
  .views((store) => ({
    get userId() {
      return store.user?.id
    },
  }))
  .actions(withSetPropAction)
  .actions((store) => ({
    clearUser() {
      store.user = undefined
      store.isLoading = false
    },
    setLoading(value: boolean) {
      store.isLoading = value
    },
    setUploading(value: boolean) {
      store.isUploading = value
    },
  }))
  .actions((store) => ({
    fetchProfile: flow(function* (userIdProp: string) {
      try {
        store.setLoading(true)
        if (!userIdProp) throw Error("errors:notFound")

        const { data: profile, error } = yield supabase
          .from("profiles")
          .select("*")
          .eq("id", userIdProp)
          .single()

        if (error) throw error

        if (!profile) throw new Error("errors:notFound")

        store.setProp("user", profile)
        return true
      } catch (error) {
        handleError(error)
        return false
      } finally {
        store.setLoading(false)
      }
    }),
    updateProfile: flow(function* (updates: Partial<User>) {
      if (!store.user?.id) throw Error("errors:notFound")

      store.setLoading(true)
      try {
        const { error } = yield supabase.from("profiles").update(updates).eq("id", store.user.id)

        if (error) throw error

        store.setProp("user", { ...store.user, ...updates })
        return true
      } catch (error) {
        handleError(error)
        return false
      } finally {
        store.setLoading(false)
      }
    }),
  }))
  .actions((store) => ({
    uploadAvatar: flow(function* () {
      if (!store.user?.id) throw Error("erros:notFound")

      store.setUploading(true)
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
        const path = `${store.user.id}/${Date.now()}.${fileExt}`
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
        handleError(error)
        return false
      } finally {
        store.setUploading(false)
      }
    }),
  }))
  .actions((store) => ({
    report: flow(function* (reportedItemId: string, reportType: string, reason: string) {
      store.setLoading(true)
      try {
        const { error } = yield supabase.from("reports").insert({
          reporter_id: getRootStore(store).userStore.userId,
          report_type: reportType,
          reported_id: reportedItemId,
          reason,
        })
        if (error) throw error
      } catch (error) {
        handleError(error)
      } finally {
        store.setLoading(false)
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

export interface UserStore extends Instance<typeof UserStoreModel> {}
export interface UserStoreSnapshotOut extends SnapshotOut<typeof UserStoreModel> {}
export interface UserStoreSnapshotIn extends SnapshotIn<typeof UserStoreModel> {}
