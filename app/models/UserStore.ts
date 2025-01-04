import { Instance, SnapshotOut, types, flow, SnapshotIn } from "mobx-state-tree"
import { User, UserModel } from "./User"
import { supabase } from "@/services/auth/supabase"
import * as ImagePicker from "expo-image-picker"
import { withSetPropAction } from "./helpers/withSetPropAction"
export const UserStoreModel = types
  .model("UserStore")
  .props({
    user: types.maybe(UserModel),
  })
  .volatile(() => ({
    error: undefined as string | undefined,
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
      store.error = undefined
      store.isLoading = false
    },
    setError(value: string | undefined) {
      store.error = value
    },
    setLoading(value: boolean) {
      store.isLoading = value
    },
    setUploading(value: boolean) {
      store.isUploading = value
    },
  }))
  .actions((store) => ({
    fetchProfile: flow(function* (userId: string) {
      if (!userId) {
        store.setError("User ID is required")
        return false
      }

      store.setLoading(true)
      try {
        const { data: profile, error } = yield supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()

        if (error) {
          throw error
        }

        if (!profile) {
          throw new Error("Profile not found")
        }

        store.setProp("user", profile)
        return true
      } catch (error) {
        console.log(error)
        store.setError(error instanceof Error ? error.message : "An unexpected error occurred")
        return false
      } finally {
        store.setLoading(false)
      }
    }),
    updateProfile: flow(function* (updates: Partial<User>) {
      if (!store.user?.id) {
        store.setError("No user logged in")
        return false
      }

      store.setLoading(true)
      try {
        const { error } = yield supabase.from("profiles").update(updates).eq("id", store.user.id)

        if (error) {
          throw error
        }

        store.setProp("user", { ...store.user, ...updates })
        return true
      } catch (error) {
        console.log("Error", error)
        store.setError(error instanceof Error ? error.message : "An unexpected error occurred")
        return false
      } finally {
        store.setLoading(false)
      }
    }),
  }))
  .actions((store) => ({
    uploadAvatar: flow(function* () {
      if (!store.user?.id) {
        store.setError("No user logged in")
        return false
      }

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
          console.log("User cancelled image picker.")
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
        console.log("Error", error)
        store.setError(error instanceof Error ? error.message : "Failed to upload avatar")
        return false
      } finally {
        store.setUploading(false)
      }
    }),
    getPublicUrl: flow(function* () {
      try {
        if (!store.user?.avatar_url) return

        const { data } = yield Promise.resolve(
          supabase.storage.from("avatars").getPublicUrl(store.user.avatar_url),
        )
        return data.publicUrl
      } catch (error) {
        store.setError(error instanceof Error ? error.message : "Failed to download avatar")
        return null
      }
    }),
  }))

export interface UserStore extends Instance<typeof UserStoreModel> {}
export interface UserStoreSnapshotOut extends SnapshotOut<typeof UserStoreModel> {}
export interface UserStoreSnapshotIn extends SnapshotIn<typeof UserStoreModel> {}
