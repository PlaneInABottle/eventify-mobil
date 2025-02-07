import { translate } from "@/i18n"
import Toast from "react-native-toast-message"
import { ErrorType, reportCrash } from "./crashReporting"
import * as Sentry from "@sentry/react-native"
export interface ErrorConfig {
  silent?: boolean
  toast?: boolean
  report?: boolean
}

const defaultConfig: ErrorConfig = {
  silent: false,
  toast: true,
  report: true,
}

/**
 * Normalizes any error type into an Error instance while preserving properties
 */
function normalizeError(error: unknown): Error {
  // Already an Error instance (including custom errors that extend Error)
  if (error instanceof Error) {
    return error
  }

  // Create new Error and preserve properties if object
  const errorObject = new Error(
    typeof error === "object" && error !== null
      ? (error as any).message || JSON.stringify(error)
      : String(error),
  )

  // Copy all enumerable properties from the original error object
  if (error && typeof error === "object") {
    Object.assign(errorObject, error)
  }

  return errorObject
}

/**
 * Gets a user-friendly message from any error type
 */
function getErrorMessage(error: Error): string {
  // Try to get message from known error properties
  const message =
    (error as any).message ||
    (error as any).error?.message ||
    (error as any).details?.message ||
    translate("errors:unknown")

  // If message is a translation key, translate it
  return message.startsWith("errors:") ? translate(message) : message
}

/**
 * Handles any type of error with consistent behavior
 */
export function handleError(error: unknown, config: ErrorConfig = defaultConfig) {
  const normalizedError = normalizeError(error)
  const message = getErrorMessage(normalizedError)

  // Show toast if enabled
  if (config.toast) {
    Toast.show({
      type: "error",
      text1: translate("errors:title"),
      text2: message,
      position: "top",
    })
  }

  // Log in development
  if (__DEV__ && !config.silent) {
    console.error("[Error Details]:", {
      message,
      error: normalizedError,
      //     stack:normalizedError.stack,
      // Log all properties
      /*
      properties: Object.fromEntries(
        Object.entries(normalizedError).filter(([key]) => !["message", "stack"].includes(key)),
      ),
            */
    })
  }

  // Report in production
  if (!__DEV__ && config.report) {
    // Your error reporting service here
    Sentry.captureException(normalizedError)
  }

  return { message, error: normalizedError }
}
