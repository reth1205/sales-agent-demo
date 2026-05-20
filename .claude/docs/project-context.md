# Project Context: Sales Agent Demo

Last updated: 2026-05-20

## Summary

`sales-agent-demo` is a SolidJS + Vite mobile web demo for a field sales agent workflow. The app simulates a sales rep visiting customers, completing an interview, answering a post-visit questionnaire, generating CRM updates, and reviewing reporting/progress.

The app is intentionally local/demo-oriented:

- CRM data is mock data stored in the frontend.
- State persistence uses `localStorage`.
- Map rendering uses Leaflet and OpenStreetMap tiles.
- Voice capture uses the browser Web Speech APIs when available.
- Offline sync is simulated through an in-browser queue.

## Tech Stack

- SolidJS
- `@solidjs/router`
- Vite
- TypeScript
- Leaflet
- `lucide-solid` icons

## Local Commands

```powershell
npm install
npm run dev -- --port 5173
npm run build
```

Default local URL when using the command above:

```text
http://127.0.0.1:5173
```

## Key Files

- `src/main.tsx`: route registration and app bootstrap.
- `src/App.tsx`: main screens, navigation, dashboard, questionnaire, review, settings.
- `src/store.ts`: application state and business actions.
- `src/data.ts`: demo CRM data, visits, accounts, opportunities, default questions.
- `src/services.ts`: utility logic for distance, formatting, question filtering, summary interpretation, speech synthesis.
- `src/types.ts`: domain types.
- `src/styles.css`: full app styling, mobile shell layout, scroll behavior, buttons, panels, map overlays.
- `.claude/docs/`: planning and project documentation.

## Routes

- `/`: login page.
- `/dashboard`: map and next-visit workflow.
- `/clients`: CRM account, contact, opportunity, and activity context.
- `/schedule`: visit list and visit-state actions.
- `/visits/:visitId/questionnaire`: post-interview questionnaire and review flow.
- `/reporting`: progress, milestones, tasks, and sync queue.
- `/settings`: offline mode and interview question setup.

## Main User Flow

1. User signs in as Sofia Rivera.
2. Dashboard shows the map and next visit.
3. User starts a scheduled visit.
4. User finishes the interview.
5. Questionnaire becomes available.
6. User answers manually or by voice.
7. User generates a review summary.
8. User confirms the CRM update.
9. Reporting reflects progress, tasks, and sync status.

## State Model

Central state is created in `src/store.ts` with Solid's `createStore`.

Main state areas:

- `session`: authentication flag.
- `location`: current location, permission status, demo/live mode.
- `crm`: agent, accounts, contacts, opportunities, activities, generated tasks.
- `visits`: scheduled visits and visit statuses.
- `settings`: active questionnaire questions and offline mode.
- `progress`: daily progress percent and milestones.
- `queue`: simulated offline sync queue.
- `ui`: transient UI state such as active prompts and toasts.
- `questionnaire`: active visit, mode, question snapshot, answers, review, current question index.

Important actions:

- `login`, `logout`
- `requestBrowserLocation`, `useDemoLocation`, `focusVisitLocation`
- `startVisit`, `finishInterview`, `beginQuestionnaire`
- `updateAnswer`, `nextQuestion`, `previousQuestion`, `buildReview`
- `confirmReview`, `applyReview`, `syncQueue`
- `addQuestion`, `updateQuestion`, `toggleQuestion`, `removeQuestion`, `moveQuestion`, `restoreDefaultQuestions`

## Questionnaire Notes

The questionnaire flow lives mainly in `QuestionnaireStepper` and `ReviewPanel` inside `src/App.tsx`.

Questionnaire behavior:

- Questions are snapshotted from active settings when a questionnaire begins.
- Answers are stored by question id.
- Review generation uses `interpretVisitAnswers` from `src/services.ts`.
- Final confirmation either applies CRM updates immediately or stores them in the offline queue.

Recent update:

- Questionnaire action buttons were moved out of sticky/floating behavior so they do not block textarea input.
- App scroll layout was adjusted so users can reach final content above the bottom navigation.
- Voice navigation commands were added for Previous, Next, and Generate review/Finish.

Supported voice navigation command examples:

- Previous: `previous`, `previous question`, `back`, `anterior`, `pregunta anterior`, `regresar`
- Next: `next`, `next question`, `continue`, `siguiente`, `pregunta siguiente`, `continuar`
- Finish: `finish`, `finalize`, `generate review`, `submit`, `finalizar`, `terminar`, `generar revision`

## Layout Notes

The app is framed as a mobile phone shell:

- `.app-frame` centers the shell.
- `.phone-shell` owns the visual mobile viewport.
- `.app-page` owns vertical scrolling for authenticated screens.
- `.bottom-nav` is fixed to the bottom of the shell through absolute positioning.
- Dashboard map and visit overlays use absolute positioning and need care when changing shell overflow or bottom padding.

When adjusting layout, verify:

- Content reaches the final section on all screens.
- Bottom navigation does not cover important controls.
- Dashboard overlays remain usable above the bottom nav.
- Questionnaire textarea remains editable without action buttons blocking it.

## Verification Checklist

Before handing off changes:

```powershell
npm run build
```

Recommended manual check:

1. Open `http://127.0.0.1:5173`.
2. Sign in.
3. Start or continue a visit.
4. Open the questionnaire.
5. Type a long answer and confirm the textarea is not covered.
6. Scroll to the bottom and confirm buttons are reachable.
7. Switch to voice mode and test navigation commands when the browser supports speech recognition.
8. Generate review and confirm submission.

## Documentation Process

For future requested changes, create a plan document in `.claude/docs/` before implementation. Keep plans specific to the actual files and behavior involved.
