import { Observer, observer } from "mobx-react-lite"
import { useStores } from "../../../models"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { FC } from "react"
import { Icon, ListItem, ListView, Screen, Text } from "@/components"
import { View, ViewStyle } from "react-native"
import { Location } from "@/models/location/LocationStore"
import { OrganizerLocationStackScreenProps } from "@/navigators/navigationTypes.ts"

export const OrganizerLocationListScreen: FC<
  OrganizerLocationStackScreenProps<"OrganizerLocationListScreen">
> = observer(function OrganizerLocationsScreen(_props) {
  const { locationStore } = useStores()
  const { navigate } = _props.navigation
  const { themed } = useAppTheme()
  return (
    <Screen preset="auto" contentContainerStyle={themed($screenContentContainer)}>
      <ListView<Location>
        data={locationStore.locationsForList}
        estimatedItemSize={10}
        ListHeaderComponent={
          <View style={themed($heading)}>
            <Text preset="heading" tx="organizerLocationListScreen:heading" />
            <Icon
              icon="plus"
              size={24}
              onPress={() =>
                navigate("OrganizerLocationEditScreen", {
                  locationId: undefined,
                })
              }
            />
          </View>
        }
        renderItem={({ item }) => (
          <Observer>
            {() => (
              <ListItem
                text={item.name}
                bottomSeparator
                rightIcon="caretRight"
                onPress={() => {
                  navigate("OrganizerLocationEditScreen", {
                    locationId: item.id,
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

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
  paddingHorizontal: spacing.lg,
})
const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
})
