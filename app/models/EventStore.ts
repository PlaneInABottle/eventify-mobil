import { Event, EventModel } from "./Event"
import { Instance, SnapshotOut, types, flow, SnapshotIn } from "mobx-state-tree"

export const EventStoreModel = types
  .model("EventStore")
  .props({
    events: types.array(EventModel),
    selectedEvent: types.maybe(types.reference(EventModel)),
    isLoading: false,
  })
  .actions((store) => ({
    fetchEventsInBounds: flow(function* (bounds: any) {
      store.isLoading = true
      // API call to get events within map bounds
      store.isLoading = false
    }),
    setSelectedEvent(event: Event) {
      store.selectedEvent = event
    },
  }))

export interface EventStore extends Instance<typeof EventStoreModel> {}
export interface EventStoreSnapshotOut extends SnapshotOut<typeof EventStoreModel> {}
export interface EventStoreSnapshotIn extends SnapshotIn<typeof EventStoreModel> {}
