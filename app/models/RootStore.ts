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
import { CampaignStoreModel } from "./campaign/CampaignStore"
import { CampaignRuleStoreModel } from "./campaign/CampaignRuleStore"
import { CampaignCodeStoreModel } from "./campaign/CampaignCodeStore"
import { UserAuthenticationStoreModel } from "./userStores/UserAuthenticationStore"
import { UserEventStoreModel } from "./userStores/UserEventStore"
import { UserLocationStoreModel } from "./userStores/UserLocationStore"
import { UserPublisherStoreModel } from "./userStores/UserPublisherStore"
import { UserEventDateLocationStoreModel } from "./userStores/UserEventDateStore"
import { UserChatStoreModel } from "./userStores/UserChatStore"
import { UserCampaignStoreModel } from "./userStores/UserCampaignStore"
import { UserCampaignCodeStoreModel } from "./userStores/UserCampaignCodeStore"
import { UserProfileStoreModel } from "./userStores/UserProfileStore"

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
    campaignStore: types.optional(CampaignStoreModel, {}),
    campaignRuleStore: types.optional(CampaignRuleStoreModel, {}),
    campaignCodeStore: types.optional(CampaignCodeStoreModel, {}),
    // User stores
    userAuthenticationStore: types.optional(UserAuthenticationStoreModel, {}),
    userProfileStore: types.optional(UserProfileStoreModel, {}),
    userEventStore: types.optional(UserEventStoreModel, {}),
    userLocationStore: types.optional(UserLocationStoreModel, {}),
    userPublisherStore: types.optional(UserPublisherStoreModel, {}),
    userEventDateLocationStore: types.optional(UserEventDateLocationStoreModel, {}),
    userChatStore: types.optional(UserChatStoreModel, {}),
    userCampaignStore: types.optional(UserCampaignStoreModel, {}),
    userCampaignCodeStore: types.optional(UserCampaignCodeStoreModel, {}),
  })
  .actions(withSetPropAction)
  .actions((store) => ({
    resetAllStores() {
      store.setProp("authenticationStore", undefined)
      store.setProp("userAuthenticationStore", undefined)
      store.setProp("userStore", undefined)
      store.setProp("eventStore", undefined)
      store.setProp("chatStore", undefined)
      store.setProp("publisherStore", undefined)
      store.setProp("organizerEventStore", undefined)
      store.setProp("organizerEventDateLocationStore", undefined)
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
