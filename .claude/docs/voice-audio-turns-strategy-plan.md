# Plan: Voice Audio Turns Strategy

Date: 2026-05-20

## Goal

Define a robust strategy for keeping voice mode active while preventing the app from capturing its own spoken question readout as an answer.

This plan is documentation only. It is not implemented yet.

## Recommended Strategy

Treat voice mode as an audio-turn workflow instead of keeping speech recognition actively capturing through every moment.

The user-facing experience can still feel like the microphone is open, but internally the app should pause capture while it speaks and resume capture afterward.

## Proposed Audio States

- `idle`: microphone is off.
- `listening`: speech recognition is active and capturing user answers or commands.
- `speaking`: the app is reading a question prompt through text-to-speech.
- `resuming`: short buffer after text-to-speech before recognition starts again.

## Flow

### Start Voice Mode

1. User taps `Start microphone`.
2. App sets a persistent intent flag such as `wantsVoiceOpen = true`.
3. App starts speech recognition.
4. State becomes `listening`.

### Read a Question

1. App stores that the user wants voice to remain open.
2. App stops `SpeechRecognition`.
3. App clears interim transcript text.
4. App sets state to `speaking`.
5. App reads the prompt using `SpeechSynthesisUtterance`.

### While Speaking

1. Recognition results should be ignored if any arrive while state is `speaking`.
2. UI should clearly show a state such as `Reading question`.
3. User dictation should not be expected during this state.

### Resume Listening

1. When speech synthesis finishes, app waits a short buffer such as `300ms-600ms`.
2. State becomes `resuming`.
3. If `wantsVoiceOpen` is still true and questionnaire mode is still `voice`, app restarts `SpeechRecognition`.
4. State becomes `listening`.
5. UI can show `Ready for your answer`.

## Defensive Filtering

As an additional guard, store the prompt that was just read and compare incoming transcripts against it.

Normalization should:

- lowercase text
- remove punctuation
- remove accents/diacritics
- collapse whitespace

If a transcript is very similar to the prompt, discard it. A practical first threshold would be around `70%-80%` similarity.

This is only a fallback. The primary protection should be pausing recognition while the app speaks.

## Interruptions

### User Stops Microphone

- Set `wantsVoiceOpen = false`.
- Stop recognition.
- Cancel any active speech synthesis.
- Clear interim transcript.
- State becomes `idle`.

### User Navigates While Speaking

- Cancel the current speech synthesis.
- Move to the new question.
- Start a new `speaking` turn for the new prompt if readout is enabled.

### Recognition Ends Unexpectedly

- If state is `speaking`, do not restart recognition immediately.
- If state is `listening` and `wantsVoiceOpen` is true, restart recognition.
- If mode changed, review was generated, or microphone was stopped, stay idle.

## UX Guidance

Keep the control simple:

- One primary button: `Start microphone` / `Stop microphone`.
- Visible status text:
  - `Listening`
  - `Reading question`
  - `Ready for your answer`
  - `Microphone paused`

The important distinction is that the app can present voice mode as continuously active while internally pausing actual capture during readout.

## Acceptance Criteria for Future Implementation

- The app can read a question without saving the prompt as an answer.
- The microphone resumes automatically after readout if the user kept voice mode active.
- User can still use voice commands for Next, Previous, and Generate review.
- User can stop the microphone at any time.
- Switching away from voice mode stops recognition and speech synthesis.
- Build passes.
