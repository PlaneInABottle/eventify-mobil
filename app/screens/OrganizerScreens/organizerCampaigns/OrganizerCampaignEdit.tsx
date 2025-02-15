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
import { OrganizerCampaignStackScreenProps } from "@/navigators/navigationTypes"

type RuleEntry = {
  id?: string
  rule_type: "MAX_PER_USER" | "DAILY_LIMIT" | "TOTAL_CODE_LIMIT" | "MIN_INTERVAL"
  rule_value: number
}

type ImageFormEntry = {
  path: string
  mimeType: string
  buffer: any
  uri: string
}

type CampaignFormState = {
  title: string
  details: string
  end_date: string | null
  rules: RuleEntry[]
  location_id: string
  image?: ImageFormEntry
  image_url?: string | null
  errors: {
    title?: TxKeyPath
    details?: TxKeyPath
    location_id?: TxKeyPath
    rules?: Array<{
      rule_type?: TxKeyPath
      rule_value?: TxKeyPath
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
export const OrganizerCampaignEditScreen: FC<
  OrganizerCampaignStackScreenProps<"OrganizerCampaignEditScreen">
> = observer(function OrganizerCampaignScreen(_props) {
  const { campaignId } = _props.route.params
  const { goBack } = _props.navigation

  const { campaignStore, userStore, locationStore, campaignRuleStore } = useStores()
  const { themed } = useAppTheme()

  const campaign = campaignStore.campaignById(campaignId)
  const campaignRules = campaignRuleStore.rulesByCampaignId(campaignId)

  const userId = userStore.userId

  useHeader({
    titleTx: campaign
      ? "organizerCampaignEditScreen:header"
      : "organizerCampaignEditScreen:addCampaign",
    titleTxOptions: { campaignTitle: campaign?.title },
    leftIcon: "back",
    onLeftPress: () => goBack(),
  })

  const [formState, setFormState] = useState<CampaignFormState>({
    title: campaign?.title || "",
    details: campaign?.details || "",
    end_date: campaign?.end_date || null,
    rules: campaignRules.map((rule) => ({
      id: rule.id,
      rule_type: rule.rule_type,
      rule_value: rule.rule_value,
    })) || [{ rule_type: "MAX_PER_USER", rule_value: 1 }],
    location_id: campaign?.location_id.id || "",
    image_url: campaign?.image_url || null,
    image: undefined,
    errors: {},
    isLoading: false,
  })

  const updateField = (field: keyof CampaignFormState, value: any) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: undefined, general: undefined },
    }))
  }

  const validateForm = () => {
    const newErrors = {
      title: formState.title.trim().length < 6 ? ("errors:must6Chars" as TxKeyPath) : undefined,
      details:
        formState.details.trim().length < 16 ? ("errors:must16Chars" as TxKeyPath) : undefined,
      location_id: !formState.location_id ? ("errors:cantBeBlank" as TxKeyPath) : undefined,
      rules: formState.rules.map((rule) => ({
        rule_type: !rule.rule_type ? ("errors:cantBeBlank" as TxKeyPath) : undefined,
        rule_value:
          !rule.rule_value || rule.rule_value < 1
            ? ("errors:invalidValue" as TxKeyPath)
            : undefined,
      })),
    }

    setFormState((prev) => ({
      ...prev,
      errors: newErrors,
    }))

    return (
      !newErrors.title &&
      !newErrors.details &&
      newErrors.rules.every((err) => !err.rule_type && !err.rule_value)
    )
  }

  async function handleSaveCampaign() {
    if (!validateForm()) return

    setFormState((prev) => ({ ...prev, isLoading: true }))

    const result = await campaignStore.createUpdateCampaignWithRules({
      id: campaign?.id,
      title: formState.title,
      details: formState.details,
      end_date: formState.end_date,
      image_url: formState.image_url,
      image: formState.image,
      campaignRules: formState.rules,
      publisher_id: userId,
      location_id: formState.location_id,
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

  // Rule management functions
  const updateRule = (index: number, field: keyof RuleEntry, value: any) => {
    const newRules = [...formState.rules]
    newRules[index] = { ...newRules[index], [field]: value }
    updateField("rules", newRules)
  }

  const addRule = () => {
    updateField("rules", [...formState.rules, { rule_type: "MAX_PER_USER", rule_value: 1 }])
  }

  const removeRule = (index: number) => {
    const newRules = formState.rules.filter((_, i) => i !== index)
    updateField("rules", newRules)
  }

  const ruleOptions = [
    { label: translate("campaign:maxPerUser"), value: "MAX_PER_USER" },
    { label: translate("campaign:dailyLimit"), value: "DAILY_LIMIT" },
    { label: translate("campaign:totalCodeLimit"), value: "TOTAL_CODE_LIMIT" },
    { label: translate("campaign:minInterval"), value: "MIN_INTERVAL" },
  ]

  return (
    <Screen preset="scroll" contentContainerStyle={themed($screenContentContainer)}>
      <TextField
        value={formState.title}
        onChangeText={(v) => updateField("title", v)}
        labelTx="organizerCampaignEditScreen:title"
        placeholderTx="organizerCampaignEditScreen:titlePlaceholder"
        helperTx={formState.errors.title}
        status={formState.errors.title ? "error" : undefined}
        readOnly={formState.isLoading}
      />
      <TextField
        value={formState.details}
        onChangeText={(v) => updateField("details", v)}
        labelTx="organizerCampaignEditScreen:details"
        placeholderTx="organizerCampaignEditScreen:detailsPlaceholder"
        multiline
        helperTx={formState.errors.details}
        status={formState.errors.details ? "error" : undefined}
        readOnly={formState.isLoading}
      />

      {/* RULES SECTION */}
      <Text tx="organizerCampaignEditScreen:rules" preset="formLabel" />
      {formState.rules.map((rule, index) => (
        <View key={index} style={themed($ruleContainer)}>
          {formState.rules.length > 1 && (
            <Icon
              icon="x"
              size={32}
              style={themed($removeButton)}
              onPress={() => removeRule(index)}
            />
          )}

          <SelectField
            labelTx="organizerCampaignEditScreen:ruleType"
            value={[rule.rule_type]}
            onSelect={(v) => updateRule(index, "rule_type", v[0])}
            options={ruleOptions}
            helperTx={formState.errors.rules?.[index]?.rule_type}
            status={formState.errors.rules?.[index]?.rule_type ? "error" : undefined}
            multiple={false}
            multiline
            numberOfLines={2}
          />

          <TextField
            value={rule.rule_value.toString()}
            onChangeText={(v) => updateRule(index, "rule_value", parseInt(v) || 0)}
            labelTx="organizerCampaignEditScreen:ruleValue"
            keyboardType="numeric"
            helperTx={formState.errors.rules?.[index]?.rule_value}
            status={formState.errors.rules?.[index]?.rule_value ? "error" : undefined}
          />
        </View>
      ))}

      <Button
        tx="organizerCampaignEditScreen:addRule"
        onPress={addRule}
        LeftAccessory={() => <Icon icon="plus" size={24} style={themed($addIconStyle)} />}
        preset="filled"
      />

      {/* LOCATION SECTION */}
      <SelectField
        labelTx="organizerEventEditScreen:location"
        placeholderTx="organizerEventEditScreen:locationPlaceholder"
        value={[formState.location_id]}
        onSelect={(v) => updateField("location_id", v[0])}
        options={locationStore.forSelectField}
        helperTx={formState.errors.location_id}
        status={formState.errors.location_id ? "error" : undefined}
        multiple={false}
      />

      {/* IMAGE SECTION */}
      <Text tx="organizerCampaignEditScreen:image" preset="formLabel" />
      {formState.image || campaign?.image_url ? (
        <TouchableOpacity style={$imageWrapper} onPress={handlePickImage}>
          <Image
            source={{
              uri:
                formState.image?.uri ??
                `${process.env.EXPO_PUBLIC_SUPABASE_URL!}/storage/v1/object/public/campaigns/${campaign?.image_url}`,
            }}
            style={themed($campaignImage)}
            accessibilityLabel={translate("organizerCampaignEditScreen:image")}
          />
          <View style={themed($imageOverlay)}>
            <Icon icon="refresh" size={28} color="#fff" />
            <Text tx="organizerCampaignEditScreen:changeImage" preset="subheading" />
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={themed($emptyImageContainer)}
          onPress={handlePickImage}
          accessibilityLabel={translate("organizerCampaignEditScreen:addImage")}
        >
          <Icon icon="plus" size={42} />
          <Text
            tx="organizerCampaignEditScreen:addImage"
            preset="subheading"
            style={themed($placeholderText)}
          />
        </TouchableOpacity>
      )}

      <Button
        preset="reversed"
        tx={formState.isLoading ? undefined : "common:save"}
        disabledStyle={themed($disabledButton)}
        disabled={formState.isLoading}
        onPress={handleSaveCampaign}
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

const $ruleContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  position: "relative",
  marginBottom: spacing.xs,
  gap: spacing.xs,
  padding: spacing.md,
  borderWidth: 2,
  borderColor: colors.palette.neutral400,
  borderRadius: 8,
  backgroundColor: colors.background,
})

const $campaignImage: ThemedStyle<ImageStyle> = ({ colors }) => ({
  width: "100%",
  height: 300,
  borderRadius: 12,
  backgroundColor: colors.palette.neutral300,
  aspectRatio: 1.5,
})

const $removeButton: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  alignSelf: "flex-end",
})

const $addIconStyle: ThemedStyle<ImageStyle> = ({ spacing, colors }) => ({
  marginHorizontal: spacing.xs,
})
