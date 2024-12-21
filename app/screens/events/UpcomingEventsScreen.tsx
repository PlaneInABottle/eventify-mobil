import { FC } from "react"
import { ViewStyle, View, TextStyle } from "react-native"
import { Screen, Text } from "@/components"
import { useAppTheme } from "@/utils/useAppTheme"
import { EventTabScreenProps } from "@/navigators/MainNavigator"

interface UpcomingEventsScreenProps extends EventTabScreenProps<"UpcomingEvents"> {}

export const UpcomingEventsScreen: FC<UpcomingEventsScreenProps> = function UpcomingEventsScreen(
  _props,
) {
  const {
    theme: { colors: _colors },
  } = useAppTheme()

  return (
    <Screen
      preset="fixed"
      contentContainerStyle={$screenContentContainer}
      safeAreaEdges={["top", "bottom"]}
    >
      <View style={$container}>
        <Text preset="heading" text="Upcoming Events" style={$title} />
        <Text text="Discover and join exciting events happening soon" style={$description} />
      </View>
    </Screen>
  )
}

const $screenContentContainer: ViewStyle = {
  flex: 1,
}

const $container: ViewStyle = {
  flex: 1,
  padding: 16,
}

const $title: TextStyle = {
  marginBottom: 10,
}

const $description: TextStyle = {
  marginBottom: 20,
}
