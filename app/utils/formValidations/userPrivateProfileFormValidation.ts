import { TxKeyPath } from "@/i18n"
import isValidEmail from "../validation/emailValidation"
import isValidPassword from "../validation/passwordValidation"
import { SetStateAction, Dispatch } from "react"
import { IUserEditPrivateProfileFormState, UserLoginFormState } from "@/types/userFormTypes"

export const validateUserPrivateProfileForm = (
  name: string,
  lastName: string,
  identityNumber: string,
  phoneNumber: string,
  setFormState: Dispatch<SetStateAction<IUserEditPrivateProfileFormState>>,
): boolean => {

  const newErrors = {
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
