import { Instance, SnapshotOut, types, SnapshotIn } from "mobx-state-tree"

export const LocationModel = types.model("Location").props({
  id: types.number,
  name: types.string,
  address: types.string,
  location: types.array(types.number),
  updatedAt: types.string,
  createdAt: types.string,
})

export interface Location extends Instance<typeof LocationModel> {}
export interface LocationSnapshotOut extends SnapshotOut<typeof LocationModel> {}
export interface LocationSnapshotIn extends SnapshotIn<typeof LocationModel> {}
