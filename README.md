# Sales Agent Demo

SolidJS mobile web demo for a field sales agent workflow.

## Run locally

```bash
npm install
npm run dev
```

Open the local Vite URL printed by the terminal.

## Mobile app

The demo includes Capacitor projects for Android and iOS.

```bash
npm run mobile:sync
npm run cap:open:android
```

See `docs/capacitor-mobile.md` for push notification setup and native build notes.

## Backend

A real backend (ASP.NET Core + Postgres) is under active development in `server/`. See
`server/README.md` to run it locally. The frontend is migrating resource-by-resource from mock
data in `src/data.ts` to calling it.

## Contributing / building a feature

Backend and frontend feature work goes through a documented multi-agent pipeline —
**start at [`.claude/GUIA.md`](.claude/GUIA.md)** for how it works, who owns what, and where
to begin whether you're adding a product feature or maintaining the pipeline itself.

## Demo script

1. Sign in as Sofia Rivera.
2. On Dashboard, use `Use demo location` or focus the next visit pin.
3. Open Schedule and select `Simulate arrival` or `Start Visit`.
4. Mark the visit with `Finish Interview`.
5. Open the questionnaire, answer manually or use voice capture when supported.
6. Generate the review, edit the CRM summary, then confirm submission.
7. Open Reporting to review progress, tasks and sync status.
8. Open Settings to change interview questions or toggle offline mode.

## Mock limitations

- CRM updates are stored locally, not sent to Salesforce.
- Map tiles use OpenStreetMap through Leaflet.
- Geofencing is calculated in-browser with dummy coordinates.
- Voice uses browser Web Speech APIs when available and falls back to manual input.
- Offline sync is simulated with `localStorage`.
