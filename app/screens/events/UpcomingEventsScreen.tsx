import { FC, forwardRef, useCallback, useImperativeHandle, useRef } from "react"
import { ViewStyle, StyleSheet, ActivityIndicator, ImageStyle, View, TextStyle } from "react-native"
import { AutoImage, Button, Icon, Screen, Text } from "@/components"
import { useAppTheme } from "@/utils/useAppTheme"
import { EventTabScreenProps } from "@/navigators/MainNavigator"
import MapView, { Region, Marker, MapMarkerProps } from "react-native-maps"
import { useStores } from "@/models"
import { observer } from "mobx-react-lite"
import { ButtonAccessoryProps } from "@/components/Button"
import { colors, spacing, typography, ThemedStyle } from "@/theme"
import { Event } from "@/models/Event"
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet"
import { useSafeAreaInsets } from "react-native-safe-area-context"

interface UpcomingEventsScreenProps extends EventTabScreenProps<"UpcomingEvents"> {}
// TODO: Custom icons, and organizer name instead of id.
export const UpcomingEventsScreen: FC<UpcomingEventsScreenProps> = observer(
  function UpcomingEventsScreen(_props) {
    const {
      eventStore: { eventsInBounds, fetchEventsInBounds, isSearching },
    } = useStores()
    const { themed } = useAppTheme()

    const regionRef = useRef<Region | null>(null)

    const handleSearchThisArea = () => {
      if (regionRef.current) {
        fetchEventsInBounds(regionRef.current)
      }
    }

    return (
      <Screen
        preset="fixed"
        contentContainerStyle={$screenContentContainer}
        safeAreaEdges={["bottom"]}
      >
        <MapView
          style={$mapView}
          onRegionChangeComplete={(region) => {
            regionRef.current = region
          }}
          initialRegion={{
            latitude: 39.88825,
            longitude: 32.8324,
            latitudeDelta: 0.922,
            longitudeDelta: 0.0421,
          }}
        >
          {eventsInBounds.map(
            (event) =>
              event && (
                <MarkerField
                  key={event.id}
                  event={event}
                  coordinate={{
                    latitude: event.lat,
                    longitude: event.long,
                  }}
                />
              ),
          )}
        </MapView>

        <Button
          preset="filled"
          tx={isSearching ? "common:searching" : "upcomingEvents:searchThisArea"}
          style={themed($searchButton)}
          disabledStyle={themed($disabledButton)}
          onPress={handleSearchThisArea}
          disabled={isSearching}
          RightAccessory={isSearching ? LoadingIndicator : undefined}
        />
      </Screen>
    )
  },
)

interface MarkerFieldProps extends Omit<MapMarkerProps, "ref"> {
  event: Event
}

export interface MarkerFieldRef {
  presentOptions: () => void
  dismissOptions: () => void
}

const MarkerField = observer(
  forwardRef(function MarkerField(props: MarkerFieldProps, ref: React.Ref<MarkerFieldRef>) {
    const { event, ...MapMarkerProps } = props
    const sheet = useRef<BottomSheetModal>(null)
    const { themed } = useAppTheme()
    const {
      eventStore: { toggleChat, hasJoinedChat, isLoading },
    } = useStores()
    const { bottom } = useSafeAreaInsets()

    useImperativeHandle(ref, () => ({ presentOptions, dismissOptions }))

    const presentOptions = useCallback(() => {
      sheet.current?.present()
    }, [])

    const dismissOptions = useCallback(() => {
      sheet.current?.dismiss()
    }, [])

    return (
      <>
        <Marker key={event.id} onPress={presentOptions} title={event.title} {...MapMarkerProps} />
        <BottomSheetModal
          ref={sheet}
          snapPoints={["70%"]}
          stackBehavior="replace"
          enableDismissOnClose
          backdropComponent={(props) => (
            <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
          )}
        >
          <BottomSheetScrollView
            contentContainerStyle={[$bottomSheetContent, { paddingBottom: bottom + spacing.xl }]}
          >
            {event.image_url && (
              <AutoImage
                source={{
                  uri: `${process.env.EXPO_PUBLIC_SUPABASE_URL!}/storage/v1/object/public/avatars/${event.image_url}`,
                }}
                style={themed($image)}
              />
            )}

            <View style={$headerContainer}>
              <Text preset="heading" text={event.title} style={$title} />
              <View style={$dateTimeContainer}>
                <View style={$iconTextContainer}>
                  <Icon icon="components" size={20} color={colors.palette.primary500} />
                  <Text text={event.dateFormatted.textLabel} style={$dateTimeText} />
                </View>
                <View style={$iconTextContainer}>
                  <Icon icon="ladybug" size={20} color={colors.palette.primary500} />
                  <Text text={event.timeFormatted.textLabel} style={$dateTimeText} />
                </View>
              </View>
            </View>

            <View style={$descriptionContainer}>
              <Text preset="subheading" text="About" style={$sectionTitle} />
              <Text text={event.description || "No description available"} style={$description} />
            </View>

            <View style={$organizerContainer}>
              <Text preset="subheading" text="Organizer" style={$sectionTitle} />
              <Text text={event.organizer_id} style={$organizerText} />
            </View>

            {event.hasChat && (
              <Button
                preset="filled"
                text={isLoading ? "Loading..." : hasJoinedChat(event) ? "Leave Chat" : "Join Chat"}
                style={$joinChatButton}
                onPress={() => {
                  toggleChat(event)
                }}
                disabled={isLoading}
                disabledStyle={themed($disabledButton)}
                RightAccessory={isLoading ? LoadingIndicator : undefined}
              />
            )}
          </BottomSheetScrollView>
        </BottomSheetModal>
      </>
    )
  }),
)

const LoadingIndicator = (props: ButtonAccessoryProps) => {
  const {
    theme: { colors },
  } = useAppTheme()
  return <ActivityIndicator size="small" color={colors.palette.neutral800} style={props.style} />
}

const $screenContentContainer: ViewStyle = {
  flex: 1,
}

const $mapView: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
}

const $searchButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute",
  top: spacing.lg,
  alignSelf: "center",
  minWidth: 200,
})

const $disabledButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral400,
  opacity: 0.7,
})

const $bottomSheetContent: ViewStyle = {
  paddingHorizontal: spacing.lg,
}

const $headerContainer: ViewStyle = {
  marginTop: spacing.xs,
}

const $title: TextStyle = {
  fontSize: 24,
  fontFamily: typography.primary.semiBold,
  color: colors.palette.neutral800,
  marginBottom: spacing.xs,
}

const $dateTimeContainer: ViewStyle = {
  flexDirection: "row",
  justifyContent: "flex-start",
  marginBottom: spacing.md,
  gap: spacing.md,
}

const $iconTextContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xxs,
}

const $dateTimeText: TextStyle = {
  fontSize: 14,
  color: colors.palette.neutral600,
  marginLeft: spacing.xxs,
}

const $descriptionContainer: ViewStyle = {
  marginBottom: spacing.lg,
}

const $sectionTitle: TextStyle = {
  fontSize: 18,
  color: colors.palette.neutral800,
  marginBottom: spacing.xs,
}

const $description: TextStyle = {
  fontSize: 16,
  color: colors.palette.neutral600,
  lineHeight: 24,
}

const $organizerContainer: ViewStyle = {
  marginBottom: spacing.xl,
}

const $organizerText: TextStyle = {
  fontSize: 16,
  color: colors.palette.neutral600,
}

const $joinChatButton: ViewStyle = {}

const $image: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  width: "100%",
  height: 200,
  alignSelf: "center",
  marginBottom: spacing.md,
  borderRadius: 16,
})
