import { Button, Screen } from "@/components"
import { useStores } from "@/models"
import { OrganizerLocationStackScreenProps } from "@/navigators/navigationTypes"
import { $styles, ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { useHeader } from "@/utils/useHeader"
import { observer } from "mobx-react-lite"
import { FC, useRef, useState } from "react"
import { ViewStyle, StyleSheet } from "react-native"
import MapView, { Marker, Region } from "react-native-maps"

export const OrganizerLocationMap: FC<
  OrganizerLocationStackScreenProps<"OrganizerLocationMapScreen">
> = observer(function OrganizerEventLocationMapScreen(_props) {
  const { goBack, navigate } = _props.navigation
  const {
    locationStore: {
      addSelectLocationToStore,
      locationsForSelect,
      fetchLocationsInSight,
      selectedLocation,
      selectLocation,
    },
    userStore: { userId },
  } = useStores()
  const { themed } = useAppTheme()
  useHeader({
    titleTx: "organizerEventLocationMapScreen:publicLocations",
    leftIcon: "back",
    onLeftPress: () => goBack(),
  })

  const regionRef = useRef<Region | null>(null)
  const [isSearching, setIsSearching] = useState<boolean>(false)

  const handleSearchThisArea = async () => {
    if (regionRef.current) {
      setIsSearching(true)
      await fetchLocationsInSight(regionRef.current, userId)
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
        {locationsForSelect.map((location) => (
          <Marker
            onSelect={() => {
              selectLocation(location)
            }}
            onDeselect={() => {
              selectLocation(undefined)
            }}
            key={location.id}
            title={location.name}
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
      />
      <Button
        tx={
          !selectedLocation
            ? "organizerEventLocationMapScreen:chooseLocation"
            : "organizerEventLocationMapScreen:locationSelected"
        }
        txOptions={{
          locationName: selectedLocation?.name,
        }}
        onPress={() => {
          addSelectLocationToStore(userId)
          goBack()
        }}
        style={themed($confirmButton)}
        disabled={!selectedLocation}
        disabledStyle={themed($disabledButton)}
      />
    </Screen>
  )
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

const $confirmButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  margin: spacing.lg,
})
