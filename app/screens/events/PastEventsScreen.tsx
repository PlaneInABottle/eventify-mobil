import { FC } from "react"
import { ViewStyle, View, TextStyle } from "react-native"
import { Screen, Text } from "@/components"
import { useAppTheme } from "@/utils/useAppTheme"
import { EventTabScreenProps } from "@/navigators/MainNavigator"

interface PastEventsScreenProps extends EventTabScreenProps<"PastEvents"> {}

export const PastEventsScreen: FC<PastEventsScreenProps> = function PastEventsScreen(_props) {
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
        <Text preset="heading" text="Past Events" style={$title} />
        <Text text="Browse through events you've attended or missed" style={$description} />
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
