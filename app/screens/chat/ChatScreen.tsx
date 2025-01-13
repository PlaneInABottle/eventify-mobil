import { observer } from "mobx-react-lite"
import { FC, useCallback, useState } from "react"
import { AppStackScreenProps } from "@/navigators"
import { $styles, ThemedStyle } from "@/theme"
import { Card, ListView, Screen, TextField } from "@/components"
import { useStores } from "@/models"
import { ChatMessage } from "@/models/ChatStore"
import { TextStyle, ViewStyle } from "react-native"
import { useAppTheme } from "@/utils/useAppTheme"
import { faker } from "@faker-js/faker"
import { useHeader } from "@/utils/useHeader"
import { ContentStyle } from "@shopify/flash-list"

interface ChatScreenProps extends AppStackScreenProps<"Chat"> {}

export const ChatScreen: FC<ChatScreenProps> = observer(function ChatScreen(_props) {
  const { route, navigation } = _props
  const { eventChatId } = route.params
  const { chatStore } = useStores()
  const chat = chatStore.getChat(eventChatId)
  const { themed } = useAppTheme()

  // Generate fake messages
  const generateFakeMessages = useCallback(
    (count: number): ChatMessage[] => {
      return Array.from({ length: count }, (_, index) => ({
        id: faker.string.uuid(),
        content: faker.lorem.sentence(),
        sender_id: faker.person.firstName(),
        created_at: new Date(Date.now() - index * 1000 * 60 * 5).toISOString(), // 5 minutes apart
        event_chat_id: eventChatId,
      }))
    },
    [eventChatId],
  )

  // Initialize with 50 fake messages
  const [fakeMessages, setFakeMessages] = useState<ChatMessage[]>(() => generateFakeMessages(50))

  // Optional: Add more messages when loading more
  const handleLoadMore = useCallback(() => {
    setFakeMessages((prev) => [...prev, ...generateFakeMessages(10)])
  }, [generateFakeMessages])
  useHeader({
    title: "Chat",
    leftIcon: "back",
    onLeftPress: () => {
      navigation.goBack()
    },
  })

  // BUG: Keyboard hides the text field unless keyboardOffset is set, but this is not a good solution
  return (
    <Screen
      preset="fixed"
      contentContainerStyle={[$styles.flex1, themed($screenContentContainer)]}
      keyboardOffset={100}
    >
      <ListView<ChatMessage>
        inverted
        data={fakeMessages}
        estimatedItemSize={10}
        contentContainerStyle={themed($listContentContainer)}
        renderItem={({ item }) => <ChatBubble message={item} />}
        // onEndReached={handleLoadMore}
        // onEndReachedThreshold={0.5}
      />
      <TextField
        placeholder="Type a message"
        containerStyle={themed($textFieldContainer)}
        inputWrapperStyle={themed($inputWrapperStyle)}
      />
    </Screen>
  )
})
const ChatBubble = ({ message }: { message: ChatMessage }) => {
  const { themed } = useAppTheme()
  return (
    <Card
      verticalAlignment="force-footer-bottom"
      style={themed($card)}
      wrapperStyle={themed($wrapperStyle)}
      heading={message.sender_id}
      headingStyle={themed($headingText)}
      HeadingTextProps={{
        size: "xxs",
        weight: "normal",
      }}
      content={message.content}
      ContentTextProps={{
        size: "xs",
      }}
      footer={new Date(message.created_at).toLocaleString(undefined, {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}
      footerStyle={themed($footerText)}
      FooterTextProps={{
        size: "xxxs",
        weight: "light",
      }}
    />
  )
}

const $footerText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
})
const $headingText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.tint,
})

const $card: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xs,
  marginTop: spacing.xxs,
  alignSelf: "flex-start",
})

const $wrapperStyle: ThemedStyle<ViewStyle> = () => ({
  flex: 0,
})

const $textFieldContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
})

const $inputWrapperStyle: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.xxs,
  borderRadius: 100,
  backgroundColor: colors.palette.neutral100,
})

const $listContentContainer: ThemedStyle<ContentStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
})

const $screenContentContainer: ThemedStyle<ContentStyle> = ({ spacing }) => ({})
