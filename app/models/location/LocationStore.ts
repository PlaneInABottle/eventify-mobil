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
    locations: types.array(LocationModel),
  })
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
        Object.assign(oldLocation, result.data)

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
