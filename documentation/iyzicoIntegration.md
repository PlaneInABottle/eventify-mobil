# Project Documentation: iyzico Marketplace Payment Integration

**Last Updated:** May 18, 2025
**Project Version:** 1.0

## 1. Overview

- **Application Type:** Event ticket sales marketplace.
- **Frontend:** React Native (Expo application).
- **Backend:** Supabase, utilizing Edge Functions for server-side logic.
- **Payment Gateway:** iyzico.
- **iyzico Product in Use:** Marketplace Solution [Source: Marketplace _ iyzico.pdf, Marketplace Implementation _ iyzico.pdf] leveraging the Checkout Form (CF) payment method [Source: Checkout Form (CF) _ iyzico.pdf, CF Implementation _ iyzico.pdf].
  - This means iyzico hosts the final payment page, and users are redirected there to enter card details.
- **Core Goal:** To enable users (buyers) to purchase event tickets sold by various organizers (sub-merchants) on the platform. Payments are processed securely via iyzico, and the system is designed to eventually route payouts to the respective sub-merchants.

## 2. System Architecture Summary

The payment flow involves three main components:

1.  **React Native App:** Collects minimal payment initiation details from the user and calls a Supabase Edge Function. It later handles redirection to iyzico's payment page and receives a callback.
2.  **Supabase Edge Functions:** Act as the secure backend. They:
    - Authenticate the user.
    - Fetch detailed information from the Supabase database (buyer details, address, event/ticket prices, sub-merchant information).
    - Construct and send authenticated requests to the iyzico API.
    - Create and update local order/transaction records.
    - Return results to the React Native app.
3.  **iyzico Platform:** Provides the payment gateway services, including the hosted Checkout Form, payment processing, and marketplace fund management.

## 3. Key Supabase Database Tables for Payments

The following Supabase tables are crucial for the payment initialization process. The `initialize-checkout-payment` Edge Function reads from these to construct the iyzico payload and writes to `orders` and `order_items` to track the transaction.

- **`profiles`**

  - `id` (UUID, PK): Unique identifier for all users (buyers and sub-merchants/publishers).
  - `email` (VARCHAR): User's email.
  - _(Other user-related fields)_
  - **Payment Relevance:** Identifies the buyer. The `id` of a seller profile is used as `publisher_id` in the `events` table.

- **`user_private_profiles`**

  - `id` (UUID, PK, FK to `profiles.id`): Links to the main profile.
  - `name` (TEXT): Buyer's/User's first name.
  - `last_name` (TEXT): Buyer's/User's last name.
  - `phone_number` (TEXT): Buyer's/User's GSM number (needs to be in a format iyzico accepts, e.g., +905xxxxxxxxx).
  - `identity_number` (TEXT): Buyer's/User's national identity number (TCKN for Turkish users).
  - **Payment Relevance:** Provides mandatory fields for the iyzico `buyer` object. [Source: CF-Initialize _ iyzico.pdf, Page 2-4]

- **`addresses`**

  - `id` (UUID, PK): Unique address identifier.
  - `user_id` (UUID, FK to `profiles.id`): Links address to a user.
  - `address` (VARCHAR): Street address line.
  - `city` (VARCHAR): City.
  - `country` (VARCHAR): Country.
  - `zip_code` (VARCHAR): Postal code.
  - **Payment Relevance:** Provides mandatory fields for iyzico `billingAddress` and `shippingAddress` objects. [Source: CF-Initialize _ iyzico.pdf, Page 2-4]

- **`events`**

  - `id` (UUID, PK): Unique event identifier.
  - `publisher_id` (UUID, FK to `profiles.id`): Identifies the seller/organizer (sub-merchant) of this event. This ID is used to find the sub-merchant's iyzico details.
  - `title` (TEXT): Event title.
  - `category_id` (UUID, FK to `categories.id`): Links to the event's category.
  - **Payment Relevance:** Links the item being sold to its seller (`publisher_id`) and provides item details like name and category for the iyzico `basketItems`.

- **`categories`**

  - `id` (UUID, PK): Category identifier.
  - `name` (TEXT): Category name.
  - **Payment Relevance:** Provides the `category1` field for iyzico `basketItems`.

- **`events_dates_locations`**

  - `id` (UUID, PK): Unique identifier for a specific date/time and location instance of an event.
  - `event_id` (UUID, FK to `events.id`): Links to the parent event.
  - `location_id` (UUID, FK to `locations.id`): Specifies the venue.
  - `start_time`, `end_time` (TIMESTAMPTZ): Specific timing for this instance.
  - `price` (NUMERIC, NOT NULL): The sale price of a ticket for this specific event instance.
  - `currency` (VARCHAR(3), NOT NULL): The currency of the `price` (e.g., "TRY").
  - `is_open_to_sell` (BOOLEAN, DEFAULT `true`): Flag to indicate if tickets for this instance are currently on sale.
  - **Payment Relevance:** This is the core "sellable item." Its `id` is sent by the app. Its `price` and `currency` are used for iyzico `basketItems`.

- **`company_payment_profile`**

  - `id` (UUID, PK): Internal ID.
  - `sub_merchant_external_id` (UUID, FK to `profiles.id`): This is the `profiles.id` of the seller/publisher.
  - `sub_merchant_key` (TEXT, NOT NULL): **Crucial.** This is the unique key provided by iyzico when a sub-merchant is registered. It's required for each item in `basketItems` to route funds correctly in a marketplace transaction. [Source: Online Payment _ iyzico.pdf, Page 2; Submerchant _ iyzico.pdf, Page 2]
  - _(Other fields like `name`, `email`, `iban`, `tax_office`, `legal_company_title`, `identity_number`, `sub_merchant_type` are for sub-merchant onboarding with iyzico)._
  - **Payment Relevance:** Provides the `subMerchantKey` for each `basketItem` sent to iyzico, based on the item's seller (`events.publisher_id`).

- **`orders`** (Tracks a customer's entire transaction attempt)

  - `id` (UUID, PK): Your internal unique order ID.
  - `user_id` (UUID, FK to `profiles.id`): The buyer.
  - `status` (TEXT): Lifecycle status (e.g., 'pending_iyzico', 'awaiting_payment_redirect', 'payment_init_failed', 'awaiting_approval', 'completed', 'payment_failed', 'internal_error_before_iyzico').
  - `iyzico_payment_id` (TEXT, UNIQUE): The `paymentId` from iyzico after successful payment. [Source: Idempotency _ iyzico.pdf, Page 2; Retrieve _ iyzico.pdf, Page 3]
  - `iyzico_conversation_id` (TEXT, NOT NULL): The unique `conversationId` sent to iyzico with this order. [Source: Idempotency _ iyzico.pdf, Page 1]
  - `iyzico_checkout_token` (TEXT): The `token` from iyzico CF Initialize response, used for CF Retrieve. [Source: CF-Initialize _ iyzico.pdf, Page 6; CF-Retrieve _ iyzico.pdf, Page 1]
  - `total_order_amount` (NUMERIC, NOT NULL): Sum of item sale prices for this order, calculated by the system.
  - `iyzico_paid_amount` (NUMERIC): Actual amount confirmed by iyzico (from `paidPrice` in iyzico's response). [Source: CF-Retrieve _ iyzico.pdf, Page 3]
  - `currency` (VARCHAR(3), NOT NULL): Currency for the order.
  - `billing_address_id` (UUID, FK to `addresses.id`).
  - `shipping_address_id` (UUID, FK to `addresses.id`).
  - `client_ip_address` (TEXT): Buyer's IP.
  - `iyzico_error_message`, `iyzico_error_code`, `iyzico_error_group` (TEXT): For logging iyzico errors.
  - `created_at`, `updated_at` (TIMESTAMPTZ).
  - **Payment Relevance:** Central record for tracking the entire payment lifecycle from initiation to completion/failure.

- **`order_items`** (Tracks each line item within an order)
  - `id` (UUID, PK): Internal unique ID for this line item.
  - `order_id` (UUID, FK to `orders.id`): Links to the parent order.
  - `item_identifier_id` (UUID, FK to `events_dates_locations.id`): The specific event instance sold.
  - `item_name_snapshot` (TEXT): Event title at time of purchase.
  - `item_category_snapshot` (TEXT): Event category at time of purchase.
  - `quantity` (INTEGER, NOT NULL): Number of units for this line item (always 1 in the current Edge Function logic, as it expands quantities into separate iyzico basket items).
  - `item_unit_sale_price` (NUMERIC, NOT NULL): Sale price of one unit of this item.
  - `item_total_sale_price` (NUMERIC, NOT NULL): `item_unit_sale_price * quantity`.
  - `sub_merchant_id` (UUID, FK to `profiles.id`): The seller of this item.
  - `sub_merchant_payout_amount` (NUMERIC, NOT NULL): Amount due to sub-merchant for this item (currently same as `item_total_sale_price`).
  - `iyzico_basket_item_id` (TEXT): The unique ID sent for this item in iyzico's `basketItems` array.
  - `iyzico_payment_transaction_id` (TEXT, UNIQUE): From iyzico's response, identifies this specific item's transaction. Needed for item-level approval. [Source: Approval _ iyzico.pdf, Page 1-2; Submerchant Price _ Item Update _ iyzico.pdf, Page 2]
  - `approval_status` (TEXT, DEFAULT `'pending_approval'`): Marketplace approval status for this item.
  - `created_at`, `updated_at` (TIMESTAMPTZ).
  - **Payment Relevance:** Details each item sold, links to its seller, and tracks its specific payout and approval status within the marketplace model.

## 4. iyzico Integration - Core Concepts (Project Specific Summary)

This project uses iyzico's **Marketplace Solution** with the **Checkout Form (CF)**.

- **Marketplace Model:**

  - Event organizers are **Sub-merchants**. They must be registered with iyzico via the Onboarding API (not covered by the documented Edge Function, assumed to be done separately or via another function). [Source: Submerchant _ iyzico.pdf, Page 1-2]
  - Each sub-merchant has a unique `subMerchantKey` provided by iyzico upon their registration. This key is stored in the `company_payment_profile.sub_merchant_key` column, linked to the seller's `profiles.id` via `company_payment_profile.sub_merchant_external_id`.
  - For each item in the payment `basketItems`, the `subMerchantKey` of the seller and the `subMerchantPrice` (amount to be transferred to that seller for that item) must be provided. [Source: Online Payment _ iyzico.pdf, Page 1-2]
  - Currently, no commission is taken by the marketplace, so `subMerchantPrice` = `item.price`.

- **Authentication (HMAC-SHA256):**

  - All server-to-server API calls to iyzico must be authenticated.
  - **Method:** `IYZWSv2` Authorization header. [Source: HMACSHA256 Auth _ iyzico.pdf, Page 1]
  - **Construction (as implemented in `generateIyzicoAuthHeader` function):**
    1.  A unique `randomKey` is generated for each request.
    2.  The `urlPath` is extracted from the target iyzico API URL.
    3.  The `dataToHash` is a concatenation: `randomKey + urlPath + requestBodyString`.
    4.  This `dataToHash` is signed using HMAC-SHA256 with the `IYZICO_SECRET_KEY`. The signature is hex-encoded.
    5.  The `pkiString` is formed: `apiKey:{IYZICO_API_KEY}&randomKey:{randomKey}&signature:{signatureHex}`.
    6.  The `pkiString` is Base64 encoded.
    7.  The final header is: `Authorization: IYZWSv2 {base64EncodedPkiString}`.
    8.  The `randomKey` is also sent in the `x-iyzi-rnd` header. [Source: HMACSHA256 Auth _ iyzico.pdf, Page 1]

- **Checkout Form (CF) - Initialize Flow:**

  - **Endpoint:** `POST {IYZICO_BASE_URL}/payment/iyzipos/checkoutform/initialize/auth/ecom` [Source: CF-Initialize _ iyzico.pdf, Page 1]
  - **Purpose:** To initiate a payment and receive a `paymentPageUrl` (where the user is redirected to enter card details) and an iyzico `token` (used later to retrieve payment details). [Source: CF-Initialize _ iyzico.pdf, Page 6]
  - **Key Request Parameters (`IIyzicoCFInitializeRequestPayload` constructed by the Edge Function):**
    - `locale`: e.g., "tr"
    - `conversationId`: A unique ID generated by the Edge Function for this transaction attempt with iyzico.
    - `price`: Total price of all items in the basket.
    - `paidPrice`: Final amount to be charged (usually same as `price` for CF initial request).
    - `currency`: e.g., "TRY".
    - `basketId`: Your internal `orders.id`.
    - `paymentGroup`: Set to `"PRODUCT"` for marketplace transactions involving sub-merchants. [Source: CF-Initialize _ iyzico.pdf, Page 4; Online Payment _ iyzico.pdf, Page 1 (mentions LISTING if no subMerchantKey)]
    - `callbackUrl`: The app's deep link URL where iyzico redirects the user after payment attempt.
    - `buyer`: Object containing buyer's details (ID, name, surname, GSM, email, identity number, registration address, IP, city, country, zip). [Source: CF-Initialize _ iyzico.pdf, Page 2]
    - `billingAddress`, `shippingAddress`: Objects with address details. Shipping address is mandatory if any item is "PHYSICAL"; for "VIRTUAL" tickets, it can mirror billing. [Source: CF-Initialize _ iyzico.pdf, Page 3-4]
    - `basketItems`: An array where each object represents one unit of a ticket.
      - `id`: A unique ID for this line item (generated by the Edge Function, e.g., `crypto.randomUUID()`).
      - `price`: Unit price of the ticket (from `events_dates_locations.price`).
      - `name`: Event title.
      - `category1`: Event category name.
      - `itemType`: Set to `"VIRTUAL"` for event tickets. [Source: CF-Initialize _ iyzico.pdf, Page 3]
      - `subMerchantKey`: The iyzico `sub_merchant_key` of the event's publisher (from `company_payment_profile`).
      - `subMerchantPrice`: Price of the ticket (since no commission).

- **Idempotency:**
  - The `conversationId` sent to iyzico helps in matching requests and responses and can be used for reconciliation. [Source: Idempotency _ iyzico.pdf, Page 1]
  - The iyzico `token` (from CF Initialize) and `paymentId` (from CF Retrieve/webhook) are key iyzico-generated identifiers. [Source: Idempotency _ iyzico.pdf, Page 1-2]

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
  - `IYZICO_BASE_URL`

- **Inputs (from React Native app - `IAppToBackendPaymentInitRequest`):**

  ```typescript
  interface IAppBasketItemIdentifier {
    itemId: string // Corresponds to events_dates_locations.id
    quantity: number
  }

  interface IAppToBackendPaymentInitRequest {
    basketItemsIdentifiers: IAppBasketItemIdentifier[]
    selectedBillingAddressId: string
    selectedShippingAddressId?: string // Optional, defaults to billing if not provided
    callbackUrl: string // App's deep link for iyzico redirection
    clientIpAddress: string // Buyer's IP address
    currency?: string // Optional: preferred currency for the transaction (e.g., "TRY")
  }
  ```

- **Key Internal Steps (summarized from the provided Edge Function code):**

  1.  **Handle OPTIONS Request:** Standard CORS preflight handling.
  2.  **Initialize Supabase Clients:**
      - `supabaseClient`: Initialized with `SUPABASE_ANON_KEY` and the incoming user `Authorization` header. Used for `auth.getUser()`.
      - `adminSupabaseClient`: Initialized with `SUPABASE_SERVICE_ROLE_KEY`. Used for all subsequent database reads and writes to bypass RLS and ensure system integrity.
  3.  **Retrieve Environment Variables:** Load iyzico API credentials and base URL. Error if missing.
  4.  **Authenticate User (Buyer):**
      - Extract token from `Authorization` header.
      - Call `supabaseClient.auth.getUser(token)` to validate the user and get `buyerUserId`.
  5.  **Fetch Buyer & Address Details (using `adminSupabaseClient`):**
      - Fetch `buyerPrivateProfile` from `user_private_profiles` using `buyerUserId`.
      - Fetch `billingAddressData` from `addresses` using `selectedBillingAddressId` and `buyerUserId`.
      - Fetch `shippingAddressData` if `selectedShippingAddressId` is provided and different; otherwise, it defaults to `billingAddressData`.
  6.  **Process Basket & Calculate Totals:**
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
  7.  **Create Local Order Records (using `adminSupabaseClient`):**
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
      - If order items insertion fails, attempt to mark the parent order as failed/ errored (or delete it, though marking is safer for audit) and throw an error.
  8.  **Construct iyzico API Payload (`IIyzicoCFInitializeRequestPayload`):**
      - Populate all required fields using the fetched and processed data (e.g., `locale`, `conversationId`, `price`, `paidPrice`, `currency`, `basketId` (using `newOrder.id`), `paymentGroup: "PRODUCT"`, `callbackUrl`, `buyer` object, `billingAddress` object, `shippingAddress` object, and the `iyzicoBasketItems` array).
  9.  **Call iyzico API:**
      - Stringify the `iyzicoPayload`.
      - Generate the `Authorization` header and `randomKey` using `generateIyzicoAuthHeader(IYZICO_API_KEY, IYZICO_SECRET_KEY, requestBodyString, apiUrl)`.
      - Make a `POST` request to `"{IYZICO_BASE_URL}/payment/iyzipos/checkoutform/initialize/auth/ecom"` with appropriate headers and the stringified body.
  10. **Handle iyzico's Response:**
      - Parse the JSON response from iyzico.
      - **If `iyzicoResult.status === "success"`:**
        - Update the corresponding `orders` record in the database: set `iyzico_checkout_token = iyzicoResult.token` and `status = "awaiting_payment_redirect"`.
        - Return a 200 OK response to the app with `{ paymentPageUrl: iyzicoResult.paymentPageUrl, token: iyzicoResult.token }`.
      - **If `iyzicoResult.status === "failure"`:**
        - Update the `orders` record: set `status = "payment_init_failed"` and store `iyzico_error_message`, `iyzico_error_code`, `iyzico_error_group`.
        - Throw an error, which will be caught by the main try/catch.
  11. **Global Error Handling (Main `try/catch` block):**
      - Log the error.
      - If an `internalOrderId` was generated and the corresponding order record is still in `'pending_iyzico'` state (meaning the error likely occurred before a definitive iyzico response or during DB operations prior to iyzico call), update the order status to `'internal_error_before_iyzico'` or a similar error state.
      - Return a 500 Internal Server Error response to the app with the error message.

- **Outputs (to React Native app):**
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

## 6. Overall Payment Initiation Workflow Summary

1.  **App (User Action):** User finalizes their basket and proceeds to payment.
2.  **App (Request):** App collects minimal data (`basketItemsIdentifiers`, address IDs, callback URL, IP) and sends a POST request to the `/initialize-checkout-payment` Edge Function with the user's JWT.
3.  **Edge Function (Authentication & Data Aggregation):** Authenticates user, then uses `adminSupabaseClient` to fetch all required buyer, address, event, pricing, and sub-merchant data from the database.
4.  **Edge Function (Local Order Creation):** Creates records in `orders` (status: `pending_iyzico`) and `order_items` tables.
5.  **Edge Function (iyzico API Call):** Constructs the detailed payload and makes an authenticated POST request to iyzico's CF Initialize endpoint.
6.  **Edge Function (Handle iyzico Response & DB Update):**
    - **Success:** Updates `orders` table with iyzico token and status `'awaiting_payment_redirect'`. Returns `paymentPageUrl` and `token` to the app.
    - **Failure:** Updates `orders` table with error status and details. Returns error to the app.
7.  **App (Redirection):** If successful, the app receives the `paymentPageUrl` and redirects the user to iyzico's hosted payment page using `WebBrowser.openBrowserAsync()`.
8.  **(Next Steps - Not covered by this function):**
    - User completes payment on iyzico's page.
    - iyzico redirects the user back to the app's `callbackUrl` (deep link).
    - App handles the deep link, extracts necessary info (like the iyzico token if passed, though usually the token from init is re-used for retrieve).
    - App calls another Edge Function (e.g., `/retrieve-checkout-payment`) to get the final payment status from iyzico.
    - This second Edge Function updates `orders` and `order_items` (with `iyzico_payment_id`, `iyzico_payment_transaction_id` for items, final status like `'awaiting_approval'` or `'payment_failed'`).

## 7. Security Considerations

- **API Keys:** `IYZICO_API_KEY` and `IYZICO_SECRET_KEY` are stored securely as environment variables in Supabase and are only accessible within the Edge Function. They are never exposed to the client.
- **Service Role Key:** `SUPABASE_SERVICE_ROLE_KEY` is used for the `adminSupabaseClient`, allowing privileged database operations within the trusted server-side environment of the Edge Function, bypassing RLS where necessary for system operations.
- **User Authentication:** The Edge Function is protected and requires a valid Supabase JWT from the client app to identify the user and authorize the initiation of the payment process.
- **HMAC-SHA256:** Communication with the iyzico API is secured using HMAC-SHA256 signatures as per iyzico's requirements.
- **Data Validation:** Inputs from the client app should ideally be validated (though not explicitly detailed in the current Edge Function code, it's a good practice). The function does perform checks like ensuring event instances are sellable and have valid prices.
- **Least Privilege:** The client app sends only minimal necessary identifiers to the Edge Function. The function then fetches detailed data on the server-side, reducing the attack surface.

---

This documentation should provide a solid foundation for understanding the iyzico payment integration within your project, particularly the `initialize-checkout-payment` Edge Function and its interaction with your database and iyzico's API.
