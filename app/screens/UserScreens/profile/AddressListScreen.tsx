import { Observer, observer } from "mobx-react-lite"
import { useStores } from "../../../models"
import { $styles, type ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { FC } from "react"
import { Icon, ListItem, ListView, Screen, Text } from "@/components"
import { View, ViewStyle } from "react-native"
import { UserProfileStackScreenProps } from "@/navigators/userNavigationTypes"
import { IUserAddressSnapshotIn } from "@/models/userStores/UserAddressStore"
import { ContentStyle } from "@shopify/flash-list"

export const UserAddressListScreen: FC<UserProfileStackScreenProps<"UserAddressListScreen">> =
  observer(function UserAddressListScreen(_props) {
    const { navigate, goBack } = _props.navigation
    const { userAddressStore } = useStores()
    const { themed } = useAppTheme()

    return (
      <Screen preset="fixed" contentContainerStyle={$styles.flex1}>
        <ListView<IUserAddressSnapshotIn>
          data={userAddressStore.addressesForList}
          estimatedItemSize={10}
          contentContainerStyle={themed([$listContentContainer, $styles.container])}
          ListHeaderComponent={
            <View>
              <View style={themed($heading)}>
                <Icon icon="caretLeft" size={24} onPress={() => goBack()} />
                <Text preset="heading" tx="addressListScreen:myAddresses" />
                <Icon
                  icon="plus"
                  size={24}
                  onPress={() =>
                    navigate("UserAddressEditScreen", {
                      addressId: undefined,
                    })
                  }
                />
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <Observer>
              {() => (
                <ListItem
                  text={item.title}
                  bottomSeparator
                  rightIcon="caretRight"
                  onPress={() => {
                    navigate("UserAddressEditScreen", {
                      addressId: item.id,
                    })
                  }}
                />
              )}
            </Observer>
          )}
        />
      </Screen>
    )
  })

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
})
const $listContentContainer: ThemedStyle<ContentStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.lg + spacing.xl,
  paddingBottom: spacing.lg,
})
