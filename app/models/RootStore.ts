import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { AuthenticationStoreModel } from "./AuthenticationStore"
// import { EpisodeStoreModel } from "./EpisodeStore"
import { UserStoreModel } from "./UserStore"
import { EventStoreModel } from "./EventStore"

/**
 * A RootStore model.
 */
export const RootStoreModel = types.model("RootStore").props({
  authenticationStore: types.optional(AuthenticationStoreModel, {}),
  userStore: types.optional(UserStoreModel, {}),
  // episodeStore: types.optional(EpisodeStoreModel, {}),
  eventStore: types.optional(EventStoreModel, {}),
})

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> {}
/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}
