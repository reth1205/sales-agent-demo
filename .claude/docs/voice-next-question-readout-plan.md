# Plan: Voice Readout on Questionnaire Navigation

Date: 2026-05-20

## Requirement

When the questionnaire is in voice mode and the microphone is open, navigating with Next or Previous should read the newly active question automatically.

## Current Behavior

- Voice capture starts in `QuestionnaireStepper` in `src/App.tsx`.
- The current question is read with `speakText(question.prompt)` only when the microphone starts.
- If the user clicks Next/Previous or uses a voice navigation command while the microphone remains open, the active question changes but the app does not read the new prompt.

## Proposed Behavior

1. Track the last question read aloud while voice capture is active.
2. Replace the direct startup read with a helper that records the question id.
3. Add a reactive effect that watches the active question while:
   - questionnaire mode is `voice`
   - microphone is listening
   - no review panel is active
4. When the active question id changes, clear interim transcript text and read the new prompt.
5. Keep existing voice command behavior unchanged.

## Files Expected to Change

- `src/App.tsx`

## Acceptance Criteria

- Starting the microphone still reads the current question once.
- Clicking Next while the microphone is open reads the next question.
- Clicking Previous while the microphone is open reads the previous question.
- Voice navigation commands that move between questions also trigger the new prompt readout.
- Build passes.
