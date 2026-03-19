# Hackathon Buddy

A web SPA that helps hackathon participants find and connect with compatible teammates. Build a profile, search for collaborators by skill and interest, form teams, and register for hackathons.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, TypeScript, Express |
| Database | PostgreSQL |
| Cache / Token store | Redis (ioredis) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Testing | Vitest + fast-check (property-based) |
| Frontend | SPA (framework TBD) |

## Project Structure

```
hackathon-buddy/
├── backend/
│   └── src/
│       ├── services/
│       │   ├── auth/
│       │   ├── users/
│       │   ├── search/
│       │   ├── teams/
│       │   ├── hackathons/
│       │   └── notifications/
│       ├── middleware/
│       ├── db/
│       │   └── migrations/
│       └── index.ts
├── frontend/        (not yet started)
├── docs/
└── README.md
```

## Prerequisites

- Node.js
- PostgreSQL
- Redis

## Getting Started

```bash
cd backend
npm install
npm run dev
```

## Scripts

Run from the `backend/` directory.

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with ts-node-dev |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled output |
| `npm test` | Run tests (vitest, single run) |
| `npm run test:watch` | Run tests in watch mode |
