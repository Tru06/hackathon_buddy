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
| Frontend | React, TypeScript, Vite, Tailwind CSS |

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
├── frontend/        (React + Vite + Tailwind CSS)
├── docs/
└── README.md
```

## Implemented Services

### Auth Service (`backend/src/services/auth/`)

Handles registration, login, token refresh, and logout. Issues JWT access tokens (15 min expiry) and refresh tokens (7 days, stored in httpOnly cookies). Passwords are hashed with bcrypt (cost factor ≥ 12).

### Search & Match Service (`backend/src/services/search/searchService.ts`)

| Function | Description |
|---|---|
| `searchUsers(requestingUserId, filters, page, pageSize)` | Filters profiles by skills, interests, availability, hackathon scope, and timezone. Scores results by match quality (skill overlap 50%, interest overlap 30%, availability 20%). Results cached in Redis for 60 s. |
| `getSuggestedTeammates(userId, hackathonId)` | Returns top-20 candidates ranked by complementarity — prioritising unique skills the candidate brings to the requesting user. |
| `getMatchScore(userAId, userBId)` | Returns a pairwise [0, 1] compatibility score between two users. |

### User Service (`backend/src/services/users/`)

Manages user profiles and the connection graph between users.

**Profile endpoints** (mounted at `/api/users`):

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/profile/:userId` | — | Fetch a user's profile by ID |
| `PUT` | `/profile` | ✓ | Create or update the authenticated user's profile |

**Connection endpoints** (mounted at `/api/users`):

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/connections` | ✓ | List accepted connections for the authenticated user |
| `GET` | `/connections/pending` | ✓ | List incoming pending connection requests |
| `POST` | `/connections` | ✓ | Send a connection request (`{ toUserId, message }`) |
| `PATCH` | `/connections/:id` | ✓ | Accept or decline a request (`{ accept: boolean }`) |

### Team Service (`backend/src/services/teams/`)

Manages team creation, membership, invites, messaging, and project submission.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/teams` | ✓ | Create a new team |
| `GET` | `/api/teams?hackathonId=` | — | List teams for a hackathon |
| `GET` | `/api/teams/mine` | ✓ | List teams the authenticated user belongs to |
| `GET` | `/api/teams/invites/pending` | ✓ | List pending team invites for the authenticated user |
| `GET` | `/api/teams/:id` | — | Get a single team by ID |
| `PATCH` | `/api/teams/:id` | ✓ | Update a team (owner only) |
| `POST` | `/api/teams/:id/invite` | ✓ | Invite a user to the team |
| `PATCH` | `/api/teams/invites/:inviteId` | ✓ | Accept or decline an invite (`{ accept: boolean }`) |
| `DELETE` | `/api/teams/:id/leave` | ✓ | Leave a team |
| `GET` | `/api/teams/:id/messages` | ✓ | Get team chat messages |
| `POST` | `/api/teams/:id/messages` | ✓ | Send a message to the team chat |
| `POST` | `/api/teams/:id/projects` | ✓ | Submit a project for the team |

---

### Hackathon Service (`backend/src/services/hackathons/`)

Manages hackathon listings and participant interest registration.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/hackathons` | — | List hackathons, optionally filtered by `?theme=` and `?location=` |
| `GET` | `/api/hackathons/:id` | — | Get a single hackathon by ID |
| `POST` | `/api/hackathons` | ✓ | Create a new hackathon |
| `POST` | `/api/hackathons/:id/interest` | ✓ | Register the authenticated user's interest in a hackathon |
| `DELETE` | `/api/hackathons/:id/interest` | ✓ | Remove the authenticated user's interest from a hackathon |
| `GET` | `/api/hackathons/:id/participants` | ✓ | List users who have registered interest in a hackathon |

### Frontend Services (`frontend/src/services/`)

Client-side API layer used by the React SPA. All services delegate to the shared `api.ts` base client.

#### `api.ts` — base HTTP client

Wraps `fetch` with automatic JWT injection and silent token refresh. On a `401` response it calls `POST /api/auth/refresh`, updates the in-memory access token, and retries the original request once. Exposes `api.get`, `api.post`, `api.put`, `api.patch`, and `api.delete`.

#### `auth.ts` — authService

| Method | Endpoint | Description |
|---|---|---|
| `register(email, password)` | `POST /api/auth/register` | Create a new account |
| `login(email, password)` | `POST /api/auth/login` | Authenticate and receive tokens |
| `refresh()` | `POST /api/auth/refresh` | Exchange refresh cookie for a new access token |
| `logout()` | `POST /api/auth/logout` | Invalidate the refresh token |

#### `search.ts` — searchService

| Method | Endpoint | Description |
|---|---|---|
| `searchUsers(filters)` | `GET /api/search/users` | Builds query params from `SearchFilters` and returns paginated scored profiles |
| `getSuggestions(hackathonId)` | `GET /api/search/suggest?hackathonId=` | Returns top-20 suggested teammates for a hackathon |
| `getMatchScore(userA, userB)` | `GET /api/search/score?userA=&userB=` | Returns a `{ score }` pairwise compatibility value in [0, 1] |

#### `teams.ts` — teamsService

| Method | Endpoint | Description |
|---|---|---|
| `create(data)` | `POST /api/teams` | Create a new team |
| `get(id)` | `GET /api/teams/:id` | Fetch a team by ID |
| `listByHackathon(hackathonId)` | `GET /api/teams?hackathonId=` | List teams for a hackathon |
| `update(id, data)` | `PATCH /api/teams/:id` | Update a team |
| `invite(teamId, inviteeId)` | `POST /api/teams/:id/invite` | Invite a user to the team |
| `respondToInvite(inviteId, accept)` | `PATCH /api/teams/invites/:inviteId` | Accept or decline an invite |
| `leave(teamId)` | `DELETE /api/teams/:id/leave` | Leave a team |
| `getMessages(teamId)` | `GET /api/teams/:id/messages` | Fetch team chat messages |
| `sendMessage(teamId, content)` | `POST /api/teams/:id/messages` | Send a message to the team chat |

#### `users.ts` — usersService

| Method | Endpoint | Description |
|---|---|---|
| `getProfile(userId)` | `GET /api/users/profile/:userId` | Fetch any user's profile |
| `updateProfile(data)` | `PUT /api/users/profile` | Create or update the authenticated user's profile |
| `getConnections()` | `GET /api/users/connections` | List accepted connections |
| `getPendingRequests()` | `GET /api/users/connections/pending` | List incoming pending requests |
| `sendConnectionRequest(toUserId, message)` | `POST /api/users/connections` | Send a connection request |
| `respondToRequest(requestId, accept)` | `PATCH /api/users/connections/:id` | Accept or decline a request |

### Frontend Components (`frontend-v0/components/`)

UI components used by the Next.js frontend (frontend-v0).

#### `dashboard/NotificationsBell.tsx`

A self-contained bell icon component that polls for unread notifications every 30 seconds and renders them in a popover. Supports per-notification dismiss and a "Mark all read" action.

| API call | Description |
|---|---|
| `getUnreadNotifications()` | Fetches all unread notifications on mount and every 30 s |
| `markNotificationRead(id)` | Dismisses a single notification |
| `markAllNotificationsRead()` | Clears all notifications at once |

Notification types surfaced: `CONNECTION_REQUEST`, `CONNECTION_ACCEPTED`, `TEAM_INVITE`, `TEAM_INVITE_ACCEPTED`, `TEAM_INVITE_DECLINED`, `TEAM_MESSAGE`.

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

## Environment Variables

Create a `backend/.env` file (see `backend/.env.example` if present). Key variables:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the API server listens on |
| `JWT_SECRET` | `dev-secret-change-in-production` | Secret used to sign JWT access tokens — **change in production** |
| `FRONTEND_URL` | — | Additional origin added to the CORS allowlist. The server always permits `http://localhost:3000`, `http://localhost:5173`, and `https://v0-hackbuddy.vercel.app` by default. |
| `API_KEY` | — | Internal API key for service-to-service requests |

## Scripts

Run from the `backend/` directory.

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with ts-node-dev |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled output |
| `npm test` | Run tests (vitest, single run) |
| `npm run test:watch` | Run tests in watch mode |

## Deployment

The project is configured for Vercel deployment via `vercel.json` at the repository root.

| Setting | Value |
|---|---|
| Framework | Next.js |
| Root directory | `frontend-v0` |

The `frontend-v0` Next.js app is the primary frontend deployed to Vercel. The backend is deployed separately (see `backend/vercel.json`).
