import { Instance, SnapshotIn, types } from "mobx-state-tree"
import { OrganizerEventModel } from "./OrganizerEventStore"
import { LocationModel } from "../location/LocationStore"
import { formatDate } from "@/utils/formatDate"
import { withSetPropAction } from "../helpers/withSetPropAction"

export const OrganizerEventDateLocationModel = types
  .model("OrganizerEventDate")
  .props({
    id: types.identifier,
    event_id: types.reference(OrganizerEventModel),
    location_id: types.reference(LocationModel),
    start_time: types.string,
    end_time: types.maybeNull(types.string),
  })
  .actions(withSetPropAction)
  .views((self) => ({
    get dateFormatted() {
      const formatted = formatDate(self.start_time, "MMM dd, yyyy")
      return {
        textLabel: formatted,
      }
    },
    get timeFormatted() {
      const formatted = formatDate(self.start_time, "hh:mm a")
      return {
        textLabel: formatted,
      }
    },
  }))

export const OrganizerEventDateLocationStoreModel = types
  .model("OrganizerEventDateLocation")
  .props({
    datesLocations: types.array(OrganizerEventDateLocationModel),
  })
  .views((self) => ({
    get datesLocationsAsList() {
      return Array.from(self.datesLocations)
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
  .actions(withSetPropAction)

export interface OrganizerEventDateLocationSnapshotIn
  extends SnapshotIn<typeof OrganizerEventDateLocationModel> {}
export interface OrganizerEventDateLocation
  extends Instance<typeof OrganizerEventDateLocationModel> {}
