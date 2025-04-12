import { TxKeyPath } from "@/i18n"
import isValidEmail from "../validation/emailValidation"
import isValidPassword from "../validation/passwordValidation"
import { SetStateAction, Dispatch } from "react"
import { UserLoginFormState } from "@/types/userFormTypes"

export const validateUserLoginForm = (
  password: string,
  email: string,
  setFormState: Dispatch<SetStateAction<UserLoginFormState>>,
): boolean => {
  const passResult = isValidPassword(password, {
    isExists: false,
  })

  const newErrors = {
    email: isValidEmail(email) ? undefined : ("errors:invalidEmail" as TxKeyPath),
    password: passResult === true ? undefined : passResult,
  }

  setFormState((prev: UserLoginFormState) => ({
    ...prev,
    errors: newErrors,
  }))

  return !Object.values(newErrors).some(Boolean)
}

export const updateUserLoginFormField = (
  field: keyof UserLoginFormState,
  value: string,
  setFormState: Dispatch<SetStateAction<UserLoginFormState>>,
) => {
  setFormState((prev) => ({
    ...prev,
    [field]: value,
    errors: { ...prev.errors, [field]: undefined, general: undefined },
  }))
}
