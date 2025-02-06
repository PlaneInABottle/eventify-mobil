import { Instance, SnapshotOut, flow, types } from "mobx-state-tree"
import { AuthenticationStoreModel } from "./AuthenticationStore"
import { UserStoreModel } from "./UserStore"
import { EventStoreModel } from "./EventStore"
import { ChatStoreModel } from "./ChatStore"
import { withSetPropAction } from "./helpers/withSetPropAction"
import { handleError } from "@/utils/errorHandler"
import { LocationStoreModel } from "./location/LocationStore"
import { OrganizerEventStoreModel, PublisherStoreModel } from "./organizer/OrganizerEventStore"
import { OrganizerChatStoreModel } from "./organizer/OrganizerChatStore"
import { OrganizerEventDateLocationStoreModel } from "./organizer/OrganizerEventDateModel"

/**
 * A RootStore model.
 */
export const RootStoreModel = types
  .model("RootStore")
  .props({
    authenticationStore: types.optional(AuthenticationStoreModel, {}),
    userStore: types.optional(UserStoreModel, {}),
    eventStore: types.optional(EventStoreModel, {}),
    chatStore: types.optional(ChatStoreModel, {}),
    locationStore: types.optional(LocationStoreModel, {}),
    organizerEventStore: types.optional(OrganizerEventStoreModel, {}),
    organizerChatStore: types.optional(OrganizerChatStoreModel, {}),
    publisherStore: types.optional(PublisherStoreModel, {}),
    organizerEventDateLocationStore: types.optional(OrganizerEventDateLocationStoreModel, {}),
  })
  .actions(withSetPropAction)
  .actions((store) => ({
    resetAllStores() {
      store.setProp("authenticationStore", undefined)
      store.setProp("userStore", undefined)
      store.setProp("eventStore", undefined)
      store.setProp("chatStore", undefined)
      store.setProp("publisherStore", undefined)
      store.setProp("organizerEventStore", undefined)
      store.setProp("organizerChatStore", undefined)
      store.setProp("locationStore", undefined)
    },
    getInitialData: flow(function* (userId: string) {
      try {
        store.userStore.fetchProfile(userId)
        yield store.eventStore.fetchInitialEvents(userId)
        // store.chatStore.fetchUserChats(userId)
      } catch (e) {
        handleError(e)
      }
    }),
  }))

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> {}
/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}
