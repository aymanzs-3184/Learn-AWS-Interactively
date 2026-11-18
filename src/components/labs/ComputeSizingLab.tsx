import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ComputeSizingLabProps {
  isCompleted: boolean;
  onComplete: () => void;
}

interface DecisionChallenge {
  id: string;
  scenario: string;
  correct: 'lambda' | 'fargate' | 'ec2-spot';
  explanation: string;
}

const CHALLENGES: DecisionChallenge[] = [
  {
    id: 'c1',
    scenario:
      'A Stripe webhook listener processes 80,000 events/month (~120ms each), mostly during business hours with zero traffic at night.',
    correct: 'lambda',
    explanation:
      'Spiky, low-to-moderate volume webhooks cost pennies on Lambda (often within the 1M free tier requests) with zero idle charges.',
  },
  {
    id: 'c2',
    scenario:
      'A real-time collaborative whiteboard backend holds stateful WebSocket connections open for 45+ minutes per user using Docker.',
    correct: 'fargate',
    explanation:
      'Lambda caps execution at 15 minutes and cannot hold arbitrary long-lived TCP/Docker processes; ECS Fargate runs containers without server patching.',
  },
  {
    id: 'c3',
    scenario:
      'An overnight ML feature extraction pipeline runs stateless Docker jobs that can checkpoint progress and tolerate 2-minute interruption notices.',
    correct: 'ec2-spot',
    explanation:
      'EC2 Spot Instances save up to 90% on fault-tolerant batch compute that handles interruption gracefully.',
  },
];

export function ComputeSizingLab({ isCompleted, onComplete }: ComputeSizingLabProps) {
  const [monthlyMillions, setMonthlyMillions] = useState<number>(2);
  const [durationMs, setDurationMs] = useState<number>(250);
  const [spikyPattern, setSpikyPattern] = useState<boolean>(true);
  const [needsLongRuntime, setNeedsLongRuntime] = useState<boolean>(false);

  const [answers, setAnswers] = useState<Record<string, string>>({});

  const costs = useMemo(() => {
    const requests = monthlyMillions * 1_000_000;
    // Lambda: $0.20 per 1M requests + $0.0000166667 per GB-sec (assuming 512MB = 0.5GB)
    const gbSeconds = requests * (durationMs / 1000) * 0.5;
    const rawLambda = (requests / 1_000_000) * 0.2 + gbSeconds * 0.0000166667;
    const lambdaCost = needsLongRuntime ? null : Math.max(0, rawLambda);

    // Fargate: 2 tasks minimum for HA (~0.5 vCPU, 1GB RAM each) -> ~$32/mo baseline + scaling for high reqs
    const avgRps = requests / (30 * 24 * 3600);
    const neededTasks = Math.max(
      2,
      Math.ceil((avgRps * (durationMs / 1000)) / 12) * (spikyPattern ? 2 : 1)
    );
    const fargateCost = neededTasks * 18.5;

    // EC2 On-Demand / ASG (t3.small baseline ~$15/mo x 2 for HA + scaling)
    const ec2Nodes = Math.max(2, Math.ceil(neededTasks * 0.8));
    const ec2Cost = ec2Nodes * 15.2;

    const maxCost = Math.max(lambdaCost ?? 0, fargateCost, ec2Cost, 50);

    let recommendation: 'Lambda' | 'ECS Fargate' | 'EC2 Auto Scaling' = 'Lambda';
    let reason =
      'Lowest cost and zero idle spend for event-driven workloads under 15 min execution.';

    if (needsLongRuntime) {
      recommendation = 'ECS Fargate';
      reason =
        'Long-running processes (>15 min) or persistent WebSockets rule out Lambda; Fargate avoids EC2 OS maintenance.';
    } else if ((lambdaCost ?? Infinity) > fargateCost * 1.15) {
      recommendation = fargateCost <= ec2Cost ? 'ECS Fargate' : 'EC2 Auto Scaling';
      reason =
        'At sustained high request volume and long per-request duration, always-on containers become cheaper per compute-second than per-invocation Lambda.';
    }

    return {
      lambdaCost,
      fargateCost,
      ec2Cost,
      neededTasks,
      ec2Nodes,
      maxCost,
      recommendation,
      reason,
      avgRps,
    };
  }, [monthlyMillions, durationMs, spikyPattern, needsLongRuntime]);

  const solvedCount = CHALLENGES.filter((c) => answers[c.id] === c.correct).length;
  const allChallengesSolved = solvedCount === CHALLENGES.length;

  useEffect(() => {
    if (allChallengesSolved && !isCompleted) {
      onComplete();
    }
  }, [allChallengesSolved, isCompleted, onComplete]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 space-y-6">
        {/* Simulator Controls & Live Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">
              Interactive Compute Cost & Architecture Simulator
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Adjust traffic volume and runtime behavior to observe where serverless crosses over to containers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span>Monthly Requests</span>
                <span className="font-mono text-slate-900 tabular-nums">
                  {monthlyMillions}M req/mo (~{costs.avgRps.toFixed(1)} req/s)
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={50}
                step={0.5}
                value={monthlyMillions}
                onChange={(e) => setMonthlyMillions(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span>Avg Execution Duration</span>
                <span className="font-mono text-slate-900 tabular-nums">{durationMs} ms</span>
              </div>
              <input
                type="range"
                min={50}
                max={3000}
                step={50}
                value={durationMs}
                onChange={(e) => setDurationMs(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>

            <label className="flex items-center gap-2.5 px-3 py-2.5 border border-slate-200 rounded-lg cursor-pointer text-xs text-slate-800">
              <input
                type="checkbox"
                checked={spikyPattern}
                onChange={(e) => setSpikyPattern(e.target.checked)}
                className="h-4 w-4 accent-amber-600 rounded"
              />
              Spiky daytime traffic (requires headroom on containers)
            </label>

            <label className="flex items-center gap-2.5 px-3 py-2.5 border border-slate-200 rounded-lg cursor-pointer text-xs text-slate-800">
              <input
                type="checkbox"
                checked={needsLongRuntime}
                onChange={(e) => setNeedsLongRuntime(e.target.checked)}
                className="h-4 w-4 accent-amber-600 rounded"
              />
              Requires WebSockets or &gt;15 min job runtime
            </label>
          </div>

          {/* Live Horizontal Cost Comparison */}
          <div className="space-y-3 pt-2">
            <CostBar
              label="AWS Lambda (512 MB)"
              cost={costs.lambdaCost}
              maxCost={costs.maxCost}
              note={
                costs.lambdaCost === null
                  ? 'Disqualified (15-min timeout / stateless)'
                  : 'Pay-per-ms, scales to zero'
              }
              highlight={costs.recommendation === 'Lambda'}
            />
            <CostBar
              label={`ECS Fargate (${costs.neededTasks} tasks)`}
              cost={costs.fargateCost}
              maxCost={costs.maxCost}
              note="Serverless Docker containers, zero OS patching"
              highlight={costs.recommendation === 'ECS Fargate'}
            />
            <CostBar
              label={`EC2 Auto Scaling (${costs.ec2Nodes}x t3.small)`}
              cost={costs.ec2Cost}
              maxCost={costs.maxCost}
              note="Lowest raw compute $/hr, requires OS maintenance"
              highlight={costs.recommendation === 'EC2 Auto Scaling'}
            />
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="text-xs font-semibold text-slate-900">
              Recommended Pick: {costs.recommendation}
            </div>
            <p className="text-xs text-slate-600 mt-1">{costs.reason}</p>
          </div>
        </div>

        {/* 3 Decision Challenges */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Architecture Decision Challenges
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Apply the trade-offs above to solve all 3 software engineering scenarios.
            </p>
          </div>

          <div className="space-y-4">
            {CHALLENGES.map((ch, idx) => {
              const selected = answers[ch.id];
              const isCorrect = selected === ch.correct;
              return (
                <div
                  key={ch.id}
                  className="p-4 border border-slate-200 rounded-lg space-y-3"
                >
                  <div className="text-xs font-semibold text-slate-900">
                    Scenario {idx + 1}: {ch.scenario}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: 'lambda', label: 'AWS Lambda' },
                        { id: 'fargate', label: 'ECS Fargate' },
                        { id: 'ec2-spot', label: 'EC2 Spot Instances' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [ch.id]: opt.id }))
                        }
                        className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                          selected === opt.id
                            ? 'border-amber-600 bg-amber-50 text-slate-900'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {selected && (
                    <p
                      className={`text-xs ${
                        isCorrect ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isCorrect ? 'Correct — ' : 'Not optimal — '}
                      {ch.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Deck */}
      <aside className="lg:col-span-4 space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-slate-900">Lab Verification</h4>
            <span className="text-xs font-medium text-slate-500 tabular-nums">
              {solvedCount}/{CHALLENGES.length} solved
            </span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <CheckCircle2
                className={`w-4 h-4 mt-0.5 shrink-0 ${
                  allChallengesSolved ? 'text-emerald-600' : 'text-slate-300'
                }`}
              />
              <span className={allChallengesSolved ? 'text-slate-900 font-medium' : 'text-slate-600'}>
                Solve all 3 compute selection scenarios accurately
              </span>
            </div>
          </div>

          {(allChallengesSolved || isCompleted) && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Lab Completed: Compute Sizing Verified
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
          <h4 className="text-sm font-semibold text-slate-900">Rule of Thumb for Beginners</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Start with <strong>Lambda</strong> for webhooks and sporadic APIs, move to{' '}
            <strong>ECS Fargate</strong> for Dockerized microservices and WebSockets, and use{' '}
            <strong>EC2 Spot/Reserved</strong> when sustained CPU utilization makes raw VMs
            cheaper.
          </p>
        </div>
      </aside>
    </div>
  );
}

function CostBar({
  label,
  cost,
  maxCost,
  note,
  highlight,
}: {
  label: string;
  cost: number | null;
  maxCost: number;
  note: string;
  highlight: boolean;
}) {
  const widthPct = cost === null ? 0 : Math.min(100, Math.max(4, (cost / maxCost) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-900">
          {label} {highlight ? '· Recommended' : ''}
        </span>
        <span className="font-mono font-semibold text-slate-900 tabular-nums">
          {cost === null ? 'N/A' : `$${cost.toFixed(2)}/mo`}
        </span>
      </div>
      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-200 ${
            highlight ? 'bg-amber-600' : 'bg-slate-400'
          }`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
      <div className="text-[11px] text-slate-500">{note}</div>
    </div>
  );
}
