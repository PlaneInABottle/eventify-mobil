
export interface IAppBasketItemIdentifier {
  itemId: string; // Your internal ID for the product/event/ticket
  quantity: number;
  // pricePerItem?: string; // Optional: only if backend cannot determine this
}

export interface IAppToBackendPaymentInitRequest {
  basketItemsIdentifiers: IAppBasketItemIdentifier[];
  selectedBillingAddressId: string;
  selectedShippingAddressId?: string; // Optional
  callbackUrl: string;
  clientIpAddress: string; // iyzico requires buyer IP. [Source: 392]
  currency?: string; // e.g., "TRY"
  enabledInstallments?: number[]; // e.g. [1, 2, 3, 6]
  // Any other minimal info your backend *cannot* derive itself
  // but is needed for the iyzico payload (e.g., promo codes if handled by iyzico)
}

export interface IInitializePaymentResponse {
  paymentPageUrl?: string
  token?: string
  error?: string
}


// Interface for the (mocked) response from your backend after retrieving payment details
export interface IRetrievePaymentResponse {
  status?: "success" | "failure" // iyzico's paymentStatus
  paymentId?: string
  price?: string
  paidPrice?: string
  errorMessage?: string
  // ... other relevant fields from iyzico's CF Retrieve response
  error?: string // For backend communication errors
}

