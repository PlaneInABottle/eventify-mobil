import { observer } from "mobx-react-lite"
import { ComponentType, FC, useRef, useState, useMemo } from "react"
import { TextInput, TextStyle, View, ViewStyle, Pressable } from "react-native"
import { Button, Icon, Screen, Text, TextField, TextFieldAccessoryProps } from "../../components"
import { useStores } from "../../models"
import { AppStackScreenProps } from "../../navigators"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { useHeader } from "@/utils/useHeader"
import isValidEmail from "@/utils/validation/emailValidation"
import { TxKeyPath } from "@/i18n"
import isValidPassword from "@/utils/validation/passwordValidation"
import isValidDisplayName from "@/utils/validation/displayNameValidation"

type FormState = {
  displayName: string
  email: string
  password: string
  confirmPassword: string
  errors: {
    displayName?: TxKeyPath
    email?: TxKeyPath
    password?: TxKeyPath
    general?: TxKeyPath
  }
  isLoading: boolean
}

export const OrganizerRegisterScreen: FC<AppStackScreenProps<"OrganizerRegister">> = observer(
  function OrganizerRegisterScreen(_props) {
    const { navigation } = _props
    const navigate = navigation.navigate

    const { authenticationStore } = useStores()

    // Authentication States
    const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true)
    const [isConfirmPasswordHidden, setIsConfirmPasswordHidden] = useState(true)

    const [formState, setFormState] = useState<FormState>({
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      errors: {},
      isLoading: false,
    })

    const validateForm = () => {
      const passResult = isValidPassword(formState.password, {
        isExists: true,
        value: formState.confirmPassword,
      })
      const displayNameResult = isValidDisplayName(formState.displayName)

      const newErrors = {
        displayName: displayNameResult === true ? undefined : displayNameResult,
        email: isValidEmail(formState.email) ? undefined : ("errors:invalidEmail" as TxKeyPath),
        password: passResult === true ? undefined : passResult,
      }

      setFormState((prev) => ({
        ...prev,
        errors: newErrors,
      }))

      return !Object.values(newErrors).some(Boolean)
    }

    async function handleRegister() {
      if (!validateForm()) return

      setFormState((prev) => ({ ...prev, isLoading: true }))

      const result = await authenticationStore.organizerRegister(
        formState.email,
        formState.password,
        formState.displayName,
      )

      if (result === true) {
        setFormState({
          displayName: "",
          email: "",
          password: "",
          confirmPassword: "",
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

    // Update individual fields
    const updateField = (field: keyof FormState, value: string) => {
      setFormState((prev) => ({
        ...prev,
        [field]: value,
        errors: { ...prev.errors, [field]: undefined, general: undefined },
      }))
    }

    useHeader(
      {
        titleTx: "organizerRegister:register",
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

    const ConfirmPasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
      () =>
        function PasswordRightAccessory(props: TextFieldAccessoryProps) {
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
      <Screen preset="auto" contentContainerStyle={themed($screenContentContainer)}>
        <View style={themed($topContainer)}>
          <Text tx="organizerRegister:createOrganizer" preset="heading" style={themed($logIn)} />
          <Text
            tx="organizerRegister:detailsRegister"
            preset="subheading"
            style={themed($enterDetails)}
          />
        </View>

        <View style={themed($formContainer)}>
          {formState.errors.general && (
            <Text tx={formState.errors.general} size="sm" weight="light" style={themed($hint)} />
          )}

          <TextField
            value={formState.displayName}
            onChangeText={(v) => updateField("displayName", v)}
            containerStyle={themed($textField)}
            autoCapitalize="words"
            autoComplete="name"
            autoCorrect={false}
            labelTx="registerScreen:nameFieldLabel"
            placeholderTx="registerScreen:nameFieldPlaceholder"
            helperTx={formState.errors.displayName}
            status={formState.errors.displayName ? "error" : undefined}
            readOnly={formState.isLoading}
          />
          <TextField
            value={formState.email}
            onChangeText={(v) => updateField("email", v)}
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
            onChangeText={(v) => updateField("password", v)}
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

          <TextField
            value={formState.confirmPassword}
            onChangeText={(v) => updateField("confirmPassword", v)}
            containerStyle={themed($textField)}
            autoCapitalize="none"
            autoComplete="password"
            autoCorrect={false}
            secureTextEntry={isConfirmPasswordHidden}
            labelTx="registerScreen:confirmPasswordFieldLabel"
            placeholderTx="registerScreen:confirmPasswordFieldPlaceholder"
            RightAccessory={ConfirmPasswordRightAccessory}
            readOnly={formState.isLoading}
          />

          <Button
            tx={formState.isLoading ? "common:loading" : "organizerRegister:topToSingUp"}
            style={themed($tapButton)}
            preset="reversed"
            onPress={handleRegister}
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
