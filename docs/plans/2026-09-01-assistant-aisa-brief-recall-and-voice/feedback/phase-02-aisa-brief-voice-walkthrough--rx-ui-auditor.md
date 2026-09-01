# Phase 02 — aisa-brief-voice-walkthrough — rx-ui-auditor feedback

## Friction

- The card's "voice nav as bonus, not substitute" framing (item 4) doesn't state whether each
  individual voice command (`next`/`previous`/`finish`) needs to be behaviorally correct on its
  own, or whether it's enough that manual controls always cover for it. I found `finish` jumps to
  the last question but leaves `reachedEnd` false (doesn't actually end the walkthrough, unlike
  `QuestionnaireStepper`'s `finish` → `startAiReview()`). It's non-blocking only because the CTA
  row happens to render unconditionally regardless of `reachedEnd` — that's incidental, not
  something the acceptance criteria asked me to check for. A card that states "each voice command
  bonus must independently do what its name implies, even though manual controls also cover it"
  would have made this a clean CRITICAL/pass call instead of a judgment call.
- Verifying the `speechToken` guard against "the same pattern as `QuestionnaireStepper.tsx`"
  required diffing two ~300-line effect blocks by hand since the acceptance criteria named the
  comparison but the card doesn't excerpt either pattern. A one-line pointer to the exact
  `QuestionnaireStepper` line range being referenced would save a full-file read on this kind of
  cross-file pattern check.

## Proposed guide updates

| # | Target | Proposal | Status |
|---|---|---|---|
| 1 | `.claude/agents/rx-ui-auditor.md` | Add a check item for voice/bonus-nav features: verify each named voice command performs the action its label implies, independent of whether a manual-control fallback happens to cover the gap — don't let fallback coverage substitute for verifying the command itself. | proposed → applied — added catalog row S2 to `.claude/agents/rx-ui-auditor.md`, citing this exact "finish" defect as the worked example. The underlying defect itself (voice "finish" jumped to the last prompt instead of ending the walkthrough, `AisaBriefingDialog.tsx` `handleVoiceCommand`) was also fixed directly by the conductor in this same close-out (one-line change, `setReachedEnd(true)`), verified with `npm run build`. |
| 2 | Dispatch-card template (`/feature` skill or orchestrator README) | When ACCEPTANCE references "same pattern as `<file>`" for a guard/effect, cite the line range in the card so the auditor doesn't re-derive it from a full-file read. | proposed → deferred to /improve — ergonomics suggestion, no shipped defect named. |

---
Word count check: under 400.
