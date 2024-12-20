import { Instance, SnapshotOut, types, SnapshotIn } from "mobx-state-tree"

export const UserModel = types.model("User").props({
  id: types.identifier,
  roles: types.string,
  profilePictureUrl: types.maybe(types.string),
  email: types.string,
  loginAttempts: types.number,
  updatedAt: types.string,
  createdAt: types.string,
})

export interface User extends Instance<typeof UserModel> {}
export interface UserSnapshotOut extends SnapshotOut<typeof UserModel> {}
export interface UserSnapshotIn extends SnapshotIn<typeof UserModel> {}
