# Prodesk Sprint 15

Prodesk is a Next.js 16 client with an Express, MongoDB, bcrypt, and JWT authentication API. It implements registration, login, token restoration, logout, and a protected workspace dashboard with user-owned workspace-item CRUD and data visualization.

## Requirements

- Node.js 20.9 or newer
- A MongoDB Atlas cluster or local MongoDB instance

## Setup

Install the client and API dependencies:

```powershell
npm.cmd install
npm.cmd --prefix backend install
```

Create the frontend environment file from `.env.example`:

```powershell
Copy-Item .env.example .env.local
```

`NEXT_PUBLIC_API_URL` defaults to `http://localhost:4000` and is safe to expose to the browser.

Create the backend environment file from `backend/.env.example`:

```powershell
Copy-Item backend/.env.example backend/.env
```

Configure `backend/.env` with real values:

```env
MONGODB_URI=mongodb+srv://DATABASE_USER:DATABASE_PASSWORD@cluster.example.mongodb.net/prodesk?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1h
CLIENT_URL=http://localhost:3000
PORT=4000
```

Never commit either `.env` file.

## Run locally

Start the API and client in separate terminals:

```powershell
npm.cmd run dev:server
```

```powershell
npm.cmd run dev:client
```

Open the client at [http://localhost:3000/login](http://localhost:3000/login). The API health endpoint is [http://localhost:4000/health](http://localhost:4000/health).

`http://localhost:4000/` intentionally returns `Cannot GET /`: port 4000 is an API server, not the frontend.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Creates a user, hashes the password, and returns a JWT. |
| `POST` | `/api/auth/login` | Verifies credentials and returns a JWT. |
| `GET` | `/api/auth/me` | Returns the authenticated user; requires `Authorization: Bearer <token>`. |
| `GET` | `/api/workspace-items` | Lists the authenticated user's workspace items. |
| `POST` | `/api/workspace-items` | Creates a workspace item for the authenticated user. |
| `PUT` | `/api/workspace-items/:itemId` | Updates one of the authenticated user's workspace items. |
| `DELETE` | `/api/workspace-items/:itemId` | Deletes one of the authenticated user's workspace items. |
| `GET` | `/health` | Confirms that the Express API is running. |

Successful authentication responses contain only a JWT plus the safe user fields: `id`, `name`, and `email`. Passwords and password hashes are never returned.

## Authentication design

- Mongoose validates normalized email addresses and required user details.
- Passwords are hashed with `bcryptjs` using 12 salt rounds before storage.
- JWTs use the `JWT_SECRET`, the HS256 algorithm, a minimal `userId` payload, and the configured expiry.
- The Express middleware cryptographically verifies bearer tokens before serving `/api/auth/me`.
- The client stores the Sprint-required token as `prodesk_auth_token`, restores a session through `/api/auth/me`, clears invalid/expired tokens, and redirects unauthenticated users away from `/dashboard`.
- CORS permits only `CLIENT_URL`, rather than allowing every origin.

## Troubleshooting

**`bad auth : authentication failed`**

MongoDB Atlas reached the server but rejected the database credentials. Confirm the Database Access user/password, URL-encode reserved characters in the password, and use the database user password—not the Atlas account password. Add `/prodesk` to the URI to select the intended database.

**“Unable to reach the authentication service”**

Confirm both servers are running, `NEXT_PUBLIC_API_URL` is `http://localhost:4000`, and refresh the browser after changing `.env.local`. Do not use the Network URL for the frontend unless its origin is also added to backend `CLIENT_URL`.

## Security note

This sprint stores bearer JWTs in `localStorage` as required. For a production system handling sensitive data, prefer an HttpOnly, Secure, SameSite cookie-based session/token design to reduce XSS token-exfiltration risk. Add rate limiting, email verification, password reset, and token revocation before a production deployment.

## Quality checks

```powershell
npm.cmd run lint
npm.cmd run build
```
