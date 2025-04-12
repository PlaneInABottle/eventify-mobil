import { TxKeyPath } from "@/i18n"

export type UserLoginFormState = {
  email: string
  password: string
  errors: {
    email?: TxKeyPath
    password?: TxKeyPath
    general?: TxKeyPath
  }
  isLoading: boolean
}
