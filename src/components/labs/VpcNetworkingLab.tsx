import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Play, ShieldAlert, ShieldCheck } from 'lucide-react';

interface VpcNetworkingLabProps {
  isCompleted: boolean;
  onComplete: () => void;
}

export function VpcNetworkingLab({ isCompleted, onComplete }: VpcNetworkingLabProps) {
  const [igwRouteEnabled, setIgwRouteEnabled] = useState<boolean>(false);
  const [webAllows443, setWebAllows443] = useState<boolean>(true);
  const [webAllows22Public, setWebAllows22Public] = useState<boolean>(true);
  const [rdsSource, setRdsSource] = useState<'none' | '0.0.0.0/0' | 'sg-web'>('none');
  const [hasTraced, setHasTraced] = useState<boolean>(false);

  const traceResults = useMemo(() => {
    // 1. Internet -> Web Server :443
    const webReachable = igwRouteEnabled && webAllows443;
    const webHopDetail = !igwRouteEnabled
      ? 'Dropped at Route Table rtb-public: No 0.0.0.0/0 -> igw-09a8b7c6 route.'
      : !webAllows443
        ? 'Dropped at sg-web: Inbound TCP 443 not permitted.'
        : 'Passed: Internet -> IGW -> rtb-public -> sg-web (TCP 443) -> Stateful return allowed.';

    // 2. Web Server (sg-web) -> RDS Postgres :5432
    const dbFromWeb = rdsSource === 'sg-web' || rdsSource === '0.0.0.0/0';
    const dbFromWebDetail =
      rdsSource === 'none'
        ? 'Timeout at sg-rds: No inbound TCP 5432 rule permits sg-web.'
        : 'Passed: Local VPC route (10.0.0.0/16) -> sg-rds (TCP 5432 allowed).';

    // 3. Public Internet -> RDS Postgres :5432 (MUST BE BLOCKED)
    const dbIsolatedFromInternet = rdsSource !== '0.0.0.0/0';
    const dbPublicDetail =
      rdsSource === '0.0.0.0/0'
        ? 'Security Breach: sg-rds opens port 5432 to 0.0.0.0/0!'
        : 'Blocked as required: Private subnet has no IGW route and sg-rds rejects public IPs.';

    return {
      webReachable,
      webHopDetail,
      dbFromWeb,
      dbFromWebDetail,
      dbIsolatedFromInternet,
      dbPublicDetail,
    };
  }, [igwRouteEnabled, webAllows443, rdsSource]);

  const checkPublicRoute = igwRouteEnabled && webAllows443;
  const checkRdsChaining = rdsSource === 'sg-web';
  const checkHardenedWeb = !webAllows22Public;
  const allPass =
    checkPublicRoute && checkRdsChaining && checkHardenedWeb && hasTraced;

  useEffect(() => {
    if (allPass && !isCompleted) {
      onComplete();
    }
  }, [allPass, isCompleted, onComplete]);

  const applySecureTopology = () => {
    setIgwRouteEnabled(true);
    setWebAllows443(true);
    setWebAllows22Public(false);
    setRdsSource('sg-web');
    setHasTraced(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                VPC Subnet & Security Group Topology (10.0.0.0/16)
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Fix the timeout to RDS while keeping port 5432 and SSH port 22 sealed from the internet.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIgwRouteEnabled(false);
                setWebAllows443(true);
                setWebAllows22Public(true);
                setRdsSource('none');
                setHasTraced(false);
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              Reset Broken VPC
            </button>
          </div>

          {/* Visual Topology Map */}
          <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="text-xs font-semibold text-slate-900">Internet Gateway</div>
              <div className="font-mono text-[11px] text-slate-500 mt-1">igw-09a8b7c6</div>
              <div className="mt-3 text-xs text-slate-700">
                Route <code className="font-mono">0.0.0.0/0</code>:{' '}
                <span className="font-semibold">
                  {igwRouteEnabled ? 'Attached' : 'Missing'}
                </span>
              </div>
            </div>

            <div className="border border-sky-200 rounded-lg p-4 bg-sky-50/40">
              <div className="text-xs font-semibold text-slate-900">
                Public Subnet (10.0.1.0/24)
              </div>
              <div className="font-mono text-[11px] text-slate-500 mt-1">
                Web / ALB · sg-web
              </div>
              <div className="mt-3 text-xs text-slate-700 space-y-1">
                <div>TCP 443 (0.0.0.0/0): {webAllows443 ? 'Open' : 'Closed'}</div>
                <div>
                  TCP 22 SSH (0.0.0.0/0):{' '}
                  <span className={webAllows22Public ? 'text-rose-700 font-semibold' : 'text-emerald-700'}>
                    {webAllows22Public ? 'Exposed' : 'Closed'}
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50/40">
              <div className="text-xs font-semibold text-slate-900">
                Private Subnet (10.0.2.0/24)
              </div>
              <div className="font-mono text-[11px] text-slate-500 mt-1">
                RDS Postgres :5432 · sg-rds
              </div>
              <div className="mt-3 text-xs text-slate-700">
                Inbound Source:{' '}
                <span className="font-mono font-semibold">{rdsSource}</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-800">
                1. Public Route Table & Web Security Group (sg-web)
              </h4>

              <label className="flex items-start justify-between gap-3 px-3 py-2.5 border border-slate-200 rounded-lg cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-slate-900">
                    Add Route: <code className="font-mono">0.0.0.0/0 → igw-09a8b7c6</code>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Enables internet ingress/egress for public subnet
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={igwRouteEnabled}
                  onChange={(e) => setIgwRouteEnabled(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-amber-600 rounded"
                />
              </label>

              <label className="flex items-start justify-between gap-3 px-3 py-2.5 border border-slate-200 rounded-lg cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-slate-900">
                    Allow Inbound HTTPS (TCP 443) from <code className="font-mono">0.0.0.0/0</code>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Required for user web requests
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={webAllows443}
                  onChange={(e) => setWebAllows443(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-amber-600 rounded"
                />
              </label>

              <label className="flex items-start justify-between gap-3 px-3 py-2.5 border border-slate-200 rounded-lg cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-slate-900">
                    Expose SSH (TCP 22) to <code className="font-mono">0.0.0.0/0</code>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Security risk—turn off and use AWS SSM Session Manager instead
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={webAllows22Public}
                  onChange={(e) => setWebAllows22Public(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-amber-600 rounded"
                />
              </label>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-800">
                2. RDS Security Group (sg-rds · TCP 5432)
              </h4>

              {(
                [
                  {
                    value: 'none',
                    title: 'No inbound rules',
                    desc: 'All traffic to Postgres port 5432 times out.',
                  },
                  {
                    value: '0.0.0.0/0',
                    title: 'Allow 0.0.0.0/0 (Everyone)',
                    desc: 'Exposes your database firewall to the entire internet.',
                  },
                  {
                    value: 'sg-web',
                    title: 'Allow Source: sg-web (Security Group Chaining)',
                    desc: 'Only instances/ALBs carrying sg-web may connect on port 5432.',
                  },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-start gap-2.5 px-3 py-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="rds-sg-source"
                    checked={rdsSource === opt.value}
                    onChange={() => setRdsSource(opt.value)}
                    className="mt-0.5 h-4 w-4 accent-amber-600"
                  />
                  <div>
                    <div className="text-xs font-medium text-slate-900">{opt.title}</div>
                    <div className="text-[11px] text-slate-500">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Packet Tracer */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                VPC Reachability Packet Tracer
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulates TCP packet evaluation across Route Tables and Stateful Security Groups.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHasTraced(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              Run Reachability Trace
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            <TraceRow
              title="Internet → Web Server (TCP 443)"
              expected="PASS"
              actualPass={traceResults.webReachable}
              detail={traceResults.webHopDetail}
              showResult={hasTraced}
            />
            <TraceRow
              title="Web Server [sg-web] → RDS Postgres (TCP 5432)"
              expected="PASS"
              actualPass={traceResults.dbFromWeb}
              detail={traceResults.dbFromWebDetail}
              showResult={hasTraced}
            />
            <TraceRow
              title="Public Internet → RDS Postgres (TCP 5432)"
              expected="BLOCKED"
              actualPass={traceResults.dbIsolatedFromInternet}
              detail={traceResults.dbPublicDetail}
              showResult={hasTraced}
            />
          </div>
        </div>
      </div>

      {/* Right Deck */}
      <aside className="lg:col-span-4 space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-slate-900">Lab Verification</h4>
            <span className="text-xs font-medium text-slate-500 tabular-nums">
              {[checkPublicRoute, checkRdsChaining, checkHardenedWeb].filter(Boolean).length}/3 ready
            </span>
          </div>
          <div className="space-y-3 text-xs">
            <VpcCheck
              passed={checkPublicRoute}
              label="Route 0.0.0.0/0 via IGW and allow HTTPS 443 on sg-web"
            />
            <VpcCheck
              passed={checkRdsChaining}
              label="Restrict RDS port 5432 inbound source to sg-web only"
            />
            <VpcCheck
              passed={checkHardenedWeb}
              label="Close public SSH port 22 (use SSM Session Manager)"
            />
          </div>

          {allPass || isCompleted ? (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Lab Completed: VPC Hardened & Connected
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={applySecureTopology}
              className="mt-5 w-full px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Apply Secure VPC Topology
            </button>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
          <h4 className="text-sm font-semibold text-slate-900">
            Security Group Referencing
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Instead of hardcoding brittle private IP addresses in firewall rules, AWS lets a
            database Security Group reference another Security Group ID (<code className="font-mono">sg-web</code>).
            As Auto Scaling adds or replaces app containers, database access follows automatically.
          </p>
        </div>
      </aside>
    </div>
  );
}

function TraceRow({
  title,
  expected,
  actualPass,
  detail,
  showResult,
}: {
  title: string;
  expected: string;
  actualPass: boolean;
  detail: string;
  showResult: boolean;
}) {
  return (
    <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white">
      <div>
        <div className="font-mono text-xs font-semibold text-slate-900">{title}</div>
        <div className="text-xs text-slate-600 mt-0.5">
          {showResult ? detail : `Expected outcome: ${expected}`}
        </div>
      </div>
      {showResult && (
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded shrink-0 ${
            actualPass ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {actualPass ? (
            <ShieldCheck className="w-3.5 h-3.5" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5" />
          )}
          {actualPass ? 'Verified' : 'Failed'}
        </span>
      )}
    </div>
  );
}

function VpcCheck({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <CheckCircle2
        className={`w-4 h-4 mt-0.5 shrink-0 ${passed ? 'text-emerald-600' : 'text-slate-300'}`}
      />
      <span className={passed ? 'text-slate-900 font-medium' : 'text-slate-600'}>{label}</span>
    </div>
  );
}
