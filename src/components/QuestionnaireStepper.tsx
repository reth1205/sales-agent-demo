import { Bot, CheckCircle2, ClipboardList, LoaderCircle, Mic, MicOff, Sparkles } from 'lucide-solid';
import { createSignal, For, onCleanup, Show } from 'solid-js';
import { getVisitAccount } from '../selectors';
import { actions, state } from '../store';

const VOICE_NOTE_ID = 'voice-debrief-notes';

const aiReviewSteps = [
  'Reading meeting notes',
  'Finding Opportunity, Task, Meeting, Contact, and Risk signals',
  'Preparing Salesforce update list',
  'Ready for review',
];

const demoTranscript = [
  'Meeting lasted 32 minutes with Mariana Torres and the operations team.',
  'Opportunity should move to Proposal because they confirmed budget approval for the route intelligence pilot.',
  'Task: send the updated proposal and pricing deck next week.',
  'Contact update: Mariana Torres remains the champion, and procurement needs final pricing confirmation.',
  'Risk: implementation timeline is tight, so flag renewal and rollout timing as a customer risk.',
].join(' ');

function QuestionnaireStepper() {
  const review = () => state.questionnaire.review;
  const visit = () => state.questionnaire.visitId ? state.visits.find((item) => item.id === state.questionnaire.visitId) : undefined;
  const account = () => {
    const currentVisit = visit();
    return currentVisit ? getVisitAccount(currentVisit) : undefined;
  };
  const [speechSupported] = createSignal(Boolean((window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition || (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition));
  const [isListening, setIsListening] = createSignal(false);
  const [isAnalyzing, setIsAnalyzing] = createSignal(false);
  const [aiStepIndex, setAiStepIndex] = createSignal(0);
  const [interimTranscript, setInterimTranscript] = createSignal('');
  let recognition: SpeechRecognitionLike | undefined;
  const aiTimers: ReturnType<typeof window.setTimeout>[] = [];

  const transcript = () => state.questionnaire.answers[VOICE_NOTE_ID] ?? '';
  const hasTranscript = () => Boolean(transcript().trim());
  const clearAiTimers = () => {
    aiTimers.forEach((timer) => window.clearTimeout(timer));
    aiTimers.length = 0;
  };
  const getSpeechCtor = () =>
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition
      ?? (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
  const updateTranscript = (value: string) => actions.updateAnswer(VOICE_NOTE_ID, value);
  const appendTranscript = (value: string) => {
    const cleanValue = value.trim();
    if (!cleanValue) return;
    const current = transcript().trim();
    updateTranscript(`${current}${current ? ' ' : ''}${cleanValue}`);
  };
  const stopVoiceCapture = () => {
    setIsListening(false);
    setInterimTranscript('');
    recognition?.stop?.();
    recognition = undefined;
  };
  const startVoiceCapture = () => {
    const SpeechCtor = getSpeechCtor();
    if (!SpeechCtor || recognition || isListening()) return;

    recognition = new SpeechCtor();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: SpeechRecognitionResultEventLike) => {
      let finalTranscript = '';
      let interim = '';
      const startIndex = event.resultIndex ?? 0;

      for (let index = startIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const text = result[0]?.transcript?.trim() ?? '';
        if (!text) continue;
        if (result.isFinal) {
          finalTranscript = `${finalTranscript}${finalTranscript ? ' ' : ''}${text}`;
        } else {
          interim = `${interim}${interim ? ' ' : ''}${text}`;
        }
      }

      setInterimTranscript(interim);
      if (finalTranscript) appendTranscript(finalTranscript);
    };
    recognition.onerror = () => {
      stopVoiceCapture();
      actions.showToast('Voice capture failed. Demo notes are ready.');
    };
    recognition.onend = () => {
      recognition = undefined;
      setIsListening(false);
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      recognition = undefined;
      actions.showToast('Microphone could not start. Use demo notes.');
    }
  };
  const useDemoTranscript = () => {
    updateTranscript(demoTranscript.replace('Mariana Torres', account()?.name === 'Acme Corporation' ? 'Mariana Torres' : 'the customer contact'));
    actions.showToast('Demo voice note captured.');
  };
  const startAiReview = () => {
    if (isAnalyzing() || !hasTranscript()) return;
    stopVoiceCapture();
    clearAiTimers();
    setIsAnalyzing(true);
    setAiStepIndex(0);
    actions.showToast('AI is extracting Salesforce updates...');

    aiReviewSteps.slice(1).forEach((_, index) => {
      aiTimers.push(window.setTimeout(() => setAiStepIndex(index + 1), 720 * (index + 1)));
    });
    aiTimers.push(window.setTimeout(() => {
      actions.buildReview();
      clearAiTimers();
    }, 720 * aiReviewSteps.length));
  };

  onCleanup(() => {
    stopVoiceCapture();
    clearAiTimers();
  });

  return (
    <Show when={state.questionnaire.visitId && !review()}>
      <section class="panel questionnaire-panel stepper-panel voice-debrief-panel">
        <div class="questionnaire-topbar">
          <div>
            <span class="eyebrow">Voice debrief</span>
            <h2>{account()?.name ?? 'Customer meeting'} notes</h2>
          </div>
        </div>
        <div class={isListening() ? 'voice-card active' : 'voice-card'}>
          <div class="voice-status">
            <Mic size={24} />
            <div>
              <strong>{isListening() ? 'Microphone open' : 'Microphone ready'}</strong>
              <span>Talk naturally about what was reviewed in the meeting.</span>
            </div>
          </div>
          <div class="voice-transcript" aria-live="polite">
            <span class="eyebrow">Live meeting note</span>
            <p>{interimTranscript() || transcript() || 'Your spoken recap will appear here.'}</p>
          </div>
          <div class="voice-action-row">
            <button
              class={isListening() ? 'secondary-action wide' : 'primary-action wide'}
              aria-pressed={isListening()}
              disabled={!speechSupported()}
              onClick={() => (isListening() ? stopVoiceCapture() : startVoiceCapture())}
            >
              {isListening() ? <MicOff size={18} /> : <Mic size={18} />}
              {isListening() ? 'Stop microphone' : 'Open microphone'}
            </button>
            <button class="secondary-action wide" disabled={isListening()} onClick={useDemoTranscript}>
              <Sparkles size={18} />
              Simulate voice note
            </button>
          </div>
          <Show when={!speechSupported()}>
            <p class="assistant-demo-note">Voice recognition is not available in this browser. Use the simulated voice note to run the demo.</p>
          </Show>
        </div>
        <label class="field">
          <span>Captured note</span>
          <textarea
            value={transcript()}
            onInput={(event) => updateTranscript(event.currentTarget.value)}
            rows={6}
            placeholder="Summarize the meeting: opportunity, task, meeting details, contact updates, and risk..."
          />
        </label>
        <Show when={isAnalyzing()}>
          <div class="ai-review-card" aria-live="polite">
            <div class="ai-review-header">
              <Bot size={20} />
              <div>
                <span class="eyebrow">AI extraction</span>
                <strong>{aiReviewSteps[aiStepIndex()]}</strong>
              </div>
              <LoaderCircle size={18} class="sync-spinner" />
            </div>
            <div class="ai-review-steps">
              <For each={aiReviewSteps}>
                {(step, index) => (
                  <div class={index() <= aiStepIndex() ? 'ai-step active' : 'ai-step'}>
                    {index() <= aiStepIndex() ? <CheckCircle2 size={15} /> : <Sparkles size={15} />}
                    <span>{step}</span>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>
        <button class="primary-action wide" disabled={!hasTranscript() || isAnalyzing()} onClick={startAiReview}>
          {isAnalyzing() ? <LoaderCircle size={18} class="sync-spinner" /> : <ClipboardList size={18} />}
          {isAnalyzing() ? 'Extracting updates' : 'Generate Salesforce updates'}
        </button>
      </section>
    </Show>
  );
}

type SpeechRecognitionLike = {
  lang: string;
  continuous?: boolean;
  interimResults?: boolean;
  onresult: (event: SpeechRecognitionResultEventLike) => void;
  onerror: () => void;
  onend?: () => void;
  start: () => void;
  stop?: () => void;
};

type SpeechRecognitionResultEventLike = {
  resultIndex?: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionResultLike = ArrayLike<{ transcript: string }> & {
  isFinal?: boolean;
};

export default QuestionnaireStepper;
