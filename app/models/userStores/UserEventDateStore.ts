import { Instance, SnapshotIn, flow, types } from "mobx-state-tree"
import { supabase } from "@/services/auth/supabase"
import { formatDate } from "@/utils/formatDate"
import { handleError } from "@/utils/errorHandler"
import { withSetPropAction } from "@/models/helpers/withSetPropAction"
import { getRootStore } from "@/models/helpers/getRootStore"
import { UserEventModel } from "@/models/userStores/UserEventStore"
import { UserLocationModel } from "./UserLocationStore"

export const UserEventDateLocationModel = types
  .model("UserEventDate")
  .props({
    id: types.identifier,
    event_id: types.reference(UserEventModel),
    location_id: types.reference(UserLocationModel),
    start_time: types.string,
    end_time: types.maybeNull(types.string),
    is_user_favorite: types.maybeNull(types.boolean),
  })
  .views((self) => ({
    get dateFormatted() {
      const formatted = formatDate(self.start_time, "eee, MMM dd, yyyy")
      return {
        textLabel: formatted,
      }
    },
    get timeFormatted() {
      const formatted = formatDate(self.start_time, "HH:mm")
      return {
        textLabel: formatted,
      }
    },
  }))
  .actions(withSetPropAction)

export const UserEventDateLocationStoreModel = types
  .model("UserEventDateLocation")
  .props({
    datesLocations: types.array(UserEventDateLocationModel),
  })
  .views((self) => ({
    get datesLocationsAsList() {
      return self.datesLocations.slice().sort((a, b) => a.start_time.localeCompare(b.start_time))
    },
    eventsDatesByEventId(eventId: string | undefined) {
      return self.datesLocations.filter((dl) => dl.event_id.id === eventId)
    },
    eventsDatesByLocationId(locationId: string) {
      const now = new Date().toISOString()
      return self.datesLocations
        .filter((dl) => dl.start_time >= now && dl.location_id.id === locationId)
        .sort((a, b) => a.start_time.localeCompare(b.start_time))
    },
  }))
  .views((self) => ({
    forSelectFieldForAnEvent(eventId: string): Array<{ label: string; value: string }> {
      const chatsDatesLocationIds = getRootStore(self).organizerChatStore.chatsByDateLocationId

      const eventDates = self
        .eventsDatesByEventId(eventId)
        // Filter out dates that ALREADY HAVE chats
        .filter((dl) => chatsDatesLocationIds(dl.id).length === 0)

      return eventDates.map((val: IUserEventDateLocation) => ({
        label: `${val.dateFormatted.textLabel} - ${val.timeFormatted.textLabel}\n${val.location_id.name}`,
        value: val.id,
      }))
    },
  }))
  .actions(withSetPropAction)
  .actions((store) => ({
    toggleFavorite: flow(function* (dateLocId: string, userId: string) {
      try {
        const { error } = yield supabase.rpc("toggle_favorite_event_date", {
          _user_id: userId,
          _events_dates_locations_id: dateLocId,
        })
        if (error) throw error
        const changedObject = store.datesLocations.find((dl) => dl.id === dateLocId)!
        changedObject.is_user_favorite = !changedObject?.is_user_favorite
      } catch (e) {
        handleError(e)
      }
    }),
  }))

export interface IUserEventDateLocation extends Instance<typeof UserEventDateLocationModel> {}
export interface IUserEventDateLocationSnapshotIn
  extends SnapshotIn<typeof UserEventDateLocationModel> {}
