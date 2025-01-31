import { withSetPropAction } from "../helpers/withSetPropAction"
import { supabase } from "@/services/auth/supabase"
import { handleError } from "@/utils/errorHandler"
import { handleSuccess } from "@/utils/successHandler"
import { Instance, SnapshotIn, SnapshotOut, flow, types } from "mobx-state-tree"

export const LocationModel = types
  .model("Location")
  .props({
    id: types.identifier,
    name: types.string,
    address: types.string,
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
  .views((store) => ({
    get locationsForList() {
      return Array.from(store.locations.values())
    },
  }))
  .actions(withSetPropAction)
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
    createUpdateLocation: flow(function* (
      fields: Omit<LocationSnapshotIn, "lat" | "long" | "id"> & { id?: string; lat_long: any },
    ) {
      try {
        let result

        // Check if upsert works? maybe could create uuid here and send it with
        if (fields.id) {
          result = yield supabase
            .from("locations")
            .update(fields)
            .eq("id", fields.id)
            .select()
            .single()
        } else {
          result = yield supabase.from("locations").insert(fields).select().single()
        }
        if (result.error) throw result.error
        console.log(result.data)

        store.locations.set(result.data.id, {
          ...result.data,
          lat: result.data.lat_long.coordinates[1],
          long: result.data.lat_long.coordinates[0],
        })

        handleSuccess("success:locationSaved")
        return true
      } catch (e) {
        return handleError(e).message
      }
    }),
  }))

export interface Location extends Instance<typeof LocationModel> {}
export interface LocationSnapshotIn extends SnapshotIn<typeof LocationModel> {}
export interface LocationStore extends Instance<typeof LocationStoreModel> {}
