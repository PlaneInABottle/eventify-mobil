import { TxKeyPath } from "@/i18n"; // Or wherever your TxKeyPath is

export interface IValidationError {
  key: TxKeyPath;
  values?: Record<string, string | number | boolean>; // Values for interpolation
}

// A validation function will return this type or undefined
export type ValidationResult = IValidationError | undefined;
