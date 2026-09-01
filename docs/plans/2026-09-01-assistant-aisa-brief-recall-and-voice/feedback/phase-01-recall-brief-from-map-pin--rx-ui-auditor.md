# Phase 01 — recall-brief-from-map-pin — rx-ui-auditor feedback

## Friction

None. The card's KNOWN-ACCEPTED empirical claim about `selectMapAccount` (store.ts:701-706)
was independently verified: it sets `visitBriefingAccountId` to `accountId` whenever
`options.showVisitBriefing !== false`, and `MapView.tsx:94` (the only pin-click call site) never
passes that option, so the field goes truthy on every real pin tap — the removed guard was
correctly identified as dead-wrong, not a real hazard. Verified no other file reads
`visitBriefingAccountId` (grep across `src/**/*.ts(x)`, matches only in `store.ts` writes), so
removing the guard from this component is isolated and safe. The `status: 'Completed'` proxy for
"account without a scheduled visit" is reasonable given `src/data.ts`'s 1:1 account-visit
pairing, and the new `visit()` also correctly falls back to `undefined` for the untestable
true-no-visit case (`getSelectedMapVisit()` returns `undefined` when `selectedMapVisitId` is
unset), so the code is more general than the exercisable test surface requires — a good sign, not
scope creep.

## Proposed guide updates

None. The dispatch card's KNOWN-ACCEPTED section supplied exactly the empirical grounding needed
to verify without re-deriving it from scratch; no template or convention gap surfaced.
