export default function isValidEmail(email: string): boolean {
  const trimmedEmail = email.trim()
  if (trimmedEmail === "") {
    return false
  }

  /**
   * Regular expression pattern breakdown:
   * ^                        - Start of string
   * [a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+  - Local part (before @)
   * @                        - Mandatory @ symbol
   * [a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])? - Domain part (after @)
   * (?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)* - Subdomains
   * \.[a-zA-Z]{2,}           - Top-level domain (2+ characters)
   * $                        - End of string
   */
  const emailPattern =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/

  return emailPattern.test(trimmedEmail)
}

// Example usage:
const testEmails = [
  "user@example.com",
  "user.name@domain.co.uk",
  "user+tag@sub.domain.com",
  "invalid.email",
  "@missing-local.com",
  "user@.invalid-domain.com",
  "user@domain..com",
]

testEmails.forEach((email) => {
  console.log(`${email}: ${isValidEmail(email) ? "Valid" : "Invalid"}`)
})
