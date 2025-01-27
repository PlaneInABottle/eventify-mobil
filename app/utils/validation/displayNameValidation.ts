import { TxKeyPath } from "@/i18n"

export default function isValidDisplayName(displayName: string): true | TxKeyPath {
  // Trim whitespace and check length
  const trimmedDisplayName = displayName.trim()

  // Minimum 6 characters
  if (trimmedDisplayName.length < 6) {
    return "errors:displayNameShort"
  }

  return true
}
