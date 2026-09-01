# Phase 3 — aisa-debrief-copy — rx-ui-developer feedback

## Friction

The brief's instruction for `ReviewPanel.tsx` ("localiza el texto de confirmación... busca
`confirmWithSalesforceSimulation` o el texto final del flujo") pointed at two different
candidates that behave very differently: the transient toast fired by `store.ts`'s
`confirmReview()` ("CRM updated successfully.") vs. the last entry of the local
`salesforceSteps` array shown in the sync-progress card. I initially added a second
`actions.showToast(...)` call right after `actions.confirmReview()`, but `confirmReview()`
already fires its own toast internally and immediately clears `state.questionnaire.review`
(unmounting `ReviewPanel`), so a second toast would race/overwrite the first with no guarantee
the user sees the AISA line, and it would have required touching `store.ts` to change the
canonical toast text — out of Slice-lane bounds. I instead replaced the last string in the local
`salesforceSteps` array (`'Salesforce update complete'` → the AISA confirmation line), which
stays visible in the sync-steps list for the full final animation beat before the panel
unmounts, without touching `store.ts` or the `confirmReview()` signature. Worth calling out
explicitly in future dispatch cards: "the text shown after sync" in this component is a local
step-label array, not the store-level toast — pointing at the array by name up front would have
saved a false start.

Also: no browser-automation tool was available in this session, so AC10's "manual verification
en `npm run dev`" could only be partially satisfied — confirmed the dev server boots and serves
200 on `http://127.0.0.1:5173/`, and `npm run build` (tsc -b + vite build) passes clean, but I
did not click through the actual debrief flow for `acct-urban-foods` in a real browser. Flagging
this rather than asserting the visual/layout behavior passed.

## Proposed guide updates

- rx-ui-developer.md (or the Ui orchestrator dispatch-card template): when a brief references
  "final confirmation text" in a component with both a store-driven toast and a local
  step-array, name the exact variable/array to edit — avoids an agent guessing between a
  store.ts edit (boundary violation) and a local text change.
