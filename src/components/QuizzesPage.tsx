import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Flag, RotateCcw, XCircle } from 'lucide-react';
import { QUIZ_DECKS } from '../data/curriculum';
import { QuizDeck } from '../types/aws';

interface QuizzesPageProps {
  initialDeckId?: string;
  quizScores: Record<string, { bestPercent: number; attempts: number; lastCompletedAt: string }>;
  onRecordScore: (deckId: string, percent: number) => void;
  onGoToRoadmap: () => void;
}

export function QuizzesPage({
  initialDeckId,
  quizScores,
  onRecordScore,
  onGoToRoadmap,
}: QuizzesPageProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [activeDeckId, setActiveDeckId] = useState<string | null>(initialDeckId ?? null);
  const [mode, setMode] = useState<'study' | 'exam'>('study');

  // Active quiz state
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);

  useEffect(() => {
    if (initialDeckId) {
      startDeck(initialDeckId, 'study');
    }
  }, [initialDeckId]);

  const activeDeck: QuizDeck | undefined = useMemo(
    () => QUIZ_DECKS.find((d) => d.id === activeDeckId),
    [activeDeckId]
  );

  useEffect(() => {
    if (!activeDeck || submitted) return;
    const timer = setInterval(() => {
      setSecondsElapsed((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeDeck, submitted]);

  const startDeck = (deckId: string, chosenMode: 'study' | 'exam') => {
    setActiveDeckId(deckId);
    setMode(chosenMode);
    setQuestionIndex(0);
    setSelectedAnswers({});
    setFlaggedIds([]);
    setSubmitted(false);
    setSecondsElapsed(0);
  };

  const categories = ['All', 'Security', 'Compute', 'Data & Storage', 'Networking', 'Exam Readiness'];
  const filteredDecks =
    categoryFilter === 'All'
      ? QUIZ_DECKS
      : QUIZ_DECKS.filter((d) => d.category === categoryFilter);

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  if (activeDeck) {
    const questions = activeDeck.questions;
    const currentQ = questions[questionIndex];
    const currentSelection = selectedAnswers[currentQ.id];
    const isAnswered = currentSelection !== undefined;
    const showImmediateFeedback = mode === 'study' && isAnswered;

    const correctCount = questions.filter(
      (q) => selectedAnswers[q.id] === q.correctIndex
    ).length;
    const scorePercent = Math.round((correctCount / questions.length) * 100);

    const handleSubmitQuiz = () => {
      setSubmitted(true);
      onRecordScore(activeDeck.id, scorePercent);
    };

    const toggleFlag = (qId: string) => {
      setFlaggedIds((prev) =>
        prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
      );
    };

    if (submitted) {
      const passed = scorePercent >= 72;
      return (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="text-xs text-slate-500">
                  {activeDeck.category} · {mode === 'study' ? 'Study Mode' : 'Exam Simulation'} · Time{' '}
                  <span className="font-mono tabular-nums">{formatDuration(secondsElapsed)}</span>
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 mt-1">
                  {activeDeck.title} — Results
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => startDeck(activeDeck.id, mode)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retake Quiz
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDeckId(null)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  All Quiz Decks
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-5">
              <div>
                <div className="text-xs text-slate-500">Score</div>
                <div className="text-3xl font-semibold text-slate-900 font-mono tabular-nums mt-1">
                  {scorePercent}%
                </div>
                <div className="text-xs text-slate-600 mt-0.5 tabular-nums">
                  {correctCount} of {questions.length} correct
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">AWS Exam Benchmark (72%)</div>
                <div
                  className={`text-lg font-semibold mt-1 flex items-center gap-1.5 ${
                    passed ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {passed ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Exam-Ready Pace
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Review Recommended
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center sm:justify-end">
                <button
                  type="button"
                  onClick={onGoToRoadmap}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline"
                >
                  Update Certification Roadmap Progress →
                </button>
              </div>
            </div>
          </div>

          {/* Question-by-question review */}
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const userAns = selectedAnswers[q.id];
              const isCorrect = userAns === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className="bg-white border border-slate-200 rounded-xl p-6 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-xs text-slate-500">
                      Question {idx + 1} · {q.domain}
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">{q.prompt}</p>
                  {q.codeContext && (
                    <pre className="bg-slate-950 text-slate-100 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                      {q.codeContext}
                    </pre>
                  )}
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {q.options.map((opt, oIdx) => {
                      const chosen = userAns === oIdx;
                      const right = q.correctIndex === oIdx;
                      return (
                        <div
                          key={oIdx}
                          className={`px-3.5 py-2.5 text-xs rounded-lg border ${
                            right
                              ? 'border-emerald-300 bg-emerald-50/70 text-slate-900 font-medium'
                              : chosen
                                ? 'border-rose-300 bg-rose-50/70 text-slate-900'
                                : 'border-slate-200 text-slate-600'
                          }`}
                        >
                          {opt}
                          {right && ' (Correct Answer)'}
                          {chosen && !right && ' (Your Selection)'}
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-700 space-y-1">
                    <p>
                      <strong className="text-slate-900">Why it works:</strong> {q.explanation}
                    </p>
                    <p className="text-slate-500">
                      <strong className="text-slate-700">Common trap:</strong> {q.distractorNote}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setActiveDeckId(null)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Decks
            </button>
            <div className="text-xs text-slate-500 tabular-nums">
              {activeDeck.title} · {mode === 'study' ? 'Study Mode' : 'Exam Mode'} ·{' '}
              <span className="font-mono">{formatDuration(secondsElapsed)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500 tabular-nums">
                Question {questionIndex + 1} of {questions.length} · {currentQ.domain}
              </span>
              <button
                type="button"
                onClick={() => toggleFlag(currentQ.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  flaggedIds.includes(currentQ.id)
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Flag className="w-3 h-3" />
                {flaggedIds.includes(currentQ.id) ? 'Flagged' : 'Flag'}
              </button>
            </div>

            <h3 className="text-lg font-medium text-slate-900 leading-snug">
              {currentQ.prompt}
            </h3>

            {currentQ.codeContext && (
              <pre className="bg-slate-950 text-slate-100 rounded-lg p-3.5 text-xs font-mono overflow-x-auto">
                {currentQ.codeContext}
              </pre>
            )}

            <div className="space-y-2.5 pt-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = currentSelection === idx;
                const isCorrectOpt = currentQ.correctIndex === idx;

                let styleClass =
                  'border-slate-200 bg-white text-slate-800 hover:bg-slate-50';
                if (showImmediateFeedback) {
                  if (isCorrectOpt) {
                    styleClass = 'border-emerald-500 bg-emerald-50 text-slate-900 font-medium';
                  } else if (isSelected) {
                    styleClass = 'border-rose-400 bg-rose-50 text-slate-900';
                  }
                } else if (isSelected) {
                  styleClass = 'border-amber-600 bg-amber-50/70 text-slate-900 font-medium';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (mode === 'study' && isAnswered) return;
                      setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: idx }));
                    }}
                    className={`w-full text-left px-4 py-3 text-sm rounded-lg border transition-colors flex items-start gap-3 ${styleClass}`}
                  >
                    <span className="font-mono text-xs text-slate-500 mt-0.5 shrink-0">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {showImmediateFeedback && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs">
                <div
                  className={`font-semibold ${
                    currentSelection === currentQ.correctIndex
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}
                >
                  {currentSelection === currentQ.correctIndex
                    ? 'Correct Answer'
                    : 'Not quite — review the explanation below'}
                </div>
                <p className="text-slate-700 leading-relaxed">{currentQ.explanation}</p>
                <p className="text-slate-500 leading-relaxed">
                  <strong className="text-slate-700">Exam trap:</strong> {currentQ.distractorNote}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={questionIndex === 0}
              onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Previous
            </button>

            <div className="flex items-center gap-3">
              {questionIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setQuestionIndex((i) => i + 1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Next Question
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
                >
                  Finish & Score Quiz
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Navigator Sidebar */}
        <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">Question Map</h4>
            <span className="text-xs text-slate-500 tabular-nums">
              {Object.keys(selectedAnswers).length}/{questions.length} answered
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const answered = selectedAnswers[q.id] !== undefined;
              const flagged = flaggedIds.includes(q.id);
              const active = idx === questionIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setQuestionIndex(idx)}
                  className={`h-9 rounded-md font-mono text-xs font-medium border transition-colors relative tabular-nums ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : answered
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {idx + 1}
                  {flagged && (
                    <span className="block text-[9px] leading-none text-amber-600">flag</span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleSubmitQuiz}
            className="w-full px-3 py-2 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Submit Quiz Early
          </button>
        </aside>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 text-balance">
            Scenario Quizzes & Exam Readiness
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Practice realistic AWS developer scenarios with instant architectural explanations and
            common exam-trap breakdowns.
          </p>
        </div>

        <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                categoryFilter === cat
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredDecks.map((deck) => {
          const stat = quizScores[deck.id];
          return (
            <div
              key={deck.id}
              className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between gap-5"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{deck.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{deck.difficulty}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{deck.questions.length} questions</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">~{deck.estimatedMinutes} min</span>
                  {stat && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-700 font-semibold tabular-nums">
                        Best: {stat.bestPercent}%
                      </span>
                    </>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mt-2">{deck.title}</h3>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{deck.description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => startDeck(deck.id, 'study')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Start Study Mode
                </button>
                <button
                  type="button"
                  onClick={() => startDeck(deck.id, 'exam')}
                  className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Timed Exam Mode
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
