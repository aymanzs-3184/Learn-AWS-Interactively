import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Play, ShieldAlert, ShieldCheck } from 'lucide-react';

interface IamPolicyLabProps {
  isCompleted: boolean;
  onComplete: () => void;
}

type ActionOption = 's3:GetObject' | 's3:PutObject' | 's3:DeleteBucket' | 's3:*' | 'ec2:*';
type ResourceOption =
  | 'arn:aws:s3:::dev-app-invoices/*'
  | 'arn:aws:s3:::dev-app-invoices'
  | '*';

interface SimulationCase {
  id: string;
  action: string;
  resource: string;
  label: string;
  expectedAllow: boolean;
}

const SIMULATION_CASES: SimulationCase[] = [
  {
    id: 'get-invoice',
    action: 's3:GetObject',
    resource: 'arn:aws:s3:::dev-app-invoices/inv-2026-04.pdf',
    label: 'Read invoice PDF from dev-app-invoices',
    expectedAllow: true,
  },
  {
    id: 'put-invoice',
    action: 's3:PutObject',
    resource: 'arn:aws:s3:::dev-app-invoices/inv-2026-04.pdf',
    label: 'Overwrite or upload object to dev-app-invoices',
    expectedAllow: false,
  },
  {
    id: 'delete-bucket',
    action: 's3:DeleteBucket',
    resource: 'arn:aws:s3:::dev-app-invoices',
    label: 'Delete the entire invoice bucket',
    expectedAllow: false,
  },
  {
    id: 'ec2-describe',
    action: 'ec2:DescribeInstances',
    resource: '*',
    label: 'List EC2 compute instances across the account',
    expectedAllow: false,
  },
];

function actionMatches(statementAction: ActionOption, testAction: string): boolean {
  if (statementAction === testAction) return true;
  if (statementAction === 's3:*' && testAction.startsWith('s3:')) return true;
  if (statementAction === 'ec2:*' && testAction.startsWith('ec2:')) return true;
  return false;
}

function resourceMatches(statementResource: ResourceOption, testResource: string): boolean {
  if (statementResource === '*') return true;
  if (statementResource === 'arn:aws:s3:::dev-app-invoices/*') {
    return testResource.startsWith('arn:aws:s3:::dev-app-invoices/');
  }
  return statementResource === testResource;
}

export function IamPolicyLab({ isCompleted, onComplete }: IamPolicyLabProps) {
  const [effect, setEffect] = useState<'Allow' | 'Deny'>('Allow');
  const [actions, setActions] = useState<ActionOption[]>(['s3:*']);
  const [resource, setResource] = useState<ResourceOption>('*');
  const [includeExplicitDeny, setIncludeExplicitDeny] = useState<boolean>(false);
  const [hasSimulated, setHasSimulated] = useState<boolean>(false);

  const toggleAction = (action: ActionOption) => {
    setActions((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
    );
  };

  const policyDocument = useMemo(() => {
    const statements: Array<{
      Sid: string;
      Effect: 'Allow' | 'Deny';
      Action: string[];
      Resource: string;
    }> = [
      {
        Sid: 'InvoiceReaderStatement',
        Effect: effect,
        Action: actions.length > 0 ? actions : ['(none)'],
        Resource: resource,
      },
    ];

    if (includeExplicitDeny) {
      statements.push({
        Sid: 'DenyDestructiveS3Actions',
        Effect: 'Deny',
        Action: ['s3:DeleteBucket', 's3:PutObject'],
        Resource: '*',
      });
    }

    return {
      Version: '2012-10-17',
      Statement: statements,
    };
  }, [effect, actions, resource, includeExplicitDeny]);

  const simulationResults = useMemo(() => {
    return SIMULATION_CASES.map((testCase) => {
      let explicitDeny = false;
      let explicitAllow = false;

      if (includeExplicitDeny) {
        if (
          testCase.action === 's3:DeleteBucket' ||
          testCase.action === 's3:PutObject'
        ) {
          explicitDeny = true;
        }
      }

      const matchesPrimary =
        actions.some((a) => actionMatches(a, testCase.action)) &&
        resourceMatches(resource, testCase.resource);

      if (matchesPrimary) {
        if (effect === 'Deny') explicitDeny = true;
        if (effect === 'Allow') explicitAllow = true;
      }

      const allowed = !explicitDeny && explicitAllow;
      const decisionReason = explicitDeny
        ? 'Explicit Deny overrides any Allow'
        : explicitAllow
          ? 'Matched Allow statement'
          : 'Implicit Deny (no matching Allow)';

      return {
        ...testCase,
        allowed,
        decisionReason,
        passesGoal: allowed === testCase.expectedAllow,
      };
    });
  }, [effect, actions, resource, includeExplicitDeny]);

  const checkNoWildcardAction =
    !actions.includes('s3:*') && !actions.includes('ec2:*') && actions.length > 0;
  const checkScopedResource = resource === 'arn:aws:s3:::dev-app-invoices/*';
  const checkSimulationPasses = simulationResults.every((r) => r.passesGoal);
  const allChecksPass =
    checkNoWildcardAction && checkScopedResource && checkSimulationPasses && hasSimulated;

  useEffect(() => {
    if (allChecksPass && !isCompleted) {
      onComplete();
    }
  }, [allChecksPass, isCompleted, onComplete]);

  const loadLeastPrivilegePreset = () => {
    setEffect('Allow');
    setActions(['s3:GetObject']);
    setResource('arn:aws:s3:::dev-app-invoices/*');
    setIncludeExplicitDeny(false);
    setHasSimulated(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Interactive Stage (Left 8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                IAM Policy Statement Editor
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Fix the overly permissive starter policy so the backend can only read objects inside{' '}
                <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
                  dev-app-invoices
                </code>
                .
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEffect('Allow');
                setActions(['s3:*']);
                setResource('*');
                setIncludeExplicitDeny(false);
                setHasSimulated(false);
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              Reset Starter Policy
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
            {/* Interactive Controls */}
            <div className="space-y-5">
              <div>
                <span className="block text-xs font-medium text-slate-700 mb-2">
                  Effect
                </span>
                <div className="inline-flex p-1 bg-slate-100 rounded-lg">
                  {(['Allow', 'Deny'] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setEffect(opt)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        effect === opt
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-700 mb-2">
                  Actions (select permitted API calls)
                </span>
                <div className="space-y-2">
                  {(
                    [
                      { id: 's3:GetObject', hint: 'Read object bytes' },
                      { id: 's3:PutObject', hint: 'Upload / overwrite object' },
                      { id: 's3:DeleteBucket', hint: 'Delete entire bucket' },
                      { id: 's3:*', hint: 'Wildcard: all S3 actions (dangerous)' },
                      { id: 'ec2:*', hint: 'Wildcard: all EC2 compute actions' },
                    ] as const
                  ).map((item) => {
                    const checked = actions.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className="flex items-center justify-between gap-3 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAction(item.id)}
                            className="h-4 w-4 accent-amber-600 rounded"
                          />
                          <span className="font-mono text-xs font-medium text-slate-900">
                            {item.id}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 truncate">{item.hint}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-700 mb-2">
                  Resource ARN Scope
                </span>
                <div className="space-y-2">
                  {(
                    [
                      {
                        value: 'arn:aws:s3:::dev-app-invoices/*',
                        label: 'Objects inside dev-app-invoices only',
                      },
                      {
                        value: 'arn:aws:s3:::dev-app-invoices',
                        label: 'Bucket ARN only (does not match objects)',
                      },
                      {
                        value: '*',
                        label: 'All resources in account (*)',
                      },
                    ] as const
                  ).map((res) => (
                    <label
                      key={res.value}
                      className="flex items-start gap-2.5 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="iam-resource"
                        checked={resource === res.value}
                        onChange={() => setResource(res.value)}
                        className="mt-0.5 h-4 w-4 accent-amber-600"
                      />
                      <div className="min-w-0">
                        <div className="font-mono text-xs text-slate-900 break-all">
                          {res.value}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{res.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeExplicitDeny}
                  onChange={(e) => setIncludeExplicitDeny(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-amber-600 rounded"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  Add secondary <code className="font-mono bg-slate-100 px-1 rounded">Deny</code>{' '}
                  guardrail statement for <code className="font-mono">s3:DeleteBucket</code> &{' '}
                  <code className="font-mono">s3:PutObject</code> (demonstrates Explicit Deny wins)
                </span>
              </label>
            </div>

            {/* Live JSON Preview */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-700">
                  Generated IAM Policy JSON
                </span>
                <span className="text-xs text-slate-500 font-mono">invoice-policy.json</span>
              </div>
              <pre className="flex-1 bg-slate-950 text-slate-100 rounded-lg p-4 text-xs font-mono leading-relaxed overflow-x-auto border border-slate-800">
                {JSON.stringify(policyDocument, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Policy Simulator */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                IAM Policy Evaluation Simulator
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tests how AWS evaluates Default Deny, Explicit Allow, and Explicit Deny at runtime.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHasSimulated(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              Run Policy Simulation
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {simulationResults.map((row) => (
              <div
                key={row.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-white"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-semibold text-slate-900">
                      {row.action}
                    </span>
                    <span className="text-slate-400">on</span>
                    <span className="font-mono text-slate-600 truncate">{row.resource}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{row.label}</p>
                </div>

                {hasSimulated ? (
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          row.allowed ? 'text-emerald-700' : 'text-slate-700'
                        }`}
                      >
                        {row.allowed ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        {row.allowed ? 'ALLOWED' : 'DENIED'}
                      </div>
                      <div className="text-[11px] text-slate-500">{row.decisionReason}</div>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${
                        row.passesGoal
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {row.passesGoal ? 'Pass' : `Need ${row.expectedAllow ? 'Allow' : 'Deny'}`}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 shrink-0">Pending simulation</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Concept & Verification Deck (4 cols) */}
      <aside className="lg:col-span-4 space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-slate-900">Lab Verification</h4>
            <span className="text-xs font-medium text-slate-500 tabular-nums">
              {[checkNoWildcardAction, checkScopedResource, hasSimulated && checkSimulationPasses].filter(Boolean).length}
              /3 passed
            </span>
          </div>

          <div className="space-y-3">
            <VerificationRow
              passed={checkNoWildcardAction}
              label="Remove wildcard actions (s3:* / ec2:*)"
            />
            <VerificationRow
              passed={checkScopedResource}
              label="Scope Resource to dev-app-invoices/*"
            />
            <VerificationRow
              passed={hasSimulated && checkSimulationPasses}
              label="Simulate & verify only s3:GetObject passes"
            />
          </div>

          {allChecksPass || isCompleted ? (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Lab Completed: Least Privilege Verified
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Notice how object-level actions like <code className="font-mono">s3:GetObject</code>{' '}
                require the <code className="font-mono">/*</code> suffix on the bucket ARN.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={loadLeastPrivilegePreset}
              className="mt-5 w-full px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Show Least-Privilege Solution
            </button>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h4 className="text-sm font-semibold text-slate-900">
            Software Developer Mental Model
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Treat an IAM Policy like an OAuth scope + route middleware combined. Every AWS SDK
            command (<code className="font-mono">GetObjectCommand</code>) maps 1:1 to an IAM
            Action (<code className="font-mono">s3:GetObject</code>).
          </p>
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
            <div>
              <span className="font-semibold text-slate-800">Bucket ARN:</span>{' '}
              <code className="font-mono">arn:aws:s3:::bucket</code> (bucket metadata ops like
              ListBucket)
            </div>
            <div>
              <span className="font-semibold text-slate-800">Object ARN:</span>{' '}
              <code className="font-mono">arn:aws:s3:::bucket/*</code> (object ops like GetObject)
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function VerificationRow({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div className="flex items-start gap-2.5 text-xs">
      <CheckCircle2
        className={`w-4 h-4 mt-0.5 shrink-0 ${
          passed ? 'text-emerald-600' : 'text-slate-300'
        }`}
      />
      <span className={passed ? 'text-slate-900 font-medium' : 'text-slate-600'}>
        {label}
      </span>
    </div>
  );
}
