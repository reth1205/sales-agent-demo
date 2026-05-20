# Plan: Continuous Voice Answer Space

Date: 2026-05-20

## Requirement

Add a dedicated space for answering questionnaire questions in voice mode, and keep the microphone open while the user is dictating. After the plan is documented, implement the change.

## Current Behavior

- The questionnaire is implemented in `QuestionnaireStepper` inside `src/App.tsx`.
- Voice mode currently shows a compact `Listen` button.
- Pressing `Listen` starts one speech-recognition session and writes the single transcript result into the current answer.
- The same listener already recognizes some navigation commands such as Previous, Next, and Generate review.
- The answer textarea is always available, but voice mode does not have a clear live dictation area or persistent microphone state.

## Proposed Behavior

1. Voice answer space
   - In voice mode, show a dedicated voice dictation panel inside the active question card.
   - The panel should show whether the microphone is active.
   - The panel should show interim transcript text while the user is speaking.
   - Captured speech should append into the current question's answer instead of replacing the whole answer.

2. Continuous microphone
   - Replace the one-shot `Listen` behavior with a start/stop microphone control.
   - Configure speech recognition with `continuous = true` and `interimResults = true` when supported by the browser.
   - If the browser ends recognition unexpectedly while voice mode is still active, restart it so the mic stays open.
   - Stop the microphone when the user switches away from voice mode or when the component is cleaned up.

3. Voice navigation commands
   - Keep existing voice commands for Previous, Next, and Finish/Generate review.
   - Do not append recognized navigation commands into the answer text.
   - After a voice navigation command changes the active question, keep the microphone active if the user had it open.

4. Manual fallback
   - Keep the normal textarea available so the user can edit dictated text.
   - When browser speech recognition is not available, keep the existing fallback message.

5. Verification
   - Run `npm run build`.
   - Do a source-level check for continuous speech recognition setup and cleanup.
   - If browser automation is available, manually verify that the voice panel and scroll layout are still usable.

## Files Expected to Change

- `src/App.tsx`
- `src/styles.css`

## Acceptance Criteria

- Voice mode includes a visible space for live dictation.
- The microphone can remain open until the user stops it or leaves voice mode.
- Interim speech appears in the voice space.
- Final speech appends into the active answer.
- Voice navigation commands still trigger Previous, Next, and Generate review without being saved as answer text.
- Build passes.
