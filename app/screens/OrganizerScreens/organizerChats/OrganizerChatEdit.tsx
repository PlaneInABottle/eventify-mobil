import { observer } from "mobx-react-lite"
import { useStores } from "../../../models"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { FC, useState } from "react"
import { Button, ButtonAccessoryProps, Screen } from "@/components"
import { ViewStyle, ActivityIndicator } from "react-native"
import { OrganizerChatStackScreenProps } from "@/navigators/navigationTypes.ts"
import { useHeader } from "@/utils/useHeader"
import { TxKeyPath } from "@/i18n"
import { SelectField } from "@/components/SelectField"

type ChatFormState = {
  event_id: string
  events_dates_locations_id: string
  errors: {
    event_id?: TxKeyPath
    events_dates_locations_id?: TxKeyPath
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

export const OrganizerChatEditScreen: FC<OrganizerChatStackScreenProps<"OrganizerChatEditScreen">> =
  observer(function OrganizerChatScreen(_props) {
    const { eventChatId } = _props.route.params
    const { goBack } = _props.navigation

    const { organizerChatStore, organizerEventStore, organizerEventDateLocationStore } = useStores()
    const { themed } = useAppTheme()

    const eventChat = eventChatId ? organizerChatStore.chats.get(eventChatId) : undefined

    useHeader({
      titleTx: eventChatId ? "organizerChatEditScreen:header" : "organizerChatEditScreen:addChat",
      titleTxOptions: { eventName: eventChat?.events_dates_locations_id.event_id.title },
      leftIcon: "back",
      onLeftPress: () => goBack(),
    })

    const [formState, setFormState] = useState<ChatFormState>({
      event_id: eventChat?.events_dates_locations_id.event_id.id || "",
      events_dates_locations_id: eventChat?.events_dates_locations_id.id || "",
      errors: {},
      isLoading: false,
    })

    const updateField = (field: keyof ChatFormState, value: any) => {
      setFormState((prev) => ({
        ...prev,
        [field]: value,
        errors: { ...prev.errors, [field]: undefined, general: undefined },
      }))
    }

    const validateForm = () => {
      const newErrors = {
        event_id: !formState.event_id ? ("errors:cantBeBlank" as TxKeyPath) : undefined,
        events_dates_locations_id: !formState.events_dates_locations_id
          ? ("errors:cantBeBlank" as TxKeyPath)
          : undefined,
      }

      setFormState((prev) => ({
        ...prev,
        errors: newErrors,
      }))

      return !Object.values(newErrors).some(Boolean)
    }

    async function handleSaveChat() {
      if (!validateForm()) return

      setFormState((prev) => ({ ...prev, isLoading: true }))
      const result: string | true = await organizerChatStore.createUpdateChat({
        id: eventChat?.id,
        events_dates_locations_id: formState.events_dates_locations_id,
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
        <SelectField
          labelTx="organizerChatEditScreen:chooseEvent"
          placeholderTx="organizerChatEditScreen:chooseEventPlaceholder"
          value={[formState.event_id]}
          onSelect={(v) => updateField("event_id", v[0])}
          options={organizerEventStore.forSelectField}
          helperTx={formState.errors.event_id}
          status={formState.errors.event_id ? "error" : undefined}
          multiple={false}
        />
        {formState.event_id && (
          <SelectField
            multiline
            labelTx="organizerChatEditScreen:chooseDateLocation"
            placeholderTx="organizerChatEditScreen:chooseDateLocationPlaceholder"
            value={[formState.events_dates_locations_id]}
            onSelect={(v) => updateField("events_dates_locations_id", v[0])}
            options={organizerEventDateLocationStore.forSelectFieldForAnEvent(formState.event_id)}
            helperTx={formState.errors.events_dates_locations_id}
            status={formState.errors.events_dates_locations_id ? "error" : undefined}
            multiple={false}
          />
        )}
        <Button
          preset="reversed"
          tx={formState.isLoading ? undefined : "common:save"}
          disabledStyle={themed($disabledButton)}
          disabled={formState.isLoading}
          onPress={handleSaveChat}
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
