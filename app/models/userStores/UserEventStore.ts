import { Instance, SnapshotIn, flow, types } from "mobx-state-tree"
import { Region } from "react-native-maps"
import { supabase } from "@/services/auth/supabase"
import { handleError } from "@/utils/errorHandler"
import { transformRegionForSupabase } from "@/utils/regionFunctions"
import { getRootStore } from "@/models/helpers/getRootStore"
import { withSetPropAction } from "@/models/helpers/withSetPropAction"
import { UserPublisherModel } from "@/models/userStores/UserPublisherStore"

export const UserEventModel = types.model("UserEvent").props({
  id: types.identifier,
  publisher_id: types.reference(UserPublisherModel),
  title: types.string,
  description: types.optional(types.string, ""),
  image_url: types.maybeNull(types.string),
})

export const UserEventStoreModel = types
  .model("UserEventStore")
  .props({
    events: types.array(UserEventModel),
    typeFilters: types.array(types.string),
    dateFilters: types.array(types.string),
  })
  .views((self) => ({
    get eventsAsList() {
      return self.events.slice()
    },
    get forSelectField() {
      return self.events.map((val) => {
        return { label: val.title, value: val.id }
      })
    },
    eventById(eventId: string | undefined) {
      return self.events.find((event) => event.id === eventId)
    },
  }))
  .actions(withSetPropAction)
  .actions((store) => ({
    fetchEventsInSight: flow(function* (bounds: Region, userId: string) {
      try {
        const regionForSupabase = transformRegionForSupabase(bounds)
        const { data, error } = yield supabase.rpc("events_in_sight", {
          ...regionForSupabase,
          _user_id: userId,
          _date_filters: store.dateFilters,
          _type_filters: store.typeFilters,
        })

        if (error) throw error

        store.setProp("events", data.events ?? [])
        getRootStore(store).locationStore.setProp("locations", data.locations ?? [])
        getRootStore(store).publisherStore.setProp("publishers", data.publishers ?? [])
        getRootStore(store).organizerChatStore.setProp("chats", data.eventChats ?? [])
        getRootStore(store).campaignStore.setProp("campaigns", data.campaigns ?? [])
        getRootStore(store).campaignRuleStore.setProp("rules", data.campaignRules ?? [])
        getRootStore(store).organizerEventDateLocationStore.setProp(
          "datesLocations",
          data.datesLocations ?? [],
        )
      } catch (e) {
        handleError(e)
      }
    }),
  }))

export interface IUserEvent extends Instance<typeof UserEventModel> {}
export interface IUserEventSnapshotIn extends SnapshotIn<typeof UserEventModel> {}
export interface IUserEventStore extends Instance<typeof UserEventStoreModel> {}
