# Plan: Voice Mode Without Question Readout

Date: 2026-05-20

## Requirement

In voice mode, starting the microphone should not read the questionnaire prompt aloud. The microphone should only be used to capture button commands and answer dictation.

## Current Behavior

- Starting voice capture reads the active question.
- Navigating to Next/Previous while the microphone is open reads the new active question.
- This can interfere with dictation and can still be unreliable because recognition and synthesis compete with each other.

## Proposed Behavior

1. Remove automatic question readout from voice mode.
2. Keep continuous microphone capture for:
   - navigation commands
   - answer dictation
3. Remove speech-synthesis guards that were only needed because questions were being read aloud.
4. Keep the live dictation panel and Start/Stop microphone controls.
5. Keep visible question text on screen as the source prompt.

## Files Expected to Change

- `src/App.tsx`

## Acceptance Criteria

- Starting the microphone does not speak the current question.
- Next/Previous does not speak the next or previous question.
- Voice commands still move through the questionnaire.
- Dictated responses are still appended to the active answer.
- Build passes.
