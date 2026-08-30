import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { AlertCircle, Bot, CheckCircle2, ChevronLeft, ChevronRight, Circle, ClipboardCheck, LoaderCircle, Mic, MicOff, Sparkles } from 'lucide-solid';
import { createEffect, createMemo, createSignal, For, onCleanup, Show } from 'solid-js';
import { getVisitAccount } from '../selectors';
import { buildSimulatedObjectiveAnswer, cancelSpeech, combineDebriefText, evaluateVisitObjectives, matchVoiceNavigationCommand, speakText } from '../services';
import { actions, state } from '../store';
import type { VoiceNavigationCommand } from '../services';

const aiReviewSteps = [
  'Reading captured conversation',
  'Checking interview objectives',
  'Finding Opportunity, Task, Meeting, Contact, and Risk signals',
  'Ready for objective review',
];

const objectiveStatusLabels = {
  met: 'Met',
  partial: 'Needs review',
  missed: 'Missing',
};

function QuestionnaireStepper() {
  const review = () => state.questionnaire.review;
  const visit = () => state.questionnaire.visitId ? state.visits.find((item) => item.id === state.questionnaire.visitId) : undefined;
  const account = () => {
    const currentVisit = visit();
    return currentVisit ? getVisitAccount(currentVisit) : undefined;
  };
  const opportunity = () => {
    const currentAccount = account();
    return currentAccount ? state.crm.opportunities.find((item) => item.accountId === currentAccount.id) : undefined;
  };

  const snapshot = () => state.questionnaire.snapshot;
  const totalQuestions = () => snapshot().length;
  const activeIndex = () => state.questionnaire.currentQuestionIndex;
  const activeQuestion = () => snapshot()[activeIndex()];
  const isLastQuestion = () => activeIndex() >= totalQuestions() - 1;
  const answer = () => state.questionnaire.answers[activeQuestion()?.id ?? ''] ?? '';
  const hasAnyAnswer = () => Object.values(state.questionnaire.answers).some((value) => value.trim());

  const objectives = createMemo(() => {
    const currentAccount = account();
    if (!currentAccount) return [];
    return evaluateVisitObjectives(
      combineDebriefText(snapshot(), state.questionnaire.answers),
      currentAccount,
      opportunity(),
    );
  });

  const [isListening, setIsListening] = createSignal(false);
  const [isAnalyzing, setIsAnalyzing] = createSignal(false);
  const [aiStepIndex, setAiStepIndex] = createSignal(0);
  const [interimTranscript, setInterimTranscript] = createSignal('');
  const [isVoiceDisabled, setIsVoiceDisabled] = createSignal(false);
  let recognition: SpeechRecognitionLike | undefined;
  let nativeListening = false;
  let nativeStateListener: PluginListenerHandle | undefined;
  const aiTimers: ReturnType<typeof setTimeout>[] = [];

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

  const handleVoiceCommand = (command: VoiceNavigationCommand) => {
    if (command === 'previous') {
      actions.previousQuestion();
      return;
    }
    if (command === 'next') {
      handleNext();
      return;
    }
    startAiReview();
  };
  const appendAnswerText = (value: string) => {
    const cleanValue = value.trim();
    if (!cleanValue) return;
    const question = activeQuestion();
    if (!question) return;
    const current = (state.questionnaire.answers[question.id] ?? '').trim();
    actions.updateAnswer(question.id, `${current}${current ? ' ' : ''}${cleanValue}`);
  };
  const handleCapturedSpeech = (text: string) => {
    const command = matchVoiceNavigationCommand(text);
    if (command) {
      handleVoiceCommand(command);
      return;
    }
    appendAnswerText(text);
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
        prompt: 'Answer the question, or say next, previous, or finish.',
      });
      const bestFinalMatch = result.matches?.find((match) => match.trim());
      if (bestFinalMatch) {
        handleCapturedSpeech(bestFinalMatch);
        actions.showToast('Answer captured.');
      } else {
        actions.showToast('No voice was detected. Try again or simulate the answer.');
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
      if (finalTranscript) handleCapturedSpeech(finalTranscript);
    };
    recognition.onerror = () => {
      stopVoiceCapture();
      actions.showToast('Listening failed. Simulate the answer instead.');
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
      actions.showToast('Microphone could not start. Simulate the answer instead.');
    }
  };
  const handleSimulateAnswer = () => {
    const currentAccount = account();
    const question = activeQuestion();
    if (!currentAccount || !question) return;
    actions.updateAnswer(question.id, buildSimulatedObjectiveAnswer(question.id, currentAccount, opportunity()));
    actions.showToast('Simulated answer captured.');
  };
  const startAiReview = () => {
    if (isAnalyzing() || !hasAnyAnswer()) {
      if (!hasAnyAnswer()) actions.showToast('Answer at least one question before finishing.');
      return;
    }
    stopVoiceCapture();
    cancelSpeech();
    clearAiTimers();
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
  const handleNext = () => {
    if (isLastQuestion()) {
      startAiReview();
    } else {
      actions.nextQuestion();
    }
  };

  createEffect(() => {
    if (review()) return;
    const question = activeQuestion();
    if (!question) return;
    stopVoiceCapture();
    cancelSpeech();
    speakText(question.prompt, 'en-US');
  });

  onCleanup(() => {
    stopVoiceCapture();
    cancelSpeech();
    clearAiTimers();
  });

  return (
    <Show when={state.questionnaire.visitId && !review()}>
      <section class="panel questionnaire-panel stepper-panel voice-debrief-panel">
        <div class="questionnaire-topbar">
          <div>
            <span class="eyebrow">Guided debrief</span>
            <h2>{account()?.name ?? 'Customer meeting'} interview</h2>
          </div>
        </div>

        <div class="question-progress">
          <span style={{ width: `${totalQuestions() ? ((activeIndex() + 1) / totalQuestions()) * 100 : 0}%` }} />
        </div>
        <p>Question {activeIndex() + 1} of {totalQuestions()}</p>

        <div class="objective-review-card">
          <div class="objective-review-header">
            <strong>Objective checklist</strong>
            <span>Updates after every answer.</span>
          </div>
          <div class="objective-review-list">
            <For each={objectives()}>
              {(item, index) => (
                <button
                  type="button"
                  class={`objective-review-item ${item.status}${activeQuestion()?.id === item.id ? ' active' : ''}`}
                  onClick={() => actions.goToQuestion(index())}
                >
                  <div class="objective-review-icon">
                    <Show
                      when={item.status === 'met'}
                      fallback={item.status === 'partial' ? <AlertCircle size={17} /> : <Circle size={17} />}
                    >
                      <CheckCircle2 size={17} />
                    </Show>
                  </div>
                  <div>
                    <div class="objective-review-title">
                      <strong>{item.label}</strong>
                      <span>{objectiveStatusLabels[item.status]}</span>
                    </div>
                    <p>{item.detail}</p>
                  </div>
                </button>
              )}
            </For>
          </div>
        </div>

        <nav class="segmented-control" aria-label="Answer mode">
          <button
            type="button"
            class={state.questionnaire.mode === 'manual' ? 'selected' : ''}
            aria-pressed={state.questionnaire.mode === 'manual'}
            onClick={() => actions.setQuestionnaireMode('manual')}
          >
            Text
          </button>
          <button
            type="button"
            class={state.questionnaire.mode === 'voice' ? 'selected' : ''}
            aria-pressed={state.questionnaire.mode === 'voice'}
            onClick={() => actions.setQuestionnaireMode('voice')}
          >
            Voice
          </button>
        </nav>

        <div class="question-card">
          <span class="eyebrow">The assistant asks</span>
          <h2>{activeQuestion()?.prompt}</h2>

          <Show
            when={state.questionnaire.mode === 'manual'}
            fallback={
              <div class={isListening() ? 'voice-card active' : 'voice-card'}>
                <div class="voice-status">
                  <Mic size={24} />
                  <div>
                    <strong>{isListening() ? 'Listening for your answer' : 'Ready to listen'}</strong>
                    <span>Say your answer, or say "next", "previous", or "finish" to navigate.</span>
                  </div>
                </div>
                <div class="voice-transcript" aria-live="polite">
                  <span class="eyebrow">Captured answer</span>
                  <p>{interimTranscript() || answer() || 'Your spoken answer will appear here.'}</p>
                </div>
                <div class="voice-action-row">
                  <button
                    class={isListening() ? 'secondary-action wide' : 'primary-action wide'}
                    aria-pressed={isListening()}
                    disabled={!speechSupported() || isAnalyzing()}
                    onClick={() => (isListening() ? disableVoiceCapture() : startVoiceCapture())}
                  >
                    {isListening() ? <MicOff size={18} /> : <Mic size={18} />}
                    {isListening() ? 'Pause listening' : 'Start listening'}
                  </button>
                  <button class="secondary-action wide" disabled={isListening() || isAnalyzing()} onClick={handleSimulateAnswer}>
                    <Sparkles size={18} />
                    Simulate answer
                  </button>
                </div>
                <Show when={!speechSupported()}>
                  <p class="assistant-demo-note">Voice recognition is not available in this browser. Use the simulated answer to run the demo.</p>
                </Show>
                <Show when={isVoiceDisabled()}>
                  <p class="assistant-demo-note">Microphone unavailable. Use the simulated answer to continue.</p>
                </Show>
              </div>
            }
          >
            <label class="field">
              <span>Your answer</span>
              <textarea
                rows={5}
                value={answer()}
                disabled={isAnalyzing()}
                onInput={(event) => {
                  const question = activeQuestion();
                  if (question) actions.updateAnswer(question.id, event.currentTarget.value);
                }}
              />
            </label>
            <button class="secondary-action wide" disabled={isAnalyzing()} onClick={handleSimulateAnswer}>
              <Sparkles size={18} />
              Simulate answer
            </button>
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

        <div class="question-action-bar">
          <button class="secondary-action" disabled={activeIndex() === 0 || isAnalyzing()} onClick={() => actions.previousQuestion()}>
            <ChevronLeft size={18} />
            Previous
          </button>
          <button class="primary-action" disabled={isAnalyzing() || (isLastQuestion() && !hasAnyAnswer())} onClick={handleNext}>
            <Show when={isLastQuestion()} fallback={<><ChevronRight size={18} />Next</>}>
              {isAnalyzing() ? <LoaderCircle size={18} class="sync-spinner" /> : <ClipboardCheck size={18} />}
              {isAnalyzing() ? 'Checking objectives' : 'Finish debrief'}
            </Show>
          </button>
        </div>

        <button class="secondary-action wide" disabled={!hasAnyAnswer() || isAnalyzing()} onClick={startAiReview}>
          <ClipboardCheck size={18} />
          Finish debrief now
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
