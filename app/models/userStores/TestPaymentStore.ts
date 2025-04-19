import { types, flow, Instance, SnapshotOut } from "mobx-state-tree"
import { supabase } from "@/services/auth/supabase"
import { withSetPropAction } from "@/models/helpers/withSetPropAction"

// Interface for Buyer data structure
interface IBuyer {
  id: string // Example field
  name: string
  surname: string
  identityNumber: string
  email: string
  gsmNumber: string
  registrationAddress: string
  city: string
  country: string
  zipCode: string
  ip: string // Usually added server-side, but might be known client-side
  // Add other relevant buyer fields based on Iyzico requirements
}

// Interface for Address data structure
interface IAddress {
  contactName: string
  city: string
  country: string
  address: string
  zipCode?: string | null // Optional based on requirements
  // Add other relevant address fields
}

// Interface for Basket Item data structure
interface IBasketItem {
  id: string // Your internal product ID
  name: string
  category1?: string | null // Optional category
  category2?: string | null // Optional sub-category
  itemType: "PHYSICAL" | "VIRTUAL" // As per Iyzico's enum
  price: string // Price as a string (Iyzico often expects this)
  subMerchantKey: string
  subMerchantPrice: string
  // Add other relevant item fields
}

// Interface for the input to initialize-checkout-form
interface ICheckoutDetails {
  buyer: IBuyer // Use the interface
  shippingAddress: IAddress // Use the interface
  billingAddress: IAddress // Use the interface
  basketItems: IBasketItem[] // Use the interface array
  callbackUrl: string
  paidPrice: string // Total price for the transaction (string)
  currency?: string | null // Defaults to TRY if not sent for Iyzico TR
  enabledInstallments?: number[] | null // e.g., [2, 3, 6, 9]
  conversationId?: string | null // Your internal order/transaction ID
  locale?: "tr" | "en" | null // Iyzico locale
  // Add other optional fields from Iyzico docs if needed
}

// Interface for the result from initialize-checkout-form
interface IInitCheckoutResult {
  status: "success" | "failure" | string // More specific?
  paymentPageUrl: string | null
  token: string | null // This is the crucial token
  tokenExpireTime?: number | null
  errorMessage?: string | null // If status is 'failure'
  errorCode?: string | null
  // Add other fields if your API returns them
}

// Interface for the structure of item transactions in the final result
interface IItemTransaction {
  itemId: string
  paymentTransactionId: string
  paidPrice: number // Usually number here
  // Add other fields like transactionStatus, blockageRate, etc.
}

// Interface for the final result from retrieve-checkout-result
interface IFinalPaymentResult {
  status: "success" | "failure" | string // Status of your API call
  paymentStatus: "SUCCESS" | "FAILURE" | string | null // Iyzico's payment status
  paymentId: string | null
  paidPrice: number | null // Amount paid (usually number)
  currency: string | null
  errorMessage: string | null // Iyzico's error message
  errorCode: string | null // Iyzico's error code
  itemTransactions: IItemTransaction[] | any[] | null // Use specific interface or keep flexible
  conversationId?: string | null
  hostReference?: string | null // Bank reference number
  fraudStatus?: number | null // Iyzico fraud status
  installment?: number | null // Number of installments used
  // Add any other fields you need from the response
}

// --- MST Model for Storing Final Payment Result in State (Remains the same) ---
const FinalPaymentResultModel = types
  .model("FinalPaymentResult", {
    status: types.string,
    paymentStatus: types.maybeNull(types.string),
    paymentId: types.maybeNull(types.string),
    paidPrice: types.maybeNull(types.number),
    currency: types.maybeNull(types.string),
    errorMessage: types.maybeNull(types.string), // Keep MST prop for potential display from result
    errorCode: types.maybeNull(types.string), // Keep MST prop for potential display from result
    itemTransactions: types.frozen(),
    conversationId: types.maybeNull(types.string),
    hostReference: types.maybeNull(types.string),
    fraudStatus: types.maybeNull(types.number),
    installment: types.maybeNull(types.number),
  })
  .actions((self) => ({}))

// --- Rewritten Payment Store ---

const UserPaymentStoreModel = types
  .model("UserPaymentStore")
  .props({
    // Core state properties
    isInitializing: types.optional(types.boolean, false),
    paymentPageUrl: types.maybeNull(types.string),
    checkoutToken: types.maybeNull(types.string), // Token from initialization
    callbackToken: types.maybeNull(types.string), // Token received from the callback
    isRetrievingResult: types.optional(types.boolean, false),
    finalPaymentResult: types.maybeNull(FinalPaymentResultModel), // Stores the structured result
  })
  .volatile(() => ({
    // Non-persistent state, like error messages/objects
    initializationError: null as string | null,
    retrievalError: null as string | null,
  }))
  .views((store) => ({
    // Derived data getters
    get isProcessing(): boolean {
      return store.isInitializing || store.isRetrievingResult
    },
    get hasInitializationError(): boolean {
      return !!store.initializationError
    },
    get hasRetrievalError(): boolean {
      return !!store.retrievalError
    },
    get isPaymentSuccessful(): boolean {
      // Check both the final result and specific payment status within it
      return !!store.finalPaymentResult && store.finalPaymentResult.paymentStatus === "SUCCESS"
    },
    // Optional: Expose specific error messages via views if needed
    // get initializationErrorMessage(): string | null { return store.initializationError },
    // get retrievalErrorMessage(): string | null { return store.retrievalError },
  }))
  .actions(withSetPropAction) // Provides store.setProp("propName", value) for props
  .actions((store) => ({
    // Internal helper to clear volatile state
    clearErrors() {
      store.initializationError = null
      store.retrievalError = null
    },
    // Action to clear state for a new attempt
    resetPaymentState() {
      // Clear props using setProp
      store.setProp("isInitializing", false)
      store.setProp("paymentPageUrl", null)
      store.setProp("checkoutToken", null)
      store.setProp("callbackToken", null)
      store.setProp("isRetrievingResult", false)
      store.setProp("finalPaymentResult", null)
      // Clear volatile state directly
      store.initializationError = null
      store.retrievalError = null
      console.log("PaymentStore: State reset.")
    },
    // Action to handle the callback URL
    handleCallback(url: string | null) {
      if (!url) {
        console.log("PaymentStore: handleCallback received null URL")
        store.setProp("callbackToken", null)
        // Optionally set a specific volatile error if needed
        // store.retrievalError = "Invalid callback URL received.";
        return
      }
      console.log("PaymentStore: Handling callback URL:", url)
      try {
        const params = new URLSearchParams(new URL(url).search)
        const token = params.get("token")

        if (token) {
          console.log("PaymentStore: Callback token received:", token)
          store.setProp("callbackToken", token)
          // Clear previous retrieval status when a new callback comes in
          store.setProp("finalPaymentResult", null) // Clear previous result prop
          store.retrievalError = null // Clear previous retrieval volatile error
        } else {
          console.warn("PaymentStore: Token not found in callback URL query parameters.")
          store.setProp("callbackToken", null)
          // Optionally set error: store.retrievalError = "Token missing in callback URL";
        }
      } catch (error) {
        console.error("PaymentStore: Error parsing callback URL:", error)
        store.setProp("callbackToken", null)
        // Optionally set error: store.retrievalError = "Failed to parse callback URL";
      }
    },
  }))
  .actions((store) => ({
    // Asynchronous actions using flow
    initializePayment: flow(function* (checkoutDetails: ICheckoutDetails) {
      console.log("PaymentStore: Initializing payment...")
      // Set loading prop and clear previous states/errors
      store.setProp("isInitializing", true)
      store.setProp("paymentPageUrl", null)
      store.setProp("checkoutToken", null)
      store.setProp("finalPaymentResult", null)
      store.initializationError = null // Clear volatile error
      store.retrievalError = null // Clear other volatile error

      try {
        const { data, error } = yield supabase.functions.invoke(
          "init-checkout", // <--- Your Supabase function name
          {
            body: checkoutDetails, // <--- Pass the object directly
            // Add headers here if needed (e.g., custom auth beyond Supabase default)
            // headers: { 'X-Custom-Header': 'value' }
          },
        )

        // Check for invocation errors (network, function not found, internal function crash)
        if (error) {
          console.error("Supabase function invocation error (init-checkout):", error)
          throw new Error(`Initialization failed: ${error.message}`)
        }

        // Check for application-level errors returned in the data payload
        // Adjust this condition based on how your Edge Function signals errors in its response
        if (!data || data.status !== "success" || !data.token || !data.paymentPageUrl) {
          const errorMsg =
            data?.errorMessage || "Initialization failed: Invalid response from function."
          console.error("Initialization failed (Function logic):", data)
          throw new Error(errorMsg)
        }

        console.log("PaymentStore: Initialization successful", data)
        // Set props on success
        store.setProp("paymentPageUrl", data.paymentPageUrl)
        store.setProp("checkoutToken", data.token)
        return { success: true }
      } catch (error) {
        console.error("PaymentStore: Initialization failed", error)
        const message = error instanceof Error ? error.message : "Unknown initialization error"
        // Set volatile error state
        store.initializationError = message
        // Ensure other props reflect failure
        store.setProp("paymentPageUrl", null)
        store.setProp("checkoutToken", null)
        return { success: false }
      } finally {
        // Clear loading prop
        store.setProp("isInitializing", false)
      }
    }),

    retrieveResult: flow(function* () {
      const tokenToRetrieve = store.callbackToken // Access prop via store

      if (!tokenToRetrieve) {
        console.warn("PaymentStore: retrieveResult called without a valid token.")
        // Set volatile error state
        store.retrievalError = "Cannot retrieve result: Missing payment token."
        return
      }

      console.log("PaymentStore: Retrieving payment result for token:", tokenToRetrieve)
      // Set loading prop and clear previous state/error
      store.setProp("isRetrievingResult", true)
      store.setProp("finalPaymentResult", null) // Clear previous result prop
      store.retrievalError = null // Clear volatile error

      try {
        // API call simulation/logic
        const response = yield fetch("/api/retrieve-checkout-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" /* Add Auth */ },
          body: JSON.stringify({ token: tokenToRetrieve }),
        })

        if (!response.ok) {
          let errorBody = null
          try {
            errorBody = yield response.json()
          } catch (e) {
            /* ignore */
          }
          const serverError =
            errorBody?.errorMessage || errorBody?.message || `HTTP ${response.status}`
          throw new Error(`Retrieval failed: ${serverError}`)
        }

        const result: IFinalPaymentResult = yield response.json()

        if (result.status !== "success") {
          const errorMsg =
            result.errorMessage || `API Error during retrieval (Status: ${result.status})`
          throw new Error(errorMsg)
        }

        console.log("PaymentStore: API Retrieval successful", result)
        // Set the final result prop (MST converts snapshot automatically)
        store.setProp("finalPaymentResult", result)

        // Additional check on payment status within the result
        if (result.paymentStatus !== "SUCCESS") {
          const errorMsg =
            result.errorMessage ||
            `Payment was not successful (Status: ${result.paymentStatus || "Unknown"})`
          console.warn(
            `PaymentStore: Payment status is ${result.paymentStatus}. Error: ${errorMsg}`,
          )
          // Optionally set retrievalError here as well if non-SUCCESS should be treated as a retrieval failure
          // store.retrievalError = `Payment Failed: ${errorMsg}`;
        } else {
          console.log("PaymentStore: Payment Status: SUCCESS")
        }
      } catch (error) {
        console.error("PaymentStore: Retrieval failed", error)
        const message = error instanceof Error ? error.message : "Unknown retrieval error"
        // Set volatile error state
        store.retrievalError = message
        store.setProp("finalPaymentResult", null) // Ensure no stale result prop
      } finally {
        // Clear loading prop
        store.setProp("isRetrievingResult", false)
      }
    }),
  }))
// .actions((store) => ({
//     // Lifecycle actions if needed
//     afterCreate() { /* ... */ },
//     beforeDestroy() { /* ... */ },
// }));
