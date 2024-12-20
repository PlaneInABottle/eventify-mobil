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

// export interface ChatStore extends Instance<typeof ChatStoreModel> {}
// export interface ChatStoreSnapshotOut extends SnapshotOut<typeof ChatStoreModel> {}
// export interface ChatStoreSnapshotIn extends SnapshotIn<typeof ChatStoreModel> {}
