import { Instance, SnapshotIn, flow, types } from "mobx-state-tree"
import { withSetPropAction } from "../helpers/withSetPropAction"
import { supabase } from "@/services/auth/supabase"
import { handleError } from "@/utils/errorHandler"
import { handleSuccess } from "@/utils/successHandler"
import { transformRegionForSupabase } from "@/utils/regionFunctions"
import { Region } from "react-native-maps"
import { getRootStore } from "../helpers/getRootStore"
import { OrganizerEventDateLocationSnapshotIn } from "./OrganizerEventDateModel"

const PublisherModel = types.model("Publisher").props({
  id: types.identifier,
  email: types.string,
  about: types.maybeNull(types.string),
  age: types.maybeNull(types.string),
  avatar_url: types.maybeNull(types.string),
  display_name: types.string,
})

export const PublisherStoreModel = types
  .model("PublisherStore")
  .props({
    publishers: types.array(PublisherModel),
  })
  .actions(withSetPropAction)

export const OrganizerEventModel = types.model("OrganizerEvent").props({
  id: types.identifier,
  publisher_id: types.string,
  title: types.string,
  description: types.optional(types.string, ""),
  image_url: types.maybeNull(types.string),
  publisher_profile: types.maybe(types.reference(PublisherModel)),
})

export const OrganizerEventStoreModel = types
  .model("OrganizerEventStore")
  .props({
    events: types.array(OrganizerEventModel),
  })
  .views((self) => ({
    get eventsAsList() {
      return self.events.slice()
    },
    get forSelectField() {
      return self.events.map((val) => {
        return { label: val.title, value: val.id }
      })
    },
    eventById(eventId: string | undefined) {
      return self.events.find((event) => event.id === eventId)
    },
  }))
  .actions(withSetPropAction)
  .actions(() => ({
    uploadEventImage: flow(function* (image: { path: string; mimeType: string; buffer: any }) {
      // We catch error on top.
      const { data, error } = yield supabase.storage
        .from("events")
        .upload(image.path, image.buffer, {
          contentType: image?.mimeType,
          upsert: true,
        })

      if (error) throw error

      return data.path
    }),
    deleteEventImage: flow(function* (imageIdentifier: string) {
      try {
        const { error } = yield supabase.storage.from("events").remove([imageIdentifier])
        if (error) throw error
      } catch (e) {
        handleError(e, { toast: false })
      }
    }),
  }))
  .actions((store) => ({
    fetchEventsInSight: flow(function* (bounds: Region, userId: string) {
      try {
        const regionForSupabase = transformRegionForSupabase(bounds)
        const { data, error } = yield supabase.rpc("events_in_sight", {
          ...regionForSupabase,
          _user_id: userId,
        })

        if (error) throw error

        store.setProp("events", data.events)
        getRootStore(store).locationStore.setProp("locations", data.locations)
        getRootStore(store).publisherStore.setProp("publishers", data.publishers)
        getRootStore(store).organizerChatStore.setProp("chats", data.eventChats)
        getRootStore(store).organizerEventDateLocationStore.setProp(
          "datesLocations",
          data.datesLocations,
        )
      } catch (e) {
        handleError(e)
      }
    }),
    fetchOrganizerEvents: flow(function* (userId) {
      try {
        const { data: events, error } = yield supabase
          .from("events")
          .select()
          .eq("publisher_id", userId)

        if (error) throw error
        store.events.replace(events)
      } catch (e) {
        handleError(e)
      }
    }),
    createUpdateEvent: flow(function* (
      fields: Omit<OrganizerEventSnapshotIn, "id"> & {
        id?: string
        image?: {
          path: string
          mimeType: string
          buffer: any
        }
        datesLocations: (Omit<OrganizerEventDateLocationSnapshotIn, "id" | "event_id"> & {
          id?: string
        })[]
      },
    ) {
      try {
        const { image: newImage, datesLocations, ...eventsFields } = fields
        const isUpdate = !!fields.id

        if (newImage) {
          if (fields.image_url && isUpdate) store.deleteEventImage(fields.image_url)
          eventsFields.image_url = yield store.uploadEventImage(newImage)
        }

        const _eventData = {
          title: eventsFields.title,
          description: eventsFields.description,
          image_url: eventsFields.image_url,
          publisher_id: eventsFields.publisher_id,
        }

        // Prepare dates locations for SQL
        const _datesLocations = fields.datesLocations.map((dl) => ({
          id: dl.id || null,
          start_time: dl.start_time,
          end_time: dl.end_time,
          location_id: dl.location_id,
        }))
        const { error } = yield supabase.rpc("create_update_event", {
          _event_id: eventsFields.id,
          _event_data: { ...eventsFields },
          _dates_locations: datesLocations,
        })

        if (error) throw error

        getRootStore(store).authenticationStore.organizerFirstRequest(eventsFields.publisher_id)
        handleSuccess("success:eventSaved")
        return true
      } catch (e) {
        return handleError(e).message
      }
    }),
  }))

export interface IPublisherStore extends Instance<typeof PublisherStoreModel> {}
export interface IPublisherSnapshotIn extends SnapshotIn<typeof PublisherModel> {}
export interface OrganizerEvent extends Instance<typeof OrganizerEventModel> {}
export interface OrganizerEventSnapshotIn extends SnapshotIn<typeof OrganizerEventModel> {}
export interface OrganizerEventStore extends Instance<typeof OrganizerEventStoreModel> {}
