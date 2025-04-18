// components/PaymentScreen.tsx
// (Adjust path as needed)

import { useState, useEffect, useRef, useCallback } from "react"
import { useStores } from "@/models" // Adjust path to your MST stores
import { observer } from "mobx-react-lite"
import { WebView, WebViewNavigation } from "react-native-webview"
import {
  ActivityIndicator,
  Text,
  View,
  Button,
  Modal,
  SafeAreaView,
  Alert,
  ViewStyle,
  TextStyle,
} from "react-native" // Added TextStyle
// Assuming you have a navigation hook or prop
// import { useNavigation } from "@react-navigation/native";
import { useAppTheme } from "@/utils/useAppTheme" // Import theme hook
import { ThemedStyle } from "@/theme" // Import ThemedStyle type
import { ICheckoutDetails } from "@/models/userStores/UserPaymentStore"

// Import the MST model for type checking input (optional but good practice)
// import { CheckoutDetailsModel } from "@/models/PaymentStore"; // Adjust path

// --- Component ---

export const PaymentScreen = observer(() => {
  // --- Hooks ---
  const { userPaymentStore } = useStores() // Get payment store instance
  const { themed } = useAppTheme() // Get theme functions
  // const navigation = useNavigation(); // Get navigation object if needed
  const webviewRef = useRef<WebView>(null)

  // --- State ---
  const [showWebViewModal, setShowWebViewModal] = useState(false)
  // Store the callback URL used for this specific attempt
  const [callbackUrlUsed, setCallbackUrlUsed] = useState<string>("")

  // --- Effects ---

  // Effect to close WebView modal when a final result or error is available
  useEffect(() => {
    if (userPaymentStore.finalPaymentResult || userPaymentStore.retrievalError) {
      setShowWebViewModal(false)
    }
  }, [userPaymentStore.finalPaymentResult, userPaymentStore.retrievalError])

  // --- Callbacks ---

  // Function to initiate the payment process
  const handleInitiatePayment = useCallback(async () => {
    userPaymentStore.resetPaymentState()
    const details: ICheckoutDetails = {
      // Populate with actual data
      buyer: {
        id: "USR_TEST_101",
        name: "Test",
        surname: "User",
        gsmNumber: "+905559876543",
        email: "test.user@example.com",
        identityNumber: "11111111110",
        registrationAddress: "1 Test St, Testville",
        ip: "192.168.1.10",
        city: "Istanbul",
        country: "Turkey",
        zipCode: "35234",
      },
      shippingAddress: {
        contactName: "Test User",
        city: "Istanbul",
        country: "Turkey",
        address: "1 Shipping St",
      },
      billingAddress: {
        contactName: "Test User",
        city: "Istanbul",
        country: "Turkey",
        address: "1 Billing St",
      },
      basketItems: [
        {
          id: "TKT_001",
          name: "Sample Ticket",
          category1: "Events",
          itemType: "VIRTUAL",
          price: "55.50",
          subMerchantKey: "QT+ThG1rXP7XSnGL1huwVF9MffM=",
          subMerchantPrice: "50.00",
        },
      ],
      callbackUrl: "yourappscheme://payment-callback", // ** Use your actual deep link scheme **
      paidPrice: "55.50",
      conversationId: `order-${Date.now()}`,
    }
    setCallbackUrlUsed(details.callbackUrl)
    const initResult = await userPaymentStore.initializePayment(details)
    if (initResult.success && userPaymentStore.paymentPageUrl) {
      setShowWebViewModal(true)
    } else {
      Alert.alert(
        "Payment Error",
        userPaymentStore.initializationError || "Could not start payment.",
      )
    }
  }, [userPaymentStore])

  // Function called when WebView navigation state changes
  const handleWebViewNavigation = (navState: WebViewNavigation) => {
    const { url } = navState // Removed loading as it wasn't used after logging
    console.log("WebView Navigating:", url)

    if (url && url.startsWith(callbackUrlUsed)) {
      console.log("Callback URL detected:", url)
      webviewRef.current?.stopLoading()
      setShowWebViewModal(false)
      let receivedToken: string | null = null
      try {
        const urlObj = new URL(url)
        receivedToken = urlObj.searchParams.get("token")
      } catch (e) {
        console.error("Error parsing token from callback URL:", e)
      }
      if (receivedToken) {
        userPaymentStore.setProp("callbackToken", receivedToken) // Trigger store action
      } else {
        console.error("Callback received but token is missing!")
        Alert.alert(
          "Payment Error",
          "Payment verification failed. Please try again or contact support.",
        )
        userPaymentStore.resetPaymentState()
      }
      return // Prevent further processing
    }
  }

  // Function to handle manual closing of the WebView modal
  const handleCloseWebView = () => {
    Alert.alert("Cancel Payment?", "Are you sure you want to cancel the payment process?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        onPress: () => {
          setShowWebViewModal(false)
          userPaymentStore.resetPaymentState()
        },
        style: "destructive",
      },
    ])
  }

  // Function to handle finishing the process after seeing the result
  const handleFinish = () => {
    userPaymentStore.resetPaymentState()
    // navigation.goBack(); // Example navigation
    Alert.alert("Finished", "Returning to previous screen.") // Placeholder
  }

  // --- Render Logic ---

  // 1. Show WebView Modal
  if (showWebViewModal && userPaymentStore.paymentPageUrl) {
    return (
      <Modal visible={true} onRequestClose={handleCloseWebView} animationType="slide">
        <SafeAreaView style={themed($modalContainer)}>
          <View style={themed($modalHeader)}>
            {/* Use themed color for cancel button if theme supports it */}
            <Button
              title="Cancel"
              onPress={handleCloseWebView}
              color={themed((t) => t.colors.error || "#FF3B30")}
            />
          </View>
          <WebView
            ref={webviewRef}
            source={{ uri: userPaymentStore.paymentPageUrl }}
            onNavigationStateChange={handleWebViewNavigation}
            startInLoadingState={true}
            renderLoading={() => (
              <ActivityIndicator
                size="large"
                style={themed($webViewLoading)}
                color={themed((t) => t.colors.tint)}
              />
            )}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent
              console.warn("WebView error: ", nativeEvent)
              setShowWebViewModal(false)
              Alert.alert("Error", "Could not load payment page. Please check your connection.")
              userPaymentStore.resetPaymentState()
            }}
            style={themed($webView)} // Use themed style
          />
        </SafeAreaView>
      </Modal>
    )
  }

  // 2. Show Loading/Error/Result states on the main screen area
  return (
    <View style={themed($container)}>
      {/* Initialization Loading State */}
      {userPaymentStore.isInitializing && (
        <>
          <Text style={themed($statusText)}>Starting secure payment...</Text>
          <ActivityIndicator
            size="large"
            style={themed($activityIndicator)}
            color={themed((t) => t.colors.tint)}
          />
        </>
      )}

      {/* Initialization Error State */}
      {userPaymentStore.initializationError && !userPaymentStore.isInitializing && (
        <View style={themed($errorContainer)}>
          <Text style={themed($errorText)}>Error starting payment:</Text>
          <Text style={themed($errorText)}>{userPaymentStore.initializationError}</Text>
          <Button title="Retry" onPress={handleInitiatePayment} />
        </View>
      )}

      {/* Retrieval Loading State (After callback) */}
      {userPaymentStore.isRetrievingResult && (
        <>
          <Text style={themed($statusText)}>Verifying payment result...</Text>
          <ActivityIndicator
            size="large"
            style={themed($activityIndicator)}
            color={themed((t) => t.colors.tint)}
          />
        </>
      )}

      {/* Retrieval Error State */}
      {userPaymentStore.retrievalError && !userPaymentStore.isRetrievingResult && (
        <View style={themed($errorContainer)}>
          <Text style={themed($errorText)}>Error verifying payment:</Text>
          <Text style={themed($errorText)}>{userPaymentStore.retrievalError}</Text>
          <Button
            title="Contact Support"
            onPress={() => Alert.alert("Support", "Please contact support regarding your payment.")}
          />
          {/* Optionally add a button to go back */}
          {/* <Button title="Go Back" onPress={handleFinish} /> */}
        </View>
      )}

      {/* Final Payment Result Display */}
      {userPaymentStore.finalPaymentResult && !userPaymentStore.isRetrievingResult && (
        <View style={themed($resultContainer)}>
          <Text style={themed($resultTitle)}>Payment Result</Text>
          {userPaymentStore.finalPaymentResult.paymentStatus === "SUCCESS" ? (
            <Text style={themed($successText)}>Payment Successful!</Text>
          ) : (
            <Text style={themed($failureText)}>Payment Not Successful</Text>
          )}
          <Text style={themed($resultDetailText)}>
            Status: {userPaymentStore.finalPaymentResult.paymentStatus || "N/A"}
          </Text>
          <Text style={themed($resultDetailText)}>
            Payment ID: {userPaymentStore.finalPaymentResult.paymentId || "N/A"}
          </Text>
          {userPaymentStore.finalPaymentResult.errorMessage && (
            <Text style={themed($errorText)}>
              Details: {userPaymentStore.finalPaymentResult.errorMessage}
            </Text>
          )}
          <Button title="Done" onPress={handleFinish} />
        </View>
      )}

      {/* Initial State: Show Pay Button */}
      {!userPaymentStore.isInitializing &&
        !userPaymentStore.paymentPageUrl &&
        !userPaymentStore.isRetrievingResult &&
        !userPaymentStore.finalPaymentResult &&
        !userPaymentStore.initializationError &&
        !userPaymentStore.retrievalError && (
          // Consider using your themed Button component if available
          <Button title="Proceed to Secure Payment" onPress={handleInitiatePayment} />
        )}
    </View>
  )
})

// --- Styles --- (Using ThemedStyle pattern)

const $container: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.lg,
  backgroundColor: colors.background, // Use theme background
})

const $modalContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background, // Use theme background for modal
})

const $modalHeader: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.sm,
  borderBottomWidth: 1,
  borderColor: colors.border, // Use theme border color
  alignItems: "flex-start",
})

const $webView: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

// Absolute positioning might not need theme variables directly
const $webViewLoading: ThemedStyle<ViewStyle> = () => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: "center",
  alignItems: "center",
})

const $statusText: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  marginBottom: spacing.md,
  color: colors.text, // Use theme text color
  textAlign: "center",
})

const $errorText: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  color: colors.error, // Use theme error color
  textAlign: "center",
  marginBottom: spacing.sm,
})

const $successText: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  color: colors.text, // Use theme success color
  fontSize: spacing.md,
  marginBottom: spacing.md,
  textAlign: "center",
})

const $failureText: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  color: colors.text, // Use theme warning color
  marginBottom: spacing.md,
  textAlign: "center",
})

const $activityIndicator: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginVertical: spacing.lg,
})

const $resultContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  alignItems: "center",
  padding: spacing.lg,
  borderWidth: 1,
  borderColor: colors.border,
  marginHorizontal: spacing.md, // Add some horizontal margin
})

const $resultTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
  textAlign: "center",
})

const $resultDetailText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim, // Use dimmer text color for details
  marginBottom: 2,
})

const $errorContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  padding: spacing.md,
})

export default PaymentScreen
