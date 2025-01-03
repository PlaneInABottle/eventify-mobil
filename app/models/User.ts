import { Instance, SnapshotOut, types, SnapshotIn } from "mobx-state-tree"

export const UserModel = types.model("User").props({
  id: types.identifier,
  name: types.maybe(types.string),
  avatarUrl: types.maybe(types.string),
  email: types.string,
  about: types.maybe(types.string),
  age: types.maybe(types.number),
  updatedAt: types.maybe(types.string),
  createdAt: types.string,
})

export interface User extends Instance<typeof UserModel> {}
export interface UserSnapshotOut extends SnapshotOut<typeof UserModel> {}
export interface UserSnapshotIn extends SnapshotIn<typeof UserModel> {}
