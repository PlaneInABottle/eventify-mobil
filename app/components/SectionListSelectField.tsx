import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetSectionList,
} from "@gorhom/bottom-sheet"
import { forwardRef, Ref, useCallback, useImperativeHandle, useRef } from "react"
import { ImageStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import type { ThemedStyle } from "app/theme"
import { useAppTheme } from "app/utils/useAppTheme"
import { Button } from "./Button"
import { Checkbox } from "./Toggle/Checkbox"
import { Icon, IconTypes } from "./Icon"
import { ListItem } from "./ListItem"
import { TextField, TextFieldProps } from "./TextField"
import { Text } from "./Text"
import { TxKeyPath } from "@/i18n"

export interface SelectFieldProps
  extends Omit<TextFieldProps, "ref" | "onValueChange" | "onChange" | "value"> {
  value?: string[]
  renderValue?: (value: string[]) => string
  onSelect?: (newValue: string[]) => void
  multiple?: boolean
  isOnlyIcon?: boolean
  iconName?: IconTypes
  showFooter?: boolean
  sections: { title: TxKeyPath; data: { label: TxKeyPath; value: string }[] }[]
}

export interface SelectFieldRef {
  presentOptions: () => void
  dismissOptions: () => void
}

function without<T>(array: T[], value: T) {
  return array.filter((v) => v !== value)
}

export const SectionListSelectField = forwardRef(function SelectField(
  props: SelectFieldProps,
  ref: Ref<SelectFieldRef>,
) {
  const {
    value = [],
    onSelect,
    renderValue,
    sections = [],
    multiple = true,
    isOnlyIcon = false,
    iconName,
    showFooter = false,
    ...TextFieldProps
  } = props
  const sheet = useRef<BottomSheetModal>(null)
  const { bottom } = useSafeAreaInsets()
  const {
    themed,
    theme: { spacing },
  } = useAppTheme()

  const disabled = TextFieldProps.editable === false || TextFieldProps.status === "disabled"

  useImperativeHandle(ref, () => ({ presentOptions, dismissOptions }))

  const valueString =
    renderValue?.(value) ??
    value
      .map((v) => {
        for (const section of sections) {
          const option = section.data.find((o) => o.value === v)
          if (option) return option.label
        }
        return undefined
      })
      .filter(Boolean)
      .join(", ")

  const presentOptions = useCallback(() => {
    if (disabled) return
    sheet.current?.present()
  }, [disabled])

  const dismissOptions = useCallback(() => {
    sheet.current?.dismiss()
  }, [])

  const updateValue = useCallback(
    (optionValue: string) => {
      if (value.includes(optionValue)) {
        onSelect?.(multiple ? without(value, optionValue) : [])
      } else {
        onSelect?.(multiple ? [...value, optionValue] : [optionValue])
        // if (!multiple) dismissOptions()
      }
    },
    [
      value,
      multiple,
      onSelect,
      //, dismissOptions
    ],
  )

  const handleSectionSelectAll = useCallback(
    (sectionData: { label: string; value: string }[]) => {
      // 1. Extract values from section items (excluding first "Select All" item)
      const sectionValues = sectionData
        .slice(1) // Skip first item ("Select All")
        .map((item) => item.value)

      // 2. Check if ALL items in section are already selected
      const allSelected = sectionValues.every((val) => value.includes(val))

      // 3. Calculate new selection based on current state
      const newValues = allSelected
        ? // 3a. If all selected: Remove all section items
          value.filter((val) => !sectionValues.includes(val))
        : // 3b. If not all selected: Add all section items
          [...new Set([...value, ...sectionValues])]

      // 4. Update parent state with new selection
      onSelect?.(newValues)
    },
    [value, onSelect],
  )

  const renderListItem = useCallback(
    ({ item, section }: { item: { label: TxKeyPath; value: string }; section: any }) => {
      const isSelectAll = item.value.startsWith("select-all-")
      const isSelected = value.includes(item.value)

      return (
        <ListItem
          tx={item.label}
          TextProps={isSelectAll ? { preset: "bold" } : undefined}
          topSeparator={!isSelectAll}
          style={themed($listItem)}
          onPress={() =>
            isSelectAll ? handleSectionSelectAll(section.data) : updateValue(item.value)
          }
          RightComponent={
            <Checkbox
              inputDetailStyle={themed($checkboxInside)}
              containerStyle={themed($checkboxContainer)}
              value={
                isSelectAll
                  ? section.data.slice(1).every((i: any) => value.includes(i.value))
                  : isSelected
              }
            />
          }
        />
      )
    },
    [value, handleSectionSelectAll, updateValue, themed],
  )

  return (
    <>
      <TouchableOpacity onPress={presentOptions} style={isOnlyIcon && themed($iconView)}>
        <View pointerEvents="none">
          {!isOnlyIcon ? (
            <TextField
              {...TextFieldProps}
              value={valueString}
              RightAccessory={(props) => <Icon icon="caretRight" containerStyle={props.style} />}
            />
          ) : (
            <Button
              preset="default"
              style={themed($iconButton)}
              RightAccessory={(props) => (
                <Icon icon={iconName ?? "more"} size={22} containerStyle={props.style} />
              )}
            />
          )}
        </View>
      </TouchableOpacity>

      <BottomSheetModal
        ref={sheet}
        snapPoints={["60%"]}
        backgroundStyle={themed($bottomSheetBackground)}
        handleIndicatorStyle={themed($indicatorStyle)}
        stackBehavior="replace"
        enableDismissOnClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
        footerComponent={
          !multiple && !showFooter
            ? undefined
            : (props) => (
                <BottomSheetFooter
                  {...props}
                  style={themed($bottomSheetFooter)}
                  bottomInset={bottom}
                >
                  <Button text="Dismiss" preset="reversed" onPress={dismissOptions} />
                </BottomSheetFooter>
              )
        }
      >
        <BottomSheetSectionList
          sections={sections}
          keyExtractor={(item) => item.value}
          /*
          ListHeaderComponent={() =>
            value.length === 0 ? (
              <Text tx="filters:filtersNotApplied" preset="default" style={themed($note)} />
            ) : undefined
          }
                        */
          renderItem={renderListItem}
          renderSectionHeader={({ section }) => (
            <Text tx={section.title} preset="subheading" size="xl" style={themed($sectionHeader)} />
          )}
          contentContainerStyle={{
            paddingBottom: bottom + (multiple || showFooter ? spacing.xl * 2 : 0),
          }}
        />
      </BottomSheetModal>
    </>
  )
})

const $bottomSheetFooter: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xs,
})

const $listItem: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.xxl,
})

const $checkboxContainer: ThemedStyle<ViewStyle> = () => ({
  alignSelf: "center",
})
const $checkboxInside: ThemedStyle<ImageStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral100,
  width: 22,
  height: 22,
})

const $sectionHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  paddingHorizontal: spacing.lg,
})

const $bottomSheetBackground: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
})

const $indicatorStyle: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral800,
})

const $iconView: ThemedStyle<ViewStyle> = () => ({
  alignSelf: "flex-end",
})
const $iconButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  margin: spacing.lg,
  borderRadius: spacing.md,
})

const $note: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.md,
})
