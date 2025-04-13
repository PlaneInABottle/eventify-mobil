import { IAnyModelType, Instance, SnapshotIn, flow, types } from "mobx-state-tree"
import { TxKeyPath } from "@/i18n"
import { supabase } from "@/services/auth/supabase"
import { handleError } from "@/utils/errorHandler"
import { handleSuccess } from "@/utils/successHandler"
import { withSetPropAction } from "@/models/helpers/withSetPropAction"
import { UserEventDateLocationModel } from "@/models/userStores/UserEventDateStore"

export const UserChatParticipantModel = types.model("UserChatParticipant").props({
  id: types.identifier,
  avatar_url: types.maybeNull(types.string),
  display_name: types.string,
})

export const UserChatMessageModel = types.model("UserChatMessage").props({
  id: types.identifier,
  event_chat_id: types.reference(types.late(() => UserChatModel)),
  sender_id: types.string,
  profile: types.model().props({ display_name: types.string }),
  content: types.string,
  created_at: types.string,
})

export const UserChatModel = types
  .model("UserChat")
  .props({
    id: types.identifier, // Event chat idd
    events_dates_locations_id: types.reference(UserEventDateLocationModel),
    event_chats_participants: types.array(UserChatParticipantModel),
    messages: types.array(types.late((): IAnyModelType => UserChatMessageModel)),
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

export const UserChatStoreModel = types
  .model("UserChatStore")
  .props({
    chats: types.array(UserChatModel),
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
    fetchUserEventChats: flow(function* (userId) {
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

export interface IUserChatMessage extends Instance<typeof UserChatMessageModel> {}

export interface IUserChatParticipant extends Instance<typeof UserChatParticipantModel> {}

export interface IUserChat extends Instance<typeof UserChatModel> {}
export interface IUserChatSnapshotIn extends SnapshotIn<typeof UserChatModel> {}

export interface IUserChatStore extends Instance<typeof UserChatStoreModel> {}
