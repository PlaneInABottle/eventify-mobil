import { Instance, SnapshotIn, flow, types } from "mobx-state-tree"
import { Region } from "react-native-maps"
import { supabase } from "@/services/auth/supabase"
import { handleError } from "@/utils/errorHandler"
import { transformRegionForSupabase } from "@/utils/regionFunctions"
import { withSetPropAction } from "@/models/helpers/withSetPropAction"

const UserPointModel = types.model("UserPoint", {
  coordinates: types.refinement(types.array(types.number), (arr) => !!arr && arr.length === 2),
  type: types.literal("Point"),
})

export const UserLocationModel = types.model("UserLocation").props({
  id: types.identifier,
  name: types.string,
  address: types.string,
  creator_id: types.string,
  lat_long: UserPointModel,
})

export const UserLocationStoreModel = types
  .model("UserLocationStore")
  .props({
    locations: types.array(UserLocationModel),
  })
  .volatile(() => ({
    locationsForSelect: [] as IUserLocation[],
    selectedLocation: undefined as IUserLocation | undefined,
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
    selectLocation: (location: IUserLocation | undefined) => {
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
  }))

export interface IUserLocation extends Instance<typeof UserLocationModel> {}
export interface IUserLocationSnapshotIn extends SnapshotIn<typeof UserLocationModel> {}

export interface IUserLocationStore extends Instance<typeof UserLocationStoreModel> {}
