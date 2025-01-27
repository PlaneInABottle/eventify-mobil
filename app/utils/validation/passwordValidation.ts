import { TxKeyPath } from "@/i18n"

export default function isValidPassword(
  password: string,
  confirmPassword: {
    isExists: boolean
    value?: string
  },
): true | TxKeyPath {
  // Trim whitespace and check length
  const trimmedPassword = password.trim()

  // Minimum 6 characters
  if (trimmedPassword.length < 6) {
    return "errors:passwordShort"
  }

  if (confirmPassword?.isExists) {
    if (!confirmPassword.value) return "errors:passwordsNotMatch"
    const trimmedConfirmPassword = confirmPassword.value.trim()
    if (trimmedPassword !== trimmedConfirmPassword) return "errors:passwordsNotMatch"
  }

  // Minimum 6 characters with at least: 1 uppercase, 1 lowercase, 1 number
  const strongPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/

  return true
}
