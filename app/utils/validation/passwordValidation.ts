import { TxKeyPath } from "@/i18n"

export default function isValidPassword(
  password: string,
  confirmPassword?: string,
): true | TxKeyPath {
  // Trim whitespace and check length
  const trimmedPassword = password.trim()

  // Minimum 6 characters
  if (trimmedPassword.length < 6) {
    return "errors:passwordShort"
  }

  if (confirmPassword) {
    const trimmedConfirmPassword = password.trim()
    if (trimmedPassword !== trimmedConfirmPassword) return "errors:passwordsNotMatch"
  }

  // Minimum 6 characters with at least: 1 uppercase, 1 lowercase, 1 number
  const strongPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/

  return true
}
