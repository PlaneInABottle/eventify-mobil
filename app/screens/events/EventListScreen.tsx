import { ComponentType, FC, useCallback, useMemo } from "react"
import {
  ViewStyle,
  View,
  TextStyle,
  Platform,
  AccessibilityProps,
  ImageStyle,
  StyleSheet,
  ActivityIndicator,
} from "react-native"
import {
  EmptyState,
  Card,
  Icon,
  ListView,
  Switch,
  Screen,
  Text,
  Button,
  ButtonAccessoryProps,
} from "@/components"
import { useAppTheme } from "@/utils/useAppTheme"
import { EventTabScreenProps } from "@/navigators/MainNavigator"
import { observer } from "mobx-react-lite"
import { Event } from "@/models/Event"
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import { isRTL, translate } from "@/i18n"
import { $styles, ThemedStyle } from "@/theme"
import { ContentStyle } from "@shopify/flash-list"
import { useStores } from "@/models"

const ICON_SIZE = 14

interface EventListScreenProps extends EventTabScreenProps<"EventListScreen"> {}

export const EventListScreen: FC<EventListScreenProps> = observer(function EventListScreen(_props) {
  const { eventStore, chatStore } = useStores()
  const { themed } = useAppTheme()

  return (
    <Screen preset="fixed" contentContainerStyle={$styles.flex1}>
      <ListView<Event>
        contentContainerStyle={themed([$styles.container, $listContentContainer])}
        data={eventStore.eventsForList.slice() as Event[]}
        extraData={chatStore.chats.size + eventStore.favorites.length + eventStore.events.size}
        estimatedItemSize={177}
        ListEmptyComponent={
          eventStore.isLoading || chatStore.isLoading ? (
            <ActivityIndicator />
          ) : (
            <EmptyState
              preset="generic"
              style={themed($emptyState)}
              headingTx={
                eventStore.favoritesOnly
                  ? "eventListScreen:noFavoritesEmptyState.heading"
                  : "eventListScreen:noEventsEmptyState.heading"
              }
              contentTx={
                eventStore.favoritesOnly
                  ? "eventListScreen:noFavoritesEmptyState.content"
                  : "eventListScreen:noEventsEmptyState.content"
              }
              button={eventStore.favoritesOnly ? "" : ""}
              imageStyle={$emptyStateImage}
              ImageProps={{ resizeMode: "contain" }}
            />
          )
        }
        ListHeaderComponent={
          <View style={themed($heading)}>
            <Text preset="heading" tx="eventListScreen:title" />
            {(eventStore.favoritesOnly || eventStore.eventsForList.length > 0) && (
              <View style={themed($toggle)}>
                <Switch
                  value={eventStore.favoritesOnly}
                  onValueChange={() =>
                    eventStore.setProp("favoritesOnly", !eventStore.favoritesOnly)
                  }
                  labelTx="eventListScreen:onlyFavorites"
                  labelPosition="left"
                  labelStyle={$labelStyle}
                  accessibilityLabel={translate("eventListScreen:accessibility.switch")}
                />
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <EventCard
            event={item}
            isFavorite={eventStore.hasFavorite(item)}
            onPressFavorite={() => eventStore.toggleFavorite(item)}
            onPressChat={() => chatStore.toggleChat(item.event_chat_id, item.id)}
          />
        )}
      />
    </Screen>
  )
})

const EventCard = observer(function EventCard({
  event,
  isFavorite,
  onPressFavorite,
  onPressChat,
}: {
  event: Event
  isFavorite: boolean
  onPressFavorite: () => void
  onPressChat: () => void
}) {
  const {
    theme: { colors },
    themed,
  } = useAppTheme()

  const {
    chatStore: { hasJoinedChat, isLoading },
  } = useStores()
  const isChatJoined = !!event.event_chat_id && hasJoinedChat(event.event_chat_id)

  const liked = useSharedValue(isFavorite ? 1 : 0)
  const chatJoined = useSharedValue(isChatJoined ? 1 : 0)

  // Grey heart
  const animatedLikeButtonStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(liked.value, [0, 1], [1, 0], Extrapolation.EXTEND),
        },
      ],
      opacity: interpolate(liked.value, [0, 1], [1, 0], Extrapolation.CLAMP),
    }
  })

  // Pink heart
  const animatedUnlikeButtonStyles = useAnimatedStyle(() => {
    return {
      transform: [{ scale: liked.value }],
      opacity: liked.value,
    }
  })

  // Grey community
  const animatedChatJoinedButtonStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: interpolate(chatJoined.value, [0, 1], [1, 0], Extrapolation.EXTEND),
        },
      ],
      opacity: interpolate(chatJoined.value, [0, 1], [1, 0], Extrapolation.CLAMP),
    }
  })

  // Pink community
  const animatedChatQuitButtonStyles = useAnimatedStyle(() => {
    return {
      transform: [{ scale: chatJoined.value }],
      opacity: chatJoined.value,
    }
  })

  const handlePressFavorite = useCallback(() => {
    onPressFavorite()
    liked.value = withSpring(liked.value ? 0 : 1)
  }, [liked, onPressFavorite])

  const handlePressChat = useCallback(() => {
    onPressChat()
    chatJoined.value = withSpring(chatJoined.value ? 0 : 1)
  }, [chatJoined, onPressChat])

  const accessibilityHintProps = useMemo(
    () =>
      Platform.select<AccessibilityProps>({
        ios: {
          accessibilityLabel: event.title,
          accessibilityHint: translate("eventListScreen:accessibility.cardHint", {
            action: isFavorite ? "unfavorite" : "favorite",
          }),
        },
        android: {
          accessibilityLabel: event.title,
          accessibilityActions: [
            {
              name: "longpress",
              label: translate("eventListScreen:accessibility.favoriteAction"),
            },
          ],
          onAccessibilityAction: ({ nativeEvent }) => {
            if (nativeEvent.actionName === "longpress") {
              handlePressFavorite()
            }
          },
        },
      }),
    [event.title, isFavorite, handlePressFavorite],
  )

  const handlePressCard = () => {
    console.log("handlePressCard", event.title)
  }

  const ButtonLeftAccessory: ComponentType<ButtonAccessoryProps> = useMemo(
    () =>
      function ButtonLeftAccessory() {
        return (
          <View>
            <Animated.View
              style={[
                $styles.row,
                themed($iconContainer),
                StyleSheet.absoluteFill,
                animatedLikeButtonStyles,
              ]}
            >
              <Icon
                icon="heart"
                size={ICON_SIZE}
                color={colors.palette.neutral800} // dark grey
              />
            </Animated.View>
            <Animated.View
              style={[$styles.row, themed($iconContainer), animatedUnlikeButtonStyles]}
            >
              <Icon
                icon="heart"
                size={ICON_SIZE}
                color={colors.palette.primary400} // pink
              />
            </Animated.View>
          </View>
        )
      },
    [animatedLikeButtonStyles, animatedUnlikeButtonStyles, colors, themed],
  )

  const ChatButtonLeftAccessory: ComponentType<ButtonAccessoryProps> = useMemo(
    () =>
      function ChatButtonLeftAccessory() {
        return (
          <View>
            <Animated.View
              style={[
                $styles.row,
                themed($iconContainer),
                StyleSheet.absoluteFill,
                animatedChatJoinedButtonStyles,
              ]}
            >
              <Icon
                icon="community"
                size={ICON_SIZE}
                color={colors.palette.neutral800} // dark grey
              />
            </Animated.View>
            <Animated.View
              style={[$styles.row, themed($iconContainer), animatedChatQuitButtonStyles]}
            >
              <Icon
                icon="community"
                size={ICON_SIZE}
                color={colors.palette.primary400} // pink
              />
            </Animated.View>
          </View>
        )
      },
    [animatedChatJoinedButtonStyles, animatedChatQuitButtonStyles, colors, themed],
  )
  return (
    <Card
      style={themed($item)}
      verticalAlignment="force-footer-bottom"
      onPress={handlePressCard}
      onLongPress={handlePressFavorite}
      HeadingComponent={
        <View style={[$styles.row, themed($metadata)]}>
          <Text
            style={themed($metadataText)}
            size="xxs"
            accessibilityLabel={event.dateFormatted.accessibilityLabel}
          >
            {event.dateFormatted.textLabel}
          </Text>
          <Text
            style={themed($metadataText)}
            size="xxs"
            accessibilityLabel={event.timeFormatted.accessibilityLabel}
          >
            {event.timeFormatted.textLabel}
          </Text>
        </View>
      }
      content={event.title}
      {...accessibilityHintProps}
      // RightComponent={
      //   imageSource ? (
      //     <AutoImage source={imageSource} style={themed($itemThumbnail)} maxWidth={80} />
      //   ) : undefined
      // }
      FooterComponent={
        <View style={$styles.row}>
          <Button
            onPress={handlePressFavorite}
            onLongPress={handlePressFavorite}
            style={themed([$favoriteButton, isFavorite && $unFavoriteButton])}
            accessibilityLabel={
              isFavorite
                ? translate("eventListScreen:accessibility.unfavoriteIcon")
                : translate("eventListScreen:accessibility.favoriteIcon")
            }
            LeftAccessory={ButtonLeftAccessory}
          >
            <Text
              size="xxs"
              accessibilityLabel={event.timeFormatted.accessibilityLabel}
              weight="medium"
              tx={
                isFavorite ? "eventListScreen:unfavoriteButton" : "eventListScreen:favoriteButton"
              }
            />
          </Button>
          {event.hasChat && (
            <Button
              onPress={handlePressChat}
              onLongPress={handlePressChat}
              style={themed([$favoriteButton, isChatJoined && $unFavoriteButton])}
              accessibilityLabel={
                isChatJoined
                  ? translate("eventListScreen:quitChat")
                  : translate("eventListScreen:joinChat")
              }
              LeftAccessory={ChatButtonLeftAccessory}
              disabled={isLoading}
            >
              <Text
                size="xxs"
                accessibilityLabel={event.timeFormatted.accessibilityLabel}
                weight="medium"
                tx={isChatJoined ? "eventListScreen:quitChat" : "eventListScreen:joinChat"}
              />
            </Button>
          )}
        </View>
      }
    />
  )
})
// #region Styles
const $listContentContainer: ThemedStyle<ContentStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.lg + spacing.xl,
  paddingBottom: spacing.lg,
})

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $item: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  padding: spacing.md,
  marginTop: spacing.md,
  minHeight: 120,
  backgroundColor: colors.palette.neutral100,
})

// const $itemThumbnail: ThemedStyle<ImageStyle> = ({ spacing }) => ({
//   marginTop: spacing.sm,
//   borderRadius: 50,
//   alignSelf: "flex-start",
// })

const $toggle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
})

const $labelStyle: TextStyle = {
  textAlign: "left",
}

const $iconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  height: ICON_SIZE,
  width: ICON_SIZE,
  marginEnd: spacing.sm,
})

const $metadata: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginTop: spacing.xs,
})

const $metadataText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.textDim,
  marginEnd: spacing.md,
  marginBottom: spacing.xs,
})

const $favoriteButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  borderRadius: 17,
  marginTop: spacing.md,
  justifyContent: "flex-start",
  backgroundColor: colors.palette.neutral300,
  borderColor: colors.palette.neutral300,
  paddingHorizontal: spacing.md,
  paddingTop: spacing.xxxs,
  paddingBottom: 0,
  marginEnd: spacing.md,
  minHeight: 32,
  alignSelf: "flex-start",
})

const $unFavoriteButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.primary100,
  backgroundColor: colors.palette.primary100,
})

const $emptyState: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xxl,
})

const $emptyStateImage: ImageStyle = {
  transform: [{ scaleX: isRTL ? -1 : 1 }],
}
// #endregion
