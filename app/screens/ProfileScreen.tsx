import { FC, useCallback } from "react"
import {
  ViewStyle,
  View,
  TextStyle,
  Image,
  TouchableOpacity,
  ImageStyle,
  ActivityIndicator,
  LayoutAnimation,
} from "react-native"
import { Screen, Text, Icon, Button, Card } from "@/components"
import { useAppTheme } from "@/utils/useAppTheme"
import { MainTabScreenProps } from "@/navigators/MainNavigator"
import { useStores } from "@/models"
import { observer } from "mobx-react-lite"
import { $styles, colors, ThemedStyle } from "@/theme"
import { navigate } from "@/navigators/navigationUtilities"

interface ProfileScreenProps extends MainTabScreenProps<"Profile"> {}

export const ProfileScreen: FC<ProfileScreenProps> = observer(function ProfileScreen(_props) {
  const { setThemeContextOverride, themeContext, themed } = useAppTheme()
  const { userStore } = useStores()
  const user = userStore.user

  const handleEditPersonalInfo = () => {
    navigate("EditProfile")
  }

  const toggleTheme = useCallback(() => {
    // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut) // Animate the transition
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    })
    setThemeContextOverride(themeContext === "dark" ? "light" : "dark")
  }, [themeContext, setThemeContextOverride])
  return (
    <Screen preset="scroll" contentContainerStyle={$styles.container} safeAreaEdges={["top"]}>
      <>
        {/* Profile Header */}
        <View style={themed($headerContainer)}>
          {/* Profile Picture Section */}
          <View style={themed($profilePictureContainer)}>
            {user?.avatar_url ? (
              <>
                <Image
                  source={{
                    uri: `${process.env.EXPO_PUBLIC_SUPABASE_URL!}/storage/v1/object/public/avatars/${user?.avatar_url}`,
                  }}
                  style={$profilePicture}
                  accessible={true}
                  accessibilityLabel="Profile picture"
                  accessibilityRole="image"
                />
                {userStore.isLoading && (
                  <ActivityIndicator
                    size="large"
                    color={colors.palette.primary500}
                    style={themed($profileImageActivityIndicator)}
                  />
                )}
              </>
            ) : (
              <View style={[$profilePicture, themed($placeholderImage)]} />
            )}
            <TouchableOpacity
              style={themed($editPictureButton)}
              onPress={userStore.uploadAvatar}
              accessible={true}
              accessibilityLabel="Edit profile picture"
              accessibilityRole="button"
              disabled={userStore.isLoading}
            >
              <Icon icon="components" size={20} />
            </TouchableOpacity>
          </View>

          {/* Name and Username Section */}
          <View style={themed($userInfoContainer)}>
            <Text
              preset="heading"
              text={user?.display_name || "Add Your Name"}
              style={themed($nameText)}
              accessibilityRole="header"
            />
          </View>
        </View>

        <Card
          style={themed($item)}
          HeadingComponent={
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
          }
          ContentComponent={
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
                    text={user?.about || "Add a short bio"}
                    style={themed($infoValue)}
                    accessibilityLabel={`Bio: ${user?.about || "not set"}`}
                  />
                </View>
              </View>
            </View>
          }
        />
        <View style={themed($itemsContainer)}>
          <Button onPress={toggleTheme} text={`Toggle Theme: ${themeContext}`} />
        </View>
      </>
    </Screen>
  )
})

const $headerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  marginBottom: spacing.xl,
})

const $profilePictureContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
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
const $itemsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginVertical: spacing.xl,
})

const $nameText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $item: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
  minHeight: 120,
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
const $placeholderImage: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral300,
})

const $profileImageActivityIndicator: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: colors.palette.neutral300,
  borderRadius: 60,
  zIndex: 10,
})
