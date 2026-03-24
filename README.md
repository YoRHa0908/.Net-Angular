# Request Manager (Test Assignment)

Small fullstack request management app using ASP.NET Core Web API + Angular.

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
dotnet ef migrations add Init
dotnet ef database update
dotnet run
```

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
- Roles: `User`, `Manager`
- Request list + filtering (status, priority, title search) + pagination
- Create/edit request
- Request details via edit page
- Status update endpoint with explicit transition policy checks
- Status change history persistence
- Hangfire recurring job for overdue requests
- Global exception middleware returning problem-like responses
- Unit tests for transition policy

## Simplifications Made

- DTO mapping is manual (no AutoMapper).
- No full integration/e2e test suite.
- Migrations are not pre-generated in repository.

## What I Would Improve Next

- Add FluentValidation for richer request validation.
- Add integration tests (auth, authorization, overdue job).
- Add sorting options and cursor pagination.
- Add NgRx for richer frontend state handling.
