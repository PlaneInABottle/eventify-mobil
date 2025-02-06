import Toast from "react-native-toast-message"
import { TxKeyPath, translate } from "@/i18n"

interface ToastConfig {
  silent?: boolean
  position?: "top" | "bottom"
  duration?: number
}

const defaultConfig: ToastConfig = {
  silent: false,
  position: "top",
  duration: 3000,
}

/**
 * Handles success scenarios with optional toast message
 */
export function handleSuccess(
  message: string | TxKeyPath,
  config: ToastConfig = defaultConfig,
): { success: true; message: string } {
  if (!config.silent) {
    Toast.show({
      type: "success",
      text1: translate("success:title"),
      text2: message.startsWith("success:") ? translate(message as TxKeyPath) : message,
      position: config.position,
      visibilityTime: config.duration,
    })
  }

  if (__DEV__) {
    console.log(
      "[Success]:",
      message.startsWith("success:") ? translate(message as TxKeyPath) : message,
    )
  }

  return { success: true, message }
}
