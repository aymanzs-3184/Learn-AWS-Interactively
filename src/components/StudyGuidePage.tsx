import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  RotateCw,
  Search,
} from 'lucide-react';
import { FLASHCARDS, SERVICE_CHEAT_SHEET, STUDY_MODULES } from '../data/studyMaterial';
import { LabId } from '../types/aws';

interface StudyGuidePageProps {
  completedStudyModules: string[];
  masteredFlashcards: string[];
  onToggleStudyModule: (moduleId: string) => void;
  onToggleFlashcardMastered: (cardId: string, mastered: boolean) => void;
  onLaunchLab: (labId: LabId) => void;
  onLaunchQuiz: (deckId: string) => void;
}

export function StudyGuidePage({
  completedStudyModules,
  masteredFlashcards,
  onToggleStudyModule,
  onToggleFlashcardMastered,
  onLaunchLab,
  onLaunchQuiz,
}: StudyGuidePageProps) {
  const [studyView, setStudyView] = useState<'modules' | 'flashcards' | 'cheatsheet'>('modules');
  const [activeModuleId, setActiveModuleId] = useState<string>(STUDY_MODULES[0].id);
  const [quickCheckAnswers, setQuickCheckAnswers] = useState<Record<string, number>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Flashcards state
  const [cardCategory, setCardCategory] = useState<string>('All');
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [flipped, setFlipped] = useState<boolean>(false);

  // Cheat sheet state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sheetCategory, setSheetCategory] = useState<string>('All');

  const activeModule =
    STUDY_MODULES.find((m) => m.id === activeModuleId) ?? STUDY_MODULES[0];
  const activeModIdx = STUDY_MODULES.findIndex((m) => m.id === activeModule.id);
  const nextModule = STUDY_MODULES[(activeModIdx + 1) % STUDY_MODULES.length];
  const isModuleStudied = completedStudyModules.includes(activeModule.id);

  const handleCopySnippet = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Flashcard filtering
  const cardCategories = [
    'All',
    'IAM & Security',
    'Compute',
    'Storage & DB',
    'Networking',
    'Messaging & IaC',
  ];
  const filteredCards = useMemo(
    () =>
      cardCategory === 'All'
        ? FLASHCARDS
        : FLASHCARDS.filter((c) => c.category === cardCategory),
    [cardCategory]
  );
  const safeCardIndex = Math.min(cardIndex, Math.max(0, filteredCards.length - 1));
  const currentCard = filteredCards[safeCardIndex];

  // Cheat sheet filtering
  const sheetCategories = ['All', 'Security', 'Compute', 'Storage', 'Databases', 'Networking', 'Messaging', 'Observability', 'IaC'];
  const filteredSheet = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SERVICE_CHEAT_SHEET.filter((row) => {
      const matchesCat = sheetCategory === 'All' || row.category === sheetCategory;
      const matchesText =
        !q ||
        row.service.toLowerCase().includes(q) ||
        row.devAnalogy.toLowerCase().includes(q) ||
        row.keyFact.toLowerCase().includes(q);
      return matchesCat && matchesText;
    });
  }, [searchQuery, sheetCategory]);

  const quickCheckSelection = quickCheckAnswers[activeModule.id];
  const quickCheckAnswered = quickCheckSelection !== undefined;

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 text-balance">
            AWS Study Guide & Active Recall
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Structured engineering chapters, active-recall flashcards, and a searchable AWS
            service cheat sheet tailored for software developers.
          </p>
        </div>

        <div className="inline-flex p-1 bg-slate-100 rounded-lg self-start md:self-auto">
          {(
            [
              { id: 'modules', label: 'Study Modules' },
              { id: 'flashcards', label: 'Flashcards' },
              { id: 'cheatsheet', label: 'Service Cheat Sheet' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStudyView(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                studyView === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MODE 1: STUDY MODULES */}
      {studyView === 'modules' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Module Curriculum Rail */}
          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">Curriculum Chapters</span>
              <span className="text-xs text-slate-500 tabular-nums">
                {completedStudyModules.length}/{STUDY_MODULES.length} studied
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {STUDY_MODULES.map((mod) => {
                const selected = mod.id === activeModule.id;
                const studied = completedStudyModules.includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setActiveModuleId(mod.id)}
                    className={`w-full text-left px-5 py-4 transition-colors flex items-start justify-between gap-3 ${
                      selected ? 'bg-amber-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500">
                        <span className="font-mono font-semibold text-amber-700">
                          {mod.number}
                        </span>{' '}
                        · {mod.category} · {mod.readTime}
                      </div>
                      <div
                        className={`text-sm mt-1 leading-snug ${
                          selected ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'
                        }`}
                      >
                        {mod.title}
                      </div>
                    </div>
                    <CheckCircle2
                      className={`w-4 h-4 mt-1 shrink-0 ${
                        studied ? 'text-emerald-600' : 'text-slate-200'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Study Reader */}
          <article className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-8">
            {/* Chapter Header */}
            <header className="pb-6 border-b border-slate-100 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Chapter {activeModule.number} · {activeModule.category} · {activeModule.readTime}
                </div>
                <button
                  type="button"
                  onClick={() => onToggleStudyModule(activeModule.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    isModuleStudied
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isModuleStudied ? 'Studied' : 'Mark as Studied'}
                </button>
              </div>

              <h3 className="text-2xl font-semibold text-slate-900 text-balance">
                {activeModule.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                {activeModule.summary}
              </p>

              {/* Key Takeaways Strip */}
              <div className="pt-3">
                <div className="text-xs font-semibold text-slate-900 mb-2">
                  Core Takeaways
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {activeModule.keyTakeaways.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-mono text-amber-700 font-semibold mt-0.5">
                        {idx + 1}.
                      </span>
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </header>

            {/* Study Sections */}
            <div className="space-y-8">
              {activeModule.sections.map((section, sIdx) => (
                <section
                  key={section.heading}
                  className={sIdx > 0 ? 'pt-6 border-t border-slate-100 space-y-4' : 'space-y-4'}
                >
                  <h4 className="text-lg font-semibold text-slate-900">{section.heading}</h4>
                  <p className="text-sm text-slate-700 leading-relaxed max-w-3xl">
                    {section.summary}
                  </p>

                  <ul className="space-y-2 text-sm text-slate-700">
                    {section.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2.5 leading-relaxed">
                        <span className="text-slate-400 mt-1.5 text-[10px]">●</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  {section.comparisonTable && (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                          <tr>
                            {section.comparisonTable.headers.map((h) => (
                              <th key={h} className="px-4 py-2.5 font-semibold">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {section.comparisonTable.rows.map((row) => (
                            <tr key={row.dimension}>
                              <td className="px-4 py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                                {row.dimension}
                              </td>
                              {row.values.map((val, vIdx) => (
                                <td key={vIdx} className="px-4 py-2.5 text-slate-600 leading-relaxed">
                                  {val}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {section.codeSnippet && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">
                          {section.codeSnippet.title}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopySnippet(
                              `${activeModule.id}-${sIdx}`,
                              section.codeSnippet!.code
                            )
                          }
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900"
                        >
                          {copiedKey === `${activeModule.id}-${sIdx}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="bg-slate-950 text-slate-100 rounded-lg p-4 text-xs font-mono leading-relaxed overflow-x-auto">
                        {section.codeSnippet.code}
                      </pre>
                    </div>
                  )}
                </section>
              ))}
            </div>

            {/* Exam Traps */}
            <section className="pt-6 border-t border-slate-100 space-y-2.5">
              <h4 className="text-sm font-semibold text-slate-900">
                Common Developer & Certification Traps
              </h4>
              <ul className="space-y-2 text-xs text-slate-700 bg-amber-50/60 border border-amber-200/80 rounded-lg p-4">
                {activeModule.examTraps.map((trap, idx) => (
                  <li key={idx} className="leading-relaxed">
                    <span className="font-semibold text-amber-800">Watch out: </span>
                    {trap}
                  </li>
                ))}
              </ul>
            </section>

            {/* Quick Recall Check */}
            <section className="pt-6 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <BookOpen className="w-4 h-4 text-amber-600" />
                Check Your Understanding
              </div>
              <p className="text-sm text-slate-800 font-medium">
                {activeModule.quickCheck.question}
              </p>
              <div className="space-y-2">
                {activeModule.quickCheck.options.map((opt, idx) => {
                  const chosen = quickCheckSelection === idx;
                  const isCorrect = activeModule.quickCheck.correctIndex === idx;
                  let cls = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
                  if (quickCheckAnswered) {
                    if (isCorrect) {
                      cls = 'border-emerald-500 bg-emerald-50 text-slate-900 font-medium';
                    } else if (chosen) {
                      cls = 'border-rose-400 bg-rose-50 text-slate-900';
                    }
                  }
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setQuickCheckAnswers((prev) => ({ ...prev, [activeModule.id]: idx }))
                      }
                      className={`w-full text-left px-3.5 py-2.5 text-xs rounded-lg border transition-colors ${cls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {quickCheckAnswered && (
                <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed">
                  <strong className="text-slate-900">Explanation: </strong>
                  {activeModule.quickCheck.explanation}
                </p>
              )}
            </section>

            {/* Footer Actions */}
            <footer className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {activeModule.relatedLabId && (
                  <button
                    type="button"
                    onClick={() => onLaunchLab(activeModule.relatedLabId!)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    Practice in Related Lab
                  </button>
                )}
                {activeModule.relatedQuizId && (
                  <button
                    type="button"
                    onClick={() => onLaunchQuiz(activeModule.relatedQuizId!)}
                    className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                  >
                    Take Topic Quiz
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!isModuleStudied) onToggleStudyModule(activeModule.id);
                  setActiveModuleId(nextModule.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Next Chapter: {nextModule.number}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </footer>
          </article>
        </div>
      )}

      {/* MODE 2: ACTIVE RECALL FLASHCARDS */}
      {studyView === 'flashcards' && currentCard && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {cardCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCardCategory(cat);
                    setCardIndex(0);
                    setFlipped(false);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    cardCategory === cat
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-600 tabular-nums">
              {masteredFlashcards.length}/{FLASHCARDS.length} total cards mastered
            </div>
          </div>

          <div className="max-w-3xl mx-auto space-y-5">
            <div
              onClick={() => setFlipped((f) => !f)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setFlipped((f) => !f);
                }
              }}
              className="bg-white border border-slate-200 rounded-xl p-8 sm:p-10 min-h-[260px] flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-colors focus-visible:outline-2 focus-visible:outline-amber-600"
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {currentCard.category} · Card{' '}
                  <span className="font-mono tabular-nums">
                    {safeCardIndex + 1}/{filteredCards.length}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                  <RotateCw className="w-3.5 h-3.5" />
                  {flipped ? 'Answer' : 'Prompt — click to reveal'}
                </span>
              </div>

              <div className="py-6">
                {!flipped ? (
                  <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 leading-snug text-balance">
                    {currentCard.front}
                  </h3>
                ) : (
                  <div className="space-y-4">
                    <p className="text-base sm:text-lg text-slate-800 leading-relaxed">
                      {currentCard.back}
                    </p>
                    {currentCard.codeHint && (
                      <pre className="bg-slate-950 text-slate-100 rounded-lg p-3.5 text-xs font-mono overflow-x-auto">
                        {currentCard.codeHint}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-400">
                {masteredFlashcards.includes(currentCard.id)
                  ? 'Status: Mastered'
                  : 'Status: In review rotation'}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFlipped(false);
                    setCardIndex((i) =>
                      i === 0 ? filteredCards.length - 1 : i - 1
                    );
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-white bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFlipped(false);
                    setCardIndex((i) => (i + 1) % filteredCards.length);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-white bg-slate-50 transition-colors"
                >
                  Next
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onToggleFlashcardMastered(currentCard.id, false);
                    setFlipped(false);
                    setCardIndex((i) => (i + 1) % filteredCards.length);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Review Again
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onToggleFlashcardMastered(currentCard.id, true);
                    setFlipped(false);
                    setCardIndex((i) => (i + 1) % filteredCards.length);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark Mastered
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: SERVICE CHEAT SHEET */}
      {studyView === 'cheatsheet' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative w-full lg:max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search service, dev analogy, or limit..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-amber-600"
              />
            </div>

            <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {sheetCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSheetCategory(cat)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    sheetCategory === cat
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">AWS Service</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Developer Analogy</th>
                  <th className="px-4 py-3 font-semibold">Billing Model</th>
                  <th className="px-4 py-3 font-semibold">Key Architecture / Exam Fact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSheet.length > 0 ? (
                  filteredSheet.map((row) => (
                    <tr key={row.service} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {row.service}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {row.category}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-800 whitespace-nowrap">
                        {row.devAnalogy}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {row.pricingUnit}
                      </td>
                      <td className="px-4 py-3 text-slate-700 leading-relaxed">
                        {row.keyFact}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No AWS services match &ldquo;{searchQuery}&rdquo;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
