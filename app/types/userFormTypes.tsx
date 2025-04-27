import { TxKeyPath } from "@/i18n"

export type UserLoginFormState = {
  email: string
  password: string
  errors: {
    email?: TxKeyPath
    password?: TxKeyPath
    general?: TxKeyPath | string
  }
  isLoading: boolean
}

export type UserProfileFormState = {
  errors: {
    general?: TxKeyPath | string
  }
  isLoading: boolean
}

export type IUserEditPublicProfileFormState = {
  display_name: string
  about: string
  errors: {
    display_name?: TxKeyPath
    about?: TxKeyPath
    general?: TxKeyPath | string
  }
  isLoading: boolean
}

export type UserEditPrivateProfileFormState = {
  displayName: string
  about: string
  errors: {
    displayName?: TxKeyPath
    about?: TxKeyPath
    general?: TxKeyPath | string
  }
  isLoading: boolean
}

export type IUserEditAddressFormState = {
  id?: string
  user_id?: string
  title: string
  city: string
  country: string
  address: string
  zip_code: string
  errors: {
    user_id?: TxKeyPath
    title?: TxKeyPath
    city?: TxKeyPath
    country?: TxKeyPath
    address?: TxKeyPath
    zip_code?: TxKeyPath
    general?: TxKeyPath | string
  }
  isLoading: boolean
}
