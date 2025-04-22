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

export type UserProfileFormState = {
  errors: {
    general?: TxKeyPath
  }
  isLoading: boolean
}

export type IUserEditPublicProfileFormState = {
  display_name: string
  about: string
  errors: {
    display_name?: TxKeyPath
    about?: TxKeyPath
    general?: TxKeyPath
  }
  isLoading: boolean
}

export type UserEditPrivateProfileFormState = {
  displayName: string
  about: string
  errors: {
    displayName?: TxKeyPath
    about?: TxKeyPath
    general?: TxKeyPath
  }
  isLoading: boolean
}
