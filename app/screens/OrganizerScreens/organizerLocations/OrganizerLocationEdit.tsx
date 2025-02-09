import { observer } from "mobx-react-lite"
import { useStores } from "../../../models"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { FC, useRef, useState } from "react"
import { Button, ButtonAccessoryProps, Screen, Text, TextField } from "@/components"
import { View, ViewStyle, StyleSheet, ActivityIndicator } from "react-native"
import { OrganizerLocationStackScreenProps } from "@/navigators/navigationTypes"
import MapView, { Marker, Region } from "react-native-maps"
import { useHeader } from "@/utils/useHeader"
import * as Haptics from "expo-haptics"
import { TxKeyPath } from "@/i18n"

type LocationFormState = {
  name: string
  address: string
  errors: {
    name?: TxKeyPath
    address?: TxKeyPath
    general?: TxKeyPath | string
  }
  isLoading: boolean
}

const LoadingIndicator = (props: ButtonAccessoryProps) => {
  const {
    theme: { colors },
  } = useAppTheme()
  return <ActivityIndicator size="small" color={colors.palette.neutral800} style={props.style} />
}

export const OrganizerLocationEditScreen: FC<
  OrganizerLocationStackScreenProps<"OrganizerLocationEditScreen">
> = observer(function OrganizerLocationScreen(_props) {
  const { locationId } = _props.route.params
  const { goBack } = _props.navigation

  const { locationStore, userStore } = useStores()
  const { themed } = useAppTheme()

  const location = locationStore.locationById(locationId)
  const userId = userStore.userId
  const isFormReadOnly = location?.creator_id !== userId

  useHeader({
    titleTx: location
      ? "organizerLocationEditScreen:header"
      : "organizerLocationEditScreen:addLocation",
    titleTxOptions: { locationName: location?.name },
    leftIcon: "back",
    onLeftPress: () => goBack(),
  })

  const regionRef = useRef<Region>(
    location
      ? {
          latitude: location.lat_long.coordinates[1],
          longitude: location.lat_long.coordinates[0],
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
        }
      : {
          latitude: 39.88825,
          longitude: 32.8324,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        },
  )

  const [formState, setFormState] = useState<LocationFormState>({
    name: location?.name || "",
    address: location?.address || "",
    errors: {},
    isLoading: false,
  })

  const updateField = (field: keyof LocationFormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: undefined, general: undefined },
    }))
  }

  const validateForm = () => {
    const newErrors = {
      name:
        formState.name.trim().length < 6 ? ("errors:locationNameShort" as TxKeyPath) : undefined,
      address:
        formState.address.trim().length < 16
          ? ("errors:locationAddressShort" as TxKeyPath)
          : undefined,
    }

    setFormState((prev) => ({
      ...prev,
      errors: newErrors,
    }))

    return !Object.values(newErrors).some(Boolean)
  }

  async function handleSaveLocation() {
    if (!validateForm()) return

    setFormState((prev) => ({ ...prev, isLoading: true }))
    const result: string | true = await locationStore.createUpdateLocation({
      id: location?.id,
      name: formState.name,
      address: formState.address,
      creator_id: userId,
      lat_long: `Point(${regionRef.current.longitude} ${regionRef.current.latitude})`,
    })
    if (result !== true) {
      setFormState((prev) => ({
        ...prev,
        errors: { general: result },
        isLoading: false,
      }))
    } else {
      goBack()
    }
  }

  return (
    <Screen preset="scroll" contentContainerStyle={themed($screenContentContainer)}>
      <View style={themed($mapContainer)}>
        <MapView style={$mapView} initialRegion={regionRef.current}>
          <Marker
            onDragStart={() => {
              Haptics.selectionAsync() // Shake feedback when dragging starts
            }}
            onDragEnd={(e) => {
              regionRef.current = {
                ...regionRef.current,
                latitude: e.nativeEvent.coordinate.latitude,
                longitude: e.nativeEvent.coordinate.longitude,
              }
            }}
            coordinate={{
              latitude: regionRef.current.latitude,
              longitude: regionRef.current.longitude,
            }}
            title={location?.name}
            draggable={!isFormReadOnly}
          />
        </MapView>
      </View>

      <View style={themed($topContainer)}>
        <Text
          tx={
            isFormReadOnly
              ? "organizerLocationEditScreen:publicLocation"
              : "organizerLocationEditScreen:dragMarker"
          }
        />
      </View>
      <View style={themed($textFieldContainer)}>
        <TextField
          value={formState.name}
          onChangeText={(v) => updateField("name", v)}
          labelTx="organizerLocationEditScreen:name"
          placeholderTx="organizerLocationEditScreen:namePlaceholder"
          keyboardType="default"
          helperTx={formState.errors.name}
          status={formState.errors.name ? "error" : isFormReadOnly ? "disabled" : undefined}
          readOnly={formState.isLoading || isFormReadOnly}
        />
        <TextField
          value={formState.address}
          multiline
          onChangeText={(v) => updateField("address", v)}
          labelTx="organizerLocationEditScreen:address"
          placeholderTx="organizerLocationEditScreen:addressPlaceholder"
          keyboardType="default"
          helperTx={formState.errors.address}
          status={formState.errors.address ? "error" : isFormReadOnly ? "disabled" : undefined}
          readOnly={formState.isLoading || isFormReadOnly}
        />
        <Button
          preset="reversed"
          tx={formState.isLoading ? undefined : "common:save"}
          disabledStyle={themed($disabledButton)}
          disabled={formState.isLoading || isFormReadOnly}
          onPress={handleSaveLocation}
          RightAccessory={formState.isLoading ? LoadingIndicator : undefined}
        />
      </View>
    </Screen>
  )
})

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
  paddingHorizontal: spacing.lg,
})

const $topContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.sm,
})
const $textFieldContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.lg,
  gap: spacing.lg,
})

const $mapContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  height: 400,
})
const $mapView: ViewStyle = {
  ...StyleSheet.absoluteFillObject,
}
const $disabledButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral400,
  opacity: 0.7,
})
