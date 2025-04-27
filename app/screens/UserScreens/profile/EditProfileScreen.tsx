import { FC, useState } from "react"
import { View, ViewStyle, Alert } from "react-native"
import { Screen, Button, TextField } from "@/components"
import { useAppTheme } from "@/utils/useAppTheme"
import { useStores } from "@/models"
import { observer } from "mobx-react-lite"
import { $styles, ThemedStyle } from "@/theme"
import { useHeader } from "@/utils/useHeader"
import { translate } from "@/i18n"
import { UserProfileStackScreenProps } from "@/navigators/userNavigationTypes"
import { IUserEditPublicProfileFormState } from "@/types/userFormTypes"

export const EditProfileScreen: FC<UserProfileStackScreenProps<"UserProfileEditPersonalScreen">> =
  observer(function EditProfileScreen(_props) {
    const navigation = _props.navigation
    const { themed } = useAppTheme()
    const { userProfileStore } = useStores()

    const [formState, setFormState] = useState<IUserEditPublicProfileFormState>({
      display_name: "",
      about: "",
      errors: {},
      isLoading: false,
    })

    const handleSave = async () => {
      Alert.alert(
        translate("common:confirmChanges"),
        translate("editProfileScreen:saveAccountWarningDescription"),
        [
          {
            text: translate("common:cancel"),
            style: "cancel",
          },
          {
            text: translate("common:save"),
            onPress: async () => {
              setFormState((prev) => ({ ...prev, isLoading: true }))

              const result = await userProfileStore.updateProfile({
                display_name: formState.display_name,
                about: formState.about,
              })
              if (result === true) {
                setFormState({
                  display_name: "",
                  about: "",
                  errors: {},
                  isLoading: false,
                })
                navigation.goBack()
              } else {
                setFormState((prev) => ({
                  ...prev,
                  errors: { general: result },
                  isLoading: false,
                }))
              }
            },
          },
        ],
      )
    }

    const updateField = (field: keyof IUserEditPublicProfileFormState, value: any) => {
      setFormState((prev) => ({
        ...prev,
        [field]: value,
        errors: { ...prev.errors, [field]: undefined, general: undefined },
      }))
    }
    useHeader(
      {
        titleTx: "editProfileScreen:editProfile",
        leftIcon: "back",
        onLeftPress: () => navigation.goBack(),
      },
      [],
    )
    return (
      <Screen preset="scroll" contentContainerStyle={$styles.container}>
        <View style={themed($formContainer)}>
          <TextField
            value={formState.display_name}
            onChangeText={(v) => updateField("display_name", v)}
            labelTx="editProfileScreen:displayName"
            placeholderTx="editProfileScreen:displayNamePlaceholder"
            accessible={true}
            accessibilityLabel="Display name input"
            accessibilityRole="text"
          />

          <TextField
            value={formState.about}
            onChangeText={(v) => updateField("about", v)}
            labelTx="profileScreen:about"
            placeholderTx="editProfileScreen:aboutPlaceholder"
            multiline
            numberOfLines={4}
            accessible={true}
            accessibilityLabel="About input"
            accessibilityRole="text"
          />

          <Button tx="common:saveChanges" onPress={handleSave} disabled={formState.isLoading} />
        </View>
      </Screen>
    )
  })

const $formContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.lg,
})
