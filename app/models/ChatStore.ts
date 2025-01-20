import { flow, SnapshotOut, SnapshotIn, Instance, types } from "mobx-state-tree"
import { Socket, io } from "socket.io-client"
import { getRootStore } from "./helpers/getRootStore"
import { supabase } from "@/services/auth/supabase"
import { withSetPropAction } from "./helpers/withSetPropAction"
import { EventModel } from "./Event"
import { api } from "@/services/api"
import { handleError } from "@/utils/errorHandler"

export interface ChatMessage extends Instance<typeof ChatMessageModel> {}
const ChatMessageModel = types.model("ChatMessage").props({
  id: types.identifier,
  event_chat_id: types.string,
  sender_id: types.string,
  sender_display_name: types.string,
  content: types.string,
  created_at: types.string,
})

export interface Chat extends Instance<typeof ChatModel> {}
const ChatModel = types
  .model("Chat")
  .props({
    id: types.identifier,
    event_id: types.string,
    messages: types.array(ChatMessageModel),
  })
  .volatile(() => ({
    offset: 0,
  }))
  .actions((store) => ({
    clearMessages() {
      store.messages.clear()
    },
  }))
  .actions((store) => ({
    getChatMessages: flow(function* (limit: number = 10): Generator<any, void, any> {
      try {
        const { data: messages, error } = yield supabase.rpc("get_messages_with_pagination", {
          p_event_chat_id: store.id,
          p_limit: limit,
          p_offset: store.offset,
        })
        if (error) throw error
        if (store.offset === 0) {
          store.clearMessages()
        }
        store.messages.push(...messages)
        store.offset += messages.length
      } catch (e) {
        handleError(e)
      }
    }),
    pushNewMessage(message: ChatMessage) {
      store.messages.unshift(message)
      store.offset = store.offset + 1
    },
  }))
export const ChatStoreModel = types
  .model("ChatStore")
  .props({
    chats: types.map(ChatModel),
    joinedEvents: types.array(types.safeReference(EventModel)),
  })
  .volatile(() => ({
    isLoading: false,
    socket: null as Socket | null,
    isConnected: false,
    activeChat: undefined as undefined | Chat,
  }))
  .views((store) => ({
    getChat(eventChatId: string) {
      return store.chats.get(eventChatId)
    },
  }))
  .actions(withSetPropAction)
  .actions((store) => ({
    hasJoinedChat(eventChatId: string) {
      return store.chats.has(eventChatId)
    },
  }))
  .actions((store) => ({
    fetchUserChats: flow(function* (userId: string): Generator<any, void, any> {
      try {
        const { data: chats, error } = yield supabase
          .from("event_chats")
          .select("*, event_chats_participants!inner()")
          .eq("event_chats_participants.user_id", userId)
        if (error) throw error

        store.chats.clear()
        store.joinedEvents.clear()
        chats.forEach((chat: Chat) => {
          store.chats.put(chat)
          store.joinedEvents.push(chat.event_id)
        })
      } catch (e) {
        handleError(e)
      }
    }),
    pushMessageToChat(message: ChatMessage) {
      try {
        store.activeChat?.pushNewMessage(message)
      } catch (e) {
        handleError(e)
      }
    },
  }))
  .actions((store) => ({
    setSocket(socket: Socket) {
      store.socket = socket
    },
  }))
  .actions((store) => ({
    setupSocketListeners(socket: Socket) {
      if (store.socket) {
        socket.on("connect", () => {
          console.log("connected to the server")
        })

        socket.on("disconnect", () => console.log("User Disconnected"))

        socket.on("get-message", (data) => {
          store.pushMessageToChat({
            id: data.id,
            content: data.content,
            sender_id: data.sender.id,
            sender_display_name: data.sender.display_name,
            created_at: data.created_at,
            event_chat_id: data.event_chat_id,
          })
        })
      } else {
        handleError("errors:unknown")
      }
    },
  }))
  .actions((store) => ({
    connect: flow(function* (authenticationToken: string) {
      try {
        if (!authenticationToken) return

        const socket = io(api.config.socketUrl, {
          secure: true,
          auth: {
            token: `Bearer ${authenticationToken}`,
          },
        })

        store.setSocket(socket)
        store.setupSocketListeners(socket)
      } catch (e) {
        handleError(e)
      }
    }),
    disconnect() {
      if (store.socket) store.socket!.disconnect()
      else handleError("errors:unknown")
    },
    joinSocketChatRoom(chatRoomId: string) {
      store.socket!.emit("joinRoom", chatRoomId)
      store.activeChat = store.getChat(chatRoomId)
    },
    leaveSocketChatRoom(chatRoomId: string) {
      store.socket!.emit("leaveRoom", chatRoomId)
      store.activeChat = undefined
    },
  }))
  .actions((store) => ({
    sendMessage: flow(function* (chatId: string, message: string) {
      try {
        const userId = getRootStore(store).userStore.userId as string | undefined
        if (!userId) throw Error("errors:notFound")

        const { data, error } = yield supabase
          .from("messages")
          .insert({ event_chat_id: chatId, sender_id: userId, content: message })
          .select()
          .single()

        if (error) throw Error(error)

        store.socket!.emit("send-message", {
          content: data.content,
          id: data.id,
          event_chat_id: data.event_chat_id,
          created_at: data.created_at,
        })
      } catch (e) {
        handleError(e)
      }
    }),
  }))
  .actions((store) => ({
    joinChat: flow(function* (eventChatId: string, eventId: string): Generator<any, void, any> {
      store.isLoading = true
      try {
        if (store.hasJoinedChat(eventChatId)) return
        const { data, error } = yield supabase
          .from("event_chats_participants")
          .insert({
            event_chat_id: eventChatId,
            user_id: getRootStore(store).userStore.userId,
          })
          .select()
          .single()
        if (error) throw error
        store.chats.set(data.event_chat_id, {
          id: data.event_chat_id,
          event_id: eventId,
        })
        store.joinedEvents.push(eventId)
      } catch (e) {
        handleError(e)
      } finally {
        store.isLoading = false
      }
    }),

    quitChat: flow(function* (eventChatId: string): Generator<any, void, any> {
      store.isLoading = true
      try {
        if (!store.hasJoinedChat(eventChatId)) return
        const { error } = yield supabase
          .from("event_chats_participants")
          .delete()
          .eq("event_chat_id", eventChatId)
          .eq("user_id", getRootStore(store).userStore.userId)
          .select()
          .single()
        if (error) throw error

        const chat = store.getChat(eventChatId)
        if (!chat?.event_id) throw Error("Chat not found")
        const event = getRootStore(store).eventStore.events.get(chat?.event_id)
        store.chats.delete(eventChatId)
        store.joinedEvents.remove(event)
        store.leaveSocketChatRoom(eventChatId)
      } catch (e) {
        handleError(e)
      } finally {
        store.isLoading = false
      }
    }),
  }))
  .actions((store) => ({
    toggleChat(eventChatId: string | undefined | null, eventId: string) {
      if (!eventChatId) return
      if (store.hasJoinedChat(eventChatId)) store.quitChat(eventChatId)
      else store.joinChat(eventChatId, eventId)
    },
  }))

export interface ChatStore extends Instance<typeof ChatStoreModel> {}
export interface ChatStoreSnapshotOut extends SnapshotOut<typeof ChatStoreModel> {}
export interface ChatStoreSnapshotIn extends SnapshotIn<typeof ChatStoreModel> {}
