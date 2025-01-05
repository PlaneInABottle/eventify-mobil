import { Event, EventModel } from "./Event"
import { Instance, SnapshotOut, types, flow, SnapshotIn } from "mobx-state-tree"
import { Region } from "react-native-maps"
import { withSetPropAction } from "./helpers/withSetPropAction"
import { supabase } from "@/services/auth/supabase"
import { getRootStore } from "./helpers/getRootStore"

export const EventStoreModel = types
  .model("EventStore")
  .props({
    events: types.map(EventModel),
    eventsInBounds: types.array(types.safeReference(EventModel)),
    favorites: types.array(types.safeReference(EventModel)),
    joinedChats: types.array(types.safeReference(EventModel)),
    selectedEvent: types.maybe(types.safeReference(EventModel)),
    favoritesOnly: false,
  })
  .volatile(() => ({
    isLoading: false,
    isSearching: false,
    error: undefined as string | undefined,
  }))
  .actions(withSetPropAction)
  .views((store) => ({
    get eventsForList() {
      return store.favoritesOnly
        ? store.favorites
        : Array.from(new Set([...store.favorites, ...store.eventsInBounds, ...store.joinedChats]))
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
    setError(error: string | undefined) {
      store.error = error
    },
    hasFavorite(event: Event) {
      return store.favorites.includes(event)
    },
    hasJoinedChat(event: Event) {
      return store.joinedChats.includes(event)
    },
  }))
  .actions((store) => ({
    fetchEventsInBounds: flow(function* (bounds: Region) {
      store.setError(undefined)
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

        if (error) {
          console.error("Failed to fetch events:", error.message)
          store.setError(error.message)
          return
        }

        if (!events) {
          store.setError("No events data received")
          return
        }
        store.events.forEach((event) => {
          if (!store.favorites.includes(event) && !store.joinedChats.includes(event)) {
            store.events.delete(event.id)
          }
        })

        store.eventsInBounds.clear()
        events.forEach((event: Event) => {
          store.events.put(event)
          store.eventsInBounds.push(event.id)
        })
      } catch (error) {
        console.error("Error fetching events:", error)
        store.setError(error instanceof Error ? error.message : "An unexpected error occurred")
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
      if (store.favorites.includes(event)) return

      store.isLoading = true
      store.favorites.push(event) // Optimistic update

      const { error } = yield supabase.from("favorites").insert({
        user_id: getRootStore(store).userStore.userId,
        event_id: event.id,
      })

      if (error) {
        store.setError(error.message)
        store.favorites.remove(event) // Rollback on error
      }

      store.isLoading = false
    }),

    removeFavorite: flow(function* (event: Event): Generator<any, void, any> {
      if (!store.favorites.includes(event)) return

      store.isLoading = true
      store.favorites.remove(event) // Optimistic update

      const { error } = yield supabase
        .from("favorites")
        .delete()
        .eq("user_id", getRootStore(store).userStore.userId)
        .eq("event_id", event.id)

      if (error) {
        store.setError(error.message)
        store.favorites.push(event) // Rollback on error
      }

      store.isLoading = false
    }),

    joinChat: flow(function* (event: Event): Generator<any, void, any> {
      if (store.joinedChats.includes(event)) return
      store.isLoading = true
      store.joinedChats.push(event) // Optimistic update

      const { error } = yield supabase.from("event_chats_participants").insert({
        event_chat_id: event.event_chat_id,
        user_id: getRootStore(store).userStore.userId,
      })

      if (error) {
        store.setError(error.message)
        store.joinedChats.remove(event) // Rollback on error
      }

      store.isLoading = false
    }),

    quitChat: flow(function* (event: Event): Generator<any, void, any> {
      if (!store.joinedChats.includes(event)) return

      store.isLoading = true
      store.joinedChats.remove(event) // Optimistic update

      const { error } = yield supabase
        .from("event_chats_participants")
        .delete()
        .eq("event_chat_id", event.event_chat_id)
        .eq("user_id", getRootStore(store).userStore.userId)

      if (error) {
        store.setError(error.message)
        store.joinedChats.push(event) // Rollback on error
      }

      store.isLoading = false
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
    toggleChat(event: Event) {
      if (store.hasJoinedChat(event)) {
        store.quitChat(event)
      } else {
        store.joinChat(event)
      }
    },
  }))

export interface EventStore extends Instance<typeof EventStoreModel> {}
export interface EventStoreSnapshotOut extends SnapshotOut<typeof EventStoreModel> {}
export interface EventStoreSnapshotIn extends SnapshotIn<typeof EventStoreModel> {}
