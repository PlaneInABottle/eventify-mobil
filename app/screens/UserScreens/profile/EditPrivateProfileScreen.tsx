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
import { IUserEditPrivateProfileFormState, IUserEditPublicProfileFormState } from "@/types/userFormTypes"
import { updateUserPrivateProfileFormField, validateUserPrivateProfileForm } from "@/utils/formValidations/userPrivateProfileFormValidation"

export const EditPrivateProfileScreen: FC<UserProfileStackScreenProps<"UserProfileEditPrivateScreen">> =
  observer(function EditPrivateProfileScreen(_props) {
    const navigation = _props.navigation
    const { themed } = useAppTheme()
    const { userProfileStore } = useStores()

    const [formState, setFormState] = useState<IUserEditPrivateProfileFormState>({
      name: "",
      lastName: "",
      identityNumber: "",
      phoneNumber: "",
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
              if (!validateUserPrivateProfileForm) return

              const result = await userProfileStore.upsertPrivateProfile({
                name: formState.name,
                last_name: formState.lastName,
                identity_number: formState.identityNumber,
                phone_number: formState.phoneNumber,
              })
              if (result === true) {
                setFormState({
                  name: "",
                  lastName: "",
                  identityNumber: "",
                  phoneNumber: "",
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
    useHeader(
      {
        titleTx: "editPrivateProfileScreen:editPrivateProfile",
        leftIcon: "back",
        onLeftPress: () => navigation.goBack(),
      },
      [],
    )
    return (
      <Screen preset="scroll" contentContainerStyle={$styles.container}>
        <View style={themed($formContainer)}>
          <TextField
            value={formState.name}
            onChangeText={(v) => updateUserPrivateProfileFormField("name", v, setFormState)}
            labelTx="editPrivateProfileScreen:name"
            placeholderTx="editPrivateProfileScreen:namePH"
            accessible={true}
            accessibilityLabel="Name input"
            accessibilityRole="text"
          />

          <TextField
            value={formState.lastName}
            onChangeText={(v) => updateUserPrivateProfileFormField("lastName", v, setFormState)}
            labelTx="editPrivateProfileScreen:lastName"
            placeholderTx="editPrivateProfileScreen:lastNamePH"
            accessible={true}
            accessibilityLabel="Last name input"
            accessibilityRole="text"
          />
          <TextField
            value={formState.identityNumber}
            onChangeText={(v) => updateUserPrivateProfileFormField("identityNumber", v, setFormState)}
            labelTx="editPrivateProfileScreen:identityNumber"
            placeholderTx="editPrivateProfileScreen:identityNumberPH"
            keyboardType="numeric"
            accessible={true}
            accessibilityLabel="Identity Number input"
            accessibilityRole="text"
          />
          <TextField
            value={formState.phoneNumber}
            onChangeText={(v) => updateUserPrivateProfileFormField("phoneNumber", v, setFormState)}
            labelTx="editPrivateProfileScreen:phoneNumber"
            placeholderTx="editPrivateProfileScreen:phoneNumberPH"
            keyboardType="number-pad"
            accessible={true}
            accessibilityLabel="Phone Number input"
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
