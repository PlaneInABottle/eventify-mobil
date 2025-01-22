/**
 * If you're using Sentry
 *   Expo https://docs.expo.dev/guides/using-sentry/
 */
import * as Sentry from "@sentry/react-native"

/**
 * If you're using Crashlytics: https://rnfirebase.io/crashlytics/usage
 */
// import crashlytics from "@react-native-firebase/crashlytics"

/**
 * If you're using Bugsnag:
 *   RN   https://docs.bugsnag.com/platforms/react-native/)
 *   Expo https://docs.bugsnag.com/platforms/react-native/expo/
 */
// import Bugsnag from "@bugsnag/react-native"
// import Bugsnag from "@bugsnag/expo"

/**
 *  This is where you put your crash reporting service initialization code to call in `./app/app.tsx`
 */
export const initCrashReporting = () => {
  Sentry.init({
    dsn: "https://1429360a65710ac74d69e003e1c8987c@o4508677653921792.ingest.de.sentry.io/4508677662113872",
    debug: __DEV__, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
    tracesSampleRate: 1.0,
    enableUserInteractionTracing: false,
    profilesSampleRate: 1.0,
  })
  // Bugsnag.start("YOUR API KEY")
}

/**
 * Error classifications used to sort errors on error reporting services.
 */
export enum ErrorType {
  /**
   * An error that would normally cause a red screen in dev
   * and force the user to sign out and restart.
   */
  FATAL = "Fatal",
  /**
   * An error caught by try/catch where defined using Reactotron.tron.error.
   */
  HANDLED = "Handled",
}

/**
 * Manually report a handled error.
 */
// Check if any works for sentry
export const reportCrash = (error: any, type: ErrorType = ErrorType.FATAL) => {
  if (__DEV__) {
    // Log to console and Reactotron in development
    const message = error.message || "Unknown"
    console.error(error)
    console.log(message, type)
  } else {
    // In production, utilize crash reporting service of choice below:
    // RN
    Sentry.captureException(error)
    // crashlytics().recordError(error)
    // Bugsnag.notify(error)
  }
}
