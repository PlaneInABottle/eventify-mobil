import { observer } from "mobx-react-lite"
import { ComponentType, FC, useRef, useState, useMemo } from "react"
import { TextInput, TextStyle, View, ViewStyle, Pressable } from "react-native"
import { Button, Icon, Screen, Text, TextField, TextFieldAccessoryProps } from "../components"
import { useStores } from "../models"
import { AppStackScreenProps } from "../navigators"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { TxKeyPath } from "@/i18n"

interface LoginScreenProps extends AppStackScreenProps<"Login"> {}

const loginErrorToTx = {
  rejected: "loginScreen:errors.rejected",
  unauthorized: "loginScreen:errors.unauthorized",
  cannotConnect: "loginScreen:errors.cannotConnect",
} as const

export const LoginScreen: FC<LoginScreenProps> = observer(function LoginScreen(_props) {
  const authPasswordInput = useRef<TextInput>(null)

  const [authPassword, setAuthPassword] = useState("")
  const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const {
    authenticationStore: { authEmail, setAuthEmail, login, validationError, error: loginError },
  } = useStores()

  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const error = isSubmitted ? validationError : ""

  function handleLogin() {
    setIsSubmitted(true)

    if (validationError) return

    login(authEmail, authPassword)
    setIsSubmitted(false)
    setAuthPassword("")
    setAuthEmail("")
  }

  function handleForgotPassword() {
    // TODO: Implement forgot password flow
    console.log("Forgot password")
  }

  const PasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
    () =>
      function PasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <Icon
            icon={isAuthPasswordHidden ? "view" : "hidden"}
            color={colors.palette.neutral800}
            containerStyle={props.style}
            size={20}
            onPress={() => setIsAuthPasswordHidden(!isAuthPasswordHidden)}
          />
        )
      },
    [isAuthPasswordHidden, colors.palette.neutral800],
  )

  return (
    <Screen
      preset="auto"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top", "bottom"]}
    >
      <View style={themed($topContainer)}>
        <Text
          testID="login-heading"
          tx="loginScreen:logIn"
          preset="heading"
          style={themed($logIn)}
        />
        <Text tx="loginScreen:enterDetails" preset="subheading" style={themed($enterDetails)} />
      </View>

      <View style={themed($formContainer)}>
        {loginError && (
          <Text
            tx={loginErrorToTx[loginError as keyof typeof loginErrorToTx] as TxKeyPath}
            size="sm"
            weight="light"
            style={themed($hint)}
          />
        )}

        <TextField
          value={authEmail}
          onChangeText={setAuthEmail}
          containerStyle={themed($textField)}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          labelTx="loginScreen:emailFieldLabel"
          placeholderTx="loginScreen:emailFieldPlaceholder"
          helper={error}
          status={error ? "error" : undefined}
          onSubmitEditing={() => authPasswordInput.current?.focus()}
        />

        <TextField
          ref={authPasswordInput}
          value={authPassword}
          onChangeText={setAuthPassword}
          containerStyle={themed($textField)}
          autoCapitalize="none"
          autoComplete="password"
          autoCorrect={false}
          secureTextEntry={isAuthPasswordHidden}
          labelTx="loginScreen:passwordFieldLabel"
          placeholderTx="loginScreen:passwordFieldPlaceholder"
          onSubmitEditing={handleLogin}
          RightAccessory={PasswordRightAccessory}
        />

        <Pressable
          onPress={handleForgotPassword}
          style={({ pressed }) => [
            themed($forgotPasswordContainer),
            pressed && themed($forgotPasswordPressed),
          ]}
        >
          <Text
            tx="loginScreen:forgotPasswordText"
            size="sm"
            weight="medium"
            style={themed($forgotPasswordText)}
          />
        </Pressable>

        <Button
          testID="login-button"
          tx="loginScreen:tapToLogIn"
          style={themed($tapButton)}
          preset="reversed"
          onPress={handleLogin}
        />
      </View>
    </Screen>
  )
})

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

const $logIn: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $enterDetails: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $hint: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.error,
  marginBottom: spacing.md,
})

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $forgotPasswordContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "flex-end",
  marginBottom: spacing.xl,
})

const $forgotPasswordPressed: ThemedStyle<ViewStyle> = ({ colors }) => ({
  opacity: 0.7,
})

const $forgotPasswordText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

const $tapButton: ThemedStyle<ViewStyle> = () => ({
  minWidth: "100%",
})
