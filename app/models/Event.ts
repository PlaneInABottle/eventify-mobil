import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { formatDate } from "../utils/formatDate"
import { translate } from "@/i18n"

export const EventModel = types
  .model("Event")
  .props({
    id: types.identifier,
    title: types.string,
    description: types.maybeNull(types.string),
    start_time: types.string,
    end_time: types.maybeNull(types.string),
    publisher_id: types.string,
    organizer_name: types.string,
    lat: types.float,
    long: types.float,
    image_url: types.maybeNull(types.string),
    event_chat_id: types.maybeNull(types.string),
    is_favorite: types.maybeNull(types.boolean),
  })
  .views((event) => ({
    get coordinates(): [number, number] {
      return [event.lat, event.long]
    },
    get formattedAddress(): string | undefined {
      return `${event.lat}, ${event.long}`
    },
    get hasChat(): boolean {
      return !!event.event_chat_id
    },
    get isOngoing(): boolean {
      const now = new Date().toISOString()
      return event.start_time <= now && (!event.end_time || now <= event.end_time)
    },
    get hasEnded(): boolean {
      if (!event.end_time) return false
      const now = new Date().toISOString()
      return event.end_time < now
    },
    get dateFormatted() {
      const formatted = formatDate(event.start_time, "MMM dd, yyyy")
      return {
        textLabel: formatted,
        accessibilityLabel: translate("eventsListScreen:accessibility.publishLabel", {
          date: formatted,
        }),
      }
    },
    get timeFormatted() {
      const formatted = formatDate(event.start_time, "hh:mm a")
      return {
        textLabel: formatted,
        accessibilityLabel: translate("eventsListScreen:accessibility.timePublishedLabel", {
          time: formatted,
        }),
      }
    },
  }))

export interface Event extends Instance<typeof EventModel> {}
export interface EventSnapshotOut extends SnapshotOut<typeof EventModel> {}
export interface EventSnapshotIn extends SnapshotIn<typeof EventModel> {}
