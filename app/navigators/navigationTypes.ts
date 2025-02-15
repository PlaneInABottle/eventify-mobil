import { BottomTabScreenProps } from "@react-navigation/bottom-tabs"
import { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { AppStackParamList, AppStackScreenProps } from "."

export type OrganizerEventStackParamList = {
  OrganizerEventListScreen: undefined
  OrganizerEventEditScreen: { eventId?: string }
}
export type OrganizerLocationStackParamList = {
  OrganizerLocationListScreen: undefined
  OrganizerLocationDisplayScreen: undefined
  OrganizerLocationEditScreen: { locationId?: string }
  OrganizerLocationMapScreen: undefined
}
export type OrganizerChatStackParamList = {
  OrganizerChatListScreen: undefined
  OrganizerChatParticipantScreen: { eventChatId: string }
  OrganizerChatConversationScreen: { eventChatId: string }
  OrganizerChatEditScreen: { eventChatId?: string }
}
export type OrganizerProfileStackParamList = {
  OrganizerProfileListScreen: undefined
  OrganizerProfileDisplayScreen: undefined
  OrganizerProfileEditScreen: undefined
}

export type OrganizerCampaignStackParamList = {
  OrganizerCampaignListScreen: undefined
  OrganizerCampaignEditScreen: { campaignId?: string }
}

export type OrganizerTabParamList = {
  Events: NavigatorScreenParams<OrganizerEventStackParamList>
  Locations: NavigatorScreenParams<OrganizerLocationStackParamList>
  Chats: NavigatorScreenParams<OrganizerChatStackParamList>
  Profile: NavigatorScreenParams<OrganizerProfileStackParamList>
  Campaigns: NavigatorScreenParams<OrganizerCampaignStackParamList>
}

export type OrganizerCampaignStackScreenProps<T extends keyof OrganizerCampaignStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<OrganizerCampaignStackParamList, T>,
    OrganizerTabScreenProps<"Campaigns">
  >
export type OrganizerLocationStackScreenProps<T extends keyof OrganizerLocationStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<OrganizerLocationStackParamList, T>,
    OrganizerTabScreenProps<"Locations">
  >
export type OrganizerEventStackScreenProps<T extends keyof OrganizerEventStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<OrganizerEventStackParamList, T>,
    OrganizerTabScreenProps<"Events">
  >
export type OrganizerChatStackScreenProps<T extends keyof OrganizerChatStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<OrganizerChatStackParamList, T>,
    OrganizerTabScreenProps<"Chats">
  >

export type OrganizerTabScreenProps<T extends keyof OrganizerTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<OrganizerTabParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>
