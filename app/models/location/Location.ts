import { Instance, types } from "mobx-state-tree"

export const LocationModel = types
  .model("Location")
  .props({
    id: types.identifier,
    name: types.string,
    address: types.string,
    city: types.string,
    creator_id: types.string,
    lat: types.float,
    long: types.float,
  })
  .views((event) => ({
    get coordinates(): [number, number] {
      return [event.lat, event.long]
    },
    get formattedAddress(): string | undefined {
      return `${event.lat}, ${event.long}`
    },
  }))

export interface Location extends Instance<typeof LocationModel> {}
