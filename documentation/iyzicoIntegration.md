# Project Documentation: iyzico Marketplace Payment Integration

**Last Updated:** May 19, 2025
**Project Version:** 1.1

## 1. Overview

- **Application Type:** Event ticket sales marketplace.
- **Frontend:** React Native (Expo application).
- **Backend:** Supabase, utilizing Edge Functions for server-side logic.
- **Payment Gateway:** iyzico.
- **iyzico Product in Use:** [Marketplace Solution](https://docs.iyzico.com/en/products/marketplace), [Marketplace Implementation Guide](https://docs.iyzico.com/en/products/marketplace/marketplace-implementation) leveraging the [Checkout Form (CF) payment method](https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform), [Checkout Form Implementation Guide](https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform/cf-implementation/cf-initialize).
  This means iyzico hosts the final payment page, and users are redirected there to enter card details.
- **Core Goal:** To enable users (buyers) to purchase event tickets sold by various organizers (sub-merchants) on the platform. Payments are processed securely via iyzico, and the system is designed to eventually route payouts to the respective sub-merchants.

## 2. System Architecture Summary

The payment flow involves three main components:

- **React Native App:** Collects minimal payment initiation details from the user and calls a Supabase Edge Function. It later handles redirection to iyzico's payment page and receives a callback.
- **Supabase Edge Functions:** Act as the secure backend. They:
  - Authenticate the user.
  - Fetch detailed information from the Supabase database (buyer details, address, event/ticket prices, sub-merchant information).
  - Construct and send authenticated requests to the iyzico API.
  - Create and update local order/transaction records.
  - Return results to the React Native app.
- **iyzico Platform:** Provides the payment gateway services, including the hosted Checkout Form, payment processing, and marketplace fund management.

## 3. Key Supabase Database Tables for Payments

The following Supabase tables are crucial for the payment initialization process. The `initialize-checkout-payment` Edge Function reads from these to construct the iyzico payload and writes to `orders` and `order_items` to track the transaction.

- **`profiles`**:

  - **`id` (UUID, PK):** Unique identifier for all users (buyers and sub-merchants/publishers).
  - **`email` (VARCHAR):** User's email.
  - _(Other user-related fields)_
  - **Payment Relevance:** Identifies the buyer. The `id` of a seller profile is used as `publisher_id` in the `events` table.

- **`user_private_profiles`**:

  - **`id` (UUID, PK, FK to `profiles.id`):** Links to the main profile.
  - **`name` (TEXT):** Buyer's/User's first name.
  - **`last_name` (TEXT):** Buyer's/User's last name.
  - **`phone_number` (TEXT):** Buyer's/User's GSM number (needs to be in a format iyzico accepts, e.g., +905xxxxxxxxx).
  - **`identity_number` (TEXT):** Buyer's/User's national identity number (TCKN for Turkish users).
  - **Payment Relevance:** Provides mandatory fields for the iyzico `buyer` object. ([iyzico Checkout Form Initialize Docs](https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform/cf-implementation/cf-initialize))

- **`addresses`**:

  - **`id` (UUID, PK):** Unique address identifier.
  - **`user_id` (UUID, FK to `profiles.id`):** Links address to a user.
  - **`address` (VARCHAR):** Street address line.
  - **`city` (VARCHAR):** City.
  - **`country` (VARCHAR):** Country.
  - **`zip_code` (VARCHAR):** Postal code.
  - **Payment Relevance:** Provides mandatory fields for iyzico `billingAddress` and `shippingAddress` objects. ([iyzico Checkout Form Initialize Docs](https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform/cf-implementation/cf-initialize))

- **`events`**:

  - **`id` (UUID, PK):** Unique event identifier.
  - **`publisher_id` (UUID, FK to `profiles.id`):** Identifies the seller/organizer (sub-merchant) of this event. This ID is used to find the sub-merchant's iyzico details.
  - **`title` (TEXT):** Event title.
  - **`category_id` (UUID, FK to `categories.id`):** Links to the event's category.
  - **Payment Relevance:** Links the item being sold to its seller (`publisher_id`) and provides item details like name and category for the iyzico `basketItems`.

- **`categories`**:

  - **`id` (UUID, PK):** Category identifier.
  - **`name` (TEXT):** Category name.
  - **Payment Relevance:** Provides the `category1` field for iyzico `basketItems`.

- **`events_dates_locations`**:

  - **`id` (UUID, PK):** Unique identifier for a specific date/time and location instance of an event.
  - **`event_id` (UUID, FK to `events.id`):** Links to the parent event.
  - **`location_id` (UUID, FK to `locations.id`):** Specifies the venue.
  - **`start_time`, `end_time` (TIMESTAMPTZ):** Specific timing for this instance.
  - **`price` (NUMERIC, NOT NULL):** The sale price of a ticket for this specific event instance.
  - **`currency` (VARCHAR(3), NOT NULL):** The currency of the price (e.g., "TRY").
  - **`is_open_to_sell` (BOOLEAN, DEFAULT true):** Flag to indicate if tickets for this instance are currently on sale.
  - **Payment Relevance:** This is the core "sellable item." Its `id` is sent by the app. Its `price` and `currency` are used for iyzico `basketItems`.

- **`company_payment_profile`**:

  - **`id` (UUID, PK):** Internal ID.
  - **`sub_merchant_external_id` (UUID, FK to `profiles.id`):** This is the `profiles.id` of the seller/publisher.
  - **`sub_merchant_key` (TEXT, NOT NULL):** Crucial. This is the unique key provided by iyzico when a sub-merchant is registered. It's required for each item in `basketItems` to route funds correctly in a marketplace transaction. ([Submerchant Docs](https://docs.iyzico.com/en/products/marketplace/marketplace-implementation/submerchant), [Marketplace Implementation Overview](https://docs.iyzico.com/en/products/marketplace/marketplace-implementation))
  - _(Other fields like `name`, `email`, `iban`, `tax_office`, `legal_company_title`, `identity_number`, `sub_merchant_type` are for sub-merchant onboarding with iyzico)._
  - **Payment Relevance:** Provides the `subMerchantKey` for each `basketItem` sent to iyzico, based on the item's seller (`events.publisher_id`).

- **`orders`** (Tracks a customer's entire transaction attempt):

  - **`id` (UUID, PK):** Your internal unique order ID.
  - **`user_id` (UUID, FK to `profiles.id`):** The buyer.
  - **`status` (TEXT):** Lifecycle status (e.g., 'pending_iyzico', 'awaiting_payment_redirect', 'payment_init_failed', 'awaiting_approval', 'completed', 'payment_failed', 'internal_error_before_iyzico', 'payment_retrieval_failed', 'retrieval_internal_error').
  - **`iyzico_payment_id` (TEXT, UNIQUE):** The `paymentId` from iyzico after successful payment. ([Idempotency](https://docs.iyzico.com/en/getting-started/preliminaries/idempotency), [Retrieve Non-3DS](https://docs.iyzico.com/en/payment-methods/direct-charge/non-3ds/non-3ds-implementation/retrieve))
  - **`iyzico_conversation_id` (TEXT, NOT NULL):** The unique `conversationId` sent to iyzico with this order. ([Idempotency](https://docs.iyzico.com/en/getting-started/preliminaries/idempotency))
  - **`iyzico_checkout_token` (TEXT):** The token from iyzico CF Initialize response, used for CF Retrieve. ([CF Initialize](https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform/cf-implementation/cf-initialize), [CF Retrieve](https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform/cf-implementation/cf-retrieve))
  - **`total_order_amount` (NUMERIC, NOT NULL):** Sum of item sale prices for this order, calculated by the system.
  - **`iyzico_paid_amount` (NUMERIC):** Actual amount confirmed by iyzico (from `paidPrice` in iyzico's response). ([CF Retrieve Response](https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform/cf-implementation/cf-retrieve), [Retrieve Non-3DS](https://docs.iyzico.com/en/payment-methods/direct-charge/non-3ds/non-3ds-implementation/retrieve))
  - **`currency` (VARCHAR(3), NOT NULL):** Currency for the order.
  - **`billing_address_id` (UUID, FK to `addresses.id`).**
  - **`shipping_address_id` (UUID, FK to `addresses.id`).**
  - **`client_ip_address` (TEXT):** Buyer's IP.
  - **`iyzico_error_message`, `iyzico_error_code`, `iyzico_error_group` (TEXT):** For logging iyzico errors.
  - **`created_at`, `updated_at` (TIMESTAMPTZ).**
  - **Payment Relevance:** Central record for tracking the entire payment lifecycle from initiation to completion/failure.

- **`order_items`** (Tracks each line item within an order):
  - **`id` (UUID, PK):** Internal unique ID for this line item.
  - **`order_id` (UUID, FK to `orders.id`):** Links to the parent order.
  - **`item_identifier_id` (UUID, FK to `events_dates_locations.id`):** The specific event instance sold.
  - **`item_name_snapshot` (TEXT):** Event title at time of purchase.
  - **`item_category_snapshot` (TEXT):** Event category at time of purchase.
  - **`quantity` (INTEGER, NOT NULL):** Number of units for this line item (always 1 in the current Edge Function logic, as it expands quantities into separate iyzico basket items).
  - **`item_unit_sale_price` (NUMERIC, NOT NULL):** Sale price of one unit of this item.
  - **`item_total_sale_price` (NUMERIC, NOT NULL):** `item_unit_sale_price` \* `quantity`.
  - **`sub_merchant_id` (UUID, FK to `profiles.id`):** The seller of this item.
  - **`sub_merchant_payout_amount` (NUMERIC, NOT NULL):** Amount due to sub-merchant for this item (currently same as `item_total_sale_price`).
  - **`iyzico_basket_item_id` (TEXT):** The unique ID sent for this item in iyzico's `basketItems` array.
  - **`iyzico_payment_transaction_id` (TEXT, UNIQUE):** From iyzico's response, identifies this specific item's transaction. Needed for item-level approval. ([Approval](https://docs.iyzico.com/en/products/marketplace/marketplace-implementation/approval), [Submerchant Item Update](https://docs.iyzico.com/en/products/marketplace/marketplace-implementation/submerchant/alt-uye-sorgulama-1))
  - **`approval_status` (TEXT, DEFAULT 'pending_approval'):** Marketplace approval status for this item.
  - **`created_at`, `updated_at` (TIMESTAMPTZ).**
  - **Payment Relevance:** Details each item sold, links to its seller, and tracks its specific payout and approval status within the marketplace model.

## 4. iyzico Integration - Core Concepts (Project Specific Summary)

This project uses iyzico's [Marketplace Solution](https://docs.iyzico.com/en/products/marketplace) with the [Checkout Form (CF)](https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform). iyzico's official documentation can be found at [docs.iyzico.com](https://docs.iyzico.com/en/), with developer resources and SDKs often available on [GitHub](https://iyzico.github.io/).

### Marketplace Model

- Event organizers are **Sub-merchants**. They must be registered with iyzico via the Onboarding API (e.g., using the `/create-organizer-payment-profile` Edge Function). ([Submerchant Docs](https://docs.iyzico.com/en/products/marketplace/marketplace-implementation/submerchant))
- Each sub-merchant has a unique `subMerchantKey` provided by iyzico upon their registration. This key is stored in the `company_payment_profile.sub_merchant_key` column.
- For each item in the payment `basketItems`, the `subMerchantKey` of the seller and the `subMerchantPrice` must be provided. ([Marketplace Implementation](https://docs.iyzico.com/en/products/marketplace/marketplace-implementation))
- Currently, no commission is taken by the marketplace, so `subMerchantPrice` = `item.price`.

### Authentication (HMAC-SHA256)

- All server-to-server API calls to iyzico must be authenticated.
- **Method:** `IYZWSv2` Authorization header. ([HMACSHA256 Auth](https://docs.iyzico.com/en/getting-started/preliminaries/authentication/hmacsha256-auth))
- **Construction** (as implemented in `generateIyzicoAuthHeader` function in Edge Functions):
  - A unique `randomKey` is generated (referred to as `x-iyzi-rnd` in iyzico docs, can be randomly generated by the merchant).
  - The `urlPath` (URI path of the request, e.g., `/payment/bin/check`) is extracted from the target iyzico API URL.
  - The `dataToHash` is a concatenation: `randomKey` + `urlPath` + `requestBodyString`.
  - This `dataToHash` is signed using HMAC-SHA256 with the `IYZICO_SECRET_KEY`. The signature is hex-encoded.
  - The `pkiString` is formed: `apiKey:{IYZICO_API_KEY}&randomKey:{randomKey}&signature:{signatureHex}`.
  - The `pkiString` is Base64 encoded.
  - The final header is: `Authorization: IYZWSv2 {base64EncodedPkiString}` (with a single space between `IYZWSv2` and the base64 string).
- The `randomKey` is also sent in the `x-iyzi-rnd` header. ([HMACSHA256 Auth](https://docs.iyzico.com/en/getting-started/preliminaries/authentication/hmacsha256-auth))

### Checkout Form (CF) - Initialize & Retrieve Flow

- **Initialize Endpoint:** `POST {IYZICO_BASE_URL}/payment/iyzipos/checkoutform/initialize/auth/ecom` ([CF Initialize](https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform/cf-implementation/cf-initialize))
  - **Purpose:** To initiate a payment and receive a `paymentPageUrl` and an iyzico `token`.
  - **Key Request Parameters:** `locale`, `conversationId`, `price`, `paidPrice`, `currency`, `basketId`, `paymentGroup: "PRODUCT"`, `callbackUrl`, `buyer` object, `billingAddress`, `shippingAddress`, `basketItems` array (each with `id`, `price`, `name`, `category1`, `itemType: "VIRTUAL"`, `subMerchantKey`, `subMerchantPrice`). ([CF Initialize](https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform/cf-implementation/cf-initialize))
- **Retrieve Endpoint:** `POST {IYZICO_BASE_URL}/payment/iyzipos/checkoutform/auth/ecom/detail` ([CF Retrieve](https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform/cf-implementation/cf-retrieve))
  - **Purpose:** To get the final payment status using the `token` from the initialize step.
  - **Key Request Parameters:** `locale`, `conversationId`, `token`. ([CF Retrieve](https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform/cf-implementation/cf-retrieve))

### Webhooks

- **Endpoint:** A publicly accessible URL for the `/handle-iyzico-webhook` Edge Function. Webhooks are configured in the iyzico Merchant Portal. ([Webhook Docs](https://docs.iyzico.com/en/advanced/webhook))
- **Purpose:** Asynchronous updates from iyzico on payment status.
- **Security:** Signature verification using `X-IYZ-SIGNATURE-V3` header. For the HPP (Hosted Payment Page) format, the string to hash is `secretKey` + `iyziEventType` + `iyziPaymentId` + `token` + `paymentConversationId` + `status`, signed with `IYZICO_SECRET_KEY` and then HEX encoded. ([Webhook Docs](https://docs.iyzico.com/en/advanced/webhook) - Note: The original documentation missed `secretKey` at the beginning of the string to hash).
- **Key Payload Fields (HPP Format):** `paymentConversationId`, `token`, `status`, `iyziEventType`, `iyziPaymentId`, `merchantId`, `iyziReferenceCode`, `iyziEventTime`. ([Webhook Docs](https://docs.iyzico.com/en/advanced/webhook))

### Idempotency

- `conversationId` (merchant-generated, often for order numbers or basket IDs) and iyzico-generated `token` & `paymentId` are used for tracking, reconciliation, and ensuring operations are not unintentionally duplicated. ([Idempotency](https://docs.iyzico.com/en/getting-started/preliminaries/idempotency))

## 5. Supabase Edge Function: `initialize-checkout-payment`

- **File Location:** `supabase/functions/initialize-checkout-payment/index.ts`
- **Purpose:** This function serves as the primary backend endpoint for initiating a payment. It securely gathers all necessary data, communicates with iyzico, and prepares the local database for the transaction.
- **Trigger:** HTTP POST request from the React Native application.
- **Authentication:** The function expects a Supabase JWT in the `Authorization: Bearer {token}` header to identify and authenticate the buyer.
- **Environment Variables Required by Function:**
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (for privileged database access)
  - `SUPABASE_ANON_KEY` (for user authentication client)
  - `IYZICO_API_KEY`
  - `IYZICO_SECRET_KEY`
  - `IYZICO_BASE_URL` (e.g., `https://sandbox-api.iyzipay.com` for [sandbox](https://www.postman.com/iyzicointegration/iyzico-integration-s-public-workspace/documentation/tsv4wqe/iyzico-api))
- **Inputs** (from React Native app - `IAppToBackendPaymentInitRequest`):

  ```typescript
  interface IAppBasketItemIdentifier {
    itemId: string // Corresponds to events_dates_locations.id
    quantity: number
  }

  interface IAppToBackendPaymentInitRequest {
    basketItemsIdentifiers: IAppBasketItemIdentifier[] // Corrected to be an array
    selectedBillingAddressId: string
    selectedShippingAddressId?: string // Optional, defaults to billing if not provided
    callbackUrl: string // App's deep link for iyzico redirection
    clientIpAddress: string // Buyer's IP address
    currency?: string // Optional: preferred currency for the transaction (e.g., "TRY")
  }
  ```

- **Key Internal Steps** (summarized from the provided Edge Function code):
  1. **Handle OPTIONS Request:** Standard CORS preflight handling.
  2. **Initialize Supabase Clients:**
     - `supabaseClient`: Initialized with `SUPABASE_ANON_KEY` and the incoming user `Authorization` header. Used for `auth.getUser()`.
     - `adminSupabaseClient`: Initialized with `SUPABASE_SERVICE_ROLE_KEY`. Used for all subsequent database reads and writes to bypass RLS and ensure system integrity.
  3. **Retrieve Environment Variables:** Load iyzico API credentials and base URL. Error if missing.
  4. **Authenticate User (Buyer):**
     - Extract token from `Authorization` header.
     - Call `supabaseClient.auth.getUser(token)` to validate the user and get `buyerUserId`.
  5. **Fetch Buyer & Address Details** (using `adminSupabaseClient`):
     - Fetch `buyerPrivateProfile` from `user_private_profiles` using `buyerUserId`.
     - Fetch `billingAddressData` from `addresses` using `selectedBillingAddressId` and `buyerUserId`.
     - Fetch `shippingAddressData` if `selectedShippingAddressId` is provided and different; otherwise, it defaults to `billingAddressData`.
  6. **Process Basket & Calculate Totals:**
     - Generate a unique `iyzicoConversationId` and an `internalOrderId` (UUID for the `orders` table).
     - Initialize `calculatedTotalPrice = 0`.
     - Determine `finalOrderCurrency` (prioritizing `appCurrency` from request, then first item's currency, then default "TRY").
     - Loop through `basketItemsIdentifiers` received from the app:
       - For each `appItem` (`itemId` = `events_dates_locations.id`, `quantity`):
         - Fetch `eventInstance` data from `events_dates_locations` (including `price`, `currency`) and joined `events` (for `title`, `publisher_id`, `category_id`) and `categories` (for `name`) using `adminSupabaseClient`. Validate `is_open_to_sell` and that `price > 0`.
         - Fetch `companyProfile` from `company_payment_profile` using `eventInstance.events.publisher_id` to get the `sub_merchant_key`.
         - For each unit of `quantity`:
           - Generate a `uniqueLineItemId` (UUID) for iyzico's `basketItem.id`.
           - Add to `iyzicoBasketItems` array: `{ id: uniqueLineItemId, price: unitPrice.toFixed(2), name, category1, itemType: "VIRTUAL", subMerchantKey, subMerchantPrice: unitPrice.toFixed(2) }`.
           - Add `unitPrice` to `calculatedTotalPrice`.
           - Prepare an entry for `internalOrderItemsForDB` array (for the `order_items` table), including `item_name_snapshot`, `item_category_snapshot`, `iyzico_basket_item_id: uniqueLineItemId`, and other relevant details. Each entry represents quantity 1.
  7. **Create Local Order Records** (using `adminSupabaseClient`):
     - Insert a new record into the `orders` table:
       - `id: internalOrderId`
       - `user_id: buyerUserId`
       - `status: "pending_iyzico"`
       - `iyzico_conversation_id`
       - `total_order_amount: calculatedTotalPrice`
       - `currency: finalOrderCurrency`
       - `billing_address_id`, `shipping_address_id`
       - `client_ip_address`
     - If order insertion fails, throw an error.
     - Map `internalOrderItemsForDB` to link each item to the `newOrder.id`.
     - Insert records into the `order_items` table.
     - If order items insertion fails, attempt to mark the parent order as failed/errored (or delete it, though marking is safer for audit) and throw an error.
  8. **Construct iyzico API Payload** (`IIyzicoCFInitializeRequestPayload`):
     - Populate all required fields using the fetched and processed data (e.g., `locale`, `conversationId`, `price`, `paidPrice`, `currency`, `basketId` (using `newOrder.id`), `paymentGroup: "PRODUCT"`, `callbackUrl`, `buyer` object, `billingAddress` object, `shippingAddress` object, and the `iyzicoBasketItems` array). Refer to [iyzico CF Initialize docs](https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform/cf-implementation/cf-initialize) for exact field requirements.
  9. **Call iyzico API:**
     - Stringify the `iyzicoPayload`.
     - Generate the `Authorization` header and `randomKey` using `generateIyzicoAuthHeader(IYZICO_API_KEY, IYZICO_SECRET_KEY, requestBodyString, apiUrl)`.
     - Make a `POST` request to `"{IYZICO_BASE_URL}/payment/iyzipos/checkoutform/initialize/auth/ecom"` with appropriate headers and the stringified body.
  10. **Handle iyzico's Response:**
      - Parse the JSON response from iyzico.
      - If `iyzicoResult.status === "success"`:
        - Update the corresponding `orders` record in the database: set `iyzico_checkout_token = iyzicoResult.token` and `status = "awaiting_payment_redirect"`.
        - Return a `200 OK` response to the app with `{ paymentPageUrl: iyzicoResult.paymentPageUrl, token: iyzicoResult.token }`.
      - If `iyzicoResult.status === "failure"`:
        - Update the `orders` record: set `status = "payment_init_failed"` and store `iyzico_error_message`, `iyzico_error_code`, `iyzico_error_group`.
        - Throw an error, which will be caught by the main try/catch.
  11. **Global Error Handling** (Main try/catch block):
      - Log the error.
      - If an `internalOrderId` was generated and the corresponding order record is still in `'pending_iyzico'` state (meaning the error likely occurred before a definitive iyzico response or during DB operations prior to iyzico call), update the order status to `'internal_error_before_iyzico'` or a similar error state.
      - Return a `500 Internal Server Error` response to the app with the error message.
- **Outputs** (to React Native app):

  - **On Success:**

    ```json
    {
      "paymentPageUrl": "https://iyzico_payment_page_url...",
      "token": "iyzico_checkout_form_token..."
    }
    ```

  - **On Error:**

    ```json
    {
      "error": "Error message describing what went wrong."
    }
    ```

## 6. Supabase Edge Function: `retrieve-checkout-payment`

- **File Location:** `supabase/functions/retrieve-checkout-payment/index.ts`
- **Purpose:** This function is called by the client application after the user is redirected back from iyzico's payment page (via the `callbackUrl`). Its primary role is to retrieve the final status and detailed outcome of the payment attempt from iyzico using the token obtained during the initialization phase. It then updates the local `orders` and `order_items` tables with this definitive information and returns the result to the client.
- **Trigger:** HTTP POST request from the React Native application, typically after the app handles the deep link callback from iyzico.
- **Authentication:** The function expects a Supabase JWT in the `Authorization: Bearer {token}` header to identify the user who initiated the original payment, ensuring that retrieval requests are authorized.
- **Environment Variables Required by Function:**
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `IYZICO_API_KEY`
  - `IYZICO_SECRET_KEY`
  - `IYZICO_BASE_URL`
- **Inputs** (from React Native app - `IAppRetrievePaymentRequest`):

  ```typescript
  interface IAppRetrievePaymentRequest {
    iyzicoToken: string // The token received from iyzico during the CF Initialize step
    internalOrderId: string // Your internal order ID (which was sent as basketId to iyzico).
    iyzicoConversationId: string // The conversationId used during the CF Initialize step.
  }
  ```

- **Key Internal Steps:**
  1. **Handle OPTIONS Request:** Standard CORS preflight.
  2. **Initialize `adminSupabaseClient`:** Uses `SUPABASE_SERVICE_ROLE_KEY` for privileged database access.
  3. **Retrieve Environment Variables:** Load iyzico API credentials.
  4. **Validate Input:** Ensure `iyzicoToken`, `internalOrderId`, and `iyzicoConversationId` are provided by the client.
  5. **Construct iyzico CF Retrieve Payload:**
     - `locale`: e.g., "tr".
     - `conversationId`: The `iyzicoConversationId` received from the client.
     - `token`: The `iyzicoToken` received from the client. ([CF Retrieve Docs](https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform/cf-implementation/cf-retrieve))
  6. **Generate iyzico Authorization Header:**
     - Uses the `generateIyzicoAuthHeader` helper function.
     - The PKI string for hashing is `randomKey` + `urlPath` + `requestBodyString`.
  7. **Call iyzico CF Retrieve API:**
     - Endpoint: `POST {IYZICO_BASE_URL}/payment/iyzipos/checkoutform/auth/ecom/detail` ([CF Retrieve Docs](https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform/cf-implementation/cf-retrieve)).
     - Sends the constructed payload and authentication headers.
  8. **Process iyzico's Response:**
     - Parse the JSON response from iyzico.
     - If `iyzicoResult.status === "success"` (indicating the API call was successful, then check `paymentStatus` inside):
       - The `iyzicoResult` will be of type `IIyzicoCFRetrieveSuccessResponse` containing fields like `paymentId`, `paidPrice`, `paymentStatus`, `itemTransactions`, etc. ([CF Retrieve Docs](https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform/cf-implementation/cf-retrieve), [Retrieve Non-3DS](https://docs.iyzico.com/en/payment-methods/direct-charge/non-3ds/non-3ds-implementation/retrieve)).
       - Determine `finalOrderStatus` based on `iyzicoResult.paymentStatus`:
         - If "SUCCESS", set to `'awaiting_approval'` (or `'completed'`).
         - Otherwise, set to `'payment_failed'`.
       - Update `orders` table (using `adminSupabaseClient` and `internalOrderId`):
         - Set `status = finalOrderStatus`.
         - Store `iyzico_payment_id = iyzicoResult.paymentId`.
         - Store `iyzico_paid_amount = iyzicoResult.paidPrice`.
         - If payment failed, store `iyzico_error_message`, `iyzico_error_code`, `iyzico_error_group`.
       - Update `order_items` table (using `adminSupabaseClient`):
         - If `iyzicoResult.itemTransactions` is present and not empty:
           - Loop through each `itemTx` in `iyzicoResult.itemTransactions`.
           - Update the corresponding `order_items` record (matched by `order_id = internalOrderId` AND `iyzico_basket_item_id = itemTx.itemId`).
           - Store `iyzico_payment_transaction_id = itemTx.paymentTransactionId`. ([Approval Docs](https://docs.iyzico.com/en/products/marketplace/marketplace-implementation/approval))
       - Return the full `iyzicoResult` to the client app.
     - If `iyzicoResult.status === "failure"` (indicating the API call to iyzico itself failed):
       - Update the `orders` record: set `status = "payment_retrieval_failed"` and store iyzico error details.
       - Throw an error, which is caught by the main try/catch.
  9. **Global Error Handling:**
     - Catches errors.
     - If an `internalOrderId` was part of the request, attempt to update the `orders` record status to `'retrieval_internal_error'`.
     - Return a `500 Internal Server Error` response to the app with the error message.
- **Outputs** (to React Native app):

  - **On Success** (API call to iyzico successful, `paymentStatus` inside indicates actual payment outcome):

    ```typescript
    // IIyzicoCFRetrieveSuccessResponse structure
    {
      status: "success", // API call status
      locale: "tr",
      systemTime: 1686439210683, // Example
      conversationId: "your_conv_id",
      token: "the_iyzico_checkout_token",
      paymentId: "12345678", // If payment proceeded this far
      paidPrice: 50.00,
      currency: "TRY",
      paymentStatus: "SUCCESS", // or "FAILURE", etc.
      basketId: "your_internal_order_id",
      itemTransactions: [ /* ... */ ],
      //... other fields from iyzico
    }
    ```

  - **On iyzico API Call Failure** (e.g., bad request to iyzico retrieve endpoint):

    ```typescript
    // IIyzicoErrorResponse structure
    {
      status: "failure",
      errorCode: "1001",
      errorMessage: "Error description from iyzico.",
      //... other error fields
    }
    ```

  - **On Internal Server Error in Edge Function:**

    ```json
    {
      "error": "Error message describing what went wrong in the function."
    }
    ```

- **Idempotency & Tracking:**
  - The `iyzicoToken` and `conversationId` are used to retrieve a specific payment session.
  - The `internalOrderId` (sent as `basketId` to iyzico) and the `iyzico_payment_id` are key for tracking.
  - The `iyzico_payment_transaction_id` on each `order_items` record is critical for item approval. ([Approval Docs](https://docs.iyzico.com/en/products/marketplace/marketplace-implementation/approval))

## 7. Supabase Edge Function: `handle-iyzico-webhook`

- **File Location:** `supabase/functions/handle-iyzico-webhook/index.ts`
- **Purpose:** To receive and process asynchronous notifications (webhooks) from iyzico regarding payment status changes. Crucial for data reconciliation.
- **Trigger:** HTTP POST request from iyzico to this function's public URL (configured in iyzico Merchant Portal). ([Webhook Docs](https://docs.iyzico.com/en/advanced/webhook))
- **Authentication/Security:** Verifies the `X-IYZ-SIGNATURE-V3` header. ([Webhook Docs](https://docs.iyzico.com/en/advanced/webhook))
- **Environment Variables Required:**
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `IYZICO_SECRET_KEY` (Essential for signature verification)
- **Inputs** (from iyzico Webhook POST request):

  - **Headers:** `X-IYZ-SIGNATURE-V3`
  - **Body** (JSON - `IIyzicoWebhookPayloadHPP` for Checkout Form):

    ```typescript
    interface IIyzicoWebhookPayloadHPP {
      merchantId: string
      paymentConversationId: string // Your conversationId
      token: string // The iyzico checkout token
      status: "SUCCESS" | "FAILURE" | string // Key payment status
      iyziEventType: "CHECKOUT_FORM_AUTH" | string // e.g., for CF completion
      iyziReferenceCode: string // Unique iyzico ref for the notification
      iyziEventTime: number // Unix timestamp
      iyziPaymentId: string | null // iyzico's paymentId
      errorCode?: string | null
      errorMessage?: string | null
    }
    ```

    ([Webhook Docs](https://docs.iyzico.com/en/advanced/webhook))

- **Key Internal Steps:**
  1. **Handle OPTIONS Request:** For CORS.
  2. **Validate HTTP Method:** Ensure POST.
  3. **Parse Request Body:** Get raw text and parse as JSON.
  4. **Retrieve `IYZICO_SECRET_KEY`.**
  5. **Verify Signature (`X-IYZ-SIGNATURE-V3`):**
     - Construct `dataToSignForV3`: `IYZICO_SECRET_KEY` + `payload.iyziEventType` + (`payload.iyziPaymentId` || "") + `payload.token` + `payload.paymentConversationId` + `payload.status`.
     - Compute HMAC-SHA256 hash.
     - Compare with received header. If mismatch, return HTTP 403.
  6. **Identify Order:** Use `payload.paymentConversationId` (and/or `payload.token`) to find the order. If not found, log and return HTTP 200.
  7. **Process Payload & Update Database (Idempotently):**
     - Determine `newOrderStatus` based on `payload.status` and `payload.iyziEventType`.
     - If `payload.iyziEventType` is `CHECKOUT_FORM_AUTH` and `payload.status` is "SUCCESS": `newOrderStatus = 'awaiting_approval'`. Store `iyzico_payment_id`.
     - If `payload.status` is "FAILURE": `newOrderStatus = 'payment_failed'`. Store error details.
     - If `newOrderStatus` is different from current `order.status`, update the `orders` record.
  8. **Acknowledge Webhook:** Return HTTP 200 OK. ([Webhook Docs](https://docs.iyzico.com/en/advanced/webhook))
  9. **Global Error Handling:** Catch errors, log, return HTTP 500.
- **Outputs** (to iyzico):
  - **On Successful Processing/Validation:** HTTP 200 OK `{"message": "Webhook received and processed."}`.
  - **On Signature Mismatch:** HTTP 403 Forbidden.
  - **On Internal Server Error:** HTTP 500.

## 8. Overall Payment Workflow Summary

1. **App (User Action):** User finalizes ticket selection and proceeds to payment.
2. **App (Data Collection & Request Preparation):**
   - Gathers `basketItemsIdentifiers`, address IDs, `callbackUrl`, IP, currency.
   - Constructs `IAppToBackendPaymentInitRequest`.
3. **App -> Edge Function (`initialize-checkout-payment`):**
   - Sends POST with JWT and payload.
4. **Edge Function (`initialize-checkout-payment` - Backend Logic):**
   - Authenticates User.
   - Aggregates data from DB.
   - Creates `orders` (status: `'pending_iyzico'`) and `order_items`.
   - Calls iyzico's CF Initialize endpoint.
     - **Success:** Updates `orders` (status: `'awaiting_payment_redirect'`, stores `iyzico_checkout_token`). Returns `paymentPageUrl` and `iyzicoToken` to app.
     - **Failure:** Updates `orders` (status: `'payment_init_failed'`). Returns error to app.
5. **App (Redirection to iyzico):**
   - If successful, app uses `WebBrowser.openBrowserAsync(paymentPageUrl)`.
6. **User Completes Payment (on iyzico's Page):**
   - User interacts with iyzico's Checkout Form.
7. **iyzico -> App (Callback via Deep Link):**
   - iyzico redirects to app's `callbackUrl`.
8. **App (Handles Callback & Prepares for Retrieval):**
   - App detects deep link, closes WebBrowser.
   - Retrieves stored `iyzicoToken`, `internalOrderId`, `iyzicoConversationId`.
9. **App -> Edge Function (`retrieve-checkout-payment`):**
   - Sends POST with `iyzicoToken`, `internalOrderId`, `iyzicoConversationId`.
10. **Edge Function (`retrieve-checkout-payment` - Backend Logic):**
    - Calls iyzico's CF Retrieve endpoint.
      - **Success (iyzico API call):** Parses response. Updates `orders` (status, `iyzico_payment_id`, `iyzico_paid_amount`) and `order_items` (`iyzico_payment_transaction_id`).
      - **Failure (iyzico API call):** Updates `orders` status to `'payment_retrieval_failed'`.
    - Returns detailed result/error to app.
11. **App (Displays Final Result):**
    - Updates UI based on response from `/retrieve-checkout-payment`.
12. **(Asynchronous) iyzico -> Edge Function (`handle-iyzico-webhook`):**
    - iyzico sends POST to `/handle-iyzico-webhook`.
13. **Edge Function Verifies Signature:** If invalid, returns 403.
14. **Edge Function Processes Payload:** Identifies order, updates `orders.status` (and other fields). This is a reconciliation step.
15. **Returns HTTP 200 OK to iyzico.**
16. **(Marketplace Specific - Future Step):**
    - If payment successful (e.g., `orders.status` is `'awaiting_approval'`), an admin triggers calls to `/approve-payment-item` for each `order_items.iyzico_payment_transaction_id`. ([Approval Docs](https://docs.iyzico.com/en/products/marketplace/marketplace-implementation/approval))

## 9. Security Considerations

- **API Keys:** `IYZICO_API_KEY` and `IYZICO_SECRET_KEY` are stored as environment variables in Supabase, accessible only within Edge Functions.
- **Service Role Key:** `SUPABASE_SERVICE_ROLE_KEY` is used for `adminSupabaseClient`, allowing privileged DB operations server-side.
- **User Authentication:** Edge Functions require a valid Supabase JWT.
- **HMAC-SHA256:** Communication with iyzico API is secured using HMAC-SHA256 signatures. ([HMACSHA256 Auth](https://docs.iyzico.com/en/getting-started/preliminaries/authentication/hmacsha256-auth))
- **Webhook Signature Validation:** Incoming webhooks are validated using `X-IYZ-SIGNATURE-V3` and `IYZICO_SECRET_KEY`. ([Webhook Docs](https://docs.iyzico.com/en/advanced/webhook))
- **Response Signature Validation:** Consider implementing response signature validation for critical API responses from iyzico. ([Response Signature Validation](https://docs.iyzico.com/en/advanced/response-signature-validation))
- **Data Validation:** Inputs from the client app should be validated.
- **Least Privilege:** Client app sends minimal identifiers; Edge Function fetches details server-side.

## Alıntılanan çalışmalar

1. [iyzico: Welcome](https://docs.iyzico.com/en/)
2. [Marketplace - iyzico](https://docs.iyzico.com/en/products/marketplace)
3. [Marketplace Implementation - iyzico](https://docs.iyzico.com/en/products/marketplace/marketplace-implementation)
4. [Checkout Form (CF) - iyzico](https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform)
5. [Submerchant | iyzico](https://docs.iyzico.com/en/products/marketplace/marketplace-implementation/submerchant)
6. [Idempotency | iyzico](https://docs.iyzico.com/en/getting-started/preliminaries/idempotency)
7. [Retrieve | iyzico (Non-3DS)](https://docs.iyzico.com/en/payment-methods/direct-charge/non-3ds/non-3ds-implementation/retrieve)
8. [Approval - iyzico](https://docs.iyzico.com/en/products/marketplace/marketplace-implementation/approval)
9. [Submerchant Price / Item Update | iyzico](https://docs.iyzico.com/en/products/marketplace/marketplace-implementation/submerchant/alt-uye-sorgulama-1) (Note: The original document linked this as "Submerchant Query" in Turkish, this seems to be the English equivalent for item-level operations)
10. [iyzico API | Documentation | Postman API Network](https://www.postman.com/iyzicointegration/iyzico-integration-s-public-workspace/documentation/tsv4wqe/iyzico-api)
11. [iyzico.github.io](https://iyzico.github.io/)
12. [HMACSHA256 Auth - iyzico](https://docs.iyzico.com/en/getting-started/preliminaries/authentication/hmacsha256-auth)
13. [Webhook | iyzico](https://docs.iyzico.com/en/advanced/webhook)
14. [Response Signature Validation - iyzico](https://docs.iyzico.com/en/advanced/response-signature-validation)
15. [Checkout Form Implementation - Initialize | iyzico](https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform/cf-implementation/cf-initialize) (Inferred from context, as used multiple times)
16. [Checkout Form Implementation - Retrieve | iyzico](https://docs.iyzico.com/en/payment-methods/direct-charge/checkoutform/cf-implementation/cf-retrieve) (Inferred from context, as used multiple times)
