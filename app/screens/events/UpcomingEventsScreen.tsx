import { FC, useRef } from "react"
import { ViewStyle, StyleSheet, ActivityIndicator } from "react-native"
import { Button, Screen } from "@/components"
import { useAppTheme } from "@/utils/useAppTheme"
import { EventTabScreenProps } from "@/navigators/MainNavigator"
import MapView, { Region, Marker } from "react-native-maps"
import { useStores } from "@/models"
import { observer } from "mobx-react-lite"
import { ButtonAccessoryProps } from "@/components/Button"
import { ThemedStyle } from "@/theme"

interface UpcomingEventsScreenProps extends EventTabScreenProps<"UpcomingEvents"> {}

export const UpcomingEventsScreen: FC<UpcomingEventsScreenProps> = observer(
  function UpcomingEventsScreen(_props) {
    const {
      eventStore: { eventsInBounds, fetchEventsInBounds, isLoading },
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
                <Marker
                  key={event.id}
                  coordinate={{
                    latitude: event.lat,
                    longitude: event.long,
                  }}
                  title={event.title}
                  description={event.description ?? undefined}
                />
              ),
          )}
        </MapView>

        <Button
          preset="filled"
          tx={isLoading ? "common:searching" : "upcomingEvents:searchThisArea"}
          style={themed($searchButton)}
          disabledStyle={themed($disabledSearchButton)}
          onPress={handleSearchThisArea}
          disabled={isLoading}
          RightAccessory={isLoading ? LoadingIndicator : undefined}
        />
      </Screen>
    )
  },
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

const $disabledSearchButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral400,
  opacity: 0.7,
})
