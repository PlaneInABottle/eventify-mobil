import { ComponentType, FC, useMemo, useState } from "react"
import { ViewStyle, View, TextStyle, ImageStyle, StyleSheet } from "react-native"
import {
  Card,
  Icon,
  ListView,
  Screen,
  Text,
  Button,
  ButtonAccessoryProps,
  AutoImage,
} from "@/components"
import { useAppTheme } from "@/utils/useAppTheme"
import { EventTabScreenProps } from "@/navigators/MainNavigator"
import { observer } from "mobx-react-lite"
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import { translate } from "@/i18n"
import { $styles, ThemedStyle } from "@/theme"
import { ContentStyle } from "@shopify/flash-list"
import { useStores } from "@/models"
import { convertImageURLToSupabaseURL } from "@/utils/imageFunctions"
import { OrganizerEventDateLocation } from "@/models/organizer/OrganizerEventDateModel"

const ICON_SIZE = 14

interface EventListScreenProps extends EventTabScreenProps<"EventListScreen"> {}

export const EventListScreen: FC<EventListScreenProps> = observer(function EventListScreen(_props) {
  const { organizerEventDateLocationStore } = useStores()
  const { themed } = useAppTheme()
  return (
    <Screen preset="fixed" contentContainerStyle={$styles.flex1}>
      <ListView<OrganizerEventDateLocation>
        contentContainerStyle={themed([$styles.container, $listContentContainer])}
        data={organizerEventDateLocationStore.datesLocationsAsList}
        estimatedItemSize={177}
        /*
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
        */
        renderItem={({ item }) => <EventCard eventDateLocation={item} />}
      />
    </Screen>
  )
})

const EventCard = observer(function EventCard({
  eventDateLocation,
}: {
  eventDateLocation: OrganizerEventDateLocation
}) {
  const {
    theme: { colors },
    themed,
  } = useAppTheme()

  const { organizerChatStore, userStore, organizerEventDateLocationStore } = useStores()
  const eventChat = organizerChatStore.chatsByDateLocationId.get(eventDateLocation.id)
  const isFavorite = organizerEventDateLocationStore.favorites.has(eventDateLocation.id)

  const userId = userStore.userId
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const liked = useSharedValue(isFavorite ? 1 : 0)
  const chatJoined = useSharedValue(eventChat?.is_user_joined ? 1 : 0)

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

  const handlePressFavorite = () => {
    setIsLoading(true)
    organizerEventDateLocationStore.toggleFavorite(eventDateLocation.id, userId)
    liked.value = withSpring(liked.value ? 0 : 1)
    setIsLoading(false)
  }

  const handlePressChat = async () => {
    setIsLoading(true)
    chatJoined.value = withSpring(chatJoined.value ? 0 : 1)
    const result: true | string = await organizerChatStore.toggleChatParticipation(
      userId,
      eventChat.id,
    )
    if (result !== true) {
      // setIsChatJoined(!isChatJoined)
      chatJoined.value = withSpring(chatJoined.value ? 0 : 1)
    }
    setIsLoading(false)
  }

  const handlePressCard = () => {
    console.log("handlePressCard", eventDateLocation.event_id.title)
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
          <Text style={themed($metadataText)} size="xxs">
            {eventDateLocation.dateFormatted.textLabel}
          </Text>
          <Text style={themed($metadataText)} size="xxs">
            {eventDateLocation.timeFormatted.textLabel}
          </Text>
        </View>
      }
      content={eventDateLocation.event_id.title}
      RightComponent={
        eventDateLocation.event_id.image_url ? (
          <AutoImage
            source={{
              uri: convertImageURLToSupabaseURL("events", eventDateLocation.event_id.image_url),
            }}
            style={themed($itemThumbnail)}
            maxWidth={80}
            maxHeight={80}
          />
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
                ? translate("eventListScreen:accessibility.unfavoriteIcon")
                : translate("eventListScreen:accessibility.favoriteIcon")
            }
            LeftAccessory={ButtonLeftAccessory}
          >
            <Text
              size="xxs"
              weight="medium"
              tx={
                isFavorite ? "eventListScreen:unfavoriteButton" : "eventListScreen:favoriteButton"
              }
            />
          </Button>

          {!!eventChat && (
            <Button
              onPress={handlePressChat}
              onLongPress={handlePressChat}
              style={themed([$favoriteButton, eventChat?.is_user_joined && $unFavoriteButton])}
              LeftAccessory={ChatButtonLeftAccessory}
              disabled={isLoading}
            >
              <Text
                size="xxs"
                weight="medium"
                tx={
                  eventChat?.is_user_joined
                    ? "eventListScreen:quitChat"
                    : "eventListScreen:joinChat"
                }
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

const $itemThumbnail: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
  borderRadius: spacing.sm,
  alignSelf: "flex-start",
})

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
