import { Instance, SnapshotOut, types, SnapshotIn } from "mobx-state-tree"
import { LocationModel } from "./Location"
import { MediaModel } from "./Media"
import { UserModel } from "./User"
import { withSetPropAction } from "./helpers/withSetPropAction"
import { formatDate } from "@/utils/formatDate"
import { translate } from "@/i18n"

export const EventModel = types
  .model("Event")
  .props({
    id: types.identifier,
    name: types.string,
    location: LocationModel,
    description: types.maybeNull(types.string),
    date: types.string,
    organizer: types.union(types.string, types.maybe(UserModel)),
    media: types.array(MediaModel),
    hasChat: types.boolean,
    updatedAt: types.string,
    createdAt: types.string,
  })
  .actions(withSetPropAction)
  .views((event) => ({
    get imageUrls() {
      return event.media

      // return event.media.map((media) => `${Config.API_URL}${media.url}`)
    },
    get datePublished() {
      const formatted = formatDate(event.date, "MMM dd, yyyy")
      return {
        textLabel: formatted,
        accessibilityLabel: translate("eventsListScreen:accessibility.publishLabel", {
          date: formatted,
        }),
      }
    },
    get timePublished() {
      const formatted = formatDate(event.date, "hh:mm a")
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
