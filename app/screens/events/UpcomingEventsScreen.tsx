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
      eventStore: { events, fetchEventsInBounds, isLoading },
    } = useStores()
    const { theme, themed } = useAppTheme()

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
        safeAreaEdges={["top", "bottom"]}
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
          {events.map((event) => (
            <Marker
              key={event.id}
              coordinate={{
                latitude: event.location.location[1],
                longitude: event.location.location[0],
              }}
              title={event.name}
              description={event.description}
            />
          ))}
        </MapView>

        <Button
          preset="filled"
          tx={isLoading ? "common:searching" : "upcomingEvents:searchThisArea"}
          style={themed($searchButton)}
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
  return <ActivityIndicator size="small" color={colors.palette.neutral100} style={props.style} />
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
