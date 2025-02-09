import { observer } from "mobx-react-lite"
import { useStores } from "../../../models"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { FC, useState } from "react"
import { Button, ButtonAccessoryProps, Icon, Screen, Text, TextField } from "@/components"
import {
  View,
  ViewStyle,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  ImageStyle,
  TextStyle,
} from "react-native"
import { useHeader } from "@/utils/useHeader"
import { TxKeyPath, locale, translate } from "@/i18n"
import DatePicker from "react-native-date-picker"
import { formatDate } from "@/utils/formatDate"
import { SelectField } from "@/components/SelectField"
import { pickSingleImage } from "@/utils/imageFunctions"
import { OrganizerEventStackScreenProps } from "@/navigators/navigationTypes"

type DateLocationEntry = {
  id?: string
  start_time: string
  end_time: string | null
  location_id: string
}

type ImageFormEntry = {
  path: string
  mimeType: string
  buffer: any
  uri: string
}

type EventFormState = {
  title: string
  description?: string
  datesLocations: DateLocationEntry[]
  image?: ImageFormEntry
  image_url?: string | null
  errors: {
    title?: TxKeyPath
    description?: TxKeyPath
    datesLocations?: Array<{
      start_time?: TxKeyPath
      end_time?: TxKeyPath
      location_id?: TxKeyPath
    }>
    image_url?: TxKeyPath
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

export const OrganizerEventEditScreen: FC<
  OrganizerEventStackScreenProps<"OrganizerEventEditScreen">
> = observer(function OrganizerEventScreen(_props) {
  const { eventId } = _props.route.params
  const { goBack } = _props.navigation

  const { organizerEventStore, userStore, locationStore, organizerEventDateLocationStore } =
    useStores()
  const { themed, themeContext } = useAppTheme()

  const eventDates = organizerEventDateLocationStore.eventsDatesByEventId(eventId)
  const event = organizerEventStore.eventById(eventId)
  const userId = userStore.userId

  useHeader({
    titleTx: event ? "organizerEventEditScreen:header" : "organizerEventEditScreen:addEvent",
    titleTxOptions: { eventTitle: event?.title },
    leftIcon: "back",
    onLeftPress: () => goBack(),
  })

  const [open, setOpen] = useState(false)

  const [formState, setFormState] = useState<EventFormState>({
    title: event?.title || "",
    description: event?.description || "",
    datesLocations:
      eventDates.length > 0
        ? eventDates.map((eventDate) => {
            return {
              id: eventDate.id,
              start_time: eventDate.start_time,
              end_time: eventDate.end_time,
              location_id: eventDate.location_id.id,
            }
          })
        : [{ start_time: new Date().toISOString(), end_time: null, location_id: "" }],
    image_url: event?.image_url || "",
    image: undefined,
    errors: {},
    isLoading: false,
  })

  const updateField = (field: keyof EventFormState, value: any) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: undefined, general: undefined },
    }))
  }

  const validateForm = () => {
    const newErrors = {
      title: formState.title.trim().length < 6 ? ("errors:must6Chars" as TxKeyPath) : undefined,
      datesLocations: formState.datesLocations.map((dl) => ({
        start_time: !dl.start_time ? ("errors:cantBeBlank" as TxKeyPath) : undefined,
        location_id: !dl.location_id ? ("errors:cantBeBlank" as TxKeyPath) : undefined,
      })),
    }

    setFormState((prev) => ({
      ...prev,
      errors: newErrors,
    }))

    return (
      !newErrors.title &&
      newErrors.datesLocations.every((err) => !err.start_time && !err.location_id)
    )
  }

  async function handleSaveEvent() {
    if (!validateForm()) return

    setFormState((prev) => ({ ...prev, isLoading: true }))
    const result: string | true = await organizerEventStore.createUpdateEvent({
      id: event?.id,
      title: formState.title,
      description: formState.description,
      image_url: formState.image_url,
      image: formState.image,
      datesLocations: formState.datesLocations,
      publisher_id: userId,
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

  async function handlePickImage() {
    setFormState((prev) => ({ ...prev, isLoading: true }))
    const image = await pickSingleImage(userId)
    if (image) updateField("image", image)
    setFormState((prev) => ({ ...prev, isLoading: false }))
  }
  // Helper functions:
  const updateDateLocation = (index: number, field: keyof DateLocationEntry, value: any) => {
    const newDates = [...formState.datesLocations]
    newDates[index] = { ...newDates[index], [field]: value }
    updateField("datesLocations", newDates)
  }

  const addDateLocation = () => {
    updateField("datesLocations", [
      ...formState.datesLocations,
      { start_time: new Date().toISOString(), end_time: null, location_id: "" },
    ])
  }

  const removeDateLocation = (index: number) => {
    const newDates = formState.datesLocations.filter((_, i) => i !== index)
    updateField("datesLocations", newDates)
  }

  // Track which dateLocation index's datepicker is open; null means none
  const [openDateIndex, setOpenDateIndex] = useState<number | null>(null)
  return (
    <Screen preset="scroll" contentContainerStyle={themed($screenContentContainer)}>
      <TextField
        value={formState.title}
        onChangeText={(v) => updateField("title", v)}
        labelTx="organizerEventEditScreen:title"
        placeholderTx="organizerEventEditScreen:titlePlaceholder"
        keyboardType="default"
        helperTx={formState.errors.title}
        status={formState.errors.title ? "error" : undefined}
        readOnly={formState.isLoading}
      />

      <TextField
        value={formState.description}
        multiline
        onChangeText={(v) => updateField("description", v)}
        labelTx="organizerEventEditScreen:description"
        placeholderTx="organizerEventEditScreen:descriptionPlaceholder"
        keyboardType="default"
        helperTx={formState.errors.description}
        status={formState.errors.description ? "error" : undefined}
        readOnly={formState.isLoading}
      />

      {/*
    DATE LOCATION SECTION
            */}
      <>
        <Text tx="organizerEventEditScreen:multipleDatesAndLocations" preset="formLabel" />
        {formState.datesLocations.map((dl, index) => (
          <View key={index} style={themed($dateLocationContainer)}>
            {formState.datesLocations.length > 1 && (
              <Icon
                icon="x"
                size={32}
                style={themed($removeButton)}
                onPress={() => {
                  removeDateLocation(index)
                }}
              />
            )}
            <TouchableOpacity
              onPress={() => {
                setOpen(true)
                setOpenDateIndex(index)
              }}
            >
              <View pointerEvents="none">
                <TextField
                  readOnly
                  value={formatDate(dl.start_time, "eee, MMM dd, yyyy HH:mm")}
                  labelTx="organizerEventEditScreen:date"
                  helperTx={formState.errors.datesLocations?.at(index)?.start_time}
                  status={
                    formState.errors.datesLocations?.at(index)?.start_time ? "error" : undefined
                  }
                  RightAccessory={(props) => (
                    <Icon icon="caretRight" containerStyle={props.style} />
                  )}
                />
              </View>
            </TouchableOpacity>
            <SelectField
              labelTx="organizerEventEditScreen:location"
              placeholderTx="organizerEventEditScreen:locationPlaceholder"
              value={[dl.location_id]}
              onSelect={(v) => updateDateLocation(index, "location_id", v[0])}
              options={locationStore.forSelectField}
              helperTx={formState.errors.datesLocations?.at(index)?.location_id}
              status={formState.errors.datesLocations?.at(index)?.location_id ? "error" : undefined}
              multiple={false}
            />
          </View>
        ))}

        <Button
          tx="organizerEventEditScreen:addDateLocation"
          onPress={addDateLocation}
          LeftAccessory={() => <Icon icon="plus" size={24} style={themed($addIconStyle)} />}
          preset="filled"
        />
        <DatePicker
          modal
          open={open}
          date={new Date()}
          title={translate("common:selectDate")}
          confirmText={translate("common:confirm")}
          cancelText={translate("common:cancel")}
          locale={locale?.languageCode || undefined}
          theme={themeContext}
          onConfirm={(date) => {
            setOpen(false)
            if (openDateIndex !== null)
              updateDateLocation(openDateIndex, "start_time", date.toISOString())
          }}
          onCancel={() => {
            setOpen(false)
            setOpenDateIndex(null)
          }}
        />
      </>

      {/*
    IMAGE SECTION
            */}
      <>
        <Text tx="organizerEventEditScreen:image" preset="formLabel" />
        {formState.image || event?.image_url ? (
          <TouchableOpacity style={$imageWrapper} onPress={handlePickImage}>
            <Image
              source={{
                uri:
                  formState.image?.uri ??
                  `${process.env.EXPO_PUBLIC_SUPABASE_URL!}/storage/v1/object/public/events/${event?.image_url}`,
              }}
              style={themed($eventImage)}
              accessible
              accessibilityLabel={translate("organizerEventEditScreen:image")}
              accessibilityRole="image"
            />
            <View style={themed($imageOverlay)}>
              <Icon icon="refresh" size={28} color="#fff" />
              <Text tx="organizerEventEditScreen:changeImage" preset="subheading" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={themed($emptyImageContainer)}
            onPress={handlePickImage}
            accessible
            accessibilityLabel={translate("organizerEventEditScreen:addImage")}
            accessibilityRole="button"
          >
            <Icon icon="plus" size={42} />
            <Text
              tx="organizerEventEditScreen:addImage"
              preset="subheading"
              style={themed($placeholderText)}
            />
          </TouchableOpacity>
        )}
      </>
      <Button
        preset="reversed"
        tx={formState.isLoading ? undefined : "common:save"}
        disabledStyle={themed($disabledButton)}
        disabled={formState.isLoading}
        onPress={handleSaveEvent}
        RightAccessory={formState.isLoading ? LoadingIndicator : undefined}
      />
    </Screen>
  )
})

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
  paddingHorizontal: spacing.lg,
  gap: spacing.lg,
})

const $disabledButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral400,
  opacity: 0.7,
})

const $emptyImageContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  height: 300,
  backgroundColor: colors.palette.neutral300,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: colors.palette.neutral800,
  borderStyle: "dashed",
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.lg,
})

const $eventImage: ThemedStyle<ImageStyle> = ({ colors }) => ({
  width: "100%",
  height: 300,
  borderRadius: 12,
  backgroundColor: colors.palette.neutral300,
})

const $imageWrapper: ViewStyle = {
  position: "relative",
  borderRadius: 12,
  overflow: "hidden",
}

const $imageOverlay: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  padding: spacing.sm,
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "row",
  gap: spacing.xs,
})

const $placeholderText: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

const $dateLocationContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  position: "relative",

  marginBottom: spacing.xs,
  gap: spacing.xs,
  padding: spacing.md,
  borderWidth: 4,
  borderColor: colors.palette.neutral400,
  borderRadius: 8,
  backgroundColor: colors.background,
  borderStyle: "dotted",
})

const $removeButton: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  alignSelf: "flex-end",
})

const $addIconStyle: ThemedStyle<ImageStyle> = ({ spacing, colors }) => ({
  marginHorizontal: spacing.xs,
})
