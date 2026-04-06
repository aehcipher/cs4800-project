# Student-to-Student Rental App

This project implements the Student-to-Student Rental Platform as a local-first web application using React + Vite for the presentation layer and Node.js + Express for the backend.

## What is included

- Presentation layer UI for renter, lister, and admin flows
- Remaining architecture layers connected through REST endpoints
- Persistent local data storage for development in `server/data/database.json`
- Production-oriented PostgreSQL schema and data specification in `database/`
- External API specification and provider adapters for payments, email, push, and student verification

## Demo accounts

Run the seed command first. All demo users use password `Password123!`.

- renter: `renter@cpp.edu`
- lister: `lister@cpp.edu`
- admin: `admin@cpp.edu`
- demo admin MFA code: `123456`

## Run locally

```bash
npm install
npm run seed
npm run dev
```

Open:

- Web app: `http://localhost:5173`
- API health check: `http://localhost:3001/api/health`

## Notes

- The app works without a `.env` file.
- `npm run seed` writes demo data to `server/data/database.json`.
- The backend uses a persistent JSON datastore for local development and includes a PostgreSQL production schema for deployment planning.
