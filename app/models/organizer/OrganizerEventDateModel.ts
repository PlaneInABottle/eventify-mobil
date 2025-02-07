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
    // TODO: Refactor in the future, didn't like it very much
    get datesLocationsAsList() {
      return Array.from(self.datesLocations.values()).sort((a, b) =>
        a.start_time.localeCompare(b.start_time),
      )
    },
    get eventsDatesByEventId() {
      const map = new Map()
      self.datesLocations.forEach((dateLoc) => {
        const eventId = dateLoc.event_id.id
        if (!map.has(eventId)) map.set(eventId, [dateLoc])
        else map.get(eventId).push(dateLoc)
      })
      return map
    },
    get eventsDatesByLocationId() {
      const dateLocationMap = new Map()

      self.datesLocations.forEach((dateLoc) => {
        const locationId = dateLoc.location_id.id
        const list = dateLocationMap.get(locationId) || []

        // Insert in sorted order (binary search insertion could be used for better performance)
        const index = list.findIndex(
          (item: OrganizerEventDateLocationSnapshotIn) => item.start_time > dateLoc.start_time,
        )
        if (index === -1) {
          list.push(dateLoc)
        } else {
          list.splice(index, 0, dateLoc)
        }

        dateLocationMap.set(locationId, list)
      })
      return dateLocationMap
    },
  }))
  .views((self) => ({
    forSelectFieldForAnEvent(eventId: string): Array<{ label: string; value: string }> {
      const rootStore = getRootStore(self)
      const chatsDatesLocationIds = rootStore.organizerChatStore.chatsByDateLocationId

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
    setDatesLocationsFromArrayToMap: (datesLocations: OrganizerEventDateLocationSnapshotIn[]) => {
      datesLocations.forEach((dl) => {
        store.datesLocations.put(dl)
      })
    },
  }))
  .actions((store) => ({
    clearAndSet: (
      datesLocations: OrganizerEventDateLocationSnapshotIn[],
      newDatesLocationsIds: Set<string>,
    ) => {
      for (const key of store.datesLocations.keys()) {
        if (!newDatesLocationsIds.has(key)) store.datesLocations.delete(key)
      }
      store.setDatesLocationsFromArrayToMap(datesLocations)
    },
  }))

export interface OrganizerEventDateLocationSnapshotIn
  extends SnapshotIn<typeof OrganizerEventDateLocationModel> {}
export interface OrganizerEventDateLocation
  extends Instance<typeof OrganizerEventDateLocationModel> {}
