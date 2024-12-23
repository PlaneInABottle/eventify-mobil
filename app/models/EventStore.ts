import { api } from "@/services/api"
import { Event, EventModel } from "./Event"
import { Instance, SnapshotOut, types, flow, SnapshotIn } from "mobx-state-tree"
import { Region } from "react-native-maps"
import { withSetPropAction } from "./helpers/withSetPropAction"

// TODO: FIND A WAY TO FIX BUG ABOUT FAVORITES
export const EventStoreModel = types
  .model("EventStore")
  .props({
    events: types.array(EventModel),
    favorites: types.array(types.safeReference(EventModel)),
    favoritesOnly: false,
    joinedChats: types.array(types.safeReference(EventModel)),
    selectedEvent: types.maybe(types.safeReference(EventModel)),
  })
  .volatile(() => ({
    isLoading: false,
  }))
  .actions(withSetPropAction)
  .views((store) => ({
    get eventsForList() {
      return store.favoritesOnly ? store.favorites : store.events
    },
  }))
  .actions((store) => ({
    fetchEventsInBounds: flow(function* (bounds: Region) {
      store.isLoading = true
      try {
        const response = yield api.getEvents(bounds)
        if (response.kind === "ok") {
          // console.log("response", response)
          store.setProp("events", response.events)
          // console.log(store.events[0].organizer, "location")
        } else {
          console.error("Failed to fetch events:", response.kind)
        }
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        store.isLoading = false
      }
    }),
    setSelectedEvent(event: Event) {
      store.selectedEvent = event
    },
  }))
  .actions((store) => ({
    addFavorite(event: Event) {
      store.favorites.push(event)
    },
    removeFavorite(event: Event) {
      store.favorites.remove(event)
    },
    hasFavorite(event: Event) {
      return store.favorites.includes(event)
    },
    joinChat(event: Event) {
      store.joinedChats.push(event)
    },
    quitChat(event: Event) {
      store.joinedChats.remove(event)
    },
    hasJoinedChat(event: Event) {
      return store.joinedChats.includes(event)
    },
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
