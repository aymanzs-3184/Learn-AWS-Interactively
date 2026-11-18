import { useState } from 'react';
import { CheckCircle2, Code2, Copy, Check, ArrowRight } from 'lucide-react';
import { LABS } from '../data/curriculum';
import { LabId } from '../types/aws';
import { IamPolicyLab } from './labs/IamPolicyLab';
import { S3StaticLab } from './labs/S3StaticLab';
import { ServerlessApiLab } from './labs/ServerlessApiLab';
import { VpcNetworkingLab } from './labs/VpcNetworkingLab';
import { ComputeSizingLab } from './labs/ComputeSizingLab';

interface LabsHubProps {
  activeLabId: LabId;
  onSelectLab: (id: LabId) => void;
  completedLabs: LabId[];
  onCompleteLab: (id: LabId) => void;
  onGoToQuizzes: () => void;
}

export function LabsHub({
  activeLabId,
  onSelectLab,
  completedLabs,
  onCompleteLab,
  onGoToQuizzes,
}: LabsHubProps) {
  const [showCodeDrawer, setShowCodeDrawer] = useState<boolean>(false);
  const [codeFormat, setCodeFormat] = useState<'cli' | 'sdk'>('sdk');
  const [copied, setCopied] = useState<boolean>(false);

  const activeLab = LABS.find((l) => l.id === activeLabId) ?? LABS[0];
  const currentIndex = LABS.findIndex((l) => l.id === activeLab.id);
  const nextLab = LABS[(currentIndex + 1) % LABS.length];
  const isCompleted = completedLabs.includes(activeLab.id);

  const handleCopyCode = () => {
    const snippet = codeFormat === 'cli' ? activeLab.cliSnippet : activeLab.sdkSnippet;
    navigator.clipboard?.writeText(snippet).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Lab Selector Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {LABS.map((lab) => {
              const selected = lab.id === activeLab.id;
              const done = completedLabs.includes(lab.id);
              return (
                <button
                  key={lab.id}
                  type="button"
                  onClick={() => onSelectLab(lab.id)}
                  className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    selected
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  <span className="font-mono tabular-nums opacity-75">{lab.number}</span>
                  <span>{lab.title.split(':')[0].split('–')[0]}</span>
                  {done && (
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${selected ? 'text-emerald-400' : 'text-emerald-600'}`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-slate-500 tabular-nums">
              {completedLabs.length}/{LABS.length} labs completed
            </span>
            <button
              type="button"
              onClick={() => setShowCodeDrawer((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <Code2 className="w-3.5 h-3.5 text-amber-600" />
              {showCodeDrawer ? 'Hide CLI & SDK' : 'View CLI & SDK'}
            </button>
          </div>
        </div>

        {/* Active Lab Header Summary */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{activeLab.category}</span>
              <span aria-hidden="true">·</span>
              <span>{activeLab.difficulty}</span>
              <span aria-hidden="true">·</span>
              <span>{activeLab.duration}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-700 font-medium">
                Dev Analogy: {activeLab.devAnalogy}
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mt-1 text-balance">
              {activeLab.number}. {activeLab.title}
            </h2>
            <p className="text-sm text-slate-600 mt-1">{activeLab.summary}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isCompleted && (
              <button
                type="button"
                onClick={() => onSelectLab(nextLab.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Next Lab: {nextLab.number}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onGoToQuizzes}
              className="px-3 py-2 text-xs font-medium text-amber-700 hover:text-amber-800 hover:underline whitespace-nowrap shrink-0"
            >
              Test Knowledge in Quizzes
            </button>
          </div>
        </div>

        {/* Collapsible Developer CLI & TypeScript SDK Drawer */}
        {showCodeDrawer && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="inline-flex p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setCodeFormat('sdk')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      codeFormat === 'sdk'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600'
                    }`}
                  >
                    TypeScript SDK v3 ({activeLab.sdkPackage})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeFormat('cli')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      codeFormat === 'cli'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600'
                    }`}
                  >
                    AWS CLI v2
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Snippet
                  </>
                )}
              </button>
            </div>
            <pre className="bg-slate-950 text-slate-100 rounded-lg p-4 text-xs font-mono leading-relaxed overflow-x-auto">
              {codeFormat === 'cli' ? activeLab.cliSnippet : activeLab.sdkSnippet}
            </pre>
          </div>
        )}
      </div>

      {/* Active Interactive Lab Engine */}
      {activeLab.id === 'iam-policy' && (
        <IamPolicyLab
          isCompleted={isCompleted}
          onComplete={() => onCompleteLab('iam-policy')}
        />
      )}
      {activeLab.id === 's3-static-cors' && (
        <S3StaticLab
          isCompleted={isCompleted}
          onComplete={() => onCompleteLab('s3-static-cors')}
        />
      )}
      {activeLab.id === 'serverless-api' && (
        <ServerlessApiLab
          isCompleted={isCompleted}
          onComplete={() => onCompleteLab('serverless-api')}
        />
      )}
      {activeLab.id === 'vpc-networking' && (
        <VpcNetworkingLab
          isCompleted={isCompleted}
          onComplete={() => onCompleteLab('vpc-networking')}
        />
      )}
      {activeLab.id === 'compute-sizing' && (
        <ComputeSizingLab
          isCompleted={isCompleted}
          onComplete={() => onCompleteLab('compute-sizing')}
        />
      )}
    </div>
  );
}
