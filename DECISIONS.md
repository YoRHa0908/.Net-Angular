# Key Architecture Decisions

## 1) ASP.NET Identity + JWT

**Decision:** Use ASP.NET Identity for user/role management and issue JWT for SPA authentication.  
**Why:** Identity gives robust user and role primitives quickly; JWT works well with Angular and stateless APIs.  
**Alternatives considered:** Custom auth tables, cookie auth, external IdP.

## 2) Single API with layered folders (Models/DTOs/Controllers/Services)

**Decision:** Keep one API project with clear folder-level boundaries.  
**Why:** Fast to implement for a test task while keeping responsibilities understandable.  
**Alternatives considered:** Clean Architecture with multiple projects, CQRS/MediatR split.

## 3) Entity Framework Core with PostgreSQL

**Decision:** Use EF Core code-first and PostgreSQL provider.  
**Why:** Fast schema iteration and LINQ-based querying; easy local setup with Docker.  
**Alternatives considered:** MSSQL provider, Dapper/manual SQL.

## 4) Status history as separate table

**Decision:** Persist each status transition in `RequestStatusHistory`.  
**Why:** Auditable timeline and supports requirement for status change history.  
**Alternatives considered:** JSON history blob in request table, event store.

## 5) Hangfire for overdue detection and strict overdue handling

**Decision:** Use a Hangfire recurring job (PostgreSQL storage, cron every 5 minutes) to mark unfinished past-deadline requests as `Overdue`, and block further edits while `Overdue` (`400` on `PUT` / manager `POST …/status`, read-only form in the Angular app).  
**Why:** Background work stays reliable and observable inside the API process; once overdue, the lifecycle is explicit instead of allowing silent “fix-ups” without a defined recovery path.  
**Alternatives considered:** `IHostedService` timer, database scheduler (pg_cron), external worker; allowing deadline extension via `PUT` to auto-return to `Draft` (rejected in favor of the strict lock).
