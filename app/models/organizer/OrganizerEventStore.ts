import { Instance, SnapshotIn, detach, flow, types } from "mobx-state-tree"
import { withSetPropAction } from "../helpers/withSetPropAction"
import { supabase } from "@/services/auth/supabase"
import { handleError } from "@/utils/errorHandler"
import { LocationSnapshotIn } from "../location/LocationStore"
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
    publishers: types.map(PublisherModel),
  })
  .actions(withSetPropAction)
  .actions((store) => ({
    setPublishersFromArrayToMap: (publishers: IPublisherSnapshotIn[]) => {
      publishers.forEach((publisher) => {
        store.publishers.put(publisher)
      })
    },
  }))
  .actions((store) => ({
    clearAndSet: (publishers: IPublisherSnapshotIn[]) => {
      store.publishers.clear()
      store.setPublishersFromArrayToMap(publishers)
    },
  }))

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
    events: types.map(OrganizerEventModel),
  })
  .views((self) => ({
    get forSelectField() {
      return Array.from(self.events.values()).map((val) => {
        return { label: val.title, value: val.id }
      })
    },
  }))
  .actions(withSetPropAction)
  .actions((store) => ({
    setEventsFromArrayToMap: (events: OrganizerEventSnapshotIn[]) => {
      events.forEach((event) => {
        store.events.put(event)
      })
    },
  }))
  .actions((store) => ({
    clearAndSet: (events: OrganizerEventSnapshotIn[]) => {
      store.events.clear()
      store.setEventsFromArrayToMap(events)
    },
  }))
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
    uploadDatesLocations: flow(function* (
      eventId: string,
      datesLocations: Array<{ start_time: string; end_time: string | null; location_id: string }>,
    ) {
      const newDatesLocations = datesLocations.map((dl) => {
        return {
          event_id: eventId,
          ...dl,
        }
      })
      // We catch error on top.
      const { data, error } = yield supabase.rpc("upsert_events_dates_locations", {
        p_event_id: eventId,
        data: newDatesLocations,
      })

      if (error) throw error

      return data.map((newDL: any) => {
        return {
          id: newDL.r_id,
          event_id: newDL.r_event_id,
          start_time: newDL.r_start_time,
          end_time: newDL.r_end_time,
          location_id: newDL.r_location_id,
        }
      })
    }),
  }))
  .actions((store) => ({
    fetchEventsInSight: flow(function* (bounds: Region) {
      try {
        const regionForSupabase = transformRegionForSupabase(bounds)
        const { data, error } = yield supabase.rpc("events_in_sight", regionForSupabase)

        const { datesLocations, events, locations, publishers } = data.reduce(
          (
            acc: any,
            item: {
              event: OrganizerEventSnapshotIn
              location: LocationSnapshotIn
              publisher: IPublisherSnapshotIn
              dates_location: OrganizerEventDateLocationSnapshotIn
              event_chat_id: string | null
            },
          ) => {
            acc.datesLocations.push({ ...item.dates_location, event_chat_id: item.event_chat_id })

            if (!acc.eventIds.has(item.event.id)) {
              acc.events.push({ ...item.event, publisher_profile: item.publisher.id })
              acc.eventIds.add(item.event.id)
            }

            if (!acc.publisherIds.has(item.publisher.id)) {
              acc.publishers.push(item.publisher)
              acc.publisherIds.add(item.publisher.id)
            }

            if (!acc.locationIds.has(item.location.id)) {
              acc.locations.push(item.location)
              acc.locationIds.add(item.location.id)
            }
            return acc
          },
          {
            datesLocations: [],
            events: [],
            locations: [],
            publishers: [],
            locationIds: new Set(),
            publisherIds: new Set(),
            eventIds: new Set(),
          },
        )
        if (error) throw error

        store.clearAndSet(events)
        getRootStore(store).locationStore.clearAndSet(locations)
        getRootStore(store).publisherStore.clearAndSet(publishers)
        getRootStore(store).organizerEventDateLocationStore.clearAndSet(datesLocations)
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
        store.setEventsFromArrayToMap(events)
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
        datesLocations: Array<{ start_time: string; end_time: string | null; location_id: string }>
        oldDateLocationIds: string[]
      },
    ) {
      try {
        let result
        const { image: newImage, datesLocations, oldDateLocationIds, ...eventsFields } = fields
        const isUpdate = !!fields.id

        if (newImage) {
          if (fields.image_url && isUpdate) store.deleteEventImage(fields.image_url)
          eventsFields.image_url = yield store.uploadEventImage(newImage)
        }

        if (fields.id) {
          result = yield supabase
            .from("events")
            .update(eventsFields)
            .eq("id", fields.id)
            .select()
            .single()
        } else {
          result = yield supabase.from("events").insert(eventsFields).select().single()
        }

        if (result.error) throw result.error

        // Here we upload dates and locations
        const newDatesLocations = yield store.uploadDatesLocations(result.data.id, datesLocations)
        store.events.put(result.data)

        getRootStore(store).organizerEventDateLocationStore.setDatesLocationsFromArrayToMap(
          newDatesLocations,
        )

        getRootStore(store).organizerEventDateLocationStore.clearOldDates(oldDateLocationIds)
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
