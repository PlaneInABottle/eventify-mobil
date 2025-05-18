export const errorKeys = {
  forms: {
    errors: {
      // General Field Errors
      fieldRequired: "This field is required.",
      minLength: "Must be at least {{min}} characters.", // Example with interpolation
      maxLength: "Cannot exceed {{max}} characters.", // Example with interpolation
      invalidFormat: "Invalid format.",

      // Name Field Errors
      requiredName: "Name is required.",
      invalidName: "Name contains invalid characters.", // Example

      // Last Name Field Errors
      requiredLastName: "Last name is required.",
      invalidLastName: "Last name contains invalid characters.", // Example

      // Email Field Errors (assuming you might add email validation)
      requiredEmail: "Email is required.",
      invalidEmail: "Please enter a valid email address.",

      // Password Field Errors (assuming you might add password validation)
      requiredPassword: "Password is required.",
      passwordComplexity: "Password must include uppercase, lowercase, number, and special character.",

      // Identity Number Field Errors
      requiredIdentityNumber: "Identity number is required.",
      invalidIdentityNumberFormat: "Identity number format is invalid. It should contain only digits.",
      identityNumberLength: "Identity number must 11 digits.",

      // Phone Number Field Errors
      requiredPhoneNumber: "Phone number is required.",
      invalidPhoneNumberFormat: "Phone number format is invalid. Must be 10 digits.",

      // General Form Errors
      generalSubmissionError: "An unexpected error occurred. Please try again.",
      networkError: "Network error. Please check your connection and try again.",
      formInvalid: "Please correct the errors in the form.",

      fillPrivateProfile: "Please first fill the private profile for payment.",
      fillAddressForPayment: "Please first fill the address part for payment.",

    },
    placeholders: { // You might also want to group placeholders
      name: "Enter your name",
      lastName: "Enter your last name",
      email: "your.email@example.com",
      identityNumber: "e.g., 1234567890",
      phoneNumber: "e.g., 555 123 4567",
    },
    labels: { // And labels
      name: "Name",
      lastName: "Last Name",
      email: "Email Address",
      identityNumber: "Identity Number",
      phoneNumber: "Phone Number",
      password: "Password",
    }
  },
}

export default errorKeys;
