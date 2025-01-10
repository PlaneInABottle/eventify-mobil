import { $styles, ThemedStyle } from "@/theme"
import { observer } from "mobx-react-lite"
import { FC, useEffect } from "react"
import { ImageStyle, TextStyle, View, ViewStyle } from "react-native"
import { AutoImage, Card, ListItem, ListView, Screen, Text } from "@/components"
import { MainTabScreenProps } from "@/navigators/MainNavigator"
import { useAppTheme } from "@/utils/useAppTheme"
import { useStores } from "@/models"
import { Chat } from "@/models/ChatStore"
import { ContentStyle } from "@shopify/flash-list"

export const ChatListScreen: FC<MainTabScreenProps<"ChatList">> = observer(
  function ChatListScreen(_props) {
    const { navigation } = _props
    const { themed } = useAppTheme()
    const { chatStore, eventStore } = useStores()

    useEffect(() => {
      chatStore.fetchUserChats()
    }, [])
    const handlePressChat = (chat: Chat) => {
      navigation.navigate("Chat", { eventChatId: chat.id })
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
          // renderItem={({ item }) => <ChatItemCard chat={item} handlePressChat={handlePressChat} />}

          renderItem={({ item }) => {
            const event = eventStore.events.get(item.event_id)
            return (
              <ListItem
                text={event?.title}
                TextProps={{ preset: "subheading" }}
                textStyle={themed($listItemText)}
                containerStyle={themed($listItem)}
                bottomSeparator
                onPress={() => handlePressChat(item)}
                LeftComponent={
                  event?.image_url ? (
                    <AutoImage
                      source={{
                        uri: `${process.env.EXPO_PUBLIC_SUPABASE_URL!}/storage/v1/object/public/avatars/${event?.image_url}`,
                      }}
                      style={$itemThumbnail}
                    />
                  ) : undefined
                }
                rightIcon="caretRight"
              />
            )
          }}
        />
      </Screen>
    )
  },
)

interface ChatItemProps {
  chat: Chat
  handlePressChat: (chat: Chat) => void
}
// Not used, but could be used if we want to add a chat list item card
const ChatItemCard = observer(function ChatItem({ chat, handlePressChat }: ChatItemProps) {
  const { themed } = useAppTheme()
  const { eventStore } = useStores()
  const event = eventStore.events.get(chat.event_id)

  return (
    <Card
      style={themed($item)}
      verticalAlignment="center"
      onPress={() => handlePressChat(chat)}
      LeftComponent={
        event?.image_url ? (
          <AutoImage
            source={{
              uri: `${process.env.EXPO_PUBLIC_SUPABASE_URL!}/storage/v1/object/public/avatars/${event?.image_url}`,
            }}
            style={$itemThumbnail}
          />
        ) : undefined
      }
      // RightComponent={
      //   <Button preset="default" text="Click It" onPress={() => Alert.alert("pressed")} />
      // }
      HeadingComponent={<Text preset="subheading" text={event?.title} />}
    />
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
