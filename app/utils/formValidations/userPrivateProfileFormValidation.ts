import { IUserEditPrivateProfileFormState } from "@/types/userFormTypes"
import { Dispatch, SetStateAction } from "react"
import { validateIdentityNumber, validateLastName, validateName, validatePhoneNumber } from "../validation/allValidations"

export const validateUserPrivateProfileForm = (
  name: string,
  lastName: string,
  identityNumber: string,
  phoneNumber: string,
  setFormState: Dispatch<SetStateAction<IUserEditPrivateProfileFormState>>,
): boolean => {

  const newErrors = {
    name: validateName(name),
    lastName: validateLastName(lastName),
    identityNumber: validateIdentityNumber(identityNumber),
    phoneNumber: validatePhoneNumber(phoneNumber),
  }

  setFormState((prev: IUserEditPrivateProfileFormState) => ({
    ...prev,
    errors: newErrors,
  }))

  return !Object.values(newErrors).some(Boolean)
}

export const updateUserPrivateProfileFormField = (
  field: keyof IUserEditPrivateProfileFormState,
  value: string,
  setFormState: Dispatch<SetStateAction<IUserEditPrivateProfileFormState>>,
) => {
  setFormState((prev) => ({
    ...prev,
    [field]: value,
    errors: { ...prev.errors, [field]: undefined, general: undefined },
  }))
}
