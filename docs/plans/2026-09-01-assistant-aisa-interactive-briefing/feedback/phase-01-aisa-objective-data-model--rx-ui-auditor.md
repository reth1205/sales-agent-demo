# Feedback — phase-01-aisa-objective-data-model — rx-ui-auditor

## Friction

The dispatch card asserted `src/types.ts`/`src/data.ts` were "already applied and committed
separately by the architect in a prior step." `git log -- src/types.ts src/data.ts` shows no
such commit exists at HEAD — both files are still uncommitted working-tree modifications,
identical in kind to `src/services.ts`. The instruction to "verify yourself" caught this, so it
cost only one extra `git log` round-trip, but a wrong premise in the card is exactly the kind of
thing that would mislead an auditor who trusts the card's framing over `git status`. Substance
was unaffected here (the diffs are exactly what BRIEF asked for), but the card should not assert
a repo state it hasn't confirmed.

Keyword-collision verification (AC6's actual risk surface) required manually cross-checking 7
keyword sets against 7 prompts and 7 simulated answers by hand — no tooling in this repo does
this. For a task class that will recur (this file's docstring already documents the constraint
for future contributors), a small script asserting no keyword set is a substring of any other
objective's prompt/simulated-answer would remove an entire category of silent-bug risk and make
this audit step mechanical instead of manual-eyeball.

## Proposed guide updates

- Row: rx-ui-architect (or rx-api-tester-equivalent for UI) — when a task's docstring itself says
  "IMPORTANT: reword with care, no keyword collisions" for a matching namespace, consider adding
  a lightweight guard (a `scripts/check-objective-keywords.ts` or a `tsc`-time assertion) rather
  than relying on every future editor/auditor manually cross-referencing N×N string sets. Low
  priority — only worth it if this objective-matching pattern grows past its current 7 entries.
- Row: dispatch-card authoring (orchestrator Ui / `/feature`) — do not state a file's commit
  status as fact in a dispatch card unless it was just verified; say "should already be committed
  — verify" instead of asserting it, so a card revision doesn't need to catch its own inaccuracy
  via the auditor's independent check every time.
