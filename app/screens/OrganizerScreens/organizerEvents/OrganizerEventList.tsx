import { Observer, observer } from "mobx-react-lite"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { FC } from "react"
import { Icon, ListItem, ListView, Screen, Text } from "@/components"
import { View, ViewStyle } from "react-native"
import { useStores } from "@/models"
import { OrganizerEventStackScreenProps } from "@/navigators/navigationTypes.ts"
import { OrganizerEvent } from "@/models/organizer/OrganizerEventStore"

export const OrganizerEventListScreen: FC<
  OrganizerEventStackScreenProps<"OrganizerEventListScreen">
> = observer(function OrganizerLocationsScreen(_props) {
  const { navigation } = _props
  const navigate = navigation.navigate

  const { organizerEventStore } = useStores()

  const { themed } = useAppTheme()
  return (
    <Screen preset="auto" contentContainerStyle={themed($screenContentContainer)}>
      <ListView<OrganizerEvent>
        data={organizerEventStore.eventsAsList}
        estimatedItemSize={10}
        ListHeaderComponent={
          <View style={themed($heading)}>
            <Text preset="heading" tx="organizerEventListScreen:heading" />
            <Icon
              icon="plus"
              size={24}
              onPress={() =>
                navigate("OrganizerEventEditScreen", {
                  eventId: undefined,
                })
              }
            />
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
                  navigate("OrganizerEventEditScreen", {
                    eventId: item.id,
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
