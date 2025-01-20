import { observer } from "mobx-react-lite"
import { ComponentType, FC, useRef, useState, useMemo } from "react"
import { TextInput, TextStyle, View, ViewStyle } from "react-native"
import { Button, Icon, Screen, Text, TextField, TextFieldAccessoryProps } from "../components"
import { useStores } from "../models"
import { AppStackScreenProps } from "../navigators"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { TxKeyPath } from "@/i18n"
import { useHeader } from "@/utils/useHeader"

interface RegisterScreenProps extends AppStackScreenProps<"Register"> {}

export const RegisterScreen: FC<RegisterScreenProps> = observer(function RegisterScreen(_props) {
  const {
    navigation: { navigate },
  } = _props
  const authPasswordInput = useRef<TextInput>(null)
  const confirmPasswordInput = useRef<TextInput>(null)

  const [authPassword, setAuthPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true)
  const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const {
    authenticationStore: {
      authEmail,
      setAuthEmail,
      register,
      validationError,
      error: registerError,
      isLoading,
    },
  } = useStores()

  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  useHeader(
    {
      title: "Register",
      leftIcon: "back",
      onLeftPress: () => navigate("Welcome"),
    },
    [],
  )
  const error = isSubmitted ? validationError : ""

  async function handleRegister() {
    setIsSubmitted(true)

    if (validationError) return
    if (authPassword !== confirmPassword) return
    if (!name.trim()) return

    const success = await register(authEmail, authPassword, name)
    if (success) {
      setIsSubmitted(false)
      setAuthPassword("")
      setConfirmPassword("")
      setAuthEmail("")
      setName("")
    }
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

  const ConfirmPasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
    () =>
      function ConfirmPasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <Icon
            icon={isConfirmPasswordHidden ? "view" : "hidden"}
            color={colors.palette.neutral800}
            containerStyle={props.style}
            size={20}
            onPress={() => setIsConfirmPasswordHidden(!isConfirmPasswordHidden)}
          />
        )
      },
    [isConfirmPasswordHidden, colors.palette.neutral800],
  )

  return (
    <Screen
      preset="auto"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["bottom"]}
    >
      <View style={themed($topContainer)}>
        <Text
          testID="register-heading"
          tx="registerScreen:signUp"
          preset="heading"
          style={themed($signUp)}
        />
        <Text
          tx="registerScreen:createAccount"
          preset="subheading"
          style={themed($createAccount)}
        />
      </View>

      <View style={themed($formContainer)}>
        {registerError && (
          <Text
            tx={`${registerError.replace("-", "")}` as TxKeyPath}
            size="sm"
            weight="light"
            style={themed($hint)}
          />
        )}

        <TextField
          value={name}
          onChangeText={setName}
          containerStyle={themed($textField)}
          autoCapitalize="words"
          autoComplete="name"
          autoCorrect={false}
          labelTx="registerScreen:nameFieldLabel"
          placeholderTx="registerScreen:nameFieldPlaceholder"
          helper={isSubmitted && !name.trim() ? "registerScreen:nameRequired" : undefined}
          status={isSubmitted && !name.trim() ? "error" : undefined}
          onSubmitEditing={() => authPasswordInput.current?.focus()}
          readOnly={isLoading}
        />

        <TextField
          value={authEmail}
          onChangeText={setAuthEmail}
          containerStyle={themed($textField)}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          labelTx="registerScreen:emailFieldLabel"
          placeholderTx="registerScreen:emailFieldPlaceholder"
          helper={error}
          status={error ? "error" : undefined}
          onSubmitEditing={() => authPasswordInput.current?.focus()}
          readOnly={isLoading}
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
          labelTx="registerScreen:passwordFieldLabel"
          placeholderTx="registerScreen:passwordFieldPlaceholder"
          onSubmitEditing={() => confirmPasswordInput.current?.focus()}
          RightAccessory={PasswordRightAccessory}
          readOnly={isLoading}
        />

        <TextField
          ref={confirmPasswordInput}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          containerStyle={themed($textField)}
          autoCapitalize="none"
          autoComplete="password"
          autoCorrect={false}
          secureTextEntry={isConfirmPasswordHidden}
          labelTx="registerScreen:confirmPasswordFieldLabel"
          placeholderTx="registerScreen:confirmPasswordFieldPlaceholder"
          onSubmitEditing={handleRegister}
          RightAccessory={ConfirmPasswordRightAccessory}
          status={confirmPassword !== authPassword && confirmPassword !== "" ? "error" : undefined}
          helper={
            confirmPassword !== authPassword && confirmPassword !== ""
              ? "Passwords do not match"
              : undefined
          }
          readOnly={isLoading}
        />

        <Button
          testID="register-button"
          tx={isLoading ? "common:loading" : "registerScreen:tapToSignUp"}
          style={themed($tapButton)}
          preset="reversed"
          onPress={handleRegister}
          disabled={isLoading}
        />
      </View>
    </Screen>
  )
})

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
  paddingHorizontal: spacing.lg,
})

const $topContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xl,
})

const $formContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $signUp: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $createAccount: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $tapButton: ThemedStyle<ViewStyle> = () => ({
  minWidth: "100%",
})

const $hint: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.error,
  marginBottom: spacing.md,
})
