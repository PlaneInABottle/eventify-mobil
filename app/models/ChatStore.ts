import { flow, SnapshotOut, SnapshotIn, Instance, types } from "mobx-state-tree"
import { getRootStore } from "./helpers/getRootStore"
import { supabase } from "@/services/auth/supabase"
import { withSetPropAction } from "./helpers/withSetPropAction"

export interface ChatMessage extends Instance<typeof ChatMessageModel> {}
const ChatMessageModel = types.model("ChatMessage").props({
  id: types.identifier,
  event_chat_id: types.string,
  sender_id: types.string,
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
    getChatMessages: flow(function* (limit: number = 10): Generator<any, void, any> {
      try {
        const { data: messages, error } = yield supabase
          .from("messages")
          .select("*")
          .eq("event_chat_id", store.id)
          .order("created_at", { ascending: false })
          .limit(limit)
          .range(store.offset, store.offset + limit)
        if (error) throw error
        if (store.offset === 0) {
          store.messages.clear()
        }
        store.messages.push(...messages)
        store.offset += messages.length
      } catch (error) {
        console.error(error)
      }
    }),
  }))
export const ChatStoreModel = types
  .model("ChatStore")
  .props({
    chats: types.map(ChatModel),
  })
  .volatile(() => ({
    isLoading: false,
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
    fetchUserChats: flow(function* (): Generator<any, void, any> {
      try {
        const userId = getRootStore(store).userStore.userId
        const { data: chats, error } = yield supabase
          .from("event_chats")
          .select("*, event_chats_participants!inner()")
          .eq("event_chats_participants.user_id", userId)
        if (error) throw error
        store.chats.clear()
        chats.forEach((chat: Chat) => {
          store.chats.put(chat)
        })
      } catch (error) {
        console.error(error)
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
      } catch (error) {
        console.error(error)
      } finally {
        store.isLoading = false
      }
    }),

    quitChat: flow(function* (eventChatId: string): Generator<any, void, any> {
      store.isLoading = true
      try {
        if (!store.hasJoinedChat(eventChatId)) return
        const { data, error } = yield supabase
          .from("event_chats_participants")
          .delete()
          .eq("event_chat_id", eventChatId)
          .eq("user_id", getRootStore(store).userStore.userId)
          .select()
          .single()
        if (error) throw error

        store.chats.delete(eventChatId)
      } catch (error) {
        console.error(error)
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
// import { Instance, SnapshotOut, types, flow, SnapshotIn } from "mobx-state-tree"
// import { EventChatModel } from "./EventChat"
// import { ChatMessageModel } from "./ChatMessage"
// import { Socket, io } from "socket.io-client"
// import { api } from "../services/api"
// import { getRootStore } from "./helpers/getRootStore"

// export const ChatStoreModel = types
//   .model("ChatStore")
//   .props({
//     eventChats: types.array(EventChatModel),
//     activeEventChatId: types.maybe(types.number),
//   })
//   .volatile(() => ({
//     socket: null as Socket | null,
//     isConnected: false,
//   }))
//   .actions((store) => {
//     afterCreate(){
//         self.connectWebSocket()
//     },
//     connectWebSocket(){
//         const socket = io(api.config.url, {
//             auth: {
//                 token: authStore.authToken,
//             },
//         })
//     }
//   })
// //   .views((store) => ({
// //     get activeEventChat() {
// //       return store.eventChats.find((chat) => chat.id === store.activeEventChatId)
// //     },
// //   }))
// //   .actions((store) => ({
// //     setSocket(socket: Socket) {
// //       store.socket = socket
// //     },
// //     setIsConnected(connected: boolean) {
// //       store.isConnected = connected
// //     },
// //     setActiveEventChat(chatId: number) {
// //       store.activeEventChatId = chatId
// //     },
// //     addEventChat(chat: typeof EventChatModel.Type) {
// //       store.eventChats.push(chat)
// //     },
// //     addMessage(chatId: number, message: typeof ChatMessageModel.Type) {
// //       const chat = store.eventChats.find((c) => c.id === chatId)
// //       if (chat) {
// //         chat.messages.push(message)
// //       }
// //     },
// //   }))
// //   .actions((store) => ({
// //     setupSocketListeners() {
// //       if (!store.socket) return

// //       store.socket.on("connect", () => {
// //         store.setIsConnected(true)
// //       })

// //       store.socket.on("disconnect", () => {
// //         store.setIsConnected(false)
// //       })

// //       store.socket.on("chat:message", (message) => {
// //         store.addMessage(message.eventChatId, message)
// //       })

// //       // Join the active chat room when it changes
// //       store.socket.on("chat:joined", (chatId) => {
// //         console.log(`Joined chat room: ${chatId}`)
// //       })
// //     },
// //   }))
// //   .actions((store) => ({
// //     connect: flow(function* () {
// //       const authStore = getRootStore(store).authenticationStore
// //       if (!authStore.authToken) return

// //       const socket = io(api.config.url, {
// //         auth: {
// //           token: authStore.authToken,
// //         },
// //       })
// //       store.setSocket(socket)
// //       store.setupSocketListeners()
// //     }),

// //     disconnect() {
// //       if (store.socket) {
// //         store.socket.disconnect()
// //         store.socket = null
// //       }
// //       store.setIsConnected(false)
// //     },

// //     joinChat: flow(function* (chatId: number) {
// //       if (!store.socket || !store.isConnected) return

// //       store.setActiveEventChat(chatId)
// //       store.socket.emit("chat:join", chatId)
// //     }),

// //     leaveChat: flow(function* (chatId: number) {
// //       if (!store.socket || !store.isConnected) return

// //       if (store.activeEventChatId === chatId) {
// //         store.setActiveEventChat(undefined)
// //       }
// //       store.socket.emit("chat:leave", chatId)
// //     }),

// //     sendMessage: flow(function* (content: string) {
// //       if (!store.socket || !store.isConnected || !store.activeEventChatId) return

// //       store.socket.emit("chat:message", {
// //         eventChatId: store.activeEventChatId,
// //         content,
// //       })
// //     }),
// //   }))

export interface ChatStore extends Instance<typeof ChatStoreModel> {}
export interface ChatStoreSnapshotOut extends SnapshotOut<typeof ChatStoreModel> {}
export interface ChatStoreSnapshotIn extends SnapshotIn<typeof ChatStoreModel> {}
