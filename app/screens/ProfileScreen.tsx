import { FC } from "react"
import { ViewStyle, View, TextStyle, Image, TouchableOpacity, ImageStyle } from "react-native"
import { Screen, Text, Icon } from "@/components"
import { useAppTheme } from "@/utils/useAppTheme"
import { MainTabScreenProps } from "@/navigators/MainNavigator"
import { useStores } from "@/models"
import { observer } from "mobx-react-lite"
import { ThemedStyle } from "@/theme"

interface ProfileScreenProps extends MainTabScreenProps<"Profile"> {}

export const ProfileScreen: FC<ProfileScreenProps> = observer(function ProfileScreen(_props) {
  const { themed } = useAppTheme()
  const { userStore } = useStores()
  const user = userStore.user

  const handleEditProfilePicture = () => {
    // TODO: Implement profile picture editing
  }

  const handleEditPersonalInfo = () => {
    // TODO: Implement personal info editing
  }

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top"]}
    >
      <View style={themed($container)}>
        {/* Profile Header */}
        <View style={themed($headerContainer)}>
          {/* Profile Picture Section */}
          <View style={themed($profilePictureContainer)}>
            <Image
              source={
                user?.avatarUrl
                  ? { uri: user.avatarUrl }
                  : {
                      uri: "https://images.pexels.com/photos/9072375/pexels-photo-9072375.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
                    }
              }
              style={$profilePicture}
              accessible={true}
              accessibilityLabel="Profile picture"
              accessibilityRole="image"
            />
            <TouchableOpacity
              style={themed($editPictureButton)}
              onPress={handleEditProfilePicture}
              accessible={true}
              accessibilityLabel="Edit profile picture"
              accessibilityRole="button"
            >
              <Icon icon="components" size={20} />
            </TouchableOpacity>
          </View>

          {/* Name and Username Section */}
          <View style={themed($userInfoContainer)}>
            <Text
              preset="heading"
              text={user?.name || "Add Your Name"}
              style={themed($nameText)}
              accessibilityRole="header"
            />
          </View>
        </View>

        {/* Personal Information Section */}
        <View style={themed($sectionContainer)}>
          <View style={themed($sectionHeader)}>
            <Text preset="subheading" text="Personal Information" accessibilityRole="header" />
            <TouchableOpacity
              onPress={handleEditPersonalInfo}
              accessible={true}
              accessibilityLabel="Edit personal information"
              accessibilityRole="button"
            >
              <Icon icon="components" size={20} />
            </TouchableOpacity>
          </View>

          {/* Info Items */}
          <View style={themed($infoContainer)}>
            <View style={themed($infoItem)} accessible={true}>
              <View style={themed($iconContainer)}>
                <Icon icon="lock" size={20} containerStyle={themed($iconWrapper)} />
              </View>
              <View style={themed($infoTextContainer)}>
                <Text preset="formLabel" text="Email" style={themed($infoLabel)} />
                <Text
                  text={user?.email || "Add email"}
                  style={themed($infoValue)}
                  accessibilityLabel={`Email: ${user?.email || "not set"}`}
                />
              </View>
            </View>

            <View style={themed($infoItem)} accessible={true}>
              <View style={themed($iconContainer)}>
                <Icon icon="components" size={20} containerStyle={themed($iconWrapper)} />
              </View>
              <View style={themed($infoTextContainer)}>
                <Text preset="formLabel" text="Age" style={themed($infoLabel)} />
                <Text
                  text={user?.age?.toString() || "Add age"}
                  style={themed($infoValue)}
                  accessibilityLabel={`Age: ${user?.age || "not set"}`}
                />
              </View>
            </View>

            <View style={themed($infoItem)} accessible={true}>
              <View style={themed($iconContainer)}>
                <Icon icon="components" size={20} containerStyle={themed($iconWrapper)} />
              </View>
              <View style={themed($infoTextContainer)}>
                <Text preset="formLabel" text="Bio" style={themed($infoLabel)} />
                <Text
                  text={user?.bio || "Add a short bio"}
                  style={themed($infoValue)}
                  accessibilityLabel={`Bio: ${user?.bio || "not set"}`}
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </Screen>
  )
})

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingVertical: spacing.xxl,
})

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.lg,
})

const $headerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  marginBottom: spacing.xl,
})

const $profilePictureContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "relative",
  marginBottom: spacing.lg,
})

const $profilePicture: ImageStyle = {
  width: 120,
  height: 120,
  borderRadius: 60,
}

const $editPictureButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  position: "absolute",
  right: 0,
  bottom: 0,
  backgroundColor: colors.background,
  borderRadius: 20,
  padding: spacing.sm,
  shadowColor: colors.palette.neutral800,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
})

const $userInfoContainer: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
})

const $nameText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $sectionContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderRadius: spacing.sm,
  padding: spacing.md,
  shadowColor: colors.palette.neutral800,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 3.84,
  elevation: 3,
})

const $sectionHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: spacing.md,
})

const $infoContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.md,
})

const $infoItem: ThemedStyle<ViewStyle> = () => ({
  flexDirection: "row",
  alignItems: "center",
})

const $iconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: "transparent",
  marginRight: spacing.sm,
  alignItems: "center",
  justifyContent: "center",
})

const $iconWrapper: ThemedStyle<ViewStyle> = () => ({
  alignItems: "center",
  justifyContent: "center",
})

const $infoTextContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $infoLabel: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})

const $infoValue: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.xxs,
})
