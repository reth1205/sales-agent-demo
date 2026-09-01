# Feedback — phase-02 aisa-briefing-dialog — rx-ui-auditor

## Friction

- No blocking friction with the card itself. One real defect found, not a card-clarity issue:
  `buildBriefingFollowUpAnswer` (src/services.ts:332) routes on `asked.includes('stage'|'opportunity'
  |'commercial'|'pipeline')`, but the actual `suggestedQuestions[1]` when an opportunity exists
  (services.ts:238) is `Is ${opportunity.name} still in ${opportunity.stage}?` — and every
  `opportunity.stage`/`.name` in `data.ts` (Discovery, Proposal, Negotiation, Pricing, Evaluation,
  Closed Won; "Route Intelligence Pilot", "Manufacturing Field CRM", etc.) contains none of those
  four keywords. So for any account with an open opportunity — the majority of the demo data —
  that question always falls through to the generic executiveSummary fallback instead of the
  dedicated branch, silently. It happens to still read as "distinct per question" only because the
  other two suggested questions do hit their branches; add a second opportunity-shaped question and
  two taps would return the identical fallback string. Traced, not guessed — verified against the
  literal `data.ts` opportunity rows.
- The architect's own feedback file says this branch was written specifically "clasifica por
  palabra clave" to match these three generated questions — worth a proposed guide update so this
  class of bug (keyword branch vs. actual generated string) gets a quick manual trace step before
  handoff, not just "does it compile."
- No browser-automation tool was available in this session (no Playwright/screenshot capability),
  matching the developer's own note. I traced statically (mount gating via `Show when={notification()}`
  in `AssistantNotificationSheet.tsx`, signal defaults in `AisaBriefingDialog.tsx`, `npm run build`
  green) but did not visually drive `npm run dev` — flagging that explicitly per the dispatch card's
  step 7 rather than certifying a "visual pass."

## Proposed guide updates

| Archivo | Cambio propuesto | Disposition |
|---|---|---|
| `.claude/agents/rx-ui-architect.md` | When a new pure function branches on `.includes(keyword)` against a *generated* string (suggestedQuestions, dynamic copy), require the author to trace at least one real generated value per branch against actual `data.ts` content before handoff — compiling is not enough to catch a dead branch. | → applied 0ac9364 (same fix already landed for the identical row on the phase-01/phase-02 architect feedback files) |
| `.claude/orchestrators/ui.md` | Codify the "no browser-automation tool available" fallback the developer already improvised (static trigger-path trace + explicit disclosure) as the standard note format, so auditors don't have to re-derive it each time. | deferred to /improve — process-consistency nit, no defect attached; also partly moot: the conductor did run a real browser (Playwright) for live verification of this plan before close. |
