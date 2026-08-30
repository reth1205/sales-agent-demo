## Friction

The Design Brief was unusually implementation-ready: the shared surface (services.ts,
store.ts) was already committed with a doc comment explaining the objectiveQuestionCopy
keyword-signal guardrail, and the CSS classes (`.question-card`, `.question-progress`,
`.question-action-bar`, `.objective-review-*`) were already present in styles.css before I
touched it — the architect clearly pre-built the CSS alongside the store change in the same
commit that shipped the "shared surface." That made this task close to pure wiring rather than
design. Only real judgment calls I had to make on my own: (1) whether "Next becomes finish on
last question" (AC3) and the always-visible "Finish debrief now" button (AC7) should coexist —
I kept both since the brief phrased them as two separate ACs with no stated conflict; (2)
whether voice-mode auto-start-listening (present in the old single-transcript flow) should
survive into the per-question flow — I dropped it, since auto-starting the mic while
`speakText` might still be finishing the question prompt risks capturing overlapping audio,
which would violate the spirit of AC5 (no overlap). This wasn't specified either way in the
brief; worth confirming it's the right call.

One minor gap: the brief's AC10 voice-navigation spec says "si devuelve un comando... si
devuelve undefined, es la respuesta" but doesn't say what happens when the *last* question's
"next" voice command is spoken — I routed it through the same `handleNext` that the Next button
uses (so it finishes on the last question, consistent with AC3), but this required inference
rather than being stated.

## Proposed guide updates

- None blocking. The brief's practice of pre-shipping both the store/services surface AND the
  consuming CSS classes in the same "architect surface" commit worked well here and is worth
  keeping as the pattern for Full-lane tasks where the developer's file scope is narrow
  (components/views only) — it meant zero HALT/escalation round-trips were needed.
