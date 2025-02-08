import { IAnyModelType, Instance, SnapshotIn, flow, types } from "mobx-state-tree"
import { withSetPropAction } from "../helpers/withSetPropAction"
import { supabase } from "@/services/auth/supabase"
import { handleError } from "@/utils/errorHandler"
import { OrganizerChatMessageModel } from "./OrganizerChatMessageModel"
import { handleSuccess } from "@/utils/successHandler"
import { TxKeyPath } from "@/i18n"
import { OrganizerEventDateLocationModel } from "./OrganizerEventDateModel"

export const OrganizerChatParticipantModel = types.model("OrganizerChatParticipant").props({
  id: types.identifier,
  avatar_url: types.maybeNull(types.string),
  display_name: types.string,
})

export const OrganizerChatModel = types
  .model("OrganizerChat")
  .props({
    id: types.identifier, // Event chat idd
    events_dates_locations_id: types.reference(OrganizerEventDateLocationModel),
    event_chats_participants: types.array(OrganizerChatParticipantModel),
    messages: types.array(types.late((): IAnyModelType => OrganizerChatMessageModel)),
    is_user_joined: types.optional(types.boolean, true), // change later this is for organizers
  })
  .volatile(() => ({
    messageOffset: 0,
    participantOffset: 0,
  }))
  .views((self) => ({
    get participantsAsList() {
      return Array.from(self.event_chats_participants)
    },
    get messagesAsList() {
      return Array.from(self.messages)
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
          .select("*, profile:profiles!inner(display_name)")
          .eq("event_chat_id", store.id)
          .range(store.messageOffset, store.messageOffset + 10)
          .order("created_at", { ascending: false })

        if (error) throw error
        console.log("Messages: ", messages)

        if (store.messageOffset === 0) store.messages.clear()
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
    chats: types.array(OrganizerChatModel),
  })
  .views((store) => ({
    get chatsAsList() {
      return store.chats.slice()
    },
  }))
  .views((self) => ({
    get usersChatsAsArray() {
      return self.chatsAsList.filter((chat) => !!chat.is_user_joined)
    },
    chatsByDateLocationId(dateLocId: string) {
      return self.chats.filter((chat) => chat.events_dates_locations_id.id === dateLocId)
    },
    chatById(chatId: string | undefined) {
      return self.chats.find((chat) => chat.id === chatId)
    },
  }))
  .actions(withSetPropAction)
  .actions((store) => ({
    toggleChatParticipation: flow(function* (userId: string, eventChatId: string | null) {
      try {
        if (!eventChatId) throw new Error("errors:unknown" as TxKeyPath)
        const { error } = yield supabase
          .rpc("toggle_chat_participation", {
            participant_id: userId,
            chat_id: eventChatId,
          })
          .single()
        if (error) throw error

        const changedChat = store.chats.find((chat) => chat.id === eventChatId)!
        changedChat.is_user_joined = !changedChat?.is_user_joined

        return true
      } catch (e) {
        return handleError(e).message
      }
    }),
  }))
  .actions((store) => ({
    fetchOrganizerEventChats: flow(function* (userId) {
      try {
        const { data: eventChats, error } = yield supabase
          .from("event_chats")
          .select("*,  events!inner()")
          .eq("events.publisher_id", userId)

        if (error) throw error
        store.setProp("chats", eventChats)
      } catch (e) {
        handleError(e)
      }
    }),
  }))
  .actions((store) => ({
    createUpdateChat: flow(function* (
      fields: Omit<IOrganizerChatSnapshotIn, "id" | "event_chats_participants" | "messages"> & {
        id?: string
      },
    ) {
      try {
        let result
        if (fields.id) {
          result = yield supabase
            .from("event_chats")
            .update(fields)
            .eq("id", fields.id)
            .select()
            .single()
        } else {
          result = yield supabase.from("event_chats").insert(fields).select().single()
        }

        if (result.error) throw result.error
        const oldChat = store.chats.find((chat) => chat.id === result!.data.id)!

        if (oldChat) Object.assign(oldChat, result.data)
        else store.chats.push(result.data)

        return handleSuccess("success:chatSaved" as TxKeyPath).success
      } catch (e) {
        return handleError(e).message
      }
    }),
  }))

export interface IOrganizerChatParticipant extends Instance<typeof OrganizerChatParticipantModel> {}
export interface IOrganizerChat extends Instance<typeof OrganizerChatModel> {}
export interface IOrganizerChatSnapshotIn extends SnapshotIn<typeof OrganizerChatModel> {}
export interface IOrganizerChatStore extends Instance<typeof OrganizerChatStoreModel> {}
