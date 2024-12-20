import { observer } from "mobx-react-lite"
import { FC, useMemo, useState } from "react"
import { TextStyle, View, ViewStyle, ActivityIndicator } from "react-native"
import { AppStackScreenProps } from "@/navigators"
import { Button, Screen, Text, TextField } from "@/components"
import { useAppTheme } from "@/utils/useAppTheme"
import type { ThemedStyle } from "@/theme"

interface ForgotPasswordScreenProps extends AppStackScreenProps<"ForgotPassword"> {}

export const ForgotPasswordScreen: FC<ForgotPasswordScreenProps> = observer(
  function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState("")
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [resetError, setResetError] = useState<string | null>(null)

    const {
      themed,
      theme: { colors },
    } = useAppTheme()

    // Email validation
    const validationError = useMemo(() => {
      if (email.length === 0) return "can't be blank"
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "must be a valid email address"
      return ""
    }, [email])

    const error = isSubmitted ? validationError : ""

    async function handleResetPassword() {
      setIsSubmitted(true)
      if (validationError) return

      setIsLoading(true)
      try {
        // TODO: Implement actual password reset API call here
        // const response = await api.resetPassword(email)
        // if (response.kind === "ok") {
        //   navigation.navigate("Login")
        // } else {
        //   setResetError("Unable to process your request. Please try again.")
        // }

        // Simulating API call for now
        await new Promise((resolve) => setTimeout(resolve, 1000))
        navigation.navigate("Login")
      } catch {
        setResetError("An unexpected error occurred. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    return (
      <Screen
        preset="auto"
        contentContainerStyle={themed($screenContentContainer)}
        safeAreaEdges={["top", "bottom"]}
      >
        <View style={themed($topContainer)}>
          <Text preset="heading" style={themed($heading)} text="Reset Password" />
          <Text
            preset="subheading"
            style={themed($description)}
            text="Enter your email address to reset your password"
          />
        </View>

        <View style={themed($formContainer)}>
          {resetError && (
            <Text size="sm" weight="light" style={themed($errorText)}>
              {resetError}
            </Text>
          )}

          <TextField
            value={email}
            onChangeText={setEmail}
            containerStyle={themed($textField)}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            label="Email"
            placeholder="Enter your email address"
            helper={error}
            status={error ? "error" : undefined}
            editable={!isLoading}
          />

          <Button
            text={isLoading ? "" : "Reset Password"}
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
            text="Back"
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
