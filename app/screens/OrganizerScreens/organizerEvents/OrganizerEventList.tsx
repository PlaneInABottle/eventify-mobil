import { observer } from "mobx-react-lite"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { FC } from "react"
import { ListItem, ListView, Screen, Text } from "@/components"
import { View, ViewStyle } from "react-native"
import { useStores } from "@/models"
import { OrganizerEventStackScreenProps } from "@/navigators/navigationTypes.ts"
import { OrganizerEvent } from "@/models/organizer/OrganizerEventStore"

export const OrganizerEventListScreen: FC<
  OrganizerEventStackScreenProps<"OrganizerEventListScreen">
> = observer(function OrganizerLocationsScreen(_props) {
  const { navigation } = _props
  const navigate = navigation.navigate

  const { userStore, organizerEventStore } = useStores()
  const userId = userStore.userId

  const { themed } = useAppTheme()
  return (
    <Screen preset="auto" contentContainerStyle={themed($screenContentContainer)}>
      <ListView<OrganizerEvent>
        data={organizerEventStore.eventsForList}
        estimatedItemSize={10}
        ListHeaderComponent={
          <View style={themed($heading)}>
            <Text preset="heading" tx="organizerEventListScreen:heading" />
          </View>
        }
        renderItem={({ item }) => (
          <ListItem
            text={item.title}
            bottomSeparator
            rightIcon="caretRight"
            onPress={() => {
              navigate("OrganizerEventEditScreen", {
                eventId: item.id,
              })
            }}
          />
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
})
