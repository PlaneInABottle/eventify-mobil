# Payment Integration Guide

This document describes the current state and planned implementation of payment processing in Eventify using iyzico's marketplace solution.

## Current Implementation Status

### ✅ Deployed Edge Functions

The following Edge Functions exist on the Supabase server:

#### 1. Submerchant Creation (`create-submerchant`)
- **Purpose**: Register event organizers as iyzico submerchants
- **Status**: Deployed but not integrated with frontend
- **Usage**: Not currently called from app

#### 2. Checkout Initialization (`init-checkout`) ⚠️ DEPRECATED
- **Purpose**: Initialize iyzico checkout forms for payments  
- **Status**: Deployed but deprecated, will be removed
- **Usage**: Legacy function, being replaced by `initialize-payment-iyzico`

#### 3. Payment Initialization (`initialize-payment-iyzico`) ✅ CURRENT
- **Purpose**: Main payment initialization with full database integration
- **Status**: Deployed and actively being developed
- **Usage**: Primary payment function with complete order flow
- **Features**: 
  - Full database integration (orders, order_items)
  - Basket item processing
  - Address validation
  - Error handling and rollback
  - iyzico API integration

#### 4. Payment Retrieval (`retrieve-checkout-payment`)
- **Purpose**: Retrieve payment results after user completes payment
- **Status**: Deployed but not integrated with frontend
- **Usage**: Not currently called from app

#### 5. Webhook Handler (`handle-iyzico-webhook`)
- **Purpose**: Handle iyzico webhook notifications
- **Status**: Deployed but not configured
- **Usage**: Webhook endpoint exists but may need URL configuration

#### 6. User Test Function (`test-fetch-user`)
- **Purpose**: Test user authentication and data fetching
- **Status**: Deployed (development/testing only)
- **Usage**: Development testing

### 🔄 In Active Development

- **Frontend Integration**: Payment flows being implemented for user screens
- **Store Integration**: `UserPaymentStore.ts` contains mocked implementations
- **Testing**: `TestPaymentStore.ts` being used for integration testing
- **UI Development**: Payment screens under development

## Architecture Overview

### Database Schema

The payment system uses the following Supabase tables (as verified from the actual database):

#### Core Tables
- **`profiles`**: User information linking to auth.users
- **`user_private_profiles`**: Sensitive user data (names, identity numbers, phone)
- **`company_payment_profile`**: Organizer payment profiles with iyzico submerchant keys
- **`addresses`**: Billing and shipping addresses
- **`events`**: Event information with publisher relationships
- **`events_dates_locations`**: Specific event instances with pricing
- **`orders`**: Payment transaction tracking
- **`order_items`**: Individual items within orders

#### Key Relationships
```sql
profiles (id) ← company_payment_profile (sub_merchant_external_id)
profiles (id) ← events (publisher_id)
events (id) ← events_dates_locations (event_id)
orders (id) ← order_items (order_id)
events_dates_locations (id) ← order_items (item_identifier_id)
```

## Payment Flow

### 1. Organizer Onboarding
```typescript
// Call create-submerchant endpoint
POST /functions/v1/create-submerchant
{
  "subMerchantExternalId": "organizer_profile_id",
  "subMerchantType": "PERSONAL" | "PRIVATE_COMPANY" | "LIMITED_OR_JOINT_STOCK_COMPANY",
  "name": "Organizer Name",
  "email": "organizer@example.com",
  "gsmNumber": "+905551234567",
  "address": "Full address",
  "iban": "TR180006200119000006672315",
  "identityNumber": "12345678901", // For PERSONAL/PRIVATE_COMPANY
  "contactName": "Contact Name",
  "contactSurname": "Contact Surname",
  // Additional fields based on subMerchantType
}
```

### 2. Payment Initialization
```typescript
// Call initialize-payment-iyzico endpoint
POST /functions/v1/initialize-payment-iyzico
{
  "basketItemsIdentifiers": [
    {
      "itemId": "events_dates_locations_id",
      "quantity": 1
    }
  ],
  "selectedBillingAddressId": "address_uuid",
  "selectedShippingAddressId": "address_uuid", // Optional
  "callbackUrl": "app://payment-result",
  "clientIpAddress": "user_ip",
  "currency": "TRY" // Optional
}
```

**Response:**
```typescript
{
  "paymentPageUrl": "https://iyzico_payment_url",
  "token": "iyzico_checkout_token"
}
```

### 3. Payment Completion
After user completes payment on iyzico's page:

```typescript
// Call retrieve-checkout-payment endpoint
POST /functions/v1/retrieve-checkout-payment
{
  "iyzicoToken": "token_from_init",
  "internalOrderId": "order_uuid",
  "iyzicoConversationId": "conversation_id"
}
```

### 4. Webhook Processing
iyzico automatically sends webhooks to `/functions/v1/handle-iyzico-webhook` for:
- Payment completion notifications
- Status change updates
- Reconciliation data

## Security Implementation

### Authentication
- All Edge Functions use HMAC-SHA256 authentication with iyzico
- User authentication via Supabase JWT tokens
- Row Level Security (RLS) on all database tables

### Data Protection
- Sensitive payment data stored securely
- PCI compliance through iyzico's hosted payment pages
- Environment variables for API credentials

### Signature Verification
- Webhook signature verification using `X-IYZ-SIGNATURE-V3`
- Request validation and sanitization
- Comprehensive error handling

## Environment Variables

Required environment variables for Edge Functions:

```env
# iyzico Credentials
IYZICO_API_KEY=your_api_key
IYZICO_SECRET_KEY=your_secret_key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com # or production URL

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Order Status Flow

```
pending_iyzico → awaiting_payment_redirect → awaiting_approval → completed
     ↓                    ↓                       ↓
payment_init_failed  payment_failed    payment_retrieval_failed
```

### Status Definitions
- **`pending_iyzico`**: Order created, waiting for iyzico initialization
- **`awaiting_payment_redirect`**: iyzico checkout initialized, user redirect pending
- **`awaiting_approval`**: Payment successful, awaiting marketplace approval
- **`completed`**: Payment approved and finalized
- **`payment_failed`**: Payment failed or declined
- **`payment_init_failed`**: Failed to initialize payment with iyzico
- **`payment_retrieval_failed`**: Failed to retrieve payment status

## Error Handling

### Common Error Scenarios
1. **Missing submerchant profile**: Organizer not registered with iyzico
2. **Invalid basket items**: Event not available or pricing issues
3. **Address validation**: Missing or invalid billing/shipping addresses
4. **Currency mismatch**: Event currency vs order currency conflicts
5. **Network failures**: iyzico API timeouts or connectivity issues

### Error Recovery
- Database rollback for failed transactions
- Order status updates for tracking failures
- Comprehensive logging for debugging
- User-friendly error messages

## Frontend Integration

### React Native Implementation
```typescript
// Example payment initialization
const initiatePayment = async (basketItems: BasketItem[]) => {
  try {
    const response = await fetch('/functions/v1/initialize-payment-iyzico', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        basketItemsIdentifiers: basketItems,
        selectedBillingAddressId: billingAddress.id,
        callbackUrl: 'eventify://payment-result',
        clientIpAddress: await getClientIP()
      })
    });

    const { paymentPageUrl, token } = await response.json();
    
    // Open iyzico payment page
    await WebBrowser.openBrowserAsync(paymentPageUrl);
    
    // Store token for later retrieval
    await storePaymentToken(token);
  } catch (error) {
    console.error('Payment initialization failed:', error);
  }
};
```

## Testing

### Test Environment
- Use iyzico sandbox environment
- Test submerchant creation
- Verify payment flows with test cards
- Validate webhook delivery

### Test Data
- Valid Turkish identity numbers for testing
- iyzico test credit card numbers
- Various error scenarios

## Troubleshooting

### Common Issues
1. **Submerchant registration failures**: Check identity numbers and business information
2. **Payment initialization errors**: Verify basket items and pricing
3. **Webhook delivery issues**: Ensure public endpoint accessibility
4. **Currency conversion**: Handle multiple currency support

### Debugging
- Check Supabase Edge Function logs
- Monitor iyzico webhook delivery
- Validate database order status progression
- Review error messages and codes

## Future Enhancements

### Planned Features
- Multi-currency support
- Subscription payments
- Refund processing
- Split payment functionality
- Enhanced reporting and analytics

### Integration Roadmap
1. Complete user payment screen integration
2. Implement organizer payout management
3. Add payment analytics dashboard
4. Enhanced error handling and recovery
5. Mobile app deep linking optimization

---

*This documentation reflects the current implementation as of the latest deployment. For the most up-to-date API specifications, refer to the individual Edge Function source code.*