import { FC, useState } from "react"
import { View, ViewStyle, Alert } from "react-native"
import { Screen, Button, TextField } from "@/components"
import { useAppTheme } from "@/utils/useAppTheme"
import { useStores } from "@/models"
import { observer } from "mobx-react-lite"
import { $styles, ThemedStyle } from "@/theme"
import { navigate } from "@/navigators/navigationUtilities"
import { useHeader } from "@/utils/useHeader"
import { translate } from "@/i18n"
import { UserProfileStackScreenProps } from "@/navigators/userNavigationTypes"

export const EditProfileScreen: FC<UserProfileStackScreenProps<"UserProfileEditPersonalScreen">> =
  observer(function EditProfileScreen(_props) {
    const { themed } = useAppTheme()
    const { userStore } = useStores()
    const user = userStore.user

    const [displayName, setDisplayName] = useState(user?.display_name || "")
    const [about, setAbout] = useState(user?.about || "")
    const [age, setAge] = useState(user?.age?.toString() || "")
    const [isSubmitting, setIsSubmitting] = useState(false)

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
              setIsSubmitting(true)
              try {
                const updates = {
                  display_name: displayName,
                  about,
                  age: age ? parseInt(age, 10) : null,
                }

                const success = await userStore.updateProfile(updates)
                if (success) {
                  navigate("Main", { screen: "Profile" })
                }
              } finally {
                setIsSubmitting(false)
              }
            },
          },
        ],
      )
    }
    useHeader(
      {
        titleTx: "editProfileScreen:editProfile",
        leftIcon: "back",
        onLeftPress: () => navigate("Main", { screen: "Profile" }),
      },
      [],
    )
    return (
      <Screen preset="scroll" contentContainerStyle={$styles.container}>
        <View style={themed($formContainer)}>
          <TextField
            value={displayName}
            onChangeText={setDisplayName}
            labelTx="editProfileScreen:displayName"
            placeholderTx="editProfileScreen:displayNamePlaceholder"
            accessible={true}
            accessibilityLabel="Display name input"
            accessibilityRole="text"
          />

          <TextField
            value={age}
            onChangeText={setAge}
            labelTx="profileScreen:age"
            placeholderTx="editProfileScreen:agePlaceholder"
            keyboardType="numeric"
            accessible={true}
            accessibilityLabel="Age input"
            accessibilityRole="text"
          />

          <TextField
            value={about}
            onChangeText={setAbout}
            labelTx="profileScreen:about"
            placeholderTx="editProfileScreen:aboutPlaceholder"
            multiline
            numberOfLines={4}
            accessible={true}
            accessibilityLabel="About input"
            accessibilityRole="text"
          />

          <Button tx="common:saveChanges" onPress={handleSave} disabled={isSubmitting} />
        </View>
      </Screen>
    )
  })

const $formContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.lg,
})
