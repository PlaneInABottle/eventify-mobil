import { Instance, SnapshotOut, types } from "mobx-state-tree"
import { AuthenticationStoreModel } from "./AuthenticationStore"
import { EpisodeStoreModel } from "./EpisodeStore"
import { UserStoreModel } from "./UserStore"
import { EventStoreModel } from "./EventStore"
import { ChatStoreModel } from "./ChatStore"
import { withSetPropAction } from "./helpers/withSetPropAction"

/**
 * A RootStore model.
 */
export const RootStoreModel = types
  .model("RootStore")
  .props({
    authenticationStore: types.optional(AuthenticationStoreModel, {}),
    userStore: types.optional(UserStoreModel, {}),
    episodeStore: types.optional(EpisodeStoreModel, {}),
    eventStore: types.optional(EventStoreModel, {}),
    chatStore: types.optional(ChatStoreModel, {}),
  })
  .actions(withSetPropAction)
  .actions((store) => ({
    resetAllStores() {
      store.setProp("authenticationStore", undefined)
      store.setProp("userStore", undefined)
      store.setProp("episodeStore", undefined)
      store.setProp("eventStore", undefined)
      store.setProp("chatStore", undefined)
    },
  }))

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> {}
/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}
