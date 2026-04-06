# Persistent Storage Specification

## Local development storage

The runnable local build uses a persistent JSON datastore:

- File: `server/data/database.json`
- Created automatically on first run
- Seeded with `npm run seed`

Collections stored in the file:
- users
- sessions
- emailVerifications
- listings
- bookings
- payments
- escrows
- conversations
- messages
- conditionReports
- reviews
- disputes
- notifications
- auditLogs
- settings

This local datastore keeps setup friction low for Windows-based coursework while still demonstrating data-layer separation.

## Production storage model

The architecture diagram specifies PostgreSQL as the primary database, Redis for transient/session concerns, and object storage for images. The production relational design is provided in `database/schema.sql`.

### Core relational entities
- users
- listings
- availability_slots
- bookings
- payments
- escrows
- conversations
- messages
- condition_reports
- reviews
- disputes
- notifications
- audit_logs

### Key integrity rules
- A booking references one listing, one renter, and one lister.
- A conversation references one booking.
- Reviews are only valid for completed bookings.
- A dispute references one booking and may produce refund records.
- Listing availability and booking overlap checks prevent double-booking.
