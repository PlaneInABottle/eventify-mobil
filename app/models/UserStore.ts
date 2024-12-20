import { api } from "@/services/api"
import { Instance, SnapshotOut, types, flow, SnapshotIn } from "mobx-state-tree"
import { User, UserModel } from "./User"

export const UserStoreModel = types
  .model("UserStore")
  .props({
    user: types.maybe(UserModel),
  })
  .actions((store) => ({
    setUser(userData: User) {
      store.user = UserModel.create(userData)
    },
    clearUser() {
      store.user = undefined
    },
  }))
  .actions((store) => ({
    updateProfile: flow(function* (updates: Partial<User>) {
      // Handle profile updates separately from auth
      const response = yield api.updateProfile(updates)
      if (response.kind === "ok") {
        store.setUser(response.user)
      }
    }),
  }))

export interface UserStore extends Instance<typeof UserStoreModel> {}
export interface UserStoreSnapshotOut extends SnapshotOut<typeof UserStoreModel> {}
export interface UserStoreSnapshotIn extends SnapshotIn<typeof UserStoreModel> {}
