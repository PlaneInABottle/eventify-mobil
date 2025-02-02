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
import { OrganizerEventStackScreenProps } from "@/navigators/navigationTypes.ts"
import { useHeader } from "@/utils/useHeader"
import { TxKeyPath, locale, translate } from "@/i18n"
import DatePicker from "react-native-date-picker"
import { formatDate } from "@/utils/formatDate"
import { SelectField } from "@/components/SelectField"
import { pickSingleImage } from "@/utils/imageFunctions"

type EventFormState = {
  title: string
  description?: string
  start_time: string
  end_time?: string
  location_id: string
  image_url?: string | null
  image?: {
    path: string
    mimeType: string
    buffer: any
    uri: string
  }
  errors: {
    title?: TxKeyPath
    description?: TxKeyPath
    start_time?: TxKeyPath
    end_time?: TxKeyPath
    location_id?: TxKeyPath
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

  const { organizerEventStore, userStore, locationStore } = useStores()
  const {
    themed,
    themeContext,
    theme: { spacing },
  } = useAppTheme()

  const event = eventId ? organizerEventStore.events.get(eventId) : undefined
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
    start_time: event?.start_time || "",
    end_time: event?.end_time || "",
    location_id: event?.location_id.id || "",
    image_url: event?.image_url || "",
    image: undefined,
    errors: {},
    isLoading: false,
  })

  const updateField = (field: keyof EventFormState, value: string | EventFormState["image"]) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: undefined, general: undefined },
    }))
  }

  const validateForm = () => {
    const newErrors = {
      title: formState.title.trim().length < 6 ? ("errors:must6Chars" as TxKeyPath) : undefined,
      start_time: !formState.start_time ? ("errors:cantBeBlank" as TxKeyPath) : undefined,
      location_id:
        formState.location_id.trim() === "" ? ("errors:cantBeBlank" as TxKeyPath) : undefined,
    }

    setFormState((prev) => ({
      ...prev,
      errors: newErrors,
    }))

    return !Object.values(newErrors).some(Boolean)
  }

  async function handleSaveEvent() {
    if (!validateForm()) return

    setFormState((prev) => ({ ...prev, isLoading: true }))
    const result: string | true = await organizerEventStore.createUpdateEvent({
      id: event?.id,
      title: formState.title,
      description: formState.description,
      start_time: formState.start_time,
      end_time: formState.end_time,
      location_id: formState.location_id,
      image_url: formState.image_url,
      image: formState.image,
      organizer_id: userId,
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
      <>
        <TouchableOpacity activeOpacity={1} onPress={() => setOpen(true)}>
          <View pointerEvents="none">
            <TextField
              value={formatDate(
                new Date(formState.start_time).toISOString(),
                "eee, MMM dd, yyyy HH:mm",
              )}
              labelTx="organizerEventEditScreen:date"
              RightAccessory={(props) => <Icon icon="caretRight" containerStyle={props.style} />}
            />
          </View>
        </TouchableOpacity>
        <DatePicker
          modal
          open={open}
          date={new Date(formState.start_time)}
          title={translate("common:selectDate")}
          confirmText={translate("common:confirm")}
          cancelText={translate("common:cancel")}
          locale={locale?.languageCode || undefined}
          theme={themeContext}
          onConfirm={(date) => {
            setOpen(false)
            updateField("start_time", date.toISOString())
          }}
          onCancel={() => {
            setOpen(false)
          }}
        />
      </>
      <SelectField
        labelTx="organizerEventEditScreen:location"
        placeholderTx="organizerEventEditScreen:locationPlaceholder"
        value={[formState.location_id]}
        onSelect={(v) => updateField("location_id", v[0])}
        options={locationStore.forSelectField}
        multiple={false}
        containerStyle={{ marginBottom: spacing.lg }}
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
      <Text tx="organizerEventEditScreen:image" preset="formLabel" />
      <>
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
