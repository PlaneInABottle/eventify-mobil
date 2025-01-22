import { observer } from "mobx-react-lite"
import { FC, useCallback, useRef, useState } from "react"
import { AppStackParamList, AppStackScreenProps } from "@/navigators"
import { $styles, ThemedStyle } from "@/theme"
import { Card, Icon, ListItem, ListView, Screen, TextField } from "@/components"
import { useStores } from "@/models"
import { Chat, ChatMessage } from "@/models/ChatStore"
import { TextStyle, ViewStyle } from "react-native"
import { useAppTheme } from "@/utils/useAppTheme"
import { useHeader } from "@/utils/useHeader"
import { ContentStyle } from "@shopify/flash-list"
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet"
import { NavigationProp, useNavigation } from "@react-navigation/native"

interface ChatScreenProps extends AppStackScreenProps<"Chat"> {}

export const ChatScreen: FC<ChatScreenProps> = observer(function ChatScreen(_props) {
  const { route, navigation } = _props
  const { eventChatId, eventTitle } = route.params
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
    titleTx: "chatScreen:chat",
    titleTxOptions: { eventTitle },
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
      keyboardOffset={100}
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
        placeholderTx="chatScreen:textInputPlaceholder"
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

  const sheet = useRef<BottomSheetModal>(null)

  const navigation = useNavigation<NavigationProp<AppStackParamList>>()
  const presentOptions = useCallback(() => {
    sheet.current?.present()
  }, [])

  const dismissOptions = useCallback(() => {
    sheet.current?.dismiss()
  }, [])
  const isMessageBelongsUser = userId === message.sender_id
  return (
    <>
      <Card
        verticalAlignment="force-footer-bottom"
        style={[themed($card), isMessageBelongsUser ? themed($messageBelongUser) : undefined]}
        wrapperStyle={themed($wrapperStyle)}
        onPress={() => {}} // I have no idea why this is needed but if I remove it long press doesn't work
        onLongPress={presentOptions}
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
            tx="chatScreen:reportMessage"
            onPress={() => {
              dismissOptions()
              navigation.navigate("Report", {
                reportedItemId: message.id,
                reportType: "message",
                reportContent: message.content,
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

const $messageBelongUser: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignSelf: "flex-end",
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
const $bottomSheetBackground: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
})
const $handleIndicator: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral800,
})
const $bottomSheetContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
})
