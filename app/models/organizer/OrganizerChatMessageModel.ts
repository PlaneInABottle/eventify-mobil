import { Instance, types } from "mobx-state-tree"
import { OrganizerChatModel } from "./OrganizerChatStore"

export const OrganizerChatMessageModel = types.model("OrganizerChatMessage").props({
  id: types.identifier,
  event_chat_id: types.reference(types.late(() => OrganizerChatModel)),
  sender_id: types.string,
  sender_display_name: types.string,
  content: types.string,
  created_at: types.string,
})

export interface IOrganizerChatMessage extends Instance<typeof OrganizerChatMessageModel> {}
