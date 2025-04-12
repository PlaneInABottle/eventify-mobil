import { observer } from "mobx-react-lite"
import { ComponentType, FC, useState, useMemo } from "react"
import { Pressable, TextStyle, View, ViewStyle } from "react-native"
import { Button, Icon, Screen, Text, TextField, TextFieldAccessoryProps } from "../../../components"
import { useStores } from "../../../models"
import { AppStackScreenProps } from "../../../navigators"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { useHeader } from "@/utils/useHeader"
import { UserLoginFormState } from "@/types/userFormTypes"
import {
  updateUserLoginFormField,
  validateUserLoginForm,
} from "@/utils/formValidations/userLoginFormValidation"

export const UserLoginScreen: FC<AppStackScreenProps<"UserLogin">> = observer(
  function UserLoginScreen(_props) {
    const { navigation } = _props
    const navigate = navigation.navigate

    const { userAuthenticationStore } = useStores()

    const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true)

    const [formState, setFormState] = useState<UserLoginFormState>({
      email: "",
      password: "",
      errors: {},
      isLoading: false,
    })

    async function handleUserLogin() {
      if (!validateUserLoginForm(formState.password, formState.email, setFormState)) return

      setFormState((prev) => ({ ...prev, isLoading: true }))

      const result = await userAuthenticationStore.loginUser(formState.email, formState.password)

      if (result === true) {
        setFormState({
          email: "",
          password: "",
          errors: {},
          isLoading: false,
        })
      } else {
        setFormState((prev) => ({
          ...prev,
          errors: { general: result },
          isLoading: false,
        }))
      }
    }

    function handleForgotPassword() {
      navigation.navigate("ForgotPassword")
    }

    useHeader(
      {
        titleTx: "common:login",
        leftIcon: "back",
        onLeftPress: () => navigate("Welcome"),
      },
      [],
    )

    const {
      themed,
      theme: { colors },
    } = useAppTheme()

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
      <Screen preset="auto" contentContainerStyle={themed($screenContentContainer)}>
        <View style={themed($topContainer)}>
          <Text tx="loginScreen:welcomeBack" preset="heading" style={themed($logIn)} />
          <Text tx="loginScreen:enterDetails" preset="subheading" style={themed($enterDetails)} />
        </View>

        <View style={themed($formContainer)}>
          {formState.errors.general && (
            <Text tx={formState.errors.general} size="sm" weight="light" style={themed($hint)} />
          )}

          <TextField
            value={formState.email}
            onChangeText={(v) => updateUserLoginFormField("email", v, setFormState)}
            containerStyle={themed($textField)}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            labelTx="loginScreen:emailFieldLabel"
            placeholderTx="loginScreen:emailFieldPlaceholder"
            helperTx={formState.errors.email}
            status={formState.errors.email ? "error" : undefined}
            readOnly={formState.isLoading}
          />

          <TextField
            value={formState.password}
            onChangeText={(v) => updateUserLoginFormField("password", v, setFormState)}
            containerStyle={themed($textField)}
            autoCapitalize="none"
            autoComplete="password"
            autoCorrect={false}
            secureTextEntry={isAuthPasswordHidden}
            labelTx="loginScreen:passwordFieldLabel"
            placeholderTx="loginScreen:passwordFieldPlaceholder"
            helperTx={formState.errors.password}
            status={formState.errors.password ? "error" : undefined}
            RightAccessory={PasswordRightAccessory}
            readOnly={formState.isLoading}
          />

          <Pressable
            onPress={handleForgotPassword}
            style={({ pressed }) => [
              themed($forgotPasswordContainer),
              pressed && themed($forgotPasswordPressed),
            ]}
            disabled={formState.isLoading}
          >
            <Text
              tx="loginScreen:forgotPasswordText"
              size="sm"
              weight="medium"
              style={[themed($forgotPasswordText), formState.isLoading && themed($disabledText)]}
            />
          </Pressable>

          <Button
            tx={formState.isLoading ? "common:loading" : "loginScreen:tapToLogIn"}
            style={themed($tapButton)}
            preset="reversed"
            onPress={handleUserLogin}
            disabled={formState.isLoading}
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

const $tapButton: ThemedStyle<ViewStyle> = () => ({
  minWidth: "100%",
})

const $forgotPasswordContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "flex-end",
  marginBottom: spacing.xl,
})

const $forgotPasswordPressed: ThemedStyle<ViewStyle> = () => ({
  opacity: 0.7,
})

const $forgotPasswordText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

const $disabledText: ThemedStyle<TextStyle> = () => ({
  opacity: 0.5,
})
