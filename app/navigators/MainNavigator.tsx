import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { TextStyle, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Icon } from "../components"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { EventListScreen } from "@/screens/UserScreens/events/EventListScreen"
import { EventMapScreen } from "@/screens/UserScreens/events/EventMapScreen"
import { ProfileScreen } from "@/screens/UserScreens/profile/ProfileScreen"
import { EditProfileScreen } from "@/screens/UserScreens/profile/EditProfileScreen"
import { ChatListScreen } from "@/screens/chat/ChatListScreen"
import { CampaignListScreen } from "@/screens/UserScreens/campaign/CampaignListScreen"
import { CodeListScreen } from "@/screens/UserScreens/codesTickets/CodeListScreen"
import { TicketListScreen } from "@/screens/UserScreens/codesTickets/TicketListScreen"
import {
  CodesTicketsTabParamList,
  EventTabParamList,
  MainTabParamList,
  UserProfileStackParamList,
} from "./userNavigationTypes"
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

const Tab = createBottomTabNavigator<MainTabParamList>()
const EventTab = createMaterialTopTabNavigator<EventTabParamList>()
const UserProfileStack = createNativeStackNavigator<UserProfileStackParamList>()
const CodesTicketsTab = createMaterialTopTabNavigator<CodesTicketsTabParamList>()

function UserProfileStackNavigator() {
  const {
    theme: { colors },
  } = useAppTheme()
  const { top } = useSafeAreaInsets()
  return (
    <UserProfileStack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: {
          paddingTop: top + 20,
          backgroundColor: colors.background,
        },
      }}
    >
      <UserProfileStack.Screen name="UserProfileScreen" component={ProfileScreen} />

      <UserProfileStack.Screen
        name="UserProfileEditPersonalScreen"
        component={EditProfileScreen}
        options={{
          contentStyle: {
            paddingTop: 0,
          },
        }}
      />
    </UserProfileStack.Navigator>
  )
}

function CodesTicketsNavigator() {
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const { top } = useSafeAreaInsets()

  return (
    <CodesTicketsTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.text,
        tabBarIndicatorStyle: themed($tabBarIndicator),
        tabBarStyle: themed([$tabBarStyle, { paddingTop: top + 20 }]),
        tabBarLabelStyle: themed($tabBarLabel),
      }}
    >
      <CodesTicketsTab.Screen
        name="CodeListScreen"
        component={CodeListScreen}
        options={{
          tabBarLabel: "CODES",
        }}
      />
      <CodesTicketsTab.Screen
        name="TicketListScreen"
        component={TicketListScreen}
        options={{
          tabBarLabel: "TICKETS",
        }}
      />
    </CodesTicketsTab.Navigator>
  )
}

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
        name="EventMapScreen"
        component={EventMapScreen}
        options={{
          tabBarLabel: "MAP",
        }}
      />
      <EventTab.Screen
        name="EventListScreen"
        component={EventListScreen}
        options={{
          tabBarLabel: "LIST",
        }}
      />
      <EventTab.Screen
        name="CampaignListScreen"
        component={CampaignListScreen}
        options={{
          tabBarLabel: "CAMPAIGNS",
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
            <Icon icon="eventMap" color={focused ? colors.tint : colors.tintInactive} size={30} />
          ),
        }}
      />
      <Tab.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{
          tabBarLabel: "Chats",
          tabBarIcon: ({ focused }) => (
            <Icon icon="chat" color={focused ? colors.tint : colors.tintInactive} size={30} />
          ),
        }}
      />
      <Tab.Screen
        name="CodesTickets"
        component={CodesTicketsNavigator}
        options={{
          tabBarLabel: "Inventory",
          tabBarIcon: ({ focused }) => (
            <Icon icon="bell" color={focused ? colors.tint : colors.tintInactive} size={30} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={UserProfileStackNavigator}
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
