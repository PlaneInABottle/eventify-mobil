import { observer } from "mobx-react-lite"
import { ComponentType, FC, useRef, useState, useMemo } from "react"
import { TextInput, TextStyle, View, ViewStyle } from "react-native"
import { Button, Icon, Screen, Text, TextField, TextFieldAccessoryProps } from "../components"
import { useStores } from "../models"
import { AppStackScreenProps } from "../navigators"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { TxKeyPath, translate } from "@/i18n"
import { useHeader } from "@/utils/useHeader"

export const ResetPasswordScreen: FC<AppStackScreenProps<"ResetPassword">> = observer(
  function ResetPasswordScreen(_props) {
    const {
      navigation: { navigate },
    } = _props
    const authPasswordInput = useRef<TextInput>(null)
    const confirmPasswordInput = useRef<TextInput>(null)

    const [authPassword, setAuthPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true)
    const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = useState(true)
    const [error, setError] = useState("")
    const {
      authenticationStore: { isLoading, updatePassword },
    } = useStores()

    const {
      themed,
      theme: { colors },
    } = useAppTheme()

    useHeader(
      {
        title: "Reset Password",
        leftIcon: "back",
        onLeftPress: () => navigate("Welcome"),
      },
      [],
    )
    async function handleResetPassword() {
      if (authPassword.length <= 5) {
        setError("passwordShort")
        return
      }
      if (authPassword !== confirmPassword) {
        setError("passwordsNotMatch")
        return
      }

      const result: { status: string; error?: string } = await updatePassword(authPassword)
      if (result.status === "ok") navigate("Login")
      else console.log(result.error)
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
          <Text text="Reset Password" preset="heading" style={themed($resetPassword)} />
          <Text
            tx="resetPasswordScreen:tagline"
            preset="subheading"
            style={themed($createAccount)}
          />
        </View>

        <View style={themed($formContainer)}>
          {error && (
            <Text
              tx={`errors:${error}` as TxKeyPath}
              size="sm"
              weight="light"
              style={themed($hint)}
            />
          )}

          <TextField
            ref={authPasswordInput}
            value={authPassword}
            onChangeText={setAuthPassword}
            containerStyle={themed($textField)}
            autoCapitalize="none"
            autoComplete="password"
            autoCorrect={false}
            secureTextEntry={isAuthPasswordHidden}
            labelTx="resetPasswordScreen:newPasswordFieldLabel"
            placeholderTx="resetPasswordScreen:newPasswordFielPlaceholder"
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
            labelTx="resetPasswordScreen:confirmNewPasswordFieldLabel"
            placeholderTx="resetPasswordScreen:confirmNewPasswordFieldPlaceholder"
            onSubmitEditing={handleResetPassword}
            RightAccessory={ConfirmPasswordRightAccessory}
            status={
              confirmPassword !== authPassword && confirmPassword !== "" ? "error" : undefined
            }
            helper={
              confirmPassword !== authPassword && confirmPassword !== ""
                ? translate("errors:passwordsNotMatch")
                : undefined
            }
            readOnly={isLoading}
          />

          <Button
            tx={isLoading ? "common:loading" : "resetPasswordScreen:resetPassword"}
            style={themed($tapButton)}
            preset="reversed"
            onPress={handleResetPassword}
            disabled={isLoading}
          />
        </View>
      </Screen>
    )
  },
)

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

const $resetPassword: ThemedStyle<TextStyle> = ({ spacing }) => ({
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
