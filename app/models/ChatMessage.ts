import { Instance, SnapshotOut, types, SnapshotIn } from "mobx-state-tree"
import { UserModel } from "./User"

export const ChatMessageModel = types.model("ChatMessage").props({
  id: types.identifierNumber,
  content: types.string,
  sender: types.reference(UserModel),
  eventChatId: types.number,
  createdAt: types.string,
  updatedAt: types.string,
})

export interface ChatMessage extends Instance<typeof ChatMessageModel> {}
export interface ChatMessageSnapshotOut extends SnapshotOut<typeof ChatMessageModel> {}
export interface ChatMessageSnapshotIn extends SnapshotIn<typeof ChatMessageModel> {}
