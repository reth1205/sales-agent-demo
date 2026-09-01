## Friction

None. The brief's contract for `AssistantNotificationSheet.tsx` was exact and matched the
existing code precisely: `briefingParagraphs` was the only local symbol to remove, the nested
`Show` callback pattern (guarding on `briefing()` then `account()`) was the correct way to avoid
passing `undefined` into the component's required props, and `getAccountOpportunity` was already
exported next to `getVisitAccount` in `selectors.ts` with the exact signature needed. No
escalation was required.

One gap: this environment has no browser-automation tool (no Playwright/screenshot capability),
so I could not visually drive `npm run dev` through the actual flow (open a briefing
notification → prompt → summary → tap a suggested question → qa → End briefing). I instead
traced the trigger path statically to build confidence: `DashboardPage.tsx`'s map-demo start
calls `actions.schedulePreMeetingDemo(visit.id)` (store.ts:879), which after
`assistantTiming.demo.preMeetingLeadSeconds` (15s) calls `triggerPreMeetingBriefing` →
`triggerArrivalBriefing`, which builds a `PreMeetingBriefing` via `buildPreMeetingBriefing` and
upserts a notification of type `arrivalBriefing`. `isBriefing()` in the sheet already matched
both `arrivalBriefing` and `preMeetingBriefing`, so no change was needed there. `AssistantNotificationSheet`
mounts exactly once, in `DashboardPage.tsx`. `npm run build` (`tsc -b && vite build`) passed
clean with no unused-import errors after removing `Sparkles`/`For`.

## Proposed guide updates

- Dispatch cards/briefs in this repo routinely ask the developer to "verify visually in `npm run
  dev`." Worth a one-line addition to `rx-ui-developer`'s self-verification section (or the `ui`
  orchestrator doc) clarifying the fallback when no browser-automation tool is available in the
  session: trace the state/trigger path statically and say so explicitly in the report, rather
  than silently skipping or fabricating a "verified" claim. This came up cleanly here because the
  trigger path was traceable in `store.ts`, but a future brief might depend on visual-only
  behavior (CSS layout, animation timing) that static tracing can't confirm — worth flagging that
  distinction so developers know when to escalate "cannot verify" rather than just note it.
