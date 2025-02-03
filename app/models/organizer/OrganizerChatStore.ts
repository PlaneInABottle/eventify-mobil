import { IAnyModelType, Instance, SnapshotIn, flow, types } from "mobx-state-tree"
import { withSetPropAction } from "../helpers/withSetPropAction"
import { OrganizerEventModel } from "./OrganizerEventStore"
import { supabase } from "@/services/auth/supabase"
import { handleError } from "@/utils/errorHandler"
import { OrganizerChatMessageModel } from "./OrganizerChatMessageModel"
import { handleSuccess } from "@/utils/successHandler"
import { TxKeyPath } from "@/i18n"

export const OrganizerChatParticipantModel = types.model("OrganizerChatParticipant").props({
  id: types.identifier,
  avatar_url: types.maybeNull(types.string),
  display_name: types.string,
})

export const OrganizerChatModel = types
  .model("OrganizerChat")
  .props({
    id: types.identifier, // Event chat idd
    event_id: types.reference(OrganizerEventModel),
    event_chats_participants: types.array(OrganizerChatParticipantModel),
    messages: types.array(types.late((): IAnyModelType => OrganizerChatMessageModel)),
  })
  .volatile(() => ({
    messageOffset: 0,
    participantOffset: 0,
  }))
  .views((self) => ({
    get participantsAsList() {
      return Array.from(self.event_chats_participants)
    },
  }))
  .actions(withSetPropAction)
  .actions((store) => ({
    fetchParticipants: flow(function* () {
      try {
        const { data: participants, error } = yield supabase
          .from("profiles")
          .select("id, avatar_url, display_name, event_chats_participants!inner()")
          .eq("event_chats_participants.event_chat_id", store.id)
          .eq("event_chats_participants.status", "joined")
          .range(store.participantOffset, store.participantOffset + 10)
          .limit(10)

        if (error) throw error
        console.log("pariticipants: ", participants)

        if (store.participantOffset === 0) store.event_chats_participants.clear()

        store.participantOffset += participants.length
        store.event_chats_participants.push(...participants)
      } catch (e) {
        handleError(e)
      }
    }),
    fetchMessages: flow(function* () {
      try {
        const { data: messages, error } = yield supabase
          .from("messages")
          .select("*")
          .eq("event_chat_id", store.id)
          .range(store.messageOffset, store.messageOffset + 10)
          .limit(10)

        if (error) throw error

        if (store.participantOffset === 0) store.messages.clear()
        store.messageOffset += messages.length
        store.messages.push(...messages)
      } catch (e) {
        handleError(e)
      }
    }),
    removeParticipant: flow(function* (participantId: string) {
      try {
        const { error } = yield supabase
          .from("event_chats_participants")
          .update({ status: "removed" })
          .eq("user_id", participantId)
          .eq("event_chat_id", store.id)

        if (error) throw error

        store.setProp(
          "event_chats_participants",
          store.event_chats_participants.filter((participant) => participant.id !== participantId),
        )
        handleSuccess("success:participantRemoved" as TxKeyPath)
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
      return Array.from(store.chats.values())
    },
  }))
  .actions(withSetPropAction)
  .actions((store) => ({
    setChatsFromArrayToMap: (chats: any) => {
      chats.forEach((eventChat: any) => {
        store.chats.put(eventChat)
      })
    },
  }))
  .actions((store) => ({
    fetchOrganizerEventChats: flow(function* (userId) {
      try {
        const { data: eventChats, error } = yield supabase
          .from("event_chats")
          .select("*,  events!inner()")
          .eq("events.organizer_id", userId)

        if (error) throw error
        store.setChatsFromArrayToMap(eventChats)
      } catch (e) {
        handleError(e)
      }
    }),
    addNewChat: (eventId: string, chat: any) => {
      const chatInstance = OrganizerChatModel.create(chat)
      store.chats.put(chatInstance)
    },
  }))

export interface IOrganizerChatParticipant extends Instance<typeof OrganizerChatParticipantModel> {}
export interface IOrganizerChat extends Instance<typeof OrganizerChatModel> {}
export interface IOrganizerChatSnapshotIn extends SnapshotIn<typeof OrganizerChatModel> {}
export interface IOrganizerChatStore extends Instance<typeof OrganizerChatStoreModel> {}
