import { observer } from "mobx-react-lite"
import { useStores } from "../../../models"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { FC } from "react"
import { Icon, ListItem, ListView, Screen, Text } from "@/components"
import { View, ViewStyle } from "react-native"
import { OrganizerChatStackScreenProps } from "@/navigators/navigationTypes.ts"
import { IOrganizerChat } from "@/models/organizer/OrganizerChatStore"

export const OrganizerChatListScreen: FC<OrganizerChatStackScreenProps<"OrganizerChatListScreen">> =
  observer(function OrganizerChatListScreen(_props) {
    const { organizerChatStore } = useStores()
    const { navigate } = _props.navigation
    const { themed } = useAppTheme()
    return (
      <Screen preset="auto" contentContainerStyle={themed($screenContentContainer)}>
        <ListView<IOrganizerChat>
          data={organizerChatStore.chatsAsList}
          estimatedItemSize={10}
          ListHeaderComponent={
            <View style={themed($heading)}>
              <Text preset="heading" tx="organizerChatListScreen:heading" />
              <Icon
                icon="plus"
                size={24}
                onPress={() =>
                  navigate("OrganizerChatEditScreen", {
                    eventChatId: undefined,
                  })
                }
              />
            </View>
          }
          renderItem={({ item }) => (
            <ListItem
              tx="organizerChatListScreen:title"
              txOptions={{
                title: item.event_id.title,
              }}
              bottomSeparator
              rightIcon="caretRight"
              onPress={() => {
                navigate("OrganizerChatParticipantScreen", {
                  eventChatId: item.id,
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
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
})
