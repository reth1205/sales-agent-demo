import { CheckCircle2, MessageCircleQuestion, Sparkles, Target } from 'lucide-solid';
import { For, Show, createMemo, createSignal } from 'solid-js';
import { buildBriefingFollowUpAnswer, buildVisitObjectives } from '../services';
import type { Account, Opportunity, PreMeetingBriefing } from '../types';

export type AisaBriefingStep = 'prompt' | 'summary' | 'qa' | 'ended';

type AisaBriefingDialogProps = {
  briefing: PreMeetingBriefing;
  account: Account;
  opportunity?: Opportunity;
  /** Invoked by the "End briefing" action; the parent decides how to close the sheet. */
  onEndBriefing: () => void;
};

type FollowUpExchange = {
  question: string;
  answer: string;
};

/**
 * Interactive pre-visit AISA dialog. Local `createSignal` state only — nothing here is
 * persisted to `store.ts` or `localStorage`. Props-in / events-out: the parent owns the
 * briefing lookup and the close action.
 */
function AisaBriefingDialog(props: AisaBriefingDialogProps) {
  const [step, setStep] = createSignal<AisaBriefingStep>('prompt');
  const [exchanges, setExchanges] = createSignal<FollowUpExchange[]>([]);

  const objectives = createMemo(() => buildVisitObjectives(props.account, props.opportunity));
  const askedQuestions = createMemo(() => exchanges().map((exchange) => exchange.question));
  const openQuestions = createMemo(() =>
    props.briefing.suggestedQuestions.filter((question) => !askedQuestions().includes(question)),
  );

  const startBriefing = () => {
    setStep('summary');
  };

  const askQuestion = (question: string) => {
    const answer = buildBriefingFollowUpAnswer(question, props.briefing, props.account, props.opportunity);
    setExchanges((current) => [...current, { question, answer }]);
    setStep('qa');
  };

  const endBriefing = () => {
    setExchanges([]);
    setStep('ended');
    props.onEndBriefing();
  };

  return (
    <div class="aisa-dialog">
      <Show when={step() === 'prompt'}>
        <div class="assistant-briefing-copy">
          <Sparkles size={17} />
          <div>
            <p>
              AISA here. You are {props.briefing.etaMinutes} minutes out from {props.account.name}.
            </p>
            <p>I pulled the briefing for this visit. Want me to walk you through it?</p>
          </div>
        </div>
        <button class="aisa-primary-action" onClick={startBriefing}>
          Yes, let&apos;s hear it
        </button>
      </Show>

      <Show when={step() === 'summary' || step() === 'qa'}>
        <div class="assistant-briefing-copy">
          <Sparkles size={17} />
          <div>
            <p>{props.briefing.executiveSummary}</p>
            <Show when={props.briefing.opportunitySummary}>
              {(summary) => <p>{summary()}</p>}
            </Show>
            <Show when={props.briefing.blockers.length > 0}>
              <p>Watch out for: {props.briefing.blockers.join('; ')}.</p>
            </Show>
            <Show when={props.briefing.recentTopics.length > 0}>
              <p>Recent threads: {props.briefing.recentTopics.join(' | ')}</p>
            </Show>
          </div>
        </div>

        <section class="aisa-section">
          <span class="eyebrow">
            <Target size={13} /> Call objectives
          </span>
          <div class="visit-objective-list">
            <For each={objectives()}>
              {(objective) => (
                <div class="visit-objective-item">
                  <CheckCircle2 size={15} />
                  <div>
                    <span>{objective.label}</span>
                    <p>{objective.detail}</p>
                  </div>
                </div>
              )}
            </For>
          </div>
        </section>

        <Show when={exchanges().length > 0}>
          <section class="aisa-section aisa-transcript">
            <For each={exchanges()}>
              {(exchange) => (
                <div class="aisa-exchange">
                  <p class="aisa-exchange-question">{exchange.question}</p>
                  <p class="aisa-exchange-answer">{exchange.answer}</p>
                </div>
              )}
            </For>
          </section>
        </Show>

        <Show when={openQuestions().length > 0}>
          <section class="aisa-section">
            <span class="eyebrow">
              <MessageCircleQuestion size={13} /> Ask AISA
            </span>
            <div class="aisa-question-list">
              <For each={openQuestions()}>
                {(question) => (
                  <button class="aisa-question-button" onClick={() => askQuestion(question)}>
                    {question}
                  </button>
                )}
              </For>
            </div>
          </section>
        </Show>

        <button class="details-toggle" onClick={endBriefing}>
          End briefing
        </button>
      </Show>

      <Show when={step() === 'ended'}>
        <div class="assistant-briefing-copy">
          <Sparkles size={17} />
          <div>
            <p>Briefing closed. Good luck in there.</p>
          </div>
        </div>
      </Show>
    </div>
  );
}

export default AisaBriefingDialog;
