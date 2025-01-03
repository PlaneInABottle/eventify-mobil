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
  }))
  .actions((store) => ({
    setUser(userData: User) {
      store.user = UserModel.create(userData)
    },
    clearUser() {
      store.user = undefined
      store.error = undefined
    },
    setError(value: string | undefined) {
      store.error = value
    },
  }))
  .actions((store) => ({
    fetchProfile: flow(function* (userId: string) {
      if (!userId) {
        store.setError("User ID is required")
        return false
      }

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

        store.setUser(profile)
        store.setError(undefined)
        return true
      } catch (error) {
        store.setError(error instanceof Error ? error.message : "An unexpected error occurred")
        return false
      }
    }),
    updateProfile: flow(function* (updates: Partial<User>) {
      try {
        const { data: updatedProfile, error } = yield supabase
          .from("profiles")
          .update(updates)
          .eq("id", store.user?.id)
          .single()

        if (error) {
          store.setError(error.message)
          return false
        }

        if (!updatedProfile) {
          store.setError("Failed to update profile")
          return false
        }

        store.setUser(updatedProfile)
        store.setError(undefined)
        return true
      } catch (error) {
        store.setError(error instanceof Error ? error.message : "An unexpected error occurred")
        return false
      }
    }),
  }))

export interface UserStore extends Instance<typeof UserStoreModel> {}
export interface UserStoreSnapshotOut extends SnapshotOut<typeof UserStoreModel> {}
export interface UserStoreSnapshotIn extends SnapshotIn<typeof UserStoreModel> {}
