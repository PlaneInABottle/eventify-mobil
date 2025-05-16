// src/utils/validation/commonValidations.ts
import { TxKeyPath, ValidationResult } from "@/i18n"; // Or your TxKeyPath import

// --- Basic String Validations ---
export const validateRequired = (
  value: string,
  errorKey: TxKeyPath = "forms:errors.fieldRequired" // Default key
): ValidationResult => {
  if (!value || !value.trim()) {
    return { key: errorKey };
  }
  return undefined;
};

export const validateMinLength = (
  value: string,
  min: number,
  errorKey: TxKeyPath = "forms:errors.minLength" // Key that expects {{min}}
): ValidationResult => {
  if (value.trim().length < min) {
    return { key: errorKey, values: { min } };
  }
  return undefined;
};

export const validateMaxLength = (
  value: string,
  max: number,
  errorKey: TxKeyPath = "forms:errors.maxLength" // Key that expects {{max}}
): ValidationResult => {
  if (value.trim().length > max) {
    return { key: errorKey, values: { max } };
  }
  return undefined;
};

// --- Specific Field Validations (Composed) ---

export const validateName = (name: string): ValidationResult => {
  let error = validateRequired(name, "forms:errors.requiredName");
  if (error) return error;

  error = validateMinLength(name, 2, "forms:errors.minLength"); // Assuming minNameLength key is "Name must be at least {{min}} characters."
  if (error) return error;

  error = validateMaxLength(name, 20, "forms:errors.maxLength"); // Assuming maxNameLength key is "Name cannot exceed {{max}} characters."
  if (error) return error;

  return undefined;
};

export const validateLastName = (lastName: string): ValidationResult => {
  let error = validateRequired(lastName, "forms:errors.requiredLastName");
  if (error) return error;

  error = validateMinLength(lastName, 2, "forms:errors.minLength");
  if (error) return error;

  error = validateMaxLength(lastName, 50, "forms:errors.maxLength");
  if (error) return error;

  return undefined;
};

export const validateIdentityNumber = (identityNumber: string): ValidationResult => {
  let error = validateRequired(identityNumber, "forms:errors.requiredIdentityNumber" as TxKeyPath);
  if (error) {
    return error;
  }

  const trimmedIdentityNumber = identityNumber.trim();

  if (!/^\d+$/.test(trimmedIdentityNumber)) {
    return { key: "forms:errors.invalidIdentityNumberFormat" as TxKeyPath };
  }

  const exactLength = 11;

  if (trimmedIdentityNumber.length !== exactLength) {
    return {
      key: "forms:errors.identityNumberLength" as TxKeyPath,
      values: { length: exactLength },
    };
  }

  // If all checks pass, the identity number is valid.
  return undefined;
};

export const validatePhoneNumber = (phoneNumber: string): ValidationResult => {
  let error = validateRequired(phoneNumber, "forms:errors.requiredPhoneNumber");
  if (error) return error;

  const exactLength = 10;
  const trimmedPhoneNumber = phoneNumber.trim();
  if (!/^\d+$/.test(trimmedPhoneNumber)) {
    return { key: "forms:errors.invalidPhoneNumberFormat", values: { length: exactLength } };
  }

  if (trimmedPhoneNumber.length !== exactLength) {
    return {
      key: "forms:errors.invalidPhoneNumberFormat" as TxKeyPath,
      values: { length: exactLength },
    };
  }
  return undefined;
};

// Example for email if you had it
// import { isValidEmail } from "./emailValidation"; // Assuming this returns boolean
// export const validateEmailField = (email: string): ValidationResult => {
//   if (!email.trim()) return { key: "forms.errors.requiredEmail" };
//   if (!isValidEmail(email)) return { key: "forms.errors.invalidEmail" };
//   return undefined;
// }
