import { observer } from "mobx-react-lite"
import { useStores } from "../../../models"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { FC, useCallback, useRef } from "react"
import { Icon, ListItem, ListView, Screen, Text } from "@/components"
import { View, ViewStyle } from "react-native"
import {
  OrganizerChatStackParamList,
  OrganizerChatStackScreenProps,
} from "@/navigators/navigationTypes.ts"
import { IOrganizerChat } from "@/models/organizer/OrganizerChatStore"
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet"
import { NavigationProp, useNavigation } from "@react-navigation/native"

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
            <OrganizerChatListItem
              title={item.events_dates_locations_id.event_id.title}
              date={item.events_dates_locations_id.dateFormatted.textLabel}
              time={item.events_dates_locations_id.timeFormatted.textLabel}
              eventChatId={item.id}
            />
          )}
        />
      </Screen>
    )
  })

interface IOrganizerChatListItemProps {
  title: string
  eventChatId: string
  date: string
  time: string
}

const OrganizerChatListItem: FC<IOrganizerChatListItemProps> = observer(
  function ChatListItem(props) {
    const { title, eventChatId, date, time } = props
    const { themed } = useAppTheme()
    const sheet = useRef<BottomSheetModal>(null)
    const navigation = useNavigation<NavigationProp<OrganizerChatStackParamList>>()

    const presentOptions = useCallback(() => {
      sheet.current?.present()
    }, [])

    const dismissOptions = useCallback(() => {
      sheet.current?.dismiss()
    }, [])

    return (
      <>
        <ListItem
          bottomSeparator
          rightIcon="caretRight"
          onPress={() => {
            presentOptions()
          }}
        >
          <Text
            tx="organizerChatListScreen:title"
            txOptions={{
              title,
            }}
          />
          {"\n"}
          <Text
            weight="light"
            size="xxs"
            tx="organizerChatListScreen:dateTime"
            txOptions={{ date, time }}
          />
        </ListItem>
        <BottomSheetModal
          ref={sheet}
          backgroundStyle={themed($bottomSheetBackground)}
          stackBehavior="replace"
          enableDynamicSizing
          handleIndicatorStyle={themed($handleIndicator)}
          enableDismissOnClose
          backdropComponent={(props) => (
            <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
          )}
        >
          <BottomSheetView style={themed($bottomSheetContent)}>
            <ListItem
              tx="organizerChatListScreen:participants"
              rightIcon="caretRight"
              bottomSeparator
              onPress={() => {
                navigation.navigate("OrganizerChatParticipantScreen", {
                  eventChatId,
                })
                dismissOptions()
              }}
            />
            <ListItem
              tx="organizerChatListScreen:conversation"
              rightIcon="caretRight"
              onPress={() => {
                navigation.navigate("OrganizerChatConversationScreen", {
                  eventChatId,
                })
                dismissOptions()
              }}
            />
          </BottomSheetView>
        </BottomSheetModal>
      </>
    )
  },
)

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

const $bottomSheetBackground: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
})

const $handleIndicator: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral800,
})

const $bottomSheetContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
})
