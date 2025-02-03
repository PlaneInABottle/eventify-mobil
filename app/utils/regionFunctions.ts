import { Region } from "react-native-maps"

export function transformRegionForSupabase(bounds: Region) {
  const latitudeDelta = bounds.latitudeDelta / 2
  const longitudeDelta = bounds.longitudeDelta / 2

  const north = bounds.latitude + latitudeDelta
  const south = bounds.latitude - latitudeDelta
  const east = bounds.longitude + longitudeDelta
  const west = bounds.longitude - longitudeDelta

  // Call the Supabase RPC function
  return {
    min_lat: south,
    min_long: west,
    max_lat: north,
    max_long: east,
  }
}
