import { Instance, SnapshotIn, flow, types } from "mobx-state-tree"
import { OrganizerEventModel } from "./OrganizerEventStore"
import { LocationModel } from "../location/LocationStore"
import { formatDate } from "@/utils/formatDate"
import { withSetPropAction } from "../helpers/withSetPropAction"
import { getRootStore } from "../helpers/getRootStore"
import { handleError } from "@/utils/errorHandler"
import { supabase } from "@/services/auth/supabase"

export const OrganizerEventDateLocationModel = types
  .model("OrganizerEventDate")
  .props({
    id: types.identifier,
    event_id: types.reference(OrganizerEventModel),
    location_id: types.reference(LocationModel),
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

export const OrganizerEventDateLocationStoreModel = types
  .model("OrganizerEventDateLocation")
  .props({
    datesLocations: types.array(OrganizerEventDateLocationModel),
  })
  .views((self) => ({
    // TODO: Refactor in the future, didn't like it very much
    get datesLocationsAsList() {
      return self.datesLocations.slice().sort((a, b) => a.start_time.localeCompare(b.start_time))
    },
    eventsDatesByEventId(eventId: string | undefined) {
      return self.datesLocations.filter((dl) => dl.event_id.id === eventId)
    },
    eventsDatesByLocationId(locationId: string) {
      return self.datesLocations
        .filter((dl) => dl.location_id.id === locationId)
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

      return eventDates.map((val: OrganizerEventDateLocation) => ({
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

export interface OrganizerEventDateLocationSnapshotIn
  extends SnapshotIn<typeof OrganizerEventDateLocationModel> {}
export interface OrganizerEventDateLocation
  extends Instance<typeof OrganizerEventDateLocationModel> {}
