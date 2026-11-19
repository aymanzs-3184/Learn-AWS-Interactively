import { useState } from 'react';
import { ArrowRight, CheckCircle2, Layers } from 'lucide-react';
import { CERTIFICATIONS, LABS, MENTAL_MODELS, QUIZ_DECKS } from '../data/curriculum';
import { STUDY_MODULES } from '../data/studyMaterial';
import { LabId, UserProgress } from '../types/aws';

interface OverviewPageProps {
  progress: UserProgress;
  onLaunchLab: (labId: LabId) => void;
  onGoToStudy: () => void;
  onGoToQuizzes: () => void;
  onGoToRoadmap: () => void;
}

export function OverviewPage({
  progress,
  onLaunchLab,
  onGoToStudy,
  onGoToQuizzes,
  onGoToRoadmap,
}: OverviewPageProps) {
  const [modelCategory, setModelCategory] = useState<
    'compute' | 'storage' | 'networking' | 'security'
  >('compute');
  const [imgError, setImgError] = useState<boolean>(false);

  const nextLab =
    LABS.find((l) => !progress.completedLabs.includes(l.id)) ?? LABS[0];

  const quizValues = Object.values(progress.quizScores);
  const avgQuizScore =
    quizValues.length > 0
      ? Math.round(
          quizValues.reduce((sum, item) => sum + item.bestPercent, 0) / quizValues.length
        )
      : null;

  const activeCert =
    CERTIFICATIONS.find((c) => c.id === progress.activeCertId) ?? CERTIFICATIONS[1];

  const filteredModels = MENTAL_MODELS.filter((m) => m.category === modelCategory);

  return (
    <div className="space-y-12">
      {/* Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-6 flex flex-col justify-between bg-white border border-slate-200 rounded-xl p-8">
          <div className="space-y-4">
            <p className="text-xs font-medium text-amber-700">
              AWS Learning Workbench for Software Developers
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight leading-tight text-balance">
              Learn AWS by wiring real architecture, not memorizing console menus.
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-xl">
              Study core cloud chapters, practice with active-recall flashcards, wire hands-on IAM
              and serverless labs, and follow a clear certification roadmap built for software
              engineers.
            </p>
          </div>

          <div className="pt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onGoToStudy}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Read Study Guide
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onLaunchLab(nextLab.id)}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              {progress.completedLabs.length > 0
                ? `Continue Lab ${nextLab.number}`
                : 'Start Lab 01'}
            </button>
            <button
              type="button"
              onClick={onGoToRoadmap}
              className="px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline whitespace-nowrap shrink-0"
            >
              Cert Roadmap
            </button>
          </div>
        </div>

        {/* Visual Blueprint Frame */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center min-h-[280px]">
          {!imgError ? (
            <img
              src="/src/assets/images/hero_aws_architecture_1795003285167.jpg"
              alt="Isometric cloud software architecture diagram showing API Gateway, compute tier, and isolated data tier"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full p-8 bg-slate-100 flex flex-col items-center justify-center text-center gap-3">
              <Layers className="w-10 h-10 text-amber-600" />
              <div className="text-sm font-semibold text-slate-900">
                Cloud Architecture Blueprint
              </div>
              <p className="text-xs text-slate-600 max-w-xs">
                API Gateway → Serverless Compute → Private VPC Data Tier
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Full-Width 4-Column Progress Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white border border-slate-200 rounded-xl p-6">
        <div className="space-y-1">
          <div className="text-xs text-slate-500">Study Modules</div>
          <div className="text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {progress.completedStudyModules.length}/{STUDY_MODULES.length}
          </div>
          <div className="text-xs text-slate-600 tabular-nums">
            {progress.masteredFlashcards.length} flashcards mastered
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-slate-500">Interactive Labs</div>
          <div className="text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {progress.completedLabs.length}/{LABS.length}
          </div>
          <div className="text-xs text-slate-600">Hands-on sandboxes completed</div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-slate-500">Average Quiz Score</div>
          <div className="text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {avgQuizScore !== null ? `${avgQuizScore}%` : '—'}
          </div>
          <div className="text-xs text-slate-600 tabular-nums">
            {quizValues.length}/{QUIZ_DECKS.length} topic decks attempted
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-slate-500">Active Cert Track</div>
          <div className="text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {activeCert.code}
          </div>
          <div className="text-xs text-slate-600 truncate">{activeCert.title}</div>
        </div>
      </section>

      {/* Developer Mental Model Translator */}
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 text-balance">
              Developer-to-AWS Mental Model Translator
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Map familiar software engineering tools directly to their AWS equivalents and common
              production gotchas.
            </p>
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-lg self-start md:self-auto">
            {(
              [
                { id: 'compute', label: 'Compute' },
                { id: 'storage', label: 'Storage & DB' },
                { id: 'networking', label: 'Networking' },
                { id: 'security', label: 'Security' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setModelCategory(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  modelCategory === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredModels.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="text-xs text-slate-500">
                  What you know: <span className="text-slate-700 font-medium">{item.devConcept}</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{item.awsService}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.devContext}</p>

                <pre className="bg-slate-950 text-slate-100 rounded-lg p-3 text-[11px] font-mono overflow-x-auto">
                  {item.awsCode}
                </pre>

                <div className="space-y-1.5 text-xs pt-1">
                  <p className="text-slate-700">
                    <strong className="text-slate-900">When to use:</strong> {item.whenToUse}
                  </p>
                  <p className="text-slate-600">
                    <strong className="text-amber-800">Dev Gotcha:</strong> {item.gotcha}
                  </p>
                </div>
              </div>

              {item.relatedLabId && (
                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onLaunchLab(item.relatedLabId!)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline"
                  >
                    Practice in Interactive Lab
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Curriculum Directory */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              5 Hands-On Developer Labs
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Each lab includes live configuration validation and AWS CLI / TypeScript SDK v3 code.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToQuizzes}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline whitespace-nowrap shrink-0"
          >
            Jump to Quizzes →
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {LABS.map((lab) => {
            const done = progress.completedLabs.includes(lab.id);
            return (
              <div
                key={lab.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono">{lab.number}</span>
                    <span aria-hidden="true">·</span>
                    <span>{lab.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{lab.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span>{lab.duration}</span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">{lab.title}</h3>
                  <p className="text-xs text-slate-600">{lab.summary}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {done && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      Completed
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onLaunchLab(lab.id)}
                    className="px-4 py-2 text-xs font-semibold text-slate-900 border border-slate-200 rounded-lg hover:bg-white transition-colors whitespace-nowrap shrink-0"
                  >
                    {done ? 'Reopen Lab' : 'Launch Lab'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
