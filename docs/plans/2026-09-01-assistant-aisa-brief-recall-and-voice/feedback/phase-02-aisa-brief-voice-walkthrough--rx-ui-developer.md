# Phase 02 — aisa-brief-voice-walkthrough — rx-ui-developer feedback

## Friction

The card's advance-semantics rule ("moves step to 'ended' ONLY through endBriefing/simulateApproach — do NOT auto-fire onEndBriefing") took a re-read to parse into an implementable rule. What it actually means in code is: don't let `promptIndex` overrun the array, and gate the "AISA is asking" section on a `reachedEnd` flag rather than a step transition — the existing `qa` step just keeps rendering with the CTA row (already unconditional) doing the work. Spelling out "introduce a `reachedEnd`-style boolean gate distinct from `step`" in the spec would save the derivation.

Minor: the brief's "Next"/"Skip" both ended up calling the same `goNext()` internally — the acceptance criteria don't require them to diverge, but a card that anticipates this (and either blesses the duplication explicitly or asks for differentiated copy/behavior) would remove a small judgment call from the builder.

## Proposed guide updates

- rx-ui-architect briefs that describe a multi-step local-state advance flow (like this one) could include a one-line note recommending a dedicated "reached the end of the sequence" boolean signal instead of overloading the step enum, since it's the naturally reusable pattern for this shape (prompt-queue-with-a-completion-gate).
  → deferred to /improve — process suggestion, no shipped defect.

---
Word count check: under 400.
