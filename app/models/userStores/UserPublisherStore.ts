import { Instance, SnapshotIn, types } from "mobx-state-tree"
import { withSetPropAction } from "@/models/helpers/withSetPropAction"

export const UserPublisherModel = types.model("UserPublisher").props({
  id: types.identifier,
  email: types.string,
  about: types.maybeNull(types.string),
  age: types.maybeNull(types.string),
  avatar_url: types.maybeNull(types.string),
  display_name: types.string,
})

export const UserPublisherStoreModel = types
  .model("UserPublisherStore")
  .props({
    publishers: types.array(UserPublisherModel),
  })
  .actions(withSetPropAction)

export interface IUserPublisherStore extends Instance<typeof UserPublisherStoreModel> {}
export interface IUserPublisherSnapshotIn extends SnapshotIn<typeof UserPublisherModel> {}
