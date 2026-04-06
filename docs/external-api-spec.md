# External API Specification

## 1. Student Verification Provider

Purpose: validate university/student email domains during registration and email verification.

### Mock mode
- Default local development mode.
- Accepts domains listed in `ALLOWED_STUDENT_DOMAINS`.

### Production contract
- Request: `POST /verify-student-email`
- Payload:
  - `email`
  - `campus`
- Response:
  - `isValidStudentEmail`
  - `normalizedCampus`
  - `verificationMethod`

## 2. Payment Processor

Purpose: process rental charges and deposit holds.

### Mock mode
- Default local development mode.
- Generates a mock transaction reference and marks payment as succeeded.

### Stripe mode
- Uses `POST https://api.stripe.com/v1/payment_intents`
- Required environment variables:
  - `PAYMENT_PROVIDER=stripe`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_CURRENCY`

### Internal app contract
- `POST /api/payments/checkout/:bookingId`
- Response:
  - `payment.id`
  - `payment.provider`
  - `payment.providerReference`
  - `payment.status`

## 3. Email Delivery Provider

Purpose: send verification emails, receipts, booking notices, and dispute updates.

### Mock mode
- Default local development mode.
- Notification is persisted inside the app and email delivery returns a preview payload.

### SendGrid mode
- Uses `POST https://api.sendgrid.com/v3/mail/send`
- Required environment variables:
  - `EMAIL_PROVIDER=sendgrid`
  - `SENDGRID_API_KEY`
  - `SENDGRID_FROM_EMAIL`

## 4. Push Notification Provider

Purpose: future mobile push support and near-real-time alerts.

### Mock mode
- Default local development mode.
- No external request is performed.

### Example production mode
- FCM/APNs-compatible provider adapter.
- Environment variables depend on chosen provider.

## Implementation approach

The application routes never call third-party APIs directly. They call service-layer adapters in `server/providers/` so providers can be swapped without changing the presentation layer or business logic.
