import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Bot, CheckCircle2, ClipboardCheck, LoaderCircle, Mic, MicOff, Sparkles } from 'lucide-solid';
import { createEffect, createSignal, For, onCleanup, Show } from 'solid-js';
import { getVisitAccount } from '../selectors';
import { actions, state } from '../store';

const VOICE_NOTE_ID = 'voice-debrief-notes';

const aiReviewSteps = [
  'Reading captured conversation',
  'Checking interview objectives',
  'Finding Opportunity, Task, Meeting, Contact, and Risk signals',
  'Ready for objective review',
];

const demoTranscript = [
  'Meeting lasted 32 minutes with Mariana Torres, procurement, and the operations team.',
  'They confirmed budget approval for the route intelligence pilot and asked us to move the opportunity to Proposal.',
  'Implementation timeline is tight because rollout needs to begin before the next store opening.',
  'Contact update: Mariana Torres remains the champion, and procurement needs final pricing confirmation.',
  'Task: send the updated proposal and pricing deck next week, then schedule the technical review meeting.',
].join(' ');

function QuestionnaireStepper() {
  const review = () => state.questionnaire.review;
  const visit = () => state.questionnaire.visitId ? state.visits.find((item) => item.id === state.questionnaire.visitId) : undefined;
  const account = () => {
    const currentVisit = visit();
    return currentVisit ? getVisitAccount(currentVisit) : undefined;
  };
  const [isListening, setIsListening] = createSignal(false);
  const [isAnalyzing, setIsAnalyzing] = createSignal(false);
  const [aiStepIndex, setAiStepIndex] = createSignal(0);
  const [interimTranscript, setInterimTranscript] = createSignal('');
  const [isVoiceDisabled, setIsVoiceDisabled] = createSignal(false);
  const [isCaptureFinished, setIsCaptureFinished] = createSignal(false);
  let recognition: SpeechRecognitionLike | undefined;
  let nativeListening = false;
  let nativeStateListener: PluginListenerHandle | undefined;
  let attemptedAutoStart = false;
  const aiTimers: ReturnType<typeof setTimeout>[] = [];

  const transcript = () => state.questionnaire.answers[VOICE_NOTE_ID] ?? '';
  const hasTranscript = () => Boolean(transcript().trim());
  const clearAiTimers = () => {
    aiTimers.forEach((timer) => clearTimeout(timer));
    aiTimers.length = 0;
  };
  const getSpeechCtor = () =>
    (globalThis as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition
      ?? (globalThis as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
  const speechSupported = () => Capacitor.isNativePlatform() || Boolean(getSpeechCtor());
  const getNativeSpeechLanguage = () => {
    const language = globalThis.navigator?.language || 'en-US';
    return language.toLowerCase().startsWith('es') ? 'es-US' : language;
  };
  const getNativeSpeechErrorMessage = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error || '');
    if (/no speech input/i.test(message)) return 'No voice was detected. Tap the mic and speak closer to the emulator microphone.';
    if (/network/i.test(message)) return 'Speech recognition needs network access on this emulator.';
    if (/permission/i.test(message)) return 'Microphone permission is required for listening.';
    return message || 'Microphone could not start. Use demo notes.';
  };
  const updateTranscript = (value: string) => actions.updateAnswer(VOICE_NOTE_ID, value);
  const appendTranscript = (value: string) => {
    const cleanValue = value.trim();
    if (!cleanValue) return;
    const current = transcript().trim();
    updateTranscript(`${current}${current ? ' ' : ''}${cleanValue}`);
  };
  const clearNativeListeners = () => {
    void nativeStateListener?.remove().catch(() => undefined);
    nativeStateListener = undefined;
  };
  const stopVoiceCapture = () => {
    setIsListening(false);
    recognition?.stop?.();
    recognition = undefined;
    if (nativeListening) void SpeechRecognition.stop().catch(() => undefined);
    nativeListening = false;
    clearNativeListeners();
    setInterimTranscript('');
  };
  const disableVoiceCapture = () => {
    setIsVoiceDisabled(true);
    stopVoiceCapture();
  };
  const startNativeVoiceCapture = async () => {
    if (nativeListening || isListening()) return;

    try {
      const availability = await SpeechRecognition.available();
      if (!availability.available) {
        setIsVoiceDisabled(true);
        actions.showToast('Native speech recognition is not available on this device.');
        return;
      }

      const permissions = await SpeechRecognition.checkPermissions();
      const permissionState = permissions.speechRecognition === 'granted'
        ? permissions.speechRecognition
        : (await SpeechRecognition.requestPermissions()).speechRecognition;
      if (permissionState !== 'granted') {
        setIsVoiceDisabled(true);
        actions.showToast('Microphone permission is required for listening.');
        return;
      }

      clearNativeListeners();
      setInterimTranscript('');
      nativeStateListener = await SpeechRecognition.addListener('listeningState', (data) => {
        if (data.status === 'started') {
          nativeListening = true;
          setIsListening(true);
          return;
        }
        nativeListening = false;
        setIsListening(false);
        setInterimTranscript('');
      });

      setIsVoiceDisabled(false);
      nativeListening = true;
      setIsListening(true);
      setInterimTranscript('Listening...');
      const result = await SpeechRecognition.start({
        language: getNativeSpeechLanguage(),
        maxResults: 5,
        partialResults: false,
        popup: false,
        prompt: 'Talk naturally about the customer meeting.',
      });
      const bestFinalMatch = result.matches?.find((match) => match.trim());
      if (bestFinalMatch) {
        appendTranscript(bestFinalMatch);
        actions.showToast('Conversation captured.');
      } else {
        actions.showToast('No voice was detected. Try again or use demo audio.');
      }
    } catch (error) {
      actions.showToast(getNativeSpeechErrorMessage(error));
    } finally {
      nativeListening = false;
      setIsListening(false);
      setInterimTranscript('');
      clearNativeListeners();
    }
  };
  const startVoiceCapture = () => {
    if (Capacitor.isNativePlatform()) {
      void startNativeVoiceCapture();
      return;
    }

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
      actions.showToast('Listening failed. Demo audio is ready.');
    };
    recognition.onend = () => {
      recognition = undefined;
      setIsListening(false);
    };

    try {
      setIsVoiceDisabled(false);
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
    setIsCaptureFinished(true);
    setIsAnalyzing(true);
    setAiStepIndex(0);
    actions.showToast('AI is checking interview objectives...');

    aiReviewSteps.slice(1).forEach((_, index) => {
      aiTimers.push(setTimeout(() => setAiStepIndex(index + 1), 720 * (index + 1)));
    });
    aiTimers.push(setTimeout(() => {
      actions.buildReview();
      clearAiTimers();
    }, 720 * aiReviewSteps.length));
  };
  const finishListeningSession = () => {
    stopVoiceCapture();
    if (!hasTranscript()) {
      actions.showToast('No conversation captured yet. Start listening or use the demo audio.');
      return;
    }
    startAiReview();
  };

  createEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    if (attemptedAutoStart || !state.questionnaire.visitId || review() || isCaptureFinished() || !speechSupported() || isVoiceDisabled()) return;
    attemptedAutoStart = true;
    setTimeout(startVoiceCapture, 180);
  });

  onCleanup(() => {
    stopVoiceCapture();
    clearAiTimers();
  });

  return (
    <Show when={state.questionnaire.visitId && !review()}>
      <section class="panel questionnaire-panel stepper-panel voice-debrief-panel">
        <div class="questionnaire-topbar">
          <div>
            <span class="eyebrow">Post interview listening</span>
            <h2>{account()?.name ?? 'Customer meeting'} capture</h2>
          </div>
        </div>
        <div class={isListening() ? 'voice-card active' : 'voice-card'}>
          <div class="voice-status">
            <Mic size={24} />
            <div>
              <strong>{isListening() ? 'Listening to the recap' : isCaptureFinished() ? 'Conversation captured' : 'Ready to listen'}</strong>
              <span>{isCaptureFinished() ? 'The assistant is checking the brief objectives.' : 'Speak naturally. The assistant will only listen until you finish.'}</span>
            </div>
          </div>
          <div class="voice-transcript" aria-live="polite">
            <span class="eyebrow">Captured conversation</span>
            <p>{interimTranscript() || transcript() || 'The spoken recap will appear here while the assistant listens.'}</p>
          </div>
          <div class="voice-action-row">
            <button
              class={isListening() ? 'secondary-action wide' : 'primary-action wide'}
              aria-pressed={isListening()}
              disabled={!speechSupported() || isAnalyzing() || isCaptureFinished()}
              onClick={() => (isListening() ? disableVoiceCapture() : startVoiceCapture())}
            >
              {isListening() ? <MicOff size={18} /> : <Mic size={18} />}
              {isListening() ? 'Pause listening' : 'Start listening'}
            </button>
            <button class="secondary-action wide" disabled={isListening() || isAnalyzing() || isCaptureFinished()} onClick={useDemoTranscript}>
              <Sparkles size={18} />
              Simulate meeting audio
            </button>
          </div>
          <Show when={!speechSupported()}>
            <p class="assistant-demo-note">Voice recognition is not available in this browser. Use the simulated voice note to run the demo.</p>
          </Show>
        </div>
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
        <button class="primary-action wide" disabled={!hasTranscript() || isAnalyzing() || isCaptureFinished()} onClick={finishListeningSession}>
          {isAnalyzing() ? <LoaderCircle size={18} class="sync-spinner" /> : <ClipboardCheck size={18} />}
          {isAnalyzing() ? 'Checking objectives' : 'Finish and check objectives'}
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
