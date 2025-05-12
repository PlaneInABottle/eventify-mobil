import { CompositeScreenProps } from "@react-navigation/native"
import { AppStackParamList, AppStackScreenProps } from "."
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs"
import { MaterialTopTabScreenProps } from "@react-navigation/material-top-tabs"
import { NativeStackScreenProps } from "@react-navigation/native-stack"

export type UserProfileStackParamList = {
  UserProfileScreen: undefined
  UserProfileEditPersonalScreen: undefined
  UserAddressListScreen: undefined
  UserAddressEditScreen: { addressId?: string }
}

export type CodesTicketsTabParamList = {
  CodeListScreen: undefined
  TicketListScreen: undefined
}

export type EventTabParamList = {
  EventListScreen: undefined
  EventMapScreen: undefined
  CampaignListScreen: undefined
}

export type MainTabParamList = {
  Events: undefined
  Profile: undefined
  ChatList: undefined
  CodesTickets: undefined
}

/**
 * Helper for automatically generating navigation prop types for each route.
 */
export type MainTabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  AppStackScreenProps<keyof AppStackParamList>
>

export type EventTabScreenProps<T extends keyof EventTabParamList> = CompositeScreenProps<
  MaterialTopTabScreenProps<EventTabParamList, T>,
  MainTabScreenProps<"Events">
>

export type CodesTicketsTabScreenProps<T extends keyof CodesTicketsTabParamList> =
  CompositeScreenProps<
    MaterialTopTabScreenProps<CodesTicketsTabParamList, T>,
    MainTabScreenProps<"CodesTickets">
  >

export type UserProfileStackScreenProps<T extends keyof UserProfileStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<UserProfileStackParamList, T>,
    MainTabScreenProps<"Profile">
  >
