# Feedback — phase-01 postvisit-guided-debrief — rx-ui-auditor

## Friction

The card's AC5 says "En modo voz, la pregunta activa se habla automáticamente" but the
implementation's `createEffect` (QuestionnaireStepper.tsx:274-281) has no `state.questionnaire
.mode` guard at all — it calls `speakText` on every active-question change regardless of mode,
so text-mode users also get the prompt spoken aloud. This wasn't caught by the developer's own
self-check (their feedback file discusses the voice-auto-start-listening tradeoff but not this).
Nothing in the card or brief flagged "verify the effect actually reads `mode`" as a specific
self-check step for AC5 — it just states the desired behavior and trusts the implementer to gate
it. For an AC that names a specific mode as its trigger condition, the card/brief convention
could ask explicitly "does the guard read the mode signal, or just fire unconditionally?" the
same way the architect's own feedback file (this same plan dir) already proposes for the
keyword-collision self-check. This is the second time in this same plan that a "text describes
correct behavior, code implements a superset of it" gap slipped through a stage — worth a
recurring self-check line for guided/conditional flows generally, not just this one AC.

Everything else about this card was unusually easy to audit fresh-context: the card gave literal
Vocabulary names for every function it expected me to check signatures on
(`buildObjectiveInterviewQuestions`, `evaluateVisitObjectives`, etc.), so grep-and-compare over
services.ts was mechanical rather than exploratory. The explicit "confirm with `git diff main --
<file>`" instructions for AC8/AC9 were similarly fast to execute — recommend keeping that pattern
(naming the exact diff command in the card) for any future no-diff guardrail.

## Proposed guide updates

- `.claude/agents/rx-ui-auditor.md` or the dispatch-card template: for any AC phrased as
  "in mode/state X, behavior Y happens automatically," add a standing self-check instruction —
  "confirm the triggering effect/handler actually reads the named mode/state signal in its guard,
  not just its dependency list" — since an effect can satisfy "cancels on change, no overlap"
  while still firing unconditionally across every mode, which is the exact shape of the AC5 miss
  found here. Status: applied — docs/plans/_templates/plan.md § Reglas de BRIEF ACCURACY.
