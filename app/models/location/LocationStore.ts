import { withSetPropAction } from "../helpers/withSetPropAction"
import { supabase } from "@/services/auth/supabase"
import { handleError } from "@/utils/errorHandler"
import { transformRegionForSupabase } from "@/utils/regionFunctions"
import { handleSuccess } from "@/utils/successHandler"
import { Instance, SnapshotIn, flow, types } from "mobx-state-tree"
import { Region } from "react-native-maps"

const PointModel = types.model("Point", {
  coordinates: types.refinement(types.array(types.number), (arr) => !!arr && arr.length === 2),
  type: types.literal("Point"),
})

export const LocationModel = types.model("Location").props({
  id: types.identifier,
  name: types.string,
  address: types.string,
  creator_id: types.string,
  lat_long: PointModel,
})

export const LocationStoreModel = types
  .model("LocationStore")
  .props({
    locations: types.array(LocationModel),
  })
  .volatile(() => ({
    locationsForSelect: [] as Location[],
    selectedLocation: undefined as Location | undefined,
  }))
  .views((store) => ({
    get locationsForList() {
      return store.locations.slice()
    },
    get forSelectField() {
      return store.locations
        .map((val) => {
          return { label: val.name, value: val.id }
        })
        .slice()
    },
    locationById(locationId: string | undefined) {
      return store.locations.find((loc) => loc.id === locationId)
    },
  }))
  .actions(withSetPropAction)
  .actions((store) => ({
    selectLocation: (location: Location | undefined) => {
      store.selectedLocation = location
    },
    addSelectLocationToStore: flow(function* (userId: string) {
      if (!store.selectedLocation) return
      try {
        const { error } = yield supabase.from("favorites_locations").insert({
          user_id: userId,
          location_id: store.selectedLocation.id,
        })

        if (error) throw error
        store.locations.push(store.selectedLocation)
      } catch (e) {
        handleError(e)
      } finally {
        store.locationsForSelect = []
        store.selectedLocation = undefined
      }
    }),
  }))
  .actions((store) => ({
    fetchLocationsInSight: flow(function* (bounds: Region, userId: string) {
      const regionForSupabase = transformRegionForSupabase(bounds)
      const { data, error } = yield supabase.rpc("locations_in_sight", {
        ...regionForSupabase,
        _user_id: userId,
      })
      if (error) throw error
      store.locationsForSelect = data
    }),
    fetchOrganizerLocations: flow(function* (userId) {
      try {
        if (!userId) throw new Error("errors:userIdNotFound")

        const { data: locations, error } = yield supabase
          .from("locations")
          .select("*")
          .eq("creator_id", userId)

        if (error) throw error

        store.setProp("locations", locations)
      } catch (e) {
        handleError(e)
      }
    }),
    createUpdateLocation: flow(function* (
      fields: Omit<LocationSnapshotIn, "id" | "lat_long"> & { id?: string; lat_long: any },
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

        const oldLocation = store.locations.find(
          (loc) => loc.id === (result!.data as LocationSnapshotIn).id,
        )!
        if (oldLocation) Object.assign(oldLocation, result.data)
        else store.locations.push(result.data)

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
