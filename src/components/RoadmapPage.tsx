import { ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react';
import { CERTIFICATIONS } from '../data/curriculum';
import { LabId } from '../types/aws';

interface RoadmapPageProps {
  activeCertId: string;
  onSelectCert: (certId: string) => void;
  checkedMilestones: string[];
  onToggleMilestone: (milestoneId: string) => void;
  onLaunchLab: (labId: LabId) => void;
  onLaunchQuiz: (deckId: string) => void;
}

export function RoadmapPage({
  activeCertId,
  onSelectCert,
  checkedMilestones,
  onToggleMilestone,
  onLaunchLab,
  onLaunchQuiz,
}: RoadmapPageProps) {
  const selectedCert =
    CERTIFICATIONS.find((c) => c.id === activeCertId) ?? CERTIFICATIONS[1];

  const completedInCert = selectedCert.milestones.filter((m) =>
    checkedMilestones.includes(m.id)
  ).length;
  const readinessPct = Math.round(
    (completedInCert / selectedCert.milestones.length) * 100
  );

  return (
    <div className="space-y-8">
      {/* Header + Honest Developer Strategy Note */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold text-slate-900 text-balance">
            AWS Certification Roadmap for Software Developers
          </h2>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            A pragmatic progression from cloud fundamentals to production developer and architecture
            credentials. Select any stage below to inspect official domain weights and track
            your readiness checklist.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 max-w-md text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-900">Developer Fast-Track Tip: </span>
          Cloud Practitioner (CLF-C02) is optional if you already build web APIs. Many software
          engineers start straight with <strong>Developer – Associate (DVA-C02)</strong> after
          completing the 5 CloudBench labs.
        </div>
      </div>

      {/* 4-Step Visual Progression Track */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {CERTIFICATIONS.map((cert) => {
          const isSelected = cert.id === selectedCert.id;
          const doneCount = cert.milestones.filter((m) =>
            checkedMilestones.includes(m.id)
          ).length;
          return (
            <button
              key={cert.id}
              type="button"
              onClick={() => onSelectCert(cert.id)}
              className={`text-left p-5 rounded-xl border transition-colors flex flex-col justify-between gap-4 ${
                isSelected
                  ? 'border-slate-900 bg-white ring-1 ring-slate-900'
                  : 'border-slate-200 bg-white hover:bg-slate-50/70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono font-semibold text-amber-700">
                    Step 0{cert.recommendedOrder} · {cert.code}
                  </span>
                  <span>{cert.level}</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mt-2 leading-snug">
                  {cert.title}
                </h3>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 tabular-nums">
                <span>{cert.prepWeeks}</span>
                <span className="font-medium text-slate-900">
                  {doneCount}/{cert.milestones.length} milestones
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Certification Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Exam Blueprint & Official Domain Weights */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="pb-5 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-semibold text-amber-700">
                {selectedCert.code}
              </span>
              <span aria-hidden="true">·</span>
              <span>{selectedCert.level}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">${selectedCert.examFeeUsd} USD</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {selectedCert.questionCount} questions ({selectedCert.durationMinutes} min)
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">Pass: {selectedCert.passingScore}/1000</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mt-2">
              {selectedCert.title}
            </h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              {selectedCert.overview}
            </p>
            <p className="text-xs text-slate-700 mt-3 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5">
              <strong>Software Dev Verdict:</strong> {selectedCert.devVerdict}
            </p>
          </div>

          {/* Domain Weight Breakdown */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-900">
              Official Exam Domain Weights
            </h4>
            <div className="space-y-4">
              {selectedCert.domains.map((dom) => (
                <div key={dom.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">{dom.name}</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {dom.percentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-600 rounded-full"
                      style={{ width: `${dom.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{dom.focus}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Core Services */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-700 mb-2">
              Core AWS Services Tested
            </h4>
            <p className="text-xs font-mono text-slate-700 leading-relaxed">
              {selectedCert.keyServices.join(' · ')}
            </p>
          </div>
        </div>

        {/* Right 5 cols: Interactive Readiness Checklist */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h4 className="text-base font-semibold text-slate-900">
                Readiness Checklist
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Track labs and quizzes for {selectedCert.code}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-semibold font-mono text-slate-900 tabular-nums">
                {readinessPct}%
              </div>
              <div className="text-[11px] text-slate-500 tabular-nums">
                {completedInCert}/{selectedCert.milestones.length} done
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {selectedCert.milestones.map((m) => {
              const checked = checkedMilestones.includes(m.id);
              return (
                <div
                  key={m.id}
                  className={`p-3.5 border rounded-lg transition-colors ${
                    checked ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white'
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleMilestone(m.id)}
                      className="mt-0.5 h-4 w-4 accent-emerald-600 rounded"
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-xs font-semibold ${
                          checked ? 'text-slate-600 line-through' : 'text-slate-900'
                        }`}
                      >
                        {m.label}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{m.detail}</p>
                    </div>
                  </label>

                  {m.actionType !== 'study' && m.targetId && (
                    <div className="mt-2.5 pl-7">
                      <button
                        type="button"
                        onClick={() =>
                          m.actionType === 'lab'
                            ? onLaunchLab(m.targetId as LabId)
                            : onLaunchQuiz(m.targetId as string)
                        }
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline"
                      >
                        {m.actionType === 'lab' ? 'Open Interactive Lab' : 'Take Topic Quiz'}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Progress saved locally
            </span>
            <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
              Prep: {selectedCert.prepWeeks}
              <ExternalLink className="w-3 h-3 opacity-60" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
