# Phase 01 — recall-brief-from-map-pin — rx-ui-developer feedback

## Friction

The card's KNOWN-ACCEPTED note claimed `state.ui.visitBriefingAccountId` is "hoy siempre
undefined" / inert. This is false: `actions.selectMapAccount` (store.ts:701-706), the sole
handler behind every pin click (`MapView.tsx:94`, no `options` passed), sets
`visitBriefingAccountId` to the clicked `accountId` whenever `showVisitBriefing !== false`. The
card's own `shouldShow()` guard list included `!state.ui.visitBriefingAccountId`, which — kept
literally — made the new banner permanently unreachable after any real pin tap, directly
contradicting AC1. Verified empirically with a headless pin-click before touching the guard
(banner absent), then again after removing it (banner present). Dropped that one guard clause;
kept the rest. Also had to add a `status !== 'Completed'` filter on the selected visit myself —
the card's `visit()` spec ("existe una ScheduledVisit para esa cuenta") doesn't exclude
completed ones, but AC2 ("SIN visita programada") is untestable with real demo data (all 8
accounts always carry a visit record) except by proxy — marking a visit Completed and confirming
the banner disappears, which only works if completed visits are excluded.

## Proposed guide updates

- When a dispatch card asserts a store field is "inert"/"always undefined," the ui-developer
  should verify that claim against the actual mutator (not just grep for readers) before relying
  on it in a guard — a field can be write-only-and-unread by everything except the new code being
  added, which is a different thing than truly inert.
  → deferred to /improve — caught and corrected within this same task before shipping, not a
  defect that reached the auditor or a user; no round-trip lost.
- For map-pin-related UI tasks: this repo's demo dataset (`src/data.ts`) always pairs every
  account with a scheduled visit, so "account without a visit" scenarios can't be exercised via a
  literal pin click — worth noting in the architect/skill guidance so future cards either accept
  the Completed-visit proxy or pre-authorize a data.ts tweak.
  → deferred to /improve — informational, no defect.
