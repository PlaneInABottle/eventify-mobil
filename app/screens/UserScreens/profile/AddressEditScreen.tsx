import { FC, useState } from "react"
import { View, ViewStyle } from "react-native"
import { Screen, Button, TextField } from "@/components"
import { useAppTheme } from "@/utils/useAppTheme"
import { useStores } from "@/models"
import { observer } from "mobx-react-lite"
import { $styles, ThemedStyle } from "@/theme"
import { useHeader } from "@/utils/useHeader"
import { TxKeyPath } from "@/i18n"
import { UserProfileStackScreenProps } from "@/navigators/userNavigationTypes"
import { IUserEditAddressFormState } from "@/types/userFormTypes"

export const UserAddressEditScreen: FC<UserProfileStackScreenProps<"UserAddressEditScreen">> =
  observer(function UserAddressEditScreen(_props) {
    const { addressId } = _props.route.params
    const { goBack } = _props.navigation

    const { themed } = useAppTheme()
    const { userAddressStore } = useStores()

    const address = userAddressStore.addressById(addressId)

    useHeader(
      {
        titleTx: addressId ? "addressEditScreen:editAddress" : "addressEditScreen:createAddress",
        leftIcon: "back",
        onLeftPress: () => goBack(),
      },
      [],
    )

    const [formState, setFormState] = useState<IUserEditAddressFormState>({
      id: addressId,
      title: address?.title ?? "",
      city: address?.city ?? "",
      country: address?.country ?? "",
      address: address?.address ?? "",
      zip_code: address?.zip_code ?? "",
      errors: {},
      isLoading: false,
    })

    const updateField = (field: keyof IUserEditAddressFormState, value: any) => {
      setFormState((prev) => ({
        ...prev,
        [field]: value,
        errors: { ...prev.errors, [field]: undefined, general: undefined },
      }))
    }

    const validateForm = () => {
      const newErrors = {
        title: !formState.title ? ("errors:cantBeBlank" as TxKeyPath) : undefined,
        city: !formState.city ? ("errors:cantBeBlank" as TxKeyPath) : undefined,
        country: !formState.country ? ("errors:cantBeBlank" as TxKeyPath) : undefined,
        address: !formState.address ? ("errors:cantBeBlank" as TxKeyPath) : undefined,
        zip_code: !formState.title ? ("errors:cantBeBlank" as TxKeyPath) : undefined,
      }

      setFormState((prev) => ({
        ...prev,
        errors: newErrors,
      }))

      return !Object.values(newErrors).some(Boolean)
    }

    async function handleUpsertAddress() {
      if (!validateForm()) return

      setFormState((prev) => ({ ...prev, isLoading: true }))

      const result = await userAddressStore.upsertAddress({
        id: addressId,
        title: formState.title,
        city: formState.city,
        country: formState.country,
        address: formState.address,
        zip_code: formState.zip_code,
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
      <Screen preset="scroll" contentContainerStyle={$styles.container}>
        <View style={themed($formContainer)}>
          <TextField
            value={formState.title}
            onChangeText={(v) => updateField("title", v)}
            labelTx="addressEditScreen:addressTitle"
            placeholderTx="addressEditScreen:titlePlaceholder"
            helperTx={formState.errors.title}
            status={formState.errors.title ? "error" : undefined}
            readOnly={formState.isLoading}
            accessible={true}
            accessibilityLabel="Address title input"
            accessibilityRole="text"
          />

          <TextField
            value={formState.city}
            onChangeText={(v) => updateField("city", v)}
            labelTx="addressEditScreen:city"
            placeholderTx="addressEditScreen:cityPlaceholder"
            helperTx={formState.errors.city}
            status={formState.errors.city ? "error" : undefined}
            readOnly={formState.isLoading}
            accessible={true}
            accessibilityLabel="City input"
            accessibilityRole="text"
          />

          <TextField
            value={formState.country}
            onChangeText={(v) => updateField("country", v)}
            labelTx="addressEditScreen:country"
            placeholderTx="addressEditScreen:countryPlaceholder"
            helperTx={formState.errors.country}
            status={formState.errors.country ? "error" : undefined}
            readOnly={formState.isLoading}
            accessible={true}
            accessibilityLabel="Country input"
            accessibilityRole="text"
          />

          <TextField
            value={formState.address}
            onChangeText={(v) => updateField("address", v)}
            labelTx="addressEditScreen:address"
            placeholderTx="addressEditScreen:addressPlaceholder"
            multiline
            helperTx={formState.errors.address}
            status={formState.errors.address ? "error" : undefined}
            readOnly={formState.isLoading}
            accessible={true}
            accessibilityLabel="Country input"
            accessibilityRole="text"
          />

          <TextField
            value={formState.zip_code}
            onChangeText={(v) => updateField("zip_code", v)}
            labelTx="addressEditScreen:zipCode"
            placeholderTx="addressEditScreen:zipCodePlaceholder"
            helperTx={formState.errors.zip_code}
            status={formState.errors.zip_code ? "error" : undefined}
            readOnly={formState.isLoading}
            accessible={true}
            accessibilityLabel="Zip code input"
            accessibilityRole="text"
          />

          <Button
            tx="common:saveChanges"
            onPress={handleUpsertAddress}
            disabled={formState.isLoading}
          />
        </View>
      </Screen>
    )
  })

const $formContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.lg,
})
