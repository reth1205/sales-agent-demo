# Plan: Prevent Question Readout from Being Captured

Date: 2026-05-20

## Requirement

Fix voice mode so the app does not add the spoken question prompt to the user's answer.

## Current Behavior

- The microphone remains open in continuous voice mode.
- When the app reads a question aloud through speech synthesis, speech recognition can capture that audio.
- Captured readout text is treated like dictated answer text and appended to the current response.

## Proposed Behavior

1. Add a temporary readout state while the app is speaking a question prompt.
2. Pause speech recognition before reading a prompt so the microphone does not capture the app's own audio.
3. Reopen recognition after the speech synthesis finishes, only if the user still wants voice capture open.
4. Ignore any recognition result received during prompt readout as a defensive fallback.
5. Keep existing continuous dictation and voice navigation commands unchanged.

## Files Expected to Change

- `src/App.tsx`

## Acceptance Criteria

- Starting voice mode reads the current question without saving the question text as an answer.
- Navigating to Next/Previous reads the new question without adding it to the answer.
- After the prompt is read, the microphone resumes listening for the user's answer.
- Existing voice commands still work.
- Build passes.
