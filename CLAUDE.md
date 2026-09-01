# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```powershell
npm install
npm run dev            # Vite dev server on http://127.0.0.1:5173
npm run test           # tsc -b (type-check only, no test runner in this repo)
npm run build          # tsc -b && vite build -> dist/
npm run preview        # preview the production build
npm run mobile:sync    # build + cap sync (copies dist/ into android/ and ios/)
npm run cap:open:android
npm run cap:open:ios   # macOS + Xcode only
```

There is no unit test suite or linter configured — "testing" a change means `npm run build` (type-checks via `tsc -b` and produces the Vite bundle) plus manually exercising the flow in the browser at the dev URL. The `.github/workflows/deno.yml` workflow is stale boilerplate unrelated to this stack (project is TypeScript/Vite/SolidJS, not Deno) — ignore it.

```bash
cd server
docker compose -f docker-compose.local.yml up -d     # local Postgres
dotnet run --project src/SalesAgent.Database          # apply migrations
dotnet run --project src/SalesAgent.Api                # http://localhost:5287
```

See `server/README.md` for the backend's full command reference.

## Architecture

SolidJS + Vite + TypeScript + `@solidjs/router` mobile-web app for a field sales agent workflow (visit a customer, run an interview, fill a post-visit questionnaire, generate a CRM update, review reporting). It also ships a manager-facing command center (team map, agent drill-downs, KPIs) and an "AI assistant" layer (pre/post-meeting briefings, notifications, Salesforce writeback).

**The product is migrating off the original all-mock demo.** A real backend now lives in
`server/` (ASP.NET Core + Postgres — see `server/README.md`) that will own login, customer
accounts, Salesforce communication, and AI script generation; the SolidJS/mobile app becomes a
client of it. Until a given resource has a real endpoint, it stays on its original demo
behavior: CRM data static in `src/data.ts`, persistence in `localStorage`, "AI" outputs
deterministic mock logic. Check `server/src/SalesAgent.Api/` for what's actually wired up before
assuming either the mock or the real path for a given feature.

This repo also runs a multi-agent build pipeline under `.claude/` (agents, orchestrators,
skills — entry point is the `/feature` skill) for backend/frontend feature work going forward;
**see `.claude/GUIA.md` for the full usage guide** (how these skills/agents actually get
invoked in Claude Code, the agent roster, worked examples).

The app is also wrapped with Capacitor for iOS/Android (`ios/`, `android/`, `capacitor.config.ts`); see `docs/capacitor-mobile.md` for native push-notification setup. `src/mobileNotifications.ts` bridges `@capacitor/push-notifications` and `@capacitor/local-notifications` to the in-app toast/notification system, and is a no-op-safe shim on web (checks `Capacitor.isNativePlatform()`).

### Data flow

- `src/store.ts` — single source of truth. A Solid `createStore` (`AppState`) holds `session`, `location`, `crm`, `manager`, `visits`, `settings`, `progress`, `queue`, `assistant`, `ui`, and `questionnaire` slices, plus an `actions` object with every state mutation (login/logout, visit lifecycle, questionnaire flow, notification/briefing simulation, manager insights). Selected slices are persisted to `localStorage` under `sales-demo-*` keys (see `storageKeys` in that file) and rehydrated with `load`/`save` helpers on boot.
- `src/selectors.ts` — read-only derived queries over `state` (nearby accounts, map pin type, coverage risk, etc.). Prefer adding a selector here over duplicating a query inline in a component.
- `src/services.ts` — pure functions with no state access: distance/geo math, formatting, voice/speech (Web Speech API) wrappers, review/extraction "interpretation" logic, and mock briefing/recommendation builders.
- `src/data.ts` — all static demo data (accounts, contacts, opportunities, activities, agents, default questionnaire, manager metrics).
- `src/types.ts` — every domain type; consult this first when touching store/selectors/services signatures.

Components read `state` and call `actions`/selectors directly (no prop-drilled dispatch, no context providers beyond `VisitContext`) — importing `state`/`actions` from `./store` anywhere is the norm, not an anti-pattern here.

### UI structure

- `src/main.tsx` registers routes and mounts `App` as the router root.
- `src/App.tsx` is just the authenticated shell (phone-frame layout, bottom nav, toast, mobile-notification listener wiring) and re-exports the page components — it is not where page logic lives.
- `src/views/*.tsx` — one file per route (`LoginPage`, `DashboardPage`, `ClientsPage`, `SchedulePage`, `QuestionnairePage`, `ReportingPage`, `SettingsPage`), exported via `src/views/index.ts`.
- `src/components/*.tsx` — presentational/feature components used by views (map, questionnaire stepper, review panel, manager panels, notification sheets, etc.).
- `src/styles.css` — single global stylesheet for the whole app, including the mobile phone-shell frame (`.app-frame`, `.phone-shell`, `.app-page`, `.bottom-nav`). Dashboard map overlays and the bottom nav use absolute positioning against this shell — check overlay/scroll behavior on any layout change (bottom nav must not cover controls, questionnaire textarea must stay reachable/unobstructed).

### Routes

`/` login · `/dashboard` map + next visit · `/clients` CRM detail · `/schedule` visit list/actions · `/visits/:visitId/questionnaire` post-interview flow · `/reporting` progress/team/insights (manager views) · `/settings` questionnaire config + offline mode toggle.

## Conventions

- Before implementing a requested change, write a short plan doc under `.claude/docs/` describing the specific files/behavior involved (existing convention in this repo — see other files in that directory for the expected shape). This is the older, lightweight convention from the demo era; the newer multi-agent pipeline (see `.claude/README.md`) uses its own, more structured `docs/plans/YYYY-MM-DD-<AREA>-<slug>/plan.md` format instead — use that one for anything routed through `/feature`.
- Voice/questionnaire navigation recognizes both English and Spanish commands (e.g. `next`/`siguiente`, `previous`/`anterior`, `finish`/`finalizar`) — preserve both when touching that logic in `QuestionnaireStepper`/`services.ts`.
- Offline mode is simulated via the `queue` state slice, not a real network layer; `syncQueue` in `store.ts` is the "sync" action.
- `evaluateVisitObjectives`/`combineDebriefText` in `src/services.ts` match keywords against the concatenated text of every answered question's prompt AND answer — this means every objective's `requiredSignals`, every `objectiveQuestionCopy` prompt, and every `buildSimulatedObjectiveAnswer`/`buildBriefingFollowUpAnswer` string share one **global keyword namespace**. Adding or editing any of these requires checking the new keyword doesn't appear in another objective's prompt/answer/interpolated data (account/opportunity fields included) — a collision silently misattributes a `met` status or starves a keyword-dispatch function's intended branch. See the doc comment above `objectiveQuestionCopy` in `services.ts` for the current keyword sets.
