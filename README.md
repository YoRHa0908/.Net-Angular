# Request Manager (Test Assignment)

Small fullstack request management app using ASP.NET Core Web API + Angular.

## How to run the project

1. **PostgreSQL** — Start a server (Docker example under **2) Start PostgreSQL** below) and ensure the connection string in `backend/appsettings.json` (or `appsettings.Development.json`) matches.
2. **Backend** — From the repo root: `cd backend`, then `dotnet restore` and `dotnet run`. Migrations apply on startup.
3. **Frontend** — In a second terminal: `cd frontend`, then `npm install` and `npm start`.
4. **Browser** — Open `http://localhost:4200`. The SPA expects the API at `http://localhost:5000` unless you change `auth.service.ts` and `request.service.ts`.

Optional: `cd backend.tests && dotnet test` for backend unit tests; `cd frontend && npm test` for Angular smoke tests.

## Tech Stack

- Backend: .NET 10, ASP.NET Core Web API, EF Core, ASP.NET Identity, Hangfire, PostgreSQL
- Frontend: Angular 21, RxJS, Bootstrap, Reactive Forms

## Project Structure

- `backend` - API and data layer
- `backend.tests` - backend unit tests
- `frontend` - Angular client app

## Run Instructions

## 1) Prerequisites

- .NET 10 SDK (preview)
- Node.js 20+
- PostgreSQL 15+ (or Docker)

## 2) Start PostgreSQL (Docker example)

```bash
docker run --name request-manager-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=request_manager -p 5432:5432 -d postgres:15
```

## 3) Backend

```bash
cd backend
dotnet restore
dotnet run
```

On startup the API applies EF Core migrations automatically (`Database.Migrate()`). To add a new migration after model changes: `dotnet ef migrations add <Name>` then run again.

## 3.1) Backend tests

```bash
cd backend.tests
dotnet test
```

API base URL (default): `http://localhost:5000` (or ASP.NET launch profile port)

Swagger: `/swagger`

## 4) Frontend

```bash
cd frontend
npm install
npm start
```

Frontend URL: `http://localhost:4200`

## Implemented Features

- Registration and login (JWT, automatic login after registration)
- Roles: `User`, `Manager` (role in JWT + stored client-side for UI)
- Request list + filtering (status, priority, deadline range, title search) + pagination
- Managers: filter by creator, delete any request, status actions on the edit form
- Create/edit request (Reactive Forms); non-managers create as `Draft` and cannot change status from the API rules mirrored in the UI
- **Overdue** requests: read-only in the UI; `PUT` and manager `POST …/status` rejected by the API (Hangfire marks eligible items overdue)
- **Back to list** from create and edit (including overdue view-only)
- Status update endpoint with explicit transition policy checks; status history persisted
- Hangfire recurring job for overdue requests (PostgreSQL storage)
- Global exception middleware returning problem-like responses
- Backend unit tests for transition policy; minimal Angular smoke tests (`ng test`)

## Simplifications Made

- DTO mapping is manual (no AutoMapper).
- No full API integration/e2e test suite.
- Angular API base URL is fixed to `http://localhost:5000` (adjust in `auth.service.ts` / `request.service.ts` if your launch profile differs).

## What I Would Improve Next

- Add FluentValidation for richer request validation.
- Add integration tests (auth, authorization, overdue job).
- Add sorting options and cursor pagination.
- Add NgRx for richer frontend state handling.
