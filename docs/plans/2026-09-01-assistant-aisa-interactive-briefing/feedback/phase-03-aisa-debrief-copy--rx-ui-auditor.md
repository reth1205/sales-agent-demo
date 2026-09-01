# Phase 3 — aisa-debrief-copy — rx-ui-auditor feedback

## Friction

None significant. The dispatch card's pointer to `buildDebriefTransitionCopy` and the three
target files was accurate and sufficient to verify without opening `plan.md`. One near-miss: the
900ms `setTimeout` gate the developer added to `handleNext` to make the transition line
observable is, strictly read, a change to "the navigation mechanism" (the guardrail's literal
text forbids touching it) — but it's also the only way to satisfy AC7's "visible... before
advancing" without a real per-user pause. I read it as sanctioned because it preserves call order
(stopVoiceCapture → cancelSpeech → speakText all still fire only from the same createEffect,
now merely deferred) and every entry point into `handleNext` (button click, voice "next"/
"siguiente") goes through the same gate. Confirmed no overlap between the transition text and the
next question's TTS by tracing the effect trigger to `actions.nextQuestion()`, which only fires
after the timer clears `transitionCopy`.

## Proposed guide updates

- rx-ui-feature.md / dispatch-card template: when a brief says "don't modify the existing
  mechanism, only add text/UI around it" but the acceptance criterion requires that added UI to
  be *observable* (not instantaneous), call out explicitly whether a timing gate on the
  triggering handler counts as "mechanism" or "UI." This task's card left it to the auditor's
  judgment; a one-line clarification in the card template would remove the ambiguity for both
  builder and auditor.
- Same as the rx-ui-developer feedback filed alongside this task: when a brief points at "the
  final confirmation text" in a component with both a store-level toast and a local
  step-label array, name the array/variable explicitly.
