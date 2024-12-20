import { Instance, SnapshotOut, types, SnapshotIn } from "mobx-state-tree"
import { EventModel } from "./Event"
import { ChatMessageModel } from "./ChatMessage"

export const EventChatModel = types.model("EventChat").props({
  id: types.identifierNumber,
  event: types.reference(EventModel),
  messages: types.array(ChatMessageModel),
  updatedAt: types.string,
  createdAt: types.string,
})

export interface EventChat extends Instance<typeof EventChatModel> {}
export interface EventChatSnapshotOut extends SnapshotOut<typeof EventChatModel> {}
export interface EventChatSnapshotIn extends SnapshotIn<typeof EventChatModel> {}
