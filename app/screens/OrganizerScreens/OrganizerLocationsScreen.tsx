import { observer } from "mobx-react-lite"
import { useStores } from "../../models"
import { AppStackScreenProps } from "../../navigators"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { FC } from "react"
import { ListItem, ListView, Screen } from "@/components"
import { ViewStyle } from "react-native"
import { Location } from "@/models/location/LocationStore"

export const OrganizerLocationsScreen: FC<AppStackScreenProps<"OrganizerLocations">> = observer(
  function OrganizerLocationsScreen(_props) {
    const { navigation } = _props
    const navigate = navigation.navigate

    const { userStore, authenticationStore, locationStore } = useStores()
    const userId = userStore.userId

    const { themed } = useAppTheme()
    return (
      <Screen preset="auto" contentContainerStyle={themed($screenContentContainer)}>
        <ListView<Location>
          data={locationStore.locationsForList}
          estimatedItemSize={10}
          renderItem={({ item }) => (
            <ListItem text={item.name} bottomSeparator rightIcon="caretRight" />
          )}
        />
      </Screen>
    )
  },
)

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
  paddingHorizontal: spacing.lg,
})

const $tapButton: ThemedStyle<ViewStyle> = () => ({
  minWidth: "100%",
})
