import { Instance, SnapshotOut, types, SnapshotIn } from "mobx-state-tree"
import { LocationModel } from "./Location"
import { MediaModel } from "./Media"

export const EventModel = types.model("Event").props({
  id: types.number,
  name: types.string,
  location: LocationModel,
  description: types.string,
  date: types.string,
  organizer: types.number,
  media: types.array(types.maybe(MediaModel)),
  hasChat: types.boolean,
  updatedAt: types.string,
  createdAt: types.string,
})

export interface Event extends Instance<typeof EventModel> {}
export interface EventSnapshotOut extends SnapshotOut<typeof EventModel> {}
export interface EventSnapshotIn extends SnapshotIn<typeof EventModel> {}
