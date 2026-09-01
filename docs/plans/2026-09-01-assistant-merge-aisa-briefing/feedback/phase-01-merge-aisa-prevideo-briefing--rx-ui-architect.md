# Feedback — phase-01 merge-aisa-prevideo-briefing (rx-ui-architect)

## Friction

- **Acceptance 4 is ambiguous about when the sheet closes.** It reads "tocarlo corre la animación
  de ruta (~15s) y cierra el sheet al terminar". Taken literally that means the AISA sheet stays
  mounted over the map for the whole animation — which hides the very thing the CTA exists to
  show, and fights `startClientDestinationDemo`'s existing first act (it clears
  `activeAssistantNotificationId` at its top). I shipped the sheet closing *at CTA tap*, which
  still satisfies "closed by the time it ends" but is not what a literal auditor read produces.
  The card should have stated the intent (map visible during the animation) rather than a timing.

- **Notification-id collision was a near miss the card did not flag.** The obvious id for a
  pre-visit briefing is `pre-${visitId}` — and that is exactly the id `schedulePreMeetingDemo`
  guards on (`store.ts`, early-return when a non-dismissed `pre-` notification exists). No creator
  produces that id today, so the guard is dead; producing it would have silently broken acceptance
  6 (Map Demo unchanged) with nothing in the diff pointing at Map Demo. Shipped as
  `previsit-${visitId}`. A card that names an out-of-scope tour should also name the state keys
  that tour reads.

- **`AssistantNotification.triggerReason` is a closed union in `types.ts`** with no "user asked
  for it" member — every existing value is a timer or a geofence. Adding `manualBriefRequest` was
  a types.ts edit the card did not anticipate. Worth expecting whenever a new entry point is a tap.

## Proposed guide updates

| # | Target | Proposal | Status |
|---|---|---|---|
| 1 | `.claude/skills/feature` (grilling checklist) | When a task creates a store notification/briefing, require the plan to enumerate the existing id prefixes (`eta-`, `arrival-`, `post-`, `pre-`) and the guards that read them, so a new entry point cannot silently collide with an out-of-scope flow. | proposed → deferred to /improve — caught and shipped correctly within this same task (`previsit-` prefix), not an occurred/shipped defect; no production round-trip lost. |
| 2 | `.claude/agents/rx-ui-architect.md` | Add to the brief-precision rules: acceptance criteria that state a *timing* ("closes when it ends") must be restated as an *outcome* before implementation; the architect names the outcome in the Design Brief so the auditor grades the outcome, not the phrasing. | proposed → deferred to /improve — resolved sensibly within this task, no defect shipped. |
| 3 | `CLAUDE.md` (Data flow) | Note that `src/components/` briefing dialogs are strict props-in/events-out and that new user-initiated flows usually need a `triggerReason` union member in `src/types.ts`. | proposed → deferred to /improve — anticipated and handled correctly within this task, no defect shipped. |
