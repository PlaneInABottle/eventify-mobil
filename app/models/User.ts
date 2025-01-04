import { Instance, SnapshotOut, types, SnapshotIn } from "mobx-state-tree"

export const UserModel = types.model("User").props({
  id: types.identifier,
  display_name: types.maybeNull(types.string),
  avatar_url: types.maybeNull(types.string),
  email: types.string,
  about: types.maybeNull(types.string),
  age: types.maybeNull(types.number),
  updated_at: types.maybeNull(types.string),
  created_at: types.string,
})

export interface User extends Instance<typeof UserModel> {}
export interface UserSnapshotOut extends SnapshotOut<typeof UserModel> {}
export interface UserSnapshotIn extends SnapshotIn<typeof UserModel> {}
