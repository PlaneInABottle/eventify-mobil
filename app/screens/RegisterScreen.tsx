import { observer } from "mobx-react-lite"
import { ComponentType, FC, useRef, useState, useMemo } from "react"
import { TextInput, TextStyle, View, ViewStyle } from "react-native"
import { Button, Icon, Screen, Text, TextField, TextFieldAccessoryProps } from "../components"
import { useStores } from "../models"
import { AppStackScreenProps } from "../navigators"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
// import { useHeader } from "@/utils/useHeader"

interface RegisterScreenProps extends AppStackScreenProps<"Register"> {}

export const RegisterScreen: FC<RegisterScreenProps> = observer(function RegisterScreen(_props) {
  const authPasswordInput = useRef<TextInput>(null)
  const confirmPasswordInput = useRef<TextInput>(null)

  const [authPassword, setAuthPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true)
  const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const {
    authenticationStore: { authEmail, setAuthEmail, validationError },
  } = useStores()

  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const error = isSubmitted ? validationError : ""

  function handleRegister() {
    setIsSubmitted(true)

    if (validationError) return
    if (authPassword !== confirmPassword) return

    // TODO: Implement registration logic
    console.log("Register with:", { email: authEmail, password: authPassword })

    setIsSubmitted(false)
    setAuthPassword("")
    setConfirmPassword("")
    setAuthEmail("")
  }
  //   Consider implementing header
  //   useHeader(
  //     {
  //       leftTx: "common:back",
  //       onLeftPress: () => {
  //         console.log("Logout")
  //       },
  //     },
  //     [],
  //   )
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
      safeAreaEdges={["top", "bottom"]}
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
        />

        <Button
          testID="register-button"
          tx="registerScreen:tapToSignUp"
          style={themed($tapButton)}
          preset="reversed"
          onPress={handleRegister}
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
