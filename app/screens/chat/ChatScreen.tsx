import { observer } from "mobx-react-lite"
import React, { FC, useCallback, useState } from "react"
import { AppStackScreenProps } from "@/navigators"
import { $styles, ThemedStyle } from "@/theme"
import { Card, Icon, ListView, Screen, TextField } from "@/components"
import { useStores } from "@/models"
import { Chat, ChatMessage } from "@/models/ChatStore"
import { BackHandler, TextStyle, ViewStyle } from "react-native"
import { useAppTheme } from "@/utils/useAppTheme"
import { faker } from "@faker-js/faker"
import { useHeader } from "@/utils/useHeader"
import { ContentStyle } from "@shopify/flash-list"
import { useFocusEffect } from "@react-navigation/native"

interface ChatScreenProps extends AppStackScreenProps<"Chat"> {}

export const ChatScreen: FC<ChatScreenProps> = observer(function ChatScreen(_props) {
  const { route, navigation } = _props
  const { eventChatId } = route.params
  const { chatStore, userStore } = useStores()
  const chat = chatStore.getChat(eventChatId) as Chat
  const userId = userStore.userId
  const {
    themed,
    theme: { colors },
  } = useAppTheme()
  const [message, setMessage] = useState<string>("")

  // Optional: Add more messages when loading more

  const handleLoadMore = useCallback(() => {
    chat?.getChatMessages()
  }, [chat])

  useHeader({
    title: "Chat",
    leftIcon: "back",
    onLeftPress: () => {
      //     chatStore.leaveSocketChatRoom(eventChatId)
      navigation.goBack()
    },
  })
  /*
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        chatStore.leaveSocketChatRoom(eventChatId)
        return null
      }

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress)

      return () => subscription.remove()
    }, []),
  )
    */
  const handleSendMessage = () => {
    chatStore.sendMessage(eventChatId, message)
    setMessage("")
  }
  // BUG: Keyboard hides the text field unless keyboardOffset is set, but this is not a good solution
  return (
    <Screen
      preset="fixed"
      contentContainerStyle={[$styles.flex1, themed($screenContentContainer)]}
      keyboardOffset={130}
    >
      <ListView<ChatMessage>
        inverted
        data={chat?.messages.slice()}
        extraData={chat?.offset}
        estimatedItemSize={40}
        contentContainerStyle={themed($listContentContainer)}
        renderItem={({ item }) => <ChatBubble message={item} userId={userId} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />
      <TextField
        placeholder="Type a message"
        containerStyle={themed($textFieldContainer)}
        inputWrapperStyle={themed($inputWrapperStyle)}
        value={message}
        onChangeText={setMessage}
        RightAccessory={() =>
          message && (
            <Icon onPress={handleSendMessage} icon="caretRight" color={colors.text} size={41} />
          )
        }
      />
    </Screen>
  )
})
const ChatBubble = ({ message, userId }: { message: ChatMessage; userId: string }) => {
  const { themed } = useAppTheme()
  return (
    <Card
      verticalAlignment="force-footer-bottom"
      style={[themed($card), userId === message.sender_id ? { alignSelf: "flex-end" } : undefined]}
      wrapperStyle={themed($wrapperStyle)}
      heading={message.sender_display_name}
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
