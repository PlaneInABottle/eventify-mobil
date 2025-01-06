import { FC, forwardRef, useCallback, useImperativeHandle, useRef } from "react"
import { ViewStyle, StyleSheet, ActivityIndicator, ImageStyle, View, TextStyle } from "react-native"
import { AutoImage, Button, Icon, Screen, Text } from "@/components"
import { useAppTheme } from "@/utils/useAppTheme"
import { EventTabScreenProps } from "@/navigators/MainNavigator"
import MapView, { Region, Marker, MapMarkerProps } from "react-native-maps"
import { useStores } from "@/models"
import { observer } from "mobx-react-lite"
import { ButtonAccessoryProps } from "@/components/Button"
import { ThemedStyle } from "@/theme"
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
    const {
      themed,
      theme: { colors, spacing },
    } = useAppTheme()
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
          backgroundStyle={themed($bottomSheetBackground)}
          snapPoints={["70%"]}
          stackBehavior="replace"
          handleIndicatorStyle={themed($handleIndicator)}
          enableDismissOnClose
          backdropComponent={(props) => (
            <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
          )}
        >
          <BottomSheetScrollView
            contentContainerStyle={themed([
              $bottomSheetContent,
              { paddingBottom: bottom + spacing.xl },
            ])}
          >
            {event.image_url && (
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
                  <Text
                    text={event.dateFormatted.textLabel}
                    style={themed($dateTimeText)}
                    size="xxs"
                  />
                </View>
                <View style={themed($iconTextContainer)}>
                  <Icon icon="ladybug" size={20} color={colors.palette.primary500} />
                  <Text
                    text={event.timeFormatted.textLabel}
                    style={themed($dateTimeText)}
                    size="xxs"
                  />
                </View>
              </View>
            </View>

            <View style={themed($descriptionContainer)}>
              <Text preset="subheading" text="About" style={themed($sectionTitle)} />
              <Text text={event.description || "No description available"} />
            </View>

            <View style={themed($organizerContainer)}>
              <Text preset="subheading" text="Organizer" style={themed($sectionTitle)} />
              <Text text={event.organizer_id} />
            </View>

            {event.hasChat && (
              <Button
                text={isLoading ? "Loading..." : hasJoinedChat(event) ? "Leave Chat" : "Join Chat"}
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

const $handleIndicator: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral800,
})

const $bottomSheetBackground: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
})

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

const $bottomSheetContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
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

const $image: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  width: "100%",
  height: 200,
  alignSelf: "center",
  marginBottom: spacing.md,
  borderRadius: 16,
})
