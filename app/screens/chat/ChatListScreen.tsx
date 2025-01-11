import { $styles, ThemedStyle } from "@/theme"
import { observer } from "mobx-react-lite"
import { FC, useCallback, useEffect, useRef, useState } from "react"
import { Alert, ImageStyle, TextStyle, View, ViewStyle } from "react-native"
import { AutoImage, Card, ListItem, ListView, Screen, Text } from "@/components"
import { MainTabScreenProps } from "@/navigators/MainNavigator"
import { useAppTheme } from "@/utils/useAppTheme"
import { useStores } from "@/models"
import { Chat } from "@/models/ChatStore"
import { ContentStyle } from "@shopify/flash-list"
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet"
import { NavigationProp, useNavigation } from "@react-navigation/native"
import { AppStackParamList } from "@/navigators"

export const ChatListScreen: FC<MainTabScreenProps<"ChatList">> = observer(
  function ChatListScreen(_props) {
    const { navigation } = _props
    const { themed } = useAppTheme()
    const { chatStore, eventStore } = useStores()
    useEffect(() => {
      chatStore.fetchUserChats()
    }, [])
    const handlePressChat = (chatId: string) => {
      navigation.navigate("Chat", { eventChatId: chatId })
    }
    return (
      <Screen preset="fixed" contentContainerStyle={$styles.flex1}>
        <ListView<Chat>
          data={Array.from(chatStore.chats.values())}
          extraData={chatStore.chats.size}
          estimatedItemSize={100}
          contentContainerStyle={themed([$listContentContainer, $styles.container])}
          ListHeaderComponent={
            <View style={themed($heading)}>
              <Text preset="heading" text="Chats" />
            </View>
          }
          renderItem={({ item }) => {
            const event = eventStore.events.get(item.event_id)
            return (
              <ChatListItem
                title={event?.title}
                handlePressChat={() => handlePressChat(item.id)}
                imageUrl={event?.image_url}
                chatId={item.id}
              />
            )
          }}
        />
      </Screen>
    )
  },
)
interface ChatListItemProps {
  title?: string
  chatId: string
  handlePressChat: () => void
  imageUrl: string | undefined | null
}
const ChatListItem: FC<ChatListItemProps> = observer(function ChatListItem(props) {
  const { title, imageUrl, handlePressChat, chatId } = props
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
        text={title}
        TextProps={{ preset: "subheading" }}
        textStyle={themed($listItemText)}
        containerStyle={themed($listItem)}
        bottomSeparator
        onPress={handlePressChat}
        onLongPress={presentOptions}
        LeftComponent={
          imageUrl ? (
            <AutoImage
              source={{
                uri: `${process.env.EXPO_PUBLIC_SUPABASE_URL!}/storage/v1/object/public/avatars/${imageUrl}`,
              }}
              style={$itemThumbnail}
            />
          ) : undefined
        }
      />
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
            text="Leave Chat"
            rightIcon="caretRight"
            topSeparator
            onPress={() => quitChat(chatId)}
          />

          <ListItem
            text="Report Chat"
            onPress={() => {
              dismissOptions()
              navigation.navigate("Report", {
                reportedItemId: chatId,
                reportType: "chat",
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
