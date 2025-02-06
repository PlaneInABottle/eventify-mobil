import { Instance, SnapshotIn, flow, types } from "mobx-state-tree"
import { withSetPropAction } from "../helpers/withSetPropAction"
import { supabase } from "@/services/auth/supabase"
import { handleError } from "@/utils/errorHandler"
import { LocationSnapshotIn } from "../location/LocationStore"
import { handleSuccess } from "@/utils/successHandler"
import { transformRegionForSupabase } from "@/utils/regionFunctions"
import { Region } from "react-native-maps"
import { getRootStore } from "../helpers/getRootStore"
import { OrganizerEventDateLocationSnapshotIn } from "./OrganizerEventDateModel"

const OrganizerModel = types.model("Organizer").props({
  id: types.identifier,
  email: types.string,
  about: types.maybeNull(types.string),
  age: types.maybeNull(types.string),
  avatar_url: types.maybeNull(types.string),
  display_name: types.string,
})

export const OrganizerStoreModel = types
  .model("OrganizerStore")
  .props({
    organizers: types.array(OrganizerModel),
  })
  .actions(withSetPropAction)

export const OrganizerEventModel = types.model("OrganizerEvent").props({
  id: types.identifier,
  publisher_id: types.string,
  title: types.string,
  description: types.optional(types.string, ""),
  image_url: types.maybeNull(types.string),
  organizer_profile: types.maybe(types.reference(OrganizerModel)),
})

export const OrganizerEventStoreModel = types
  .model("OrganizerEventStore")
  .props({
    events: types.map(OrganizerEventModel),
  })
  .views((self) => ({
    get eventsForList() {
      return Array.from(self.events.values())
    },
  }))
  .views((self) => ({
    get forSelectField() {
      return Array.from(self.events.values()).map((val) => {
        return { label: val.title, value: val.id }
      })
    },
  }))
  .actions(withSetPropAction)
  .actions((store) => ({
    setEventsFromArrayToMap: (events: any) => {
      events.forEach((event: any) => {
        store.events.put(event)
      })
    },
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
    clearAndSet: (events: OrganizerEventSnapshotIn[]) => {
      store.events.clear()
      store.setEventsFromArrayToMap(events)
    },
  }))
  .actions((store) => ({
    fetchEventsInSight: flow(function* (bounds: Region) {
      try {
        const regionForSupabase = transformRegionForSupabase(bounds)
        const { data, error } = yield supabase.rpc("events_in_sight", regionForSupabase)

        const { datesLocations, events, locations, organizers } = data.reduce(
          (
            acc: any,
            item: {
              event: OrganizerEventSnapshotIn
              location: LocationSnapshotIn
              organizer: OrganizerSnapshotIn
              dates_location: OrganizerEventDateLocationSnapshotIn
            },
          ) => {
            acc.datesLocations.push(item.dates_location)
            if (!acc.eventIds.has(item.event.id)) {
              acc.events.push({ ...item.event, organizer_profile: item.organizer.id })
              acc.eventIds.add(item.event.id)
            }

            if (!acc.organizerIds.has(item.organizer.id)) {
              acc.organizers.push(item.organizer)
              acc.organizerIds.add(item.organizer.id)
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
            organizers: [],
            locationIds: new Set(),
            organizerIds: new Set(),
            eventIds: new Set(),
          },
        )
        if (error) throw error

        store.clearAndSet(events)
        getRootStore(store).locationStore.clearAndSet(locations)
        getRootStore(store).organizerStore.setProp("organizers", organizers)
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

export interface OrganizerStore extends Instance<typeof OrganizerStoreModel> {}
export interface OrganizerSnapshotIn extends SnapshotIn<typeof OrganizerModel> {}
export interface OrganizerEvent extends Instance<typeof OrganizerEventModel> {}
export interface OrganizerEventSnapshotIn extends SnapshotIn<typeof OrganizerEventModel> {}
export interface OrganizerEventStore extends Instance<typeof OrganizerEventStoreModel> {}
