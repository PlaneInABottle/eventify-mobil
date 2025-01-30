import { withSetPropAction } from "../helpers/withSetPropAction"
import { supabase } from "@/services/auth/supabase"
import { handleError } from "@/utils/errorHandler"
import { Instance, flow, types } from "mobx-state-tree"
import { getRootStore } from "../helpers/getRootStore"

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

export const LocationStoreModel = types
  .model("LocationStore")
  .props({
    locations: types.map(LocationModel),
  })
  .volatile(() => ({}))
  .actions(withSetPropAction)
  .views((store) => ({
    get locationsForList() {
      return Array.from(store.locations.values())
    },
  }))
  .actions((store) => ({
    setLocations: (locations: any) => {
      locations.forEach((location: any) => {
        store.locations.put({
          ...location,
          lat: location.lat_long.coordinates[1],
          long: location.lat_long.coordinates[0],
        })
      })
    },
  }))
  .actions((store) => ({
    fetchOrganizerLocations: flow(function* (userId) {
      try {
        if (!userId) throw new Error("errors:userIdNotFound")

        const { data: locations, error } = yield supabase
          .from("locations")
          .select("*")
          .eq("creator_id", userId)

        if (error) throw error

        store.setLocations(locations)
      } catch (e) {
        handleError(e)
      }
    }),
    addLocation: flow(function* (newLocation: Omit<Location, "id" | "creator_id">) {
      try {
        const userId: string | undefined = getRootStore(store).userStore.userId
        if (!userId) throw new Error("errors:userIdNotFound")

        const { data: id, error } = yield supabase.rpc("insert_location", {
          p_name: newLocation.name,
          p_address: newLocation.address,
          p_city: newLocation.city,
          p_creator_id: userId,
          p_lat: newLocation.lat,
          p_long: newLocation.long,
        })
        if (error) throw error

        store.locations.put({ ...newLocation, creator_id: userId, id })
      } catch (e) {
        handleError(e)
      }
    }),
    updateLocation: flow(function* (updates: Location) {
      try {
        const { error } = yield supabase.from("locations").upsert(updates).eq("id", updates.id)
        if (error) throw error
      } catch (e) {
        handleError(e)
      }
    }),
  }))

export interface Location extends Instance<typeof LocationModel> {}
export interface LocationStore extends Instance<typeof LocationStoreModel> {}
