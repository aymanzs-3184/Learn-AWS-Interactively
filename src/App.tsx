import { useState } from 'react';
import { LABS } from './data/curriculum';
import { useProgress } from './hooks/useProgress';
import { AppTab, LabId } from './types/aws';
import { OverviewPage } from './components/OverviewPage';
import { LabsHub } from './components/LabsHub';
import { QuizzesPage } from './components/QuizzesPage';
import { RoadmapPage } from './components/RoadmapPage';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('overview');
  const [activeLabId, setActiveLabId] = useState<LabId>('iam-policy');
  const [quizDeckTrigger, setQuizDeckTrigger] = useState<string | undefined>(undefined);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  const {
    progress,
    markLabCompleted,
    recordQuizScore,
    toggleMilestone,
    setActiveCertId,
    resetProgress,
  } = useProgress();

  const nextIncompleteLab =
    LABS.find((l) => !progress.completedLabs.includes(l.id)) ?? LABS[0];

  const handleLaunchLab = (labId: LabId) => {
    setActiveLabId(labId);
    setActiveTab('labs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLaunchQuiz = (deckId?: string) => {
    setQuizDeckTrigger(deckId);
    setActiveTab('quizzes');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems: Array<{ id: AppTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'labs', label: 'Interactive Labs' },
    { id: 'quizzes', label: 'Quizzes' },
    { id: 'roadmap', label: 'Cert Roadmap' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 3-Zone Top Bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className="text-lg font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            CloudBench
          </button>

          {/* Zone 2: 4 single-line nav links */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'quizzes') setQuizDeckTrigger(undefined);
                    setActiveTab(item.id);
                  }}
                  className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-600 ${
                    active
                      ? 'text-slate-900 border-amber-600'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => handleLaunchLab(nextIncompleteLab.id)}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
            >
              {progress.completedLabs.length === LABS.length
                ? 'Review Labs'
                : `Start Lab ${nextIncompleteLab.number}`}
            </button>
          </div>
        </div>

        {/* Mobile Nav Row (non-sticky so 0% sticky footprint on mobile) */}
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center gap-4 overflow-x-auto text-xs font-medium"
        >
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'quizzes') setQuizDeckTrigger(undefined);
                  setActiveTab(item.id);
                }}
                className={`py-1.5 whitespace-nowrap shrink-0 border-b-2 ${
                  active
                    ? 'text-slate-900 border-amber-600'
                    : 'text-slate-600 border-transparent'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {activeTab === 'overview' && (
          <OverviewPage
            progress={progress}
            onLaunchLab={handleLaunchLab}
            onGoToQuizzes={() => handleLaunchQuiz(undefined)}
            onGoToRoadmap={() => setActiveTab('roadmap')}
          />
        )}

        {activeTab === 'labs' && (
          <LabsHub
            activeLabId={activeLabId}
            onSelectLab={(id) => setActiveLabId(id)}
            completedLabs={progress.completedLabs}
            onCompleteLab={markLabCompleted}
            onGoToQuizzes={() => handleLaunchQuiz(undefined)}
          />
        )}

        {activeTab === 'quizzes' && (
          <QuizzesPage
            initialDeckId={quizDeckTrigger}
            quizScores={progress.quizScores}
            onRecordScore={recordQuizScore}
            onGoToRoadmap={() => setActiveTab('roadmap')}
          />
        )}

        {activeTab === 'roadmap' && (
          <RoadmapPage
            activeCertId={progress.activeCertId}
            onSelectCert={setActiveCertId}
            checkedMilestones={progress.checkedMilestones}
            onToggleMilestone={toggleMilestone}
            onLaunchLab={handleLaunchLab}
            onLaunchQuiz={(deckId) => handleLaunchQuiz(deckId)}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            CloudBench · AWS Developer Learning Workbench · Built for software engineers
          </div>
          <div className="flex items-center gap-4">
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="text-slate-500 hover:text-slate-900 transition-colors"
              >
                Reset Local Progress
              </button>
            ) : (
              <span className="inline-flex items-center gap-2">
                <span>Clear saved labs & scores?</span>
                <button
                  type="button"
                  onClick={() => {
                    resetProgress();
                    setConfirmReset(false);
                  }}
                  className="font-semibold text-rose-700 hover:underline"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="text-slate-600 hover:underline"
                >
                  Cancel
                </button>
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
