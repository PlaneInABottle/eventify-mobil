import { withSetPropAction } from "../helpers/withSetPropAction"
import { supabase } from "@/services/auth/supabase"
import { handleError } from "@/utils/errorHandler"
import { handleSuccess } from "@/utils/successHandler"
import { Instance, SnapshotIn, flow, types } from "mobx-state-tree"

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
    locations: types.map(LocationModel),
  })
  .volatile(() => ({
    locationIdsInSight: new Set<string>() as Set<string>,
  }))
  .views((store) => ({
    get locationsForListInSight() {
      const arr: Location[] = []
      store.locationIdsInSight.forEach((locId) => arr.push(store.locations.get(locId)!))
      return arr
    },
    get locationsForList() {
      return Array.from(store.locations.values())
    },
    get forSelectField() {
      return Array.from(store.locations.values()).map((val) => {
        return { label: val.name, value: val.id }
      })
    },
  }))
  .actions(withSetPropAction)
  .actions((store) => ({
    setLocationIdsInSight(locationIds: Set<string>) {
      store.locationIdsInSight = locationIds
    },
    setLocationsFromArrayToMap: (locations: any) => {
      locations.forEach((location: any) => {
        store.locations.put(location)
      })
    },
  }))
  .actions((store) => ({
    clearAndSet: (locations: LocationSnapshotIn[]) => {
      store.setLocationsFromArrayToMap(locations)
    },
    fetchOrganizerLocations: flow(function* (userId) {
      try {
        if (!userId) throw new Error("errors:userIdNotFound")

        const { data: locations, error } = yield supabase
          .from("locations")
          .select("*")
          .eq("creator_id", userId)

        if (error) throw error

        store.setLocationsFromArrayToMap(locations)
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

        store.locations.put(result.data)

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
