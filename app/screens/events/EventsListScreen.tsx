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
  ImageSourcePropType,
} from "react-native"
import {
  EmptyState,
  Card,
  Icon,
  ListView,
  Switch,
  Screen,
  Text,
  AutoImage,
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
import Config from "@/config"

const ICON_SIZE = 14

interface EventsListScreenProps extends EventTabScreenProps<"EventsList"> {}

export const EventsListScreen: FC<EventsListScreenProps> = observer(
  function EventsListScreen(_props) {
    const { eventStore } = useStores()
    const { themed } = useAppTheme()

    return (
      <Screen preset="fixed" contentContainerStyle={$styles.flex1} safeAreaEdges={["bottom"]}>
        <ListView<Event>
          contentContainerStyle={themed([$styles.container, $listContentContainer])}
          data={eventStore.eventsForList.slice() as Event[]}
          extraData={
            eventStore.joinedChats.length + eventStore.favorites.length + eventStore.events.length
          }
          estimatedItemSize={177}
          ListEmptyComponent={
            eventStore.isLoading ? (
              <ActivityIndicator />
            ) : (
              <EmptyState
                preset="generic"
                style={themed($emptyState)}
                headingTx={
                  eventStore.favoritesOnly
                    ? "eventsListScreen:noFavoritesEmptyState.heading"
                    : "eventsListScreen:noEventsEmptyState.heading"
                }
                contentTx={
                  eventStore.favoritesOnly
                    ? "eventsListScreen:noFavoritesEmptyState.content"
                    : "eventsListScreen:noEventsEmptyState.content"
                }
                button={eventStore.favoritesOnly ? "" : ""}
                imageStyle={$emptyStateImage}
                ImageProps={{ resizeMode: "contain" }}
              />
            )
          }
          ListHeaderComponent={
            <View style={themed($heading)}>
              <Text preset="heading" tx="eventsListScreen:title" />
              {(eventStore.favoritesOnly || eventStore.eventsForList.length > 0) && (
                <View style={themed($toggle)}>
                  <Switch
                    value={eventStore.favoritesOnly}
                    onValueChange={() =>
                      eventStore.setProp("favoritesOnly", !eventStore.favoritesOnly)
                    }
                    labelTx="eventsListScreen:onlyFavorites"
                    labelPosition="left"
                    labelStyle={$labelStyle}
                    accessibilityLabel={translate("eventsListScreen:accessibility.switch")}
                  />
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <EventCard
              event={item}
              isFavorite={eventStore.hasFavorite(item)}
              isChatJoined={eventStore.hasJoinedChat(item)}
              onPressFavorite={() => eventStore.toggleFavorite(item)}
              onPressChat={() => eventStore.toggleChat(item)}
            />
          )}
        />
      </Screen>
    )
  },
)

const EventCard = observer(function EventCard({
  event,
  isFavorite,
  isChatJoined,
  onPressFavorite,
  onPressChat,
}: {
  event: Event
  isFavorite: boolean
  isChatJoined: boolean
  onPressFavorite: () => void
  onPressChat: () => void
}) {
  const {
    theme: { colors },
    themed,
  } = useAppTheme()

  const liked = useSharedValue(isFavorite ? 1 : 0)
  const chatJoined = useSharedValue(isChatJoined ? 1 : 0)

  const imageSource = useMemo<ImageSourcePropType | null>(() => {
    // const imageUrl = event.imageUrls[0]
    const images = event.media
    console.log(images)
    return images.length > 0 ? { uri: `${Config.API_URL}${images[0].url}`, ...images[0] } : null
  }, [event.media])

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
          accessibilityLabel: event.name,
          accessibilityHint: translate("eventsListScreen:accessibility.cardHint", {
            action: isFavorite ? "unfavorite" : "favorite",
          }),
        },
        android: {
          accessibilityLabel: event.name,
          accessibilityActions: [
            {
              name: "longpress",
              label: translate("eventsListScreen:accessibility.favoriteAction"),
            },
          ],
          onAccessibilityAction: ({ nativeEvent }) => {
            if (nativeEvent.actionName === "longpress") {
              handlePressFavorite()
            }
          },
        },
      }),
    [event.name, isFavorite, handlePressFavorite],
  )

  const handlePressCard = () => {
    console.log("handlePressCard", event.name)
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
            accessibilityLabel={event.datePublished.accessibilityLabel}
          >
            {event.datePublished.textLabel}
          </Text>
          <Text
            style={themed($metadataText)}
            size="xxs"
            accessibilityLabel={event.timePublished.accessibilityLabel}
          >
            {event.timePublished.textLabel}
          </Text>
        </View>
      }
      content={event.name}
      {...accessibilityHintProps}
      RightComponent={
        imageSource ? (
          <AutoImage source={imageSource} style={themed($itemThumbnail)} maxWidth={80} />
        ) : undefined
      }
      FooterComponent={
        <View style={$styles.row}>
          <Button
            onPress={handlePressFavorite}
            onLongPress={handlePressFavorite}
            style={themed([$favoriteButton, isFavorite && $unFavoriteButton])}
            accessibilityLabel={
              isFavorite
                ? translate("eventsListScreen:accessibility.unfavoriteIcon")
                : translate("eventsListScreen:accessibility.favoriteIcon")
            }
            LeftAccessory={ButtonLeftAccessory}
          >
            <Text
              size="xxs"
              accessibilityLabel={event.timePublished.accessibilityLabel}
              weight="medium"
              text={
                isFavorite
                  ? translate("eventsListScreen:unfavoriteButton")
                  : translate("eventsListScreen:favoriteButton")
              }
            />
          </Button>
          <Button
            onPress={handlePressChat}
            onLongPress={handlePressChat}
            style={themed([$favoriteButton, isChatJoined && $unFavoriteButton])}
            accessibilityLabel={
              isChatJoined
                ? translate("eventsListScreen:quitChat")
                : translate("eventsListScreen:joinChat")
            }
            LeftAccessory={ChatButtonLeftAccessory}
          >
            <Text
              size="xxs"
              accessibilityLabel={event.timePublished.accessibilityLabel}
              weight="medium"
              text={
                isChatJoined
                  ? translate("eventsListScreen:quitChat")
                  : translate("eventsListScreen:joinChat")
              }
            />
          </Button>
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

const $itemThumbnail: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
  borderRadius: 50,
  alignSelf: "flex-start",
})

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
