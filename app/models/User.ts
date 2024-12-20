import { Instance, SnapshotOut, types, SnapshotIn } from "mobx-state-tree"
import { MediaModel } from "./Media"

export const UserModel = types.model("User").props({
  id: types.identifierNumber,
  roles: types.string,
  profilePicture: types.union(
    types.number,
    types.maybe(types.reference(types.late(() => MediaModel))),
  ),
  email: types.string,
  loginAttempts: types.number,
  updatedAt: types.string,
  createdAt: types.string,
})

export interface User extends Instance<typeof UserModel> {}
export interface UserSnapshotOut extends SnapshotOut<typeof UserModel> {}
export interface UserSnapshotIn extends SnapshotIn<typeof UserModel> {}
