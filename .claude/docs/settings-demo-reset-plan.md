# Plan: Settings Demo Cleanup Controls

Date: 2026-05-20

## Requirement

Add cleanup controls to Settings so the demo can be reset from the UI instead of using DevTools/localStorage commands. This is needed because visits/tasks can all appear completed after testing the flow several times.

## Current Behavior

- Demo state is persisted in `localStorage`.
- Generated tasks are stored under `sales-demo-tasks`.
- Visit completion state is stored under `sales-demo-visits`.
- Daily progress is stored under `sales-demo-progress`.
- Offline queue state is stored under `sales-demo-queue`.
- The Settings page currently supports offline mode, question setup, restoring default questions, and sign out, but does not expose demo cleanup controls.

## Proposed Behavior

1. Store actions
   - Add `clearTasks()` to remove generated CRM tasks.
   - Add `resetDemoActivity()` to reset visits, progress, queue, generated tasks, transient UI prompt/toast, and active questionnaire state.
   - Keep session, configured questions, and offline mode intact.

2. Settings UI
   - Add a new Settings panel for demo cleanup.
   - Show simple counts for generated tasks, pending sync items, and completed visits.
   - Add a button to clear generated tasks only.
   - Add a button to reset demo activity when visits/progress need to return to the initial demo state.

3. Safety
   - Avoid clearing custom interview questions unless the user uses the existing Restore defaults button.
   - Avoid logging the user out.
   - Use toast messages to confirm what happened.

4. Verification
   - Run `npm run build`.
   - Confirm the new actions are available from Settings.

## Files Expected to Change

- `src/store.ts`
- `src/App.tsx`
- `src/styles.css`

## Acceptance Criteria

- Settings includes cleanup controls.
- User can clear generated tasks without resetting questions/session.
- User can reset visits/progress/queue/tasks to initial demo activity.
- Build passes.
