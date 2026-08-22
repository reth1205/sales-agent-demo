# SalesAgent backend

ASP.NET Core Web API + Postgres backend for the sales-agent-demo product. Owns login, customer
accounts, Salesforce communication, and AI script generation — the SolidJS/mobile app in `../src`
becomes a client of this service.

This is a **lean** setup: no Native-AOT, no zero-allocation budget, no row-level-security
multi-tenancy, no message bus. Just ASP.NET Core minimal APIs, Dapper over parameterized SQL, and
DbUp-journaled migrations. See `.claude/agents/rx-api-architect.md` for the conventions this
codebase follows and when that might change.

## Layout

```
server/
  SalesAgent.slnx
  src/
    SalesAgent.Api/          composition root — Program.cs, minimal API endpoints, OpenAPI
    SalesAgent.Domain/       entities, models, repositories, services, validators
    SalesAgent.Database/     DbUp console runner + scripts/ (migrations)
  tests/
    SalesAgent.Domain.Tests/ xUnit + Testcontainers.PostgreSql (real-Postgres repository tests)
    SalesAgent.Api.Tests/    xUnit + Microsoft.AspNetCore.Mvc.Testing (endpoint tests)
  docker-compose.local.yml   local Postgres only
```

Nothing under `SalesAgent.Domain/` has been built yet beyond the folder scaffold — the first real
resource (e.g. login, or the first CRM account) lands via the agent pipeline (`/feature` →
`/rx-api-crud` or `/rx-api-feature`, see the repo root `.claude/`).

## Run locally

```bash
docker compose -f docker-compose.local.yml up -d      # starts Postgres on :5432
dotnet run --project src/SalesAgent.Database           # applies migrations (none yet)
dotnet run --project src/SalesAgent.Api                 # http://localhost:5287
curl http://localhost:5287/health                       # {"status":"ok"}
```

To wipe and recreate the local database from scratch, see the `/recreate-db` skill (or run
`RESET_DB=1 dotnet run --project src/SalesAgent.Database` directly).

## Test

```bash
dotnet build SalesAgent.slnx
dotnet test tests/SalesAgent.Api.Tests/SalesAgent.Api.Tests.csproj      # no Docker needed
dotnet test tests/SalesAgent.Domain.Tests/SalesAgent.Domain.Tests.csproj # needs Docker (Testcontainers)
```

## Conventions

- **SQL is always parameterized** (Dapper, named parameters) — never string-built.
- **Migrations are owned exclusively by `rx-db-owner`** (see `.claude/orchestrators/db.md`) and
  require explicit human approval before they're written. Nothing else touches
  `SalesAgent.Database/scripts/*.sql`.
- **Validation lives in the service layer**, never in repositories or endpoints.
- No multi-tenancy/RLS yet — a single application role connects. If the product ever needs real
  tenant isolation (multiple sales orgs, not to be confused with CRM "customer accounts"), that's
  a new architecture decision to raise with the user first, not a default to assume.

## How the frontend will connect

Once the first resource ships, the SolidJS app calls it through a typed client module per
resource under `src/api/` (see `.claude/agents/rx-ui-architect.md`) — never raw `fetch` scattered
across views/components. Until a resource has a real endpoint, `src/data.ts` remains the source
of truth for it.
