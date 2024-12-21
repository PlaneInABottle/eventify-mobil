import { FC } from "react"
import { ViewStyle, View, TextStyle } from "react-native"
import { Screen, Text } from "@/components"
import { useAppTheme } from "@/utils/useAppTheme"
import { MainTabScreenProps } from "@/navigators/MainNavigator"

interface ProfileScreenProps extends MainTabScreenProps<"Profile"> {}

export const ProfileScreen: FC<ProfileScreenProps> = function ProfileScreen(_props) {
  const {
    theme: { colors: _colors },
  } = useAppTheme()

  return (
    <Screen preset="scroll" contentContainerStyle={$screenContentContainer} safeAreaEdges={["top"]}>
      <View style={$container}>
        <Text preset="heading" text="Profile" style={$title} />
        <Text text="Manage your account and preferences" style={$description} />
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
