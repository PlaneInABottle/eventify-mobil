import { observer } from "mobx-react-lite"
import { FC, useMemo, useState } from "react"
import { TextStyle, View, ViewStyle, ActivityIndicator } from "react-native"
import { AppStackScreenProps } from "@/navigators"
import { Button, Screen, Text, TextField } from "@/components"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"
import { useStores } from "@/models"

interface ForgotPasswordScreenProps extends AppStackScreenProps<"ForgotPassword"> {}

export const ForgotPasswordScreen: FC<ForgotPasswordScreenProps> = observer(
  function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState("")
    const [isSubmitted, setIsSubmitted] = useState(false)

    const {
      themed,
      theme: { colors },
    } = useAppTheme()

    const {
      authenticationStore: { isLoading, sendResetPasswordEmail },
    } = useStores()

    // Email validation
    const validationError = useMemo(() => {
      if (email.length === 0) return "errors:cantBeBlank"
      if (email.length < 6) return "errors:must6Chars"
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "errors:mustBeValidEmail"
      return ""
    }, [email])

    const error = isSubmitted ? validationError : ""

    async function handleResetPassword() {
      setIsSubmitted(true)
      if (validationError) return

      const success = await sendResetPasswordEmail(email)
      if (success) {
        setIsSubmitted(false)
        navigation.navigate("Login")
      }
    }

    return (
      <Screen
        preset="auto"
        contentContainerStyle={themed($screenContentContainer)}
        safeAreaEdges={["top", "bottom"]}
      >
        <View style={themed($topContainer)}>
          <Text preset="heading" style={themed($heading)} tx="resetPasswordScreen:resetPassword" />
          <Text
            preset="subheading"
            style={themed($description)}
            tx="forgotPasswordScreen:enterEmail"
          />
        </View>

        <View style={themed($formContainer)}>
          <TextField
            value={email}
            onChangeText={setEmail}
            containerStyle={themed($textField)}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            labelTx="common:email"
            placeholderTx="loginScreen:emailFieldPlaceholder"
            helperTx={isSubmitted && error ? error : undefined}
            status={error ? "error" : undefined}
            editable={!isLoading}
          />

          <Button
            tx={isLoading ? undefined : "resetPasswordScreen:resetPassword"}
            style={themed($resetButton)}
            preset="reversed"
            onPress={handleResetPassword}
            disabled={isLoading}
          >
            {isLoading && (
              <ActivityIndicator color={colors.palette.neutral100} style={themed($spinner)} />
            )}
          </Button>

          <Button
            tx="common:back"
            style={themed($backButton)}
            preset="default"
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          />
        </View>
      </Screen>
    )
  },
)

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xxl,
  paddingHorizontal: spacing.lg,
})

const $topContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xl,
})

const $formContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $heading: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $description: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $errorText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.error,
  marginBottom: spacing.md,
})

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $resetButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  minWidth: "100%",
  marginBottom: spacing.md,
})

const $backButton: ThemedStyle<ViewStyle> = () => ({
  minWidth: "100%",
})

const $spinner: ViewStyle = {
  marginHorizontal: 3,
}
