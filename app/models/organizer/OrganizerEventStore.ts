import { Instance, SnapshotIn, flow, types } from "mobx-state-tree"
import { withSetPropAction } from "../helpers/withSetPropAction"
import { supabase } from "@/services/auth/supabase"
import { handleError } from "@/utils/errorHandler"
import { LocationModel, LocationSnapshotIn } from "../location/LocationStore"
import { handleSuccess } from "@/utils/successHandler"
import { transformRegionForSupabase } from "@/utils/regionFunctions"
import { Region } from "react-native-maps"
import { getRootStore } from "../helpers/getRootStore"

export const OrganizerEventModel = types.model("OrganizerEvent").props({
  id: types.identifier,
  organizer_id: types.string,
  title: types.string,
  description: types.optional(types.string, ""),
  start_time: types.string,
  end_time: types.optional(types.string, ""),
  location_id: types.reference(LocationModel),
  image_url: types.maybeNull(types.string),
})

export const OrganizerEventStoreModel = types
  .model("OrganizerEventStore")
  .props({
    events: types.map(OrganizerEventModel),
  })
  .views((store) => ({
    get eventsForList() {
      return Array.from(store.events.values())
    },
  }))
  .views((self) => ({
    get eventsByLocationId() {
      const eventMap = new Map()
      self.events.forEach((event) => {
        const locationId = event.location_id.id
        if (!eventMap.has(locationId)) {
          eventMap.set(locationId, [event])
        } else {
          eventMap.get(locationId).push(event)
        }
      })
      return eventMap
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

        const { events, locations } = data.reduce(
          (acc: any, item: { event: OrganizerEventSnapshotIn; location: LocationSnapshotIn }) => {
            acc.events.push(item.event)
            if (!acc.locationIds.has(item.location.id)) {
              acc.locations.push(item.location)
              acc.locationIds.add(item.location.id)
            }
            return acc
          },
          { events: [], locations: [], locationIds: new Set() },
        )
        if (error) throw error

        store.clearAndSet(events)
        getRootStore(store).locationStore.clearAndSet(locations)
      } catch (e) {
        handleError(e)
      }
    }),
    fetchOrganizerEvents: flow(function* (userId) {
      try {
        const { data: events, error } = yield supabase
          .from("events")
          .select()
          .eq("organizer_id", userId)

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
      },
    ) {
      try {
        let result
        const { image: newImage, ...eventsFields } = fields
        // Check if upsert works? maybe could create uuid here and send it with
        if (fields.id) {
          if (newImage) {
            if (fields.image_url) store.deleteEventImage(fields.image_url)
            eventsFields.image_url = yield store.uploadEventImage(newImage)
          }

          result = yield supabase
            .from("events")
            .update(eventsFields)
            .eq("id", fields.id)
            .select()
            .single()
        } else {
          if (newImage) {
            if (fields.image_url) store.deleteEventImage(fields.image_url)
            eventsFields.image_url = yield store.uploadEventImage(newImage)
          }
          result = yield supabase.from("events").insert(eventsFields).select().single()
        }
        if (result.error) throw result.error

        store.events.put(result.data)

        handleSuccess("success:eventSaved")
        return true
      } catch (e) {
        return handleError(e).message
      }
    }),
  }))

export interface OrganizerEvent extends Instance<typeof OrganizerEventModel> {}
export interface OrganizerEventSnapshotIn extends SnapshotIn<typeof OrganizerEventModel> {}
export interface OrganizerEventStore extends Instance<typeof OrganizerEventStoreModel> {}
