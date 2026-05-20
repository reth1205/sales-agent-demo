# Plan: Questionnaire Scroll and Voice Navigation

Date: 2026-05-20

## Requirement

Adjust the floating questionnaire buttons so they no longer block answer writing or continuation, fix screen scrolling so users can reach the bottom of every view, and add voice control for the questionnaire navigation actions: Previous, Next, and Finish/Generate review.

## Current Findings

- The app is a Solid/Vite mobile-style demo.
- Main layout is in `src/App.tsx`.
- Scroll and fixed/mobile shell behavior is in `src/styles.css`.
- Questionnaire navigation is rendered by `QuestionnaireStepper`.
- The action bar uses `position: sticky` with `bottom: 86px`, which can overlay the answer textarea while scrolling.
- `.phone-shell` hides overflow and `.app-page` owns a fixed `height: 100vh`, which can prevent the app from reaching the final content in some viewport combinations.
- Voice recognition currently only captures answer text through the `Listen` button; it does not interpret navigation commands.

## Implementation Plan

1. Layout and scroll
   - Keep bottom navigation visible, but make the content area scroll reliably inside the phone shell.
   - Replace the questionnaire action bar's floating/sticky behavior with normal in-flow placement at the end of the stepper panel.
   - Add enough bottom padding to scrollable app content so final controls are reachable above the bottom navigation.
   - Ensure desktop phone-shell sizing still works without cutting off lower content.

2. Questionnaire action buttons
   - Keep Previous disabled on the first question.
   - Keep Next for intermediate questions.
   - Keep Generate review as the final-step action.
   - Make the bar readable and reachable without covering textarea input.

3. Voice navigation commands
   - Extend the questionnaire voice listener to recognize navigation commands in addition to dictated answers.
   - Supported commands:
     - `next`, `next question`, `continue`
     - `previous`, `previous question`, `back`
     - `finish`, `finalize`, `generate review`, `submit`
   - When a command is recognized, run the corresponding questionnaire action instead of writing the transcript into the answer.
   - On the final question, `next` should generate the review to match the visible final action.
   - Provide short toast feedback for recognized commands.

4. Verification
   - Run the TypeScript/Vite build.
   - Start the local dev server.
   - Use the in-app Browser to confirm the questionnaire page scrolls to its final controls and that the action bar no longer covers the textarea.
   - Do a lightweight source-level check that voice command phrases are wired to Previous, Next, and Generate review.

## Files Expected to Change

- `src/App.tsx`
- `src/styles.css`

## Acceptance Criteria

- Users can type multi-line questionnaire answers without the Previous/Next/Generate review controls covering the textarea.
- Users can scroll to the bottom of questionnaire and other app screens.
- Voice mode accepts navigation commands for Previous, Next, and Finish/Generate review.
- Build passes.
