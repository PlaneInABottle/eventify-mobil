import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { TextStyle, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Icon } from "../components"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { OrganizerEventListScreen } from "@/screens/OrganizerScreens/organizerEvents/OrganizerEventList"
import { OrganizerLocationListScreen } from "@/screens/OrganizerScreens/organizerLocations/OrganizerLocationList"
import {
  OrganizerEventStackParamList,
  OrganizerLocationStackParamList,
  OrganizerTabParamList,
} from "./navigationTypes.ts"
import { OrganizerLocationEditScreen } from "@/screens/OrganizerScreens/organizerLocations/OrganizerLocationEdit"
import { OrganizerEventEditScreen } from "@/screens/OrganizerScreens/organizerEvents/OrganizerEventEdit"

const Tab = createBottomTabNavigator<OrganizerTabParamList>()
const EventStack = createNativeStackNavigator<OrganizerEventStackParamList>()
const LocationStack = createNativeStackNavigator<OrganizerLocationStackParamList>()

function OrganizerEventsStack() {
  const {
    theme: { colors },
  } = useAppTheme()
  const { top } = useSafeAreaInsets()
  return (
    <EventStack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: {
          paddingTop: top + 20,
          backgroundColor: colors.background,
        },
      }}
    >
      <EventStack.Screen name="OrganizerEventListScreen" component={OrganizerEventListScreen} />
      <EventStack.Screen
        name="OrganizerEventEditScreen"
        component={OrganizerEventEditScreen}
        options={{
          contentStyle: {
            paddingTop: 0,
          },
        }}
      />
    </EventStack.Navigator>
  )
}
function OrganizerLocationStack() {
  const {
    theme: { colors },
  } = useAppTheme()
  const { top } = useSafeAreaInsets()
  return (
    <LocationStack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: {
          paddingTop: top + 20,
          backgroundColor: colors.background,
        },
      }}
    >
      <LocationStack.Screen
        name="OrganizerLocationListScreen"
        component={OrganizerLocationListScreen}
      />
      <LocationStack.Screen
        name="OrganizerLocationEditScreen"
        component={OrganizerLocationEditScreen}
        options={{
          contentStyle: {
            paddingTop: 0,
          },
        }}
      />
    </LocationStack.Navigator>
  )
}

export function OrganizerNavigator() {
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
        component={OrganizerEventsStack}
        options={{
          tabBarLabel: "Events",
          tabBarIcon: ({ focused }) => (
            <Icon icon="eventMap" color={focused ? colors.tint : colors.tintInactive} size={30} />
          ),
        }}
      />
      <Tab.Screen
        name="Locations"
        component={OrganizerLocationStack}
        options={{
          tabBarLabel: "Locations",
          tabBarIcon: ({ focused }) => (
            <Icon icon="pin" color={focused ? colors.tint : colors.tintInactive} size={30} />
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
