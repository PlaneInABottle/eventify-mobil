import { BottomTabScreenProps, createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { CompositeScreenProps } from "@react-navigation/native"
import {
  createMaterialTopTabNavigator,
  MaterialTopTabScreenProps,
} from "@react-navigation/material-top-tabs"
import { TextStyle, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Icon } from "../components"
import type { ThemedStyle } from "@/theme"
import { AppStackParamList, AppStackScreenProps } from "./AppNavigator"
import { useAppTheme } from "@/utils/useAppTheme"
import { EventListScreen } from "@/screens/events/EventListScreen.tsx"
import { EventMapScreen } from "@/screens/events/EventMapScreen.tsx"
import { ProfileScreen } from "@/screens/ProfileScreen"
import { ChatListScreen } from "@/screens/chat/ChatListScreen"

// Define the Event tab's parameter list
export type EventTabParamList = {
  EventListScreen: undefined
  EventMapScreen: undefined
}

// Define the main tab parameter list
export type MainTabParamList = {
  Events: undefined
  Profile: undefined
  ChatList: undefined
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

const Tab = createBottomTabNavigator<MainTabParamList>()
const EventTab = createMaterialTopTabNavigator<EventTabParamList>()

// Events navigator with material top tabs
function EventsNavigator() {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const { top } = useSafeAreaInsets()

  return (
    <EventTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.text,
        tabBarIndicatorStyle: themed($tabBarIndicator),
        tabBarStyle: themed([$tabBarStyle, { paddingTop: top + 20 }]),
        tabBarLabelStyle: themed($tabBarLabel),
      }}
    >
      <EventTab.Screen
        name="EventListScreen"
        component={EventListScreen}
        options={{
          tabBarLabel: "Map",
        }}
      />
      <EventTab.Screen
        name="EventMapScreen"
        component={EventMapScreen}
        options={{
          tabBarLabel: "List",
        }}
      />
    </EventTab.Navigator>
  )
}

/**
 * Main navigator with bottom tabs.
 */
export function MainNavigator() {
  const { bottom } = useSafeAreaInsets()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: themed([$tabBar, { height: bottom + 70 }]),
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.text,
        tabBarLabelStyle: themed($tabBarLabel),
        tabBarItemStyle: themed($tabBarItem),
      }}
    >
      <Tab.Screen
        name="Events"
        component={EventsNavigator}
        options={{
          tabBarLabel: "Events",
          tabBarIcon: ({ focused }) => (
            <Icon icon="components" color={focused ? colors.tint : colors.tintInactive} size={30} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{
          tabBarLabel: "Chats",
          tabBarIcon: ({ focused }) => (
            <Icon icon="bell" color={focused ? colors.tint : colors.tintInactive} size={30} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused }) => (
            <Icon icon="community" color={focused ? colors.tint : colors.tintInactive} size={30} />
          ),
        }}
      />
    </Tab.Navigator>
  )
}

const $tabBar: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  borderTopColor: colors.transparent,
})

const $tabBarItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.md,
})

const $tabBarLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 12,
  fontFamily: typography.primary.medium,
  lineHeight: 16,
  color: colors.text,
})

const $tabBarStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  minHeight: 48,
})

const $tabBarIndicator: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
  height: 2,
})
