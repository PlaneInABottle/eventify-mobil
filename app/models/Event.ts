import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"

export const EventModel = types
  .model("Event")
  .props({
    id: types.identifier,
    title: types.string,
    description: types.maybe(types.string),
    start_time: types.Date,
    end_time: types.maybe(types.Date),
    organizer_id: types.string,
    created_at: types.Date,
    updated_at: types.maybe(types.Date),
    lat: types.float,
    long: types.float,
    image_urls: types.array(types.string),
  })
  .views((event) => ({
    get coordinates(): [number, number] {
      return [event.lat, event.long]
    },
    get formattedAddress(): string | undefined {
      return `${event.lat}, ${event.long}`
    },
    get isOngoing(): boolean {
      const now = new Date()
      return event.start_time <= now && (!event.end_time || now <= event.end_time)
    },
    get hasEnded(): boolean {
      if (!event.end_time) return false
      return event.end_time < new Date()
    },
  }))

export interface Event extends Instance<typeof EventModel> {}
export interface EventSnapshotOut extends SnapshotOut<typeof EventModel> {}
export interface EventSnapshotIn extends SnapshotIn<typeof EventModel> {}
