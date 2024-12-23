import { Instance, SnapshotOut, types, SnapshotIn } from "mobx-state-tree"

export const MediaModel = types.model("Media").props({
  id: types.identifier,
  alt: types.maybe(types.string),
  prefix: types.string,
  url: types.string,
  thumbnailURL: types.maybeNull(types.string),
  filename: types.string,
  mimeType: types.string,
  filesize: types.number,
  width: types.maybe(types.number),
  height: types.maybe(types.number),
  focalX: types.maybe(types.number),
  focalY: types.maybe(types.number),
  updatedAt: types.string,
  createdAt: types.string,
})

export interface Media extends Instance<typeof MediaModel> {}
export interface MediaSnapshotOut extends SnapshotOut<typeof MediaModel> {}
export interface MediaSnapshotIn extends SnapshotIn<typeof MediaModel> {}
