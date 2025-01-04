import { Instance, SnapshotOut, types, flow, SnapshotIn } from "mobx-state-tree"
import { User, UserModel } from "./User"
import { supabase } from "@/services/auth/supabase"

export const UserStoreModel = types
  .model("UserStore")
  .props({
    user: types.maybe(UserModel),
  })
  .volatile(() => ({
    error: undefined as string | undefined,
    isLoading: false,
  }))
  .views((store) => ({
    get userId() {
      return store.user?.id
    },
  }))
  .actions((store) => ({
    setUser(userData: any) {
      try {
        store.user = UserModel.create(userData)
        store.error = undefined
        return true
      } catch (error) {
        store.error = error instanceof Error ? error.message : "Invalid user data format"
        return false
      }
    },
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
          store.setError(error.message)
          return false
        }

        if (!profile) {
          store.setError("Profile not found")
          return false
        }

        return store.setUser(profile)
      } catch (error) {
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
        const { data: updatedProfile, error } = yield supabase
          .from("profiles")
          .update(updates)
          .eq("id", store.user.id)
          .single()

        if (error) {
          store.setError(error.message)
          return false
        }

        if (!updatedProfile) {
          store.setError("Failed to update profile")
          return false
        }

        return store.setUser(updatedProfile)
      } catch (error) {
        store.setError(error instanceof Error ? error.message : "An unexpected error occurred")
        return false
      } finally {
        store.setLoading(false)
      }
    }),
  }))

export interface UserStore extends Instance<typeof UserStoreModel> {}
export interface UserStoreSnapshotOut extends SnapshotOut<typeof UserStoreModel> {}
export interface UserStoreSnapshotIn extends SnapshotIn<typeof UserStoreModel> {}
