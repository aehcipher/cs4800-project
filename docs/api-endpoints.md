# API Endpoints

## Auth
- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Listings
- `GET /api/listings`
- `GET /api/listings/:listingId`
- `GET /api/listings/mine`
- `POST /api/listings`

## Bookings & Payments
- `GET /api/bookings`
- `GET /api/bookings/:bookingId`
- `POST /api/bookings`
- `POST /api/payments/checkout/:bookingId`
- `POST /api/bookings/:bookingId/complete`

## Messaging
- `GET /api/messages/conversations`
- `GET /api/messages/conversations/:conversationId`
- `POST /api/messages/conversations/:conversationId`

## Supporting services
- `POST /api/condition-reports/:bookingId`
- `POST /api/reviews`
- `GET /api/disputes`
- `POST /api/disputes`
- `GET /api/notifications`
- `POST /api/notifications/:notificationId/read`
- `GET /api/dashboard/earnings`

## Admin
- `GET /api/admin/summary`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:userId`
- `GET /api/admin/listings`
- `PATCH /api/admin/listings/:listingId`
- `GET /api/admin/disputes`
- `PATCH /api/admin/disputes/:disputeId`
