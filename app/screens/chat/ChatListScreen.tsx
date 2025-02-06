import { $styles, ThemedStyle } from "@/theme"
import { observer } from "mobx-react-lite"
import { FC, useCallback, useRef } from "react"
import { ImageStyle, TextStyle, View, ViewStyle } from "react-native"
import { AutoImage, ListItem, ListView, Screen, Text } from "@/components"
import { MainTabScreenProps } from "@/navigators/MainNavigator"
import { useAppTheme } from "@/utils/useAppTheme"
import { useStores } from "@/models"
import { ContentStyle } from "@shopify/flash-list"
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet"
import { NavigationProp, useNavigation } from "@react-navigation/native"
import { AppStackParamList } from "@/navigators"
import { handleError } from "@/utils/errorHandler"
import { IOrganizerChat } from "@/models/organizer/OrganizerChatStore"
import { OrganizerEventDateLocation } from "@/models/organizer/OrganizerEventDateModel"
import { convertImageURLToSupabaseURL } from "@/utils/imageFunctions"

export const ChatListScreen: FC<MainTabScreenProps<"ChatList">> = observer(
  function ChatListScreen(_props) {
    const { navigation } = _props
    const { themed } = useAppTheme()
    const { organizerChatStore, chatStore } = useStores()
    const handlePressChat = (chatId: string, eventTitle: string | undefined) => {
      if (eventTitle === undefined) {
        handleError("errors:unknown")
        return
      }

      chatStore.joinSocketChatRoom(chatId)
      navigation.navigate("Chat", { eventChatId: chatId, eventTitle })
    }
    return (
      <Screen preset="fixed" contentContainerStyle={$styles.flex1}>
        <ListView<IOrganizerChat>
          data={organizerChatStore.chatsAsList}
          estimatedItemSize={100}
          contentContainerStyle={themed([$listContentContainer, $styles.container])}
          ListHeaderComponent={
            <View style={themed($heading)}>
              <Text preset="heading" tx="chatListScreen:chats" />
            </View>
          }
          renderItem={({ item }) => {
            return (
              <ChatListItem
                chatId={item.id}
                handlePressChat={() =>
                  handlePressChat(item.id, item.events_dates_locations_id.event_id.title)
                }
                eventsDatesLocations={item.events_dates_locations_id}
              />
            )
          }}
        />
      </Screen>
    )
  },
)
interface ChatListItemProps {
  chatId: string
  eventsDatesLocations: OrganizerEventDateLocation
  handlePressChat: () => void
}
const ChatListItem: FC<ChatListItemProps> = observer(function ChatListItem(props) {
  const { chatId, eventsDatesLocations, handlePressChat } = props
  const { themed } = useAppTheme()
  const navigation = useNavigation<NavigationProp<AppStackParamList>>()
  const {
    chatStore: { quitChat },
  } = useStores()
  const sheet = useRef<BottomSheetModal>(null)

  const presentOptions = useCallback(() => {
    sheet.current?.present()
  }, [])

  const dismissOptions = useCallback(() => {
    sheet.current?.dismiss()
  }, [])

  return (
    <>
      <ListItem
        textStyle={themed($listItemText)}
        containerStyle={themed($listItem)}
        bottomSeparator
        onPress={handlePressChat}
        onLongPress={presentOptions}
        LeftComponent={
          eventsDatesLocations.event_id.image_url ? (
            <AutoImage
              source={{
                uri: convertImageURLToSupabaseURL(
                  "events",
                  eventsDatesLocations.event_id.image_url,
                ),
              }}
              style={$itemThumbnail}
            />
          ) : (
            <View style={$itemThumbnail} />
          )
        }
      >
        <Text
          tx="organizerChatListScreen:title"
          preset="subheading"
          txOptions={{
            title: eventsDatesLocations.event_id.title,
          }}
        />
        {"\n"}
        <Text
          weight="light"
          size="xxs"
          tx="organizerChatListScreen:dateTime"
          txOptions={{
            date: eventsDatesLocations.dateFormatted.textLabel,
            time: eventsDatesLocations.timeFormatted.textLabel,
          }}
        />
      </ListItem>
      <BottomSheetModal
        ref={sheet}
        backgroundStyle={themed($bottomSheetBackground)}
        stackBehavior="replace"
        snapPoints={["20%"]}
        // enableDynamicSizing
        handleIndicatorStyle={themed($handleIndicator)}
        enableDismissOnClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
      >
        <BottomSheetView style={themed($bottomSheetContent)}>
          <ListItem
            tx="chatListScreen:leaveChat"
            rightIcon="caretRight"
            topSeparator
            onPress={() => quitChat(chatId)}
          />

          <ListItem
            tx="chatListScreen:reportChat"
            onPress={() => {
              dismissOptions()
              navigation.navigate("Report", {
                reportedItemId: chatId,
                reportType: "chat",
                reportContent: eventsDatesLocations.event_id.title,
              })
            }}
            rightIcon="caretRight"
            topSeparator
            bottomSeparator
          />
        </BottomSheetView>
      </BottomSheetModal>
    </>
  )
})
const $listContentContainer: ThemedStyle<ContentStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.lg + spacing.xl,
  paddingBottom: spacing.lg,
})
const $listItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
})

const $listItemText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  paddingLeft: spacing.md,
})

const $item: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.md,
  marginTop: spacing.sm,
  minHeight: 60,
  backgroundColor: colors.palette.neutral100,
})

const $itemThumbnail: ImageStyle = {
  alignSelf: "center",
  borderRadius: 25,
  width: 50,
  height: 50,
}
const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
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
