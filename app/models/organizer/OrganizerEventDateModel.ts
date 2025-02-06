import { Instance, SnapshotIn, types } from "mobx-state-tree"
import { OrganizerEventModel } from "./OrganizerEventStore"
import { LocationModel } from "../location/LocationStore"
import { formatDate } from "@/utils/formatDate"
import { withSetPropAction } from "../helpers/withSetPropAction"
import { getRootStore } from "../helpers/getRootStore"

export const OrganizerEventDateLocationModel = types
  .model("OrganizerEventDate")
  .props({
    id: types.identifier,
    event_id: types.reference(OrganizerEventModel),
    location_id: types.reference(LocationModel),
    start_time: types.string,
    end_time: types.maybeNull(types.string),
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
    datesLocations: types.map(OrganizerEventDateLocationModel),
  })
  .views((self) => ({
    get datesLocationsAsList() {
      return Array.from(self.datesLocations.values())
    },
    get eventsDatesByEventId() {
      const eventDateMap = new Map()
      self.datesLocations.forEach((eventDate) => {
        const eventId = eventDate.event_id.id
        if (!eventDateMap.has(eventId)) {
          eventDateMap.set(eventId, [eventDate])
        } else {
          eventDateMap.get(eventId).push(eventDate)
        }
      })
      return eventDateMap
    },
    get eventsDatesByLocationId() {
      const dateLocationMap = new Map()
      self.datesLocations.forEach((dateLocation) => {
        const locationId = dateLocation.location_id.id
        if (!dateLocationMap.has(locationId)) {
          dateLocationMap.set(locationId, [dateLocation])
        } else {
          dateLocationMap.get(locationId).push(dateLocation)
        }
      })
      return dateLocationMap
    },
  }))
  .views((self) => ({
    forSelectFieldForAnEvent(eventId: string): Array<{ label: string; value: string }> {
      const rootStore = getRootStore(self)
      const chatsDatesLocationIds = rootStore.organizerChatStore.dateLocationIdsAsList

      const eventDates = (self.eventsDatesByEventId.get(eventId) || []).filter(
        (date: OrganizerEventDateLocationSnapshotIn) => !chatsDatesLocationIds.has(date.id),
      )
      return eventDates.map((val: OrganizerEventDateLocation) => ({
        label: `${val.dateFormatted.textLabel} - ${val.timeFormatted.textLabel}\n${val.location_id.name}`,
        value: val.id,
      }))
    },
  }))
  .actions(withSetPropAction)
  .actions((store) => ({
    clearOldDates: (oldIds: string[]) => {
      const rootStore = getRootStore(store)
      const chats = rootStore.organizerChatStore.chatsAsList

      const willDeletedChatIds = chats
        .filter((chat) => oldIds.includes(chat.events_dates_locations_id.id))
        .map((chat) => chat.id)

      rootStore.organizerChatStore.deleteChat(willDeletedChatIds)
      oldIds.forEach((oldID: string) => {
        store.datesLocations.delete(oldID)
      })
    },
    setDatesLocationsFromArrayToMap: (datesLocations: any) => {
      datesLocations.forEach((dl: any) => {
        store.datesLocations.put(dl)
      })
    },
  }))
  .actions((store) => ({
    clearAndSet: (datesLocations: OrganizerEventDateLocationSnapshotIn[]) => {
      store.datesLocations.clear()
      store.setDatesLocationsFromArrayToMap(datesLocations)
    },
  }))

export interface OrganizerEventDateLocationSnapshotIn
  extends SnapshotIn<typeof OrganizerEventDateLocationModel> {}
export interface OrganizerEventDateLocation
  extends Instance<typeof OrganizerEventDateLocationModel> {}
