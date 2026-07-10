import { Bot, CheckCircle2, ClipboardList, LoaderCircle, Mic, Sparkles } from 'lucide-solid';
import { createEffect, createSignal, For, onCleanup, Show } from 'solid-js';
import { actions, state } from '../store';

type VoiceTurn = 'idle' | 'listening' | 'speaking' | 'resuming';

const aiReviewSteps = [
  'Reading debrief transcript',
  'Extracting account signals',
  'Detecting opportunity updates',
  'Drafting CRM summary',
  'Ready for review',
];

const voiceTurnLabel = (turn: VoiceTurn) => {
  if (turn === 'speaking') return 'Reading question';
  if (turn === 'resuming') return 'Ready for your answer';
  if (turn === 'listening') return 'Listening';
  return 'Microphone paused';
};

const voiceTurnHelp = (turn: VoiceTurn) => {
  if (turn === 'speaking') return 'Wait for the question readout to finish.';
  if (turn === 'resuming') return 'Preparing the microphone again.';
  if (turn === 'listening') return 'Speak your answer or say a navigation command.';
  return 'Microphone is paused.';
};

function QuestionnaireStepper() {
  const review = () => state.questionnaire.review;
  const activeQuestion = () => state.questionnaire.snapshot[state.questionnaire.currentQuestionIndex];
  const [speechSupported] = createSignal(Boolean((window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition || (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition));
  const [isListening, setIsListening] = createSignal(false);
  const [isAnalyzing, setIsAnalyzing] = createSignal(false);
  const [aiStepIndex, setAiStepIndex] = createSignal(0);
  const [interimTranscript, setInterimTranscript] = createSignal('');
  const [voiceTurn, setVoiceTurn] = createSignal<VoiceTurn>('idle');
  let recognition: SpeechRecognitionLike | undefined;
  const aiTimers: ReturnType<typeof window.setTimeout>[] = [];
  let keepVoiceOpen = false;
  let isPausingForReadout = false;
  let lastReadPrompt = '';
  let lastReadQuestionId: string | undefined;
  let readoutVersion = 0;
  let resumeTimer: number | undefined;
  const progressLabel = () => `Question ${state.questionnaire.currentQuestionIndex + 1} of ${state.questionnaire.snapshot.length}`;
  const progressPercent = () => `${((state.questionnaire.currentQuestionIndex + 1) / Math.max(state.questionnaire.snapshot.length, 1)) * 100}%`;
  const currentAnswer = () => {
    const question = activeQuestion();
    return question ? state.questionnaire.answers[question.id] ?? '' : '';
  };
  const isLastQuestion = () => state.questionnaire.currentQuestionIndex >= state.questionnaire.snapshot.length - 1;
  const clearAiTimers = () => {
    aiTimers.forEach((timer) => window.clearTimeout(timer));
    aiTimers.length = 0;
  };
  const startAiReview = () => {
    if (isAnalyzing()) return;
    stopVoiceCapture();
    clearAiTimers();
    setIsAnalyzing(true);
    setAiStepIndex(0);
    actions.showToast('AI is preparing the CRM debrief...');

    aiReviewSteps.slice(1).forEach((_, index) => {
      aiTimers.push(window.setTimeout(() => setAiStepIndex(index + 1), 620 * (index + 1)));
    });
    aiTimers.push(window.setTimeout(() => {
      actions.buildReview();
      clearAiTimers();
    }, 620 * aiReviewSteps.length));
  };
  const normalizeVoiceCommand = (text: string) =>
    text
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,!?]/g, '');
  const normalizeSpeechText = (text: string) =>
    normalizeVoiceCommand(text)
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const isLikelyPromptReadout = (transcript: string) => {
    const prompt = normalizeSpeechText(lastReadPrompt);
    const spoken = normalizeSpeechText(transcript);
    if (!prompt || !spoken) return false;
    const lengthRatio = Math.min(prompt.length, spoken.length) / Math.max(prompt.length, spoken.length);
    if (lengthRatio < 0.85) return false;
    if (prompt.includes(spoken) || spoken.includes(prompt)) return true;

    const promptTokens = new Set(prompt.split(' '));
    const spokenTokens = spoken.split(' ');
    const shared = spokenTokens.filter((token) => promptTokens.has(token)).length;
    return shared / Math.max(promptTokens.size, spokenTokens.length, 1) >= 0.8;
  };
  const runVoiceNavigationCommand = (transcript: string) => {
    const command = normalizeVoiceCommand(transcript);
    const previousCommands = ['previous', 'previous question', 'previus', 'previus question', 'back', 'go back'];
    const nextCommands = ['next', 'next question', 'continue', 'go next'];
    const finishCommands = ['finish', 'finalize', 'generate review', 'submit', 'done'];

    if (previousCommands.includes(command)) {
      actions.previousQuestion();
      actions.showToast('Voice command: previous question.');
      return true;
    }

    if (nextCommands.includes(command)) {
      if (isLastQuestion()) {
        startAiReview();
        actions.showToast('Voice command: AI review.');
      } else {
        actions.nextQuestion();
        actions.showToast('Voice command: next question.');
      }
      return true;
    }

    if (finishCommands.includes(command)) {
      if (isLastQuestion()) {
        startAiReview();
        actions.showToast('Voice command: AI review.');
      } else {
        actions.showToast('Finish is available on the last question.');
      }
      return true;
    }

    return false;
  };

  const getSpeechCtor = () =>
    (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition
      ?? (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

  const appendVoiceAnswer = (questionId: string, transcript: string) => {
    const cleanTranscript = transcript.trim();
    if (!cleanTranscript) return;
    const current = state.questionnaire.answers[questionId] ?? '';
    const separator = current.trim() ? ' ' : '';
    actions.updateAnswer(questionId, `${current.trimEnd()}${separator}${cleanTranscript}`);
  };

  const clearResumeTimer = () => {
    if (resumeTimer) {
      window.clearTimeout(resumeTimer);
      resumeTimer = undefined;
    }
  };

  const startRecognition = () => {
    const SpeechCtor = getSpeechCtor();
    if (!SpeechCtor || recognition || !keepVoiceOpen) return;

    recognition = new SpeechCtor();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: SpeechRecognitionResultEventLike) => {
      if (voiceTurn() === 'speaking' || voiceTurn() === 'resuming') return;
      let finalTranscript = '';
      let interim = '';
      const startIndex = event.resultIndex ?? 0;

      for (let index = startIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim() ?? '';
        if (!transcript) continue;
        if (result.isFinal) {
          finalTranscript = `${finalTranscript}${finalTranscript ? ' ' : ''}${transcript}`;
        } else {
          interim = `${interim}${interim ? ' ' : ''}${transcript}`;
        }
      }

      setInterimTranscript(interim);
      if (!finalTranscript) return;
      setInterimTranscript('');
      if (isLikelyPromptReadout(finalTranscript)) return;
      if (runVoiceNavigationCommand(finalTranscript)) return;
      const currentQuestion = activeQuestion();
      if (currentQuestion) appendVoiceAnswer(currentQuestion.id, finalTranscript);
    };
    recognition.onerror = () => {
      if (isPausingForReadout) return;
      keepVoiceOpen = false;
      setIsListening(false);
      setVoiceTurn('idle');
      actions.showToast('Voice capture failed. Manual fallback is ready.');
    };
    recognition.onend = () => {
      recognition = undefined;
      if (isPausingForReadout) return;
      if (!keepVoiceOpen || state.questionnaire.mode !== 'voice' || review()) {
        setIsListening(false);
        setVoiceTurn('idle');
        return;
      }
      startRecognition();
    };
    try {
      recognition.start();
      setVoiceTurn('listening');
    } catch {
      recognition = undefined;
    }
  };

  const readActiveQuestion = () => {
    const question = activeQuestion();
    if (!question || !('speechSynthesis' in window)) {
      startRecognition();
      return;
    }

    lastReadQuestionId = question.id;
    lastReadPrompt = question.prompt;
    readoutVersion += 1;
    const currentReadout = readoutVersion;
    isPausingForReadout = true;
    setVoiceTurn('speaking');
    setInterimTranscript('');
    clearResumeTimer();
    recognition?.stop?.();
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(question.prompt);
    const resumeListening = () => {
      if (currentReadout !== readoutVersion) return;
      isPausingForReadout = false;
      if (!keepVoiceOpen || state.questionnaire.mode !== 'voice' || review()) {
        setVoiceTurn('idle');
        return;
      }
      setVoiceTurn('resuming');
      resumeTimer = window.setTimeout(() => {
        resumeTimer = undefined;
        startRecognition();
      }, 450);
    };

    utterance.onend = resumeListening;
    utterance.onerror = resumeListening;
    window.speechSynthesis.speak(utterance);
  };

  const startVoiceCapture = () => {
    const question = activeQuestion();
    if (!getSpeechCtor() || !question || isListening()) return;

    keepVoiceOpen = true;
    setIsListening(true);
    readActiveQuestion();
  };

  const stopVoiceCapture = () => {
    keepVoiceOpen = false;
    isPausingForReadout = false;
    readoutVersion += 1;
    clearResumeTimer();
    setIsListening(false);
    setVoiceTurn('idle');
    setInterimTranscript('');
    recognition?.stop?.();
    window.speechSynthesis?.cancel();
    recognition = undefined;
  };

  createEffect(() => {
    if (state.questionnaire.mode !== 'voice' || review() || !state.questionnaire.visitId) {
      stopVoiceCapture();
    }
  });

  createEffect(() => {
    const question = activeQuestion();
    if (!keepVoiceOpen || state.questionnaire.mode !== 'voice' || review() || !question) return;
    if (question.id === lastReadQuestionId) return;
    readActiveQuestion();
  });

  onCleanup(() => {
    stopVoiceCapture();
    clearAiTimers();
  });

  return (
    <Show when={state.questionnaire.visitId && !review()}>
      <section class="panel questionnaire-panel stepper-panel">
        <div class="questionnaire-topbar">
          <div>
            <p>{progressLabel()}</p>
          </div>
          <div class="segmented-control">
            <button class={state.questionnaire.mode === 'manual' ? 'selected' : ''} onClick={() => actions.setQuestionnaireMode('manual')}>Manual</button>
            <button class={state.questionnaire.mode === 'voice' ? 'selected' : ''} onClick={() => actions.setQuestionnaireMode('voice')}>Voice</button>
          </div>
        </div>
        <div class="question-progress" aria-label={progressLabel()}>
          <span style={{ width: progressPercent() }} />
        </div>
        <Show when={activeQuestion()} fallback={<p>No active questions are configured.</p>}>
          {(question) => (
            <div class="question-card">
              <h2>{question().prompt}</h2>
              <Show when={state.questionnaire.mode === 'voice'}>
                <Show when={speechSupported()} fallback={<p>Voice recognition is not available in this browser. Manual input is ready below.</p>}>
                  <div class={isListening() ? 'voice-card active' : 'voice-card'}>
                    <div class="voice-status">
                      <Mic size={24} />
                      <div>
                        <strong>{isListening() ? voiceTurnLabel(voiceTurn()) : 'Microphone ready'}</strong>
                        <span>{isListening() ? voiceTurnHelp(voiceTurn()) : 'Start the microphone to hear the prompt, dictate, or use commands.'}</span>
                      </div>
                    </div>
                    <div class="voice-transcript" aria-live="polite">
                      <span class="eyebrow">Live dictation</span>
                      <p>{interimTranscript() || currentAnswer() || 'Your spoken answer will appear here.'}</p>
                    </div>
                    <button
                      class={isListening() ? 'secondary-action wide' : 'primary-action wide'}
                      aria-pressed={isListening()}
                      onClick={() => (isListening() ? stopVoiceCapture() : startVoiceCapture())}
                    >
                      {isListening() ? 'Stop microphone' : 'Start microphone'}
                    </button>
                  </div>
                </Show>
              </Show>
              <label class="field">
                <span>Answer</span>
                <textarea
                  value={currentAnswer()}
                  onInput={(event) => actions.updateAnswer(question().id, event.currentTarget.value)}
                  rows={question().answerType === 'text' ? 5 : 3}
                  placeholder="Capture the key customer notes..."
                />
              </label>
            </div>
          )}
        </Show>
        <Show when={isAnalyzing()}>
          <div class="ai-review-card" aria-live="polite">
            <div class="ai-review-header">
              <Bot size={20} />
              <div>
                <span class="eyebrow">AI review</span>
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
          <button class="secondary-action" disabled={state.questionnaire.currentQuestionIndex === 0 || isAnalyzing()} onClick={() => actions.previousQuestion()}>Previous</button>
          <Show
            when={isLastQuestion()}
            fallback={<button class="primary-action" disabled={isAnalyzing()} onClick={() => actions.nextQuestion()}>Next</button>}
          >
            <button class="primary-action" disabled={isAnalyzing()} onClick={startAiReview}>
              {isAnalyzing() ? <LoaderCircle size={18} class="sync-spinner" /> : <ClipboardList size={18} />}
              {isAnalyzing() ? 'AI reviewing' : 'Generate debrief'}
            </button>
          </Show>
        </div>
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
