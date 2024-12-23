import { api } from "@/services/api"
import { Event, EventModel } from "./Event"
import { Instance, SnapshotOut, types, flow, SnapshotIn } from "mobx-state-tree"
import { Region } from "react-native-maps"
import { withSetPropAction } from "./helpers/withSetPropAction"

export const EventStoreModel = types
  .model("EventStore")
  .props({
    events: types.array(EventModel),
    selectedEvent: types.maybe(types.reference(EventModel)),
  })
  .volatile(() => ({
    isLoading: false,
  }))
  .actions(withSetPropAction)
  .actions((store) => ({
    fetchEventsInBounds: flow(function* (bounds: Region) {
      store.isLoading = true
      try {
        const response = yield api.getEvents(bounds)
        if (response.kind === "ok") {
          // console.log("response", response)
          store.setProp("events", response.events)
          // console.log(store.events[0].organizer, "location")
        } else {
          console.error("Failed to fetch events:", response.kind)
        }
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        store.isLoading = false
      }
    }),
    setSelectedEvent(event: Event) {
      store.selectedEvent = event
    },
  }))

export interface EventStore extends Instance<typeof EventStoreModel> {}
export interface EventStoreSnapshotOut extends SnapshotOut<typeof EventStoreModel> {}
export interface EventStoreSnapshotIn extends SnapshotIn<typeof EventStoreModel> {}
