import { FC, forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react"
import { ViewStyle, StyleSheet, ActivityIndicator, ImageStyle, View, TextStyle } from "react-native"
import { AutoImage, Button, Icon, Screen, Text } from "@/components"
import { useAppTheme } from "@/utils/useAppTheme"
import { EventTabScreenProps } from "@/navigators/MainNavigator"
import MapView, { Region, Marker, MapMarkerProps } from "react-native-maps"
import { useStores } from "@/models"
import { observer } from "mobx-react-lite"
import { ButtonAccessoryProps } from "@/components/Button"
import { $styles, ThemedStyle } from "@/theme"
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet"
import { LocationSnapshotIn } from "@/models/location/LocationStore"
import { OrganizerEventDateLocation } from "@/models/organizer/OrganizerEventDateModel"

interface EventMapScreenProps extends EventTabScreenProps<"EventMapScreen"> {}

export const EventMapScreen: FC<EventMapScreenProps> = observer(function EventMapScreen(_props) {
  const {
    organizerEventDateLocationStore: { eventsDatesByLocationId },
    organizerEventStore: { fetchEventsInSight },
    locationStore: { locationsForListInSight },
  } = useStores()
  const { themed } = useAppTheme()

  const regionRef = useRef<Region | null>(null)
  const [isSearching, setIsSearching] = useState<boolean>(false)

  const handleSearchThisArea = async () => {
    if (regionRef.current) {
      setIsSearching(true)
      await fetchEventsInSight(regionRef.current)
      setIsSearching(false)
    }
  }

  return (
    <Screen preset="fixed" contentContainerStyle={$styles.flex1}>
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
        {locationsForListInSight.map((location) => (
          <NewMarkerField
            key={location.id}
            location={location}
            eventsDateLocations={eventsDatesByLocationId.get(location.id)}
            coordinate={{
              longitude: location.lat_long.coordinates[0],
              latitude: location.lat_long.coordinates[1],
            }}
          />
        ))}
      </MapView>

      <Button
        preset="filled"
        tx={isSearching ? "common:searching" : "eventMapScreen:searchThisArea"}
        style={themed($searchButton)}
        disabledStyle={themed($disabledButton)}
        onPress={handleSearchThisArea}
        disabled={isSearching}
        RightAccessory={isSearching ? LoadingIndicator : undefined}
      />
    </Screen>
  )
})

interface IMarkerFieldProps extends Omit<MapMarkerProps, "ref"> {
  eventsDateLocations: OrganizerEventDateLocation[]
  location: LocationSnapshotIn
}

export interface MarkerFieldRef {
  presentOptions: () => void
  dismissOptions: () => void
}

const NewMarkerField = observer(
  forwardRef(function MarkerField(props: IMarkerFieldProps, ref: React.Ref<MarkerFieldRef>) {
    const { eventsDateLocations, location, ...MapMarkerProps } = props
    const sheet = useRef<BottomSheetModal>(null)
    const {
      themed,
      theme: { colors },
    } = useAppTheme()

    useImperativeHandle(ref, () => ({ presentOptions, dismissOptions }))

    const presentOptions = useCallback(() => {
      sheet.current?.present()
    }, [])

    const dismissOptions = useCallback(() => {
      sheet.current?.dismiss()
    }, [])

    return (
      <>
        <Marker
          key={location.id}
          onPress={presentOptions}
          title={location.name}
          {...MapMarkerProps}
        />
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
          <BottomSheetScrollView contentContainerStyle={themed([$bottomSheetContent])}>
            {eventsDateLocations.map((dateLocation) => (
              <View key={dateLocation.id} style={themed($eventContainer)}>
                {/* Event Image */}
                {dateLocation.event_id.image_url && (
                  <AutoImage
                    source={{
                      uri: `${process.env.EXPO_PUBLIC_SUPABASE_URL!}/storage/v1/object/public/events/${dateLocation.event_id.image_url}`,
                    }}
                    style={themed($image)}
                  />
                )}

                {/* Event Header */}
                <View style={themed($headerContainer)}>
                  <Text
                    preset="heading"
                    text={dateLocation.event_id.title}
                    style={themed($title)}
                  />
                  <View style={themed($dateTimeContainer)}>
                    <View style={themed($iconTextContainer)}>
                      <Icon icon="calendar" size={20} color={colors.palette.primary500} />
                      <Text
                        text={dateLocation.dateFormatted.textLabel}
                        style={themed($dateTimeText)}
                        size="xxs"
                      />
                    </View>
                    <View style={themed($iconTextContainer)}>
                      <Icon icon="clock" size={20} color={colors.palette.primary500} />
                      <Text
                        text={dateLocation.timeFormatted.textLabel}
                        style={themed($dateTimeText)}
                        size="xxs"
                      />
                    </View>
                  </View>
                </View>

                {/* Event Description */}
                {dateLocation.event_id.description && (
                  <View style={themed($descriptionContainer)}>
                    <Text preset="subheading" text="About" style={themed($sectionTitle)} />
                    <Text text={dateLocation.event_id.description} />
                  </View>
                )}

                {/* 
                  Organizer Info 
                    */}
                <View style={themed($organizerContainer)}>
                  <Text preset="subheading" text="Organizer" style={themed($sectionTitle)} />
                  <Text text={dateLocation.event_id.publisher_profile?.display_name} />
                </View>

                {/* Chat Button 
        {event.hasChat && event.event_chat_id && (
          <Button
            tx={
              isLoading
                ? "common:loading"
                : hasJoinedChat(event.event_chat_id)
                  ? "common:leaveChat"
                  : "common:joinChat"
            }
            onPress={() => toggleChat(event.event_chat_id as string, event.id)}
            disabled={isLoading}
            disabledStyle={themed($disabledButton)}
            RightAccessory={isLoading ? LoadingIndicator : undefined}
            style={themed($chatButton)}
          />
        )}
*/}
              </View>
            ))}
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
const $eventContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginBottom: spacing.lg,
  paddingBottom: spacing.lg,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $separator: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  height: 1,
  backgroundColor: colors.separator,
  marginVertical: spacing.lg,
})

const $noEventsText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textAlign: "center",
})

const $chatButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})
