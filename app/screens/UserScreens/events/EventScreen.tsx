import { AutoImage, Button, Icon, Screen, Text } from "@/components"
import { useStores } from "@/models"
import { Event } from "@/models/Event"
import { AppStackScreenProps } from "@/navigators"
import { $styles, ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { observer } from "mobx-react-lite"
import { FC } from "react"
import { ActivityIndicator, ImageStyle, TextStyle, View, ViewStyle } from "react-native"

export const EventScreen: FC<AppStackScreenProps<"Event">> = observer(function EventScreen(_props) {
  const { eventId } = _props.route.params
  const {
    eventStore: { isLoading, events },
    chatStore: { hasJoinedChat, toggleChat },
  } = useStores()
  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const event = events.get(eventId) as Event
  return (
    <Screen preset="fixed" contentContainerStyle={$styles.flex1}>
      {event?.image_url && (
        <AutoImage
          source={{
            uri: `${process.env.EXPO_PUBLIC_SUPABASE_URL!}/storage/v1/object/public/avatars/${event.image_url}`,
          }}
          style={themed($image)}
        />
      )}
      <View style={themed($headerContainer)}>
        <Text preset="heading" text={event.title} style={themed($title)} />
        <View style={themed($dateTimeContainer)}>
          <View style={themed($iconTextContainer)}>
            <Icon icon="components" size={20} color={colors.palette.primary500} />
            <Text text={event.dateFormatted.textLabel} style={themed($dateTimeText)} size="xxs" />
          </View>
          <View style={themed($iconTextContainer)}>
            <Icon icon="ladybug" size={20} color={colors.palette.primary500} />
            <Text text={event.timeFormatted.textLabel} style={themed($dateTimeText)} size="xxs" />
          </View>
        </View>
      </View>

      <View style={themed($descriptionContainer)}>
        <Text preset="subheading" text="About" style={themed($sectionTitle)} />
        <Text text={event.description || "No description available"} />
      </View>

      <View style={themed($organizerContainer)}>
        <Text preset="subheading" text="Organizer" style={themed($sectionTitle)} />
        <Text text={event.publisher_id} />
      </View>

      {event.hasChat && event.event_chat_id && (
        <Button
          text={
            isLoading
              ? "Loading..."
              : hasJoinedChat(event.event_chat_id)
                ? "Leave Chat"
                : "Join Chat"
          }
          onPress={() => {
            toggleChat(event.event_chat_id as string, event.id)
          }}
          disabled={isLoading}
          disabledStyle={themed($disabledButton)}
          RightAccessory={isLoading ? LoadingIndicator : undefined}
        />
      )}
    </Screen>
  )
})
const LoadingIndicator = () => {
  const {
    theme: { colors },
  } = useAppTheme()
  return <ActivityIndicator size="small" color={colors.palette.neutral800} />
}
const $image: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  width: "100%",
  height: 200,
  alignSelf: "center",
  marginBottom: spacing.md,
  borderRadius: 16,
})
const $disabledButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral400,
  opacity: 0.7,
})

const $headerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $dateTimeContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "flex-start",
  marginBottom: spacing.md,
  gap: spacing.md,
})

const $iconTextContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xxs,
})

const $dateTimeText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  marginLeft: spacing.xxs,
  color: colors.textDim,
})

const $descriptionContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $organizerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xl,
})
