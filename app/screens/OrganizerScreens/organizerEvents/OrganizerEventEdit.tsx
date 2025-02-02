import { observer } from "mobx-react-lite"
import { useStores } from "../../../models"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { FC, useRef, useState } from "react"
import { Button, ButtonAccessoryProps, Screen, Text, TextField } from "@/components"
import { View, ViewStyle, StyleSheet, ActivityIndicator } from "react-native"
import {
  OrganizerEventStackScreenProps,
  OrganizerLocationStackScreenProps,
} from "@/navigators/navigationTypes.ts"
import MapView, { Marker, Region } from "react-native-maps"
import { useHeader } from "@/utils/useHeader"
import * as Haptics from "expo-haptics"
import { TxKeyPath, locale, translate } from "@/i18n"
import DatePicker from "react-native-date-picker"
import { formatDate } from "@/utils/formatDate"
import { SelectField } from "@/components/SelectField"

type EventFormState = {
  title: string
  description?: string
  start_time: string
  end_time?: string
  location_id: string
  image_url?: string | null
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

  const [date, setDate] = useState(new Date())
  const [open, setOpen] = useState(false)

  const [formState, setFormState] = useState<EventFormState>({
    title: event?.title || "",
    description: event?.description || "",
    start_time: event?.start_time || "",
    end_time: event?.end_time || "",
    location_id: event?.location_id.id || "",
    image_url: event?.image_url || "",
    errors: {},
    isLoading: false,
  })

  const updateField = (field: keyof EventFormState, value: string) => {
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
        formState.location_id[0].trim() !== "" ? ("errors:cantBeBlank" as TxKeyPath) : undefined,
    }

    setFormState((prev) => ({
      ...prev,
      errors: newErrors,
    }))

    return !Object.values(newErrors).some(Boolean)
  }

  async function handleSaveLocation() {
    if (!validateForm()) return

    //    setFormState((prev) => ({ ...prev, isLoading: true }))
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
      <TextField
        value={formatDate(date.toISOString(), "eee, MMM dd, yyyy HH:mm")}
        labelTx="organizerEventEditScreen:date"
        editable={false}
      />
      <>
        <Button tx="common:selectDate" onPress={() => setOpen(true)} />
        <DatePicker
          modal
          open={open}
          date={date}
          title={translate("common:selectDate")}
          confirmText={translate("common:confirm")}
          cancelText={translate("common:cancel")}
          locale={locale?.languageCode || undefined}
          theme={themeContext}
          onConfirm={(date) => {
            setOpen(false)
            setDate(date)
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
      <Button
        preset="reversed"
        tx={formState.isLoading ? undefined : "common:save"}
        disabledStyle={themed($disabledButton)}
        disabled={formState.isLoading}
        onPress={handleSaveLocation}
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

const $topContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingTop: spacing.sm,
})
const $textFieldContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.lg,
  gap: spacing.lg,
})

const $disabledButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral400,
  opacity: 0.7,
})
