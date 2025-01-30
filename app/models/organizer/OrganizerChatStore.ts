import { Instance, flow, types } from "mobx-state-tree"
import { withSetPropAction } from "../helpers/withSetPropAction"
import { OrganizerEventModel } from "./OrganizerEventStore"
import { supabase } from "@/services/auth/supabase"
import { handleError } from "@/utils/errorHandler"

export const OrganizerChatParticipantsModel = types.model("OrganizerChatParticipants").props({
  id: types.identifier,
  user_id: types.string,
})

export const OrganizerChatModel = types
  .model("OrganizerChat")
  .props({
    id: types.identifier, // Event chat idd
    event_id: types.reference(OrganizerEventModel),
    participants: types.array(OrganizerChatParticipantsModel),
    // Messages ?
  })
  .actions(withSetPropAction)
  .actions((store) => ({
    removeAParticipant: flow(function* (userId) {
      try {
        const { error } = yield supabase
          .from("event_chats_participants")
          .delete()
          .eq("user_id", userId)
          .eq("event_chat_id", store.id)

        if (error) throw error

        store.participants.filter((participant) => participant.user_id !== userId)
      } catch (e) {
        handleError(e)
      }
    }),
  }))

export const OrganizerChatStoreModel = types
  .model("OrganizerChatStore")
  .props({
    chats: types.map(OrganizerChatModel),
  })
  .views((store) => ({
    get chatsAsList() {
      return store.chats.keys()
    },
  }))
  .actions(withSetPropAction)
  .actions((store) => ({
    setChats: (chats: any) => {
      chats.forEach((eventChat: any) => {
        store.chats.put({
          ...eventChat,
          participants: eventChat.event_chats_participants,
        })
      })
    },
  }))
  .actions((store) => ({
    fetchOrganizerEventChats: flow(function* (userId) {
      try {
        const { data: eventChats, error } = yield supabase
          .from("event_chats")
          .select("*, event_chats_participants(*), events!inner()")
          .eq("events.organizer_id", userId)

        if (error) throw error

        store.setChats(eventChats)
      } catch (e) {
        handleError(e)
      }
    }),
    addNewChat: (eventId: string, chat: any) => {
      const chatInstance = OrganizerChatModel.create(chat)
      store.chats_by_event_id.set(eventId, chatInstance)
      store.chats.put(chatInstance)
    },
  }))

export interface IOrganizerChat extends Instance<typeof OrganizerChatModel> {}
export interface IOrganizerChatStore extends Instance<typeof OrganizerChatStoreModel> {}
