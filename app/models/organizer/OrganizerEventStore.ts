import { Instance, flow, types } from "mobx-state-tree"
import { withSetPropAction } from "../helpers/withSetPropAction"
import { supabase } from "@/services/auth/supabase"
import { handleError } from "@/utils/errorHandler"
import { LocationModel } from "../location/LocationStore"

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
  .actions(withSetPropAction)
  .actions((store) => ({
    setEvents: (events: any) => {
      events.forEach((event: any) => {
        store.events.put(event)
      })
    },
  }))
  .actions((store) => ({
    fetchOrganizerEvents: flow(function* (userId) {
      try {
        const { data: events, error } = yield supabase
          .from("events")
          .select()
          .eq("organizer_id", userId)

        if (error) throw error
        store.setEvents(events)
      } catch (e) {
        handleError(e)
      }
    }),
  }))

export interface OrganizerEvent extends Instance<typeof OrganizerEventModel> {}
export interface OrganizerEventStore extends Instance<typeof OrganizerEventStoreModel> {}
