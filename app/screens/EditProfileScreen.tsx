import { FC, useState } from "react"
import { View, ViewStyle, Alert } from "react-native"
import { AppStackScreenProps } from "@/navigators"
import { Screen, Button, TextField } from "@/components"
import { useAppTheme } from "@/utils/useAppTheme"
import { useStores } from "@/models"
import { observer } from "mobx-react-lite"
import { $styles, ThemedStyle } from "@/theme"
import { navigate } from "@/navigators/navigationUtilities"
import { useHeader } from "@/utils/useHeader"

interface EditProfileScreenProps extends AppStackScreenProps<"EditProfile"> {}

export const EditProfileScreen: FC<EditProfileScreenProps> = observer(
  function EditProfileScreen(_props) {
    const { themed } = useAppTheme()
    const { userStore } = useStores()
    const user = userStore.user

    const [displayName, setDisplayName] = useState(user?.display_name || "")
    const [about, setAbout] = useState(user?.about || "")
    const [age, setAge] = useState(user?.age?.toString() || "")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSave = async () => {
      Alert.alert("Confirm Changes", "Are you sure you want to save these profile changes?", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Save",
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
      ])
    }
    useHeader(
      {
        title: "Edit Profile",
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
            label="Display Name"
            placeholder="Enter your display name"
            accessible={true}
            accessibilityLabel="Display name input"
            accessibilityRole="text"
          />

          <TextField
            value={age}
            onChangeText={setAge}
            label="Age"
            placeholder="Enter your age"
            keyboardType="numeric"
            accessible={true}
            accessibilityLabel="Age input"
            accessibilityRole="text"
          />

          <TextField
            value={about}
            onChangeText={setAbout}
            label="About"
            placeholder="Tell us about yourself"
            multiline
            numberOfLines={4}
            accessible={true}
            accessibilityLabel="About input"
            accessibilityRole="text"
          />

          <Button text="Save Changes" onPress={handleSave} disabled={isSubmitting} />
        </View>
      </Screen>
    )
  },
)

const $formContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.lg,
})
