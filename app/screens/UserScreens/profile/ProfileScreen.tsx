import { FC, useCallback, useState } from "react"
import {
  ViewStyle,
  View,
  TextStyle,
  Image,
  TouchableOpacity,
  ImageStyle,
  ActivityIndicator,
  LayoutAnimation,
  Alert,
} from "react-native"
import { observer } from "mobx-react-lite"
import { translate } from "@/i18n"
import { Screen, Text, Icon, Button, Card } from "@/components"
import { $styles, colors, ThemedStyle } from "@/theme"
import { UserProfileFormState } from "@/types/userFormTypes"
import { useAppTheme } from "@/utils/useAppTheme"
import { useStores } from "@/models"
import { UserProfileStackScreenProps } from "@/navigators/userNavigationTypes"

export const ProfileScreen: FC<UserProfileStackScreenProps<"UserProfileScreen">> = observer(
  function ProfileScreen(_props) {
    const navigation = _props.navigation
    const { setThemeContextOverride, themeContext, themed } = useAppTheme()
    const { userProfileStore, userAuthenticationStore } = useStores()
    const userProfile = userProfileStore.profile

    const [formState, setFormState] = useState<UserProfileFormState>({
      errors: {},
      isLoading: false,
    })

    const handleEditPersonalInfo = () => {
      navigation.navigate("UserProfileEditPersonalScreen")
    }
    const handleEditPrivateProfile = () => {
      // navigation.navigate("UserProfileEditPrivateScreen")
    }

    const handleUploadAvatar = async () => {
      setFormState((prev) => ({ ...prev, isLoading: true }))

      const result = await userProfileStore.uploadAvatar()

      if (result === true) {
        setFormState({
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

    const handleDeleteProfile = () => {
      Alert.alert(
        translate("profileScreen:deleteAccountWarning"),
        translate("profileScreen:deleteAccountWarningDescription"),
        [
          {
            text: translate("common:cancel"),
            style: "cancel",
          },
          {
            text: translate("common:delete"),
            onPress: async () => {
              userProfile.deleteProfile()
            },
          },
        ],
      )
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
      <Screen preset="scroll" contentContainerStyle={$styles.container}>
        <>
          {/* Profile Header */}
          <View style={themed($headerContainer)}>
            {/* Profile Picture Section */}
            <View style={themed($profilePictureContainer)}>
              {userProfile?.avatar_url ? (
                <>
                  <Image
                    source={{
                      uri: `${process.env.EXPO_PUBLIC_SUPABASE_URL!}/storage/v1/object/public/avatars/${userProfile?.avatar_url}`,
                    }}
                    style={$profilePicture}
                    accessible={true}
                    accessibilityLabel="Profile picture"
                    accessibilityRole="image"
                  />
                  {formState.isLoading && (
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
                onPress={handleUploadAvatar}
                accessible={true}
                accessibilityLabel="Edit profile picture"
                accessibilityRole="button"
                disabled={formState.isLoading}
              >
                <Icon icon="refresh" size={20} />
              </TouchableOpacity>
            </View>

            {/* Name and Username Section */}
            <View style={themed($userInfoContainer)}>
              <Text
                preset="heading"
                tx={userProfile?.display_name || "profileScreen:addName"}
                style={themed($nameText)}
                accessibilityRole="header"
              />
            </View>
          </View>

          {/* Public Profile */}
          <Card
            style={themed($item)}
            HeadingComponent={
              <View style={themed($sectionHeader)}>
                <Text
                  preset="subheading"
                  tx="profileScreen:personalInformation"
                  accessibilityRole="header"
                />
                <TouchableOpacity
                  onPress={handleEditPersonalInfo}
                  accessible={true}
                  accessibilityLabel="Edit personal information"
                  accessibilityRole="button"
                >
                  <Icon icon="more" size={24} />
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
                    <Text preset="formLabel" tx="profileScreen:email" style={themed($infoLabel)} />
                    <Text
                      tx={userAuthenticationStore.getEmail || "profileScreen:addEmail"}
                      style={themed($infoValue)}
                      accessibilityLabel={`Email: ${userProfile?.email || "not set"}`}
                    />
                  </View>
                </View>

                <View style={themed($infoItem)} accessible={true}>
                  <View style={themed($iconContainer)}>
                    <Icon icon="growth" size={20} containerStyle={themed($iconWrapper)} />
                  </View>
                  <View style={themed($infoTextContainer)}>
                    <Text preset="formLabel" tx="profileScreen:age" style={themed($infoLabel)} />
                    <Text
                      tx={userProfile?.age?.toString() || "profileScreen:addAge"}
                      style={themed($infoValue)}
                      accessibilityLabel={`Age: ${userProfile?.age || "not set"}`}
                    />
                  </View>
                </View>

                <View style={themed($infoItem)} accessible={true}>
                  <View style={themed($iconContainer)}>
                    <Icon icon="biography" size={20} containerStyle={themed($iconWrapper)} />
                  </View>
                  <View style={themed($infoTextContainer)}>
                    <Text preset="formLabel" tx="profileScreen:bio" style={themed($infoLabel)} />
                    <Text
                      tx={userProfile?.about || "profileScreen:addBio"}
                      style={themed($infoValue)}
                      accessibilityLabel={`Bio: ${userProfile?.about || "not set"}`}
                    />
                  </View>
                </View>
              </View>
            }
          />

          {/* Private Profile */}
          <Card
            style={themed($item)}
            HeadingComponent={
              <View>
                <View style={themed($sectionHeader)}>
                  <Text
                    preset="subheading"
                    tx="profileScreen:privateInformation"
                    accessibilityRole="header"
                  />
                  <TouchableOpacity
                    onPress={handleEditPersonalInfo}
                    accessible={true}
                    accessibilityLabel="Edit private information"
                    accessibilityRole="button"
                  >
                    <Icon icon="more" size={24} />
                  </TouchableOpacity>
                </View>
                <Text
                  tx="profileScreen:privateInformationSubInfo"
                  style={themed($headerSubInfo)}
                  size="xs"
                  accessibilityLabel={`Email: ${userProfile?.email || "not set"}`}
                />
              </View>
            }
            ContentComponent={
              <View style={themed($infoContainer)}>
                <View style={themed($infoItem)} accessible={true}>
                  <View style={themed($iconContainer)}>
                    <Icon icon="idCard" size={20} containerStyle={themed($iconWrapper)} />
                  </View>
                  <View style={themed($infoTextContainer)}>
                    <Text preset="formLabel" tx="profileScreen:name" style={themed($infoLabel)} />
                  </View>
                </View>

                <View style={themed($infoItem)} accessible={true}>
                  <View style={themed($iconContainer)}>
                    <Icon icon="idCard" size={20} containerStyle={themed($iconWrapper)} />
                  </View>
                  <View style={themed($infoTextContainer)}>
                    <Text
                      preset="formLabel"
                      tx="profileScreen:lastName"
                      style={themed($infoLabel)}
                    />
                  </View>
                </View>

                <View style={themed($infoItem)} accessible={true}>
                  <View style={themed($iconContainer)}>
                    <Icon icon="biometrics" size={20} containerStyle={themed($iconWrapper)} />
                  </View>
                  <View style={themed($infoTextContainer)}>
                    <Text
                      preset="formLabel"
                      tx="profileScreen:identityNumber"
                      style={themed($infoLabel)}
                    />
                  </View>
                </View>
                <View style={themed($infoItem)} accessible={true}>
                  <View style={themed($iconContainer)}>
                    <Icon icon="telephone" size={20} containerStyle={themed($iconWrapper)} />
                  </View>
                  <View style={themed($infoTextContainer)}>
                    <Text
                      preset="formLabel"
                      tx="profileScreen:phoneNumber"
                      style={themed($infoLabel)}
                    />
                  </View>
                </View>
              </View>
            }
          />
          <Button
            onPress={() => navigation.navigate("UserAddressListScreen")}
            tx="profileScreen:listAddresses"
            RightAccessory={(props) => <Icon icon="caretRight" containerStyle={props.style} />}
            txOptions={{
              themeContext,
            }}
            style={themed($itemsContainer)}
          />
          <Button
            onPress={toggleTheme}
            tx="profileScreen:toggleTheme"
            txOptions={{
              themeContext,
            }}
            style={themed($itemsContainer)}
          />
          <Button
            onPress={() => userAuthenticationStore.logout()}
            tx="common:logOut"
            style={themed($itemsContainer)}
          />
          <Button
            onPress={handleDeleteProfile}
            tx="profileScreen:deleteAccount"
            style={themed($deleteButton)}
            preset="danger"
          />
        </>
      </Screen>
    )
  },
)

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
  marginTop: spacing.lg,
})

const $deleteButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xxxl,
})

const $nameText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $item: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
  marginBottom: spacing.lg,
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

const $headerSubInfo: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  marginBottom: spacing.md,
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
