import { Event, EventModel } from "./Event"
import { Instance, SnapshotOut, types, flow, SnapshotIn } from "mobx-state-tree"
import { Region } from "react-native-maps"
import { withSetPropAction } from "./helpers/withSetPropAction"
import { supabase } from "@/services/auth/supabase"
import { getRootStore } from "./helpers/getRootStore"
import { handleError } from "@/utils/errorHandler"

export const EventStoreModel = types
  .model("EventStore")
  .props({
    events: types.map(EventModel),
    eventsInBounds: types.array(types.safeReference(EventModel)),
    favorites: types.array(types.safeReference(EventModel)),
    selectedEvent: types.maybe(types.safeReference(EventModel)),
    favoritesOnly: false,
  })
  .volatile(() => ({
    isLoading: false,
    isSearching: false,
  }))
  .actions(withSetPropAction)
  .views((store) => ({
    get eventsForList() {
      return store.favoritesOnly ? store.favorites : Array.from(new Set([...store.events.values()]))
    },
    get ongoingEvents() {
      return Array.from(store.events.values()).filter((event) => event.isOngoing)
    },
    get upcomingEvents() {
      const now = new Date().toISOString()
      return Array.from(store.events.values()).filter((event) => event.start_time > now)
    },
  }))
  .actions((store) => ({
    hasFavorite(event: Event) {
      return store.favorites.includes(event)
    },
  }))
  .actions((store) => ({
    fetchInitialEvents: flow(function* (userId) {
      try {
        const { data: events, error } = yield supabase.rpc("get_users_initial_events", {
          _user_id: userId,
        })

        if (error) throw error

        events.forEach((event: Event) => {
          store.events.put(event)
          store.eventsInBounds.push(event.id)
          if (event.is_favorite) store.favorites.push(event.id)
        })
      } catch (e) {
        handleError(e)
      }
    }),
    fetchEventsInBounds: flow(function* (bounds: Region) {
      store.isSearching = true
      try {
        // Calculate the bounding box corners
        const latitudeDelta = bounds.latitudeDelta / 2
        const longitudeDelta = bounds.longitudeDelta / 2

        const north = bounds.latitude + latitudeDelta
        const south = bounds.latitude - latitudeDelta
        const east = bounds.longitude + longitudeDelta
        const west = bounds.longitude - longitudeDelta

        // Call the Supabase RPC function
        const { data: events, error } = yield supabase.rpc("events_in_view", {
          min_lat: south,
          min_long: west,
          max_lat: north,
          max_long: east,
        })

        if (error) throw error

        if (!events) throw Error("errors:notFound")

        store.events.forEach((event) => {
          if (
            !store.favorites.includes(event) &&
            event.event_chat_id &&
            !getRootStore(store).chatStore.chats.get(event.event_chat_id)
          ) {
            store.events.delete(event.id)
          }
        })

        store.eventsInBounds.clear()
        events.forEach((event: Event) => {
          store.events.put(event)
          store.eventsInBounds.push(event.id)
        })
      } catch (error) {
        handleError(error)
        return
      } finally {
        store.isSearching = false
      }
    }),
    setSelectedEvent(event: Event) {
      store.selectedEvent = event
    },
  }))
  .actions((store) => ({
    addFavorite: flow(function* (event: Event): Generator<any, void, any> {
      try {
        store.isLoading = true
        if (store.favorites.includes(event)) return

        store.favorites.push(event) // Optimistic update

        const { error } = yield supabase.from("favorites").insert({
          user_id: getRootStore(store).userStore.userId,
          event_id: event.id,
        })

        if (error) {
          store.favorites.remove(event) // Rollback on error
          throw error
        }
      } catch (e) {
        handleError(e)
      } finally {
        store.isLoading = false
      }
    }),

    removeFavorite: flow(function* (event: Event): Generator<any, void, any> {
      try {
        if (!store.favorites.includes(event)) return

        store.isLoading = true
        store.favorites.remove(event) // Optimistic update

        const { error } = yield supabase
          .from("favorites")
          .delete()
          .eq("user_id", getRootStore(store).userStore.userId)
          .eq("event_id", event.id)

        if (error) {
          store.favorites.push(event) // Rollback on error
          throw error
        }
      } catch (e) {
        handleError(e)
      } finally {
        store.isLoading = false
      }
    }),
  }))
  .actions((store) => ({
    toggleFavorite(event: Event) {
      if (store.hasFavorite(event)) {
        store.removeFavorite(event)
      } else {
        store.addFavorite(event)
      }
    },
  }))

export interface EventStore extends Instance<typeof EventStoreModel> {}
export interface EventStoreSnapshotOut extends SnapshotOut<typeof EventStoreModel> {}
export interface EventStoreSnapshotIn extends SnapshotIn<typeof EventStoreModel> {}
