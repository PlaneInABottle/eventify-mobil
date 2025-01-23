import { observer } from "mobx-react-lite"
import { FC } from "react"
import { Image, ImageStyle, TextStyle, View, ViewStyle } from "react-native"
import { Button, Text, Screen } from "@/components"
import { isRTL } from "../i18n"
import { AppStackScreenProps } from "../navigators"
import { $styles, type ThemedStyle } from "@/theme"
import { useSafeAreaInsetsStyle } from "../utils/useSafeAreaInsetsStyle"
import { useAppTheme } from "@/utils/useAppTheme"

const welcomeLogo = require("../../assets/images/TeamColored.png")
const welcomeFace = require("../../assets/images/welcome-face.png")

interface WelcomeScreenProps extends AppStackScreenProps<"Welcome"> {}

export const WelcomeScreen: FC<WelcomeScreenProps> = observer(function WelcomeScreen(_props) {
  const { themed, theme } = useAppTheme()
  const { navigation } = _props

  function goToLogin() {
    navigation.navigate("Login")
  }

  function goToRegister() {
    navigation.navigate("Register")
  }

  const $bottomContainerInsets = useSafeAreaInsetsStyle(["bottom"])

  return (
    <Screen preset="fixed" contentContainerStyle={$styles.flex1}>
      <View style={themed($topContainer)}>
        <Image style={themed($welcomeLogo)} source={welcomeLogo} resizeMode="contain" />

        {/* <Text
          testID="welcome-heading"
          style={themed($welcomeHeading)}
          tx="welcomeScreen:welcome"
          preset="heading"
        /> */}

        <Text tx="welcomeScreen:tagLine" preset="subheading" style={themed($tagLine)} />
        <Image
          style={$welcomeFace}
          source={welcomeFace}
          resizeMode="contain"
          tintColor={theme.isDark ? theme.colors.palette.neutral900 : undefined}
        />
      </View>

      <View style={themed([$bottomContainer, $bottomContainerInsets])}>
        <Text tx="welcomeScreen:joinUs" size="md" style={themed($joinText)} />

        <View style={themed($buttonsContainer)}>
          <Button
            testID="login-button"
            preset="reversed"
            tx="common:login"
            onPress={goToLogin}
            style={themed($loginButton)}
          />
          <Button
            testID="register-button"
            preset="default"
            tx="common:register"
            style={themed($registerButton)}
            onPress={goToRegister}
          />
        </View>
      </View>
    </Screen>
  )
})

const $topContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexShrink: 1,
  flexGrow: 1,
  flexBasis: "57%",
  justifyContent: "center",
  paddingHorizontal: spacing.lg,
})

const $bottomContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexShrink: 1,
  flexGrow: 0,
  flexBasis: "33%",
  backgroundColor: colors.palette.neutral100,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  paddingHorizontal: spacing.lg,
  justifyContent: "space-around",
})

const $welcomeLogo: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  height: 88,
  width: "100%",
  marginBottom: spacing.xxl,
})

const $welcomeFace: ImageStyle = {
  height: 169,
  width: 269,
  position: "absolute",
  bottom: -7,
  right: -80,
  transform: [{ scaleX: isRTL ? -1 : 1 }],
}

const $welcomeHeading: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
  textAlign: "center",
})

const $tagLine: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xl,
  textAlign: "center",
})

const $joinText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginBottom: spacing.lg,
})

const $buttonsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.md,
})

const $loginButton: ThemedStyle<ViewStyle> = () => ({
  minWidth: "100%",
})

const $registerButton: ThemedStyle<ViewStyle> = () => ({
  minWidth: "100%",
})
