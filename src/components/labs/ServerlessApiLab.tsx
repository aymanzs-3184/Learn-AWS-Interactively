import { useEffect, useState } from 'react';
import { CheckCircle2, Cpu, Database, Play, Route } from 'lucide-react';

interface ServerlessApiLabProps {
  isCompleted: boolean;
  onComplete: () => void;
}

type SelectedNode = 'apigw' | 'lambda' | 'dynamodb';

interface OrderRecord {
  orderId: string;
  item: string;
  totalCents: number;
  latencyMs: number;
  startType: 'Cold Start' | 'Warm Start';
}

export function ServerlessApiLab({ isCompleted, onComplete }: ServerlessApiLabProps) {
  const [selectedNode, setSelectedNode] = useState<SelectedNode>('apigw');

  // API Gateway state
  const [routeWired, setRouteWired] = useState<boolean>(false);

  // Lambda state
  const [memoryMb, setMemoryMb] = useState<128 | 512 | 1024>(512);
  const [timeoutSec, setTimeoutSec] = useState<number>(10);
  const [lambdaIamPermission, setLambdaIamPermission] = useState<
    'none' | 'put-item' | 'admin'
  >('none');
  const [initClientOutsideHandler, setInitClientOutsideHandler] = useState<boolean>(true);

  // DynamoDB state
  const [partitionKey, setPartitionKey] = useState<'orderId' | 'timestamp'>('timestamp');

  // Execution state
  const [invocationCount, setInvocationCount] = useState<number>(0);
  const [records, setRecords] = useState<OrderRecord[]>([]);
  const [lastTrace, setLastTrace] = useState<{
    status: number;
    message: string;
    logs: string[];
  } | null>(null);

  const checkApiWired = routeWired;
  const checkLeastPrivilegeIam = lambdaIamPermission === 'put-item';
  const checkDynamoKey = partitionKey === 'orderId';
  const checkInvokedSuccessfully = records.length > 0;

  useEffect(() => {
    if (
      checkApiWired &&
      checkLeastPrivilegeIam &&
      checkDynamoKey &&
      checkInvokedSuccessfully &&
      !isCompleted
    ) {
      onComplete();
    }
  }, [
    checkApiWired,
    checkLeastPrivilegeIam,
    checkDynamoKey,
    checkInvokedSuccessfully,
    isCompleted,
    onComplete,
  ]);

  const sendTestRequest = () => {
    const nextCount = invocationCount + 1;
    setInvocationCount(nextCount);

    if (!routeWired) {
      setLastTrace({
        status: 404,
        message: 'API Gateway returned 404 Not Found: POST /orders has no Lambda integration.',
        logs: [
          `[APIGW] POST /orders -> No integration configured`,
          `[APIGW] HTTP 404 {"message":"Not Found"}`,
        ],
      });
      return;
    }

    if (lambdaIamPermission === 'none') {
      setLastTrace({
        status: 500,
        message:
          'Lambda crashed with AccessDeniedException: Execution role lacks dynamodb:PutItem.',
        logs: [
          `START RequestId: req-${nextCount}01`,
          `[Lambda] Invoking create-order (${memoryMb} MB, timeout ${timeoutSec}s)`,
          `ERROR AccessDeniedException: User arn:aws:sts::123456:assumed-role/OrderFnRole is not authorized to perform: dynamodb:PutItem`,
          `END RequestId: req-${nextCount}01`,
        ],
      });
      return;
    }

    const isColdStart = nextCount === 1 || !initClientOutsideHandler;
    const baseMs = memoryMb === 1024 ? 18 : memoryMb === 512 ? 32 : 84;
    const coldMs = isColdStart ? (memoryMb === 128 ? 460 : 210) : 0;
    const totalMs = baseMs + coldMs;
    const newId = `ord_${100 + records.length + 1}`;

    const newRecord: OrderRecord = {
      orderId: newId,
      item: 'Cloud Keyboard',
      totalCents: 12900,
      latencyMs: totalMs,
      startType: isColdStart ? 'Cold Start' : 'Warm Start',
    };

    setRecords((prev) => [newRecord, ...prev].slice(0, 5));
    setLastTrace({
      status: 201,
      message: `201 Created in ${totalMs} ms (${newRecord.startType}) — Item ${newId} persisted to DynamoDB.`,
      logs: [
        `START RequestId: req-${nextCount}01`,
        isColdStart
          ? `[INIT] Initializing DynamoDBDocumentClient (${coldMs} ms)`
          : `[WARM] Reusing module-level DynamoDBDocumentClient`,
        `[DynamoDB] PutItem Table=Orders Key={orderId: "${newId}"}`,
        `REPORT RequestId: req-${nextCount}01 Duration: ${totalMs} ms Billed Duration: ${Math.ceil(totalMs)} ms Memory Size: ${memoryMb} MB`,
      ],
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 space-y-6">
        {/* Interactive 3-Node Canvas */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Serverless Request Pipeline
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Click each service node below to configure its integration, IAM role, and table key.
              </p>
            </div>
            <button
              type="button"
              onClick={sendTestRequest}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              Send Test POST /orders
            </button>
          </div>

          {/* 3 Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <button
              type="button"
              onClick={() => setSelectedNode('apigw')}
              className={`p-4 rounded-xl border text-left transition-colors ${
                selectedNode === 'apigw'
                  ? 'border-amber-600 bg-amber-50/60'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                <span className="inline-flex items-center gap-1.5">
                  <Route className="w-4 h-4 text-sky-600" />
                  1. API Gateway
                </span>
                <span className="text-[11px] font-mono text-slate-500">HTTP API</span>
              </div>
              <div className="mt-2 font-mono text-xs text-slate-700">
                POST /orders → {routeWired ? 'create-order' : '(unlinked)'}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedNode('lambda')}
              className={`p-4 rounded-xl border text-left transition-colors ${
                selectedNode === 'lambda'
                  ? 'border-amber-600 bg-amber-50/60'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                <span className="inline-flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-amber-600" />
                  2. AWS Lambda
                </span>
                <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {memoryMb} MB
                </span>
              </div>
              <div className="mt-2 font-mono text-xs text-slate-700">
                Role: {lambdaIamPermission === 'none' ? 'Missing DB perms' : lambdaIamPermission}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedNode('dynamodb')}
              className={`p-4 rounded-xl border text-left transition-colors ${
                selectedNode === 'dynamodb'
                  ? 'border-amber-600 bg-amber-50/60'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                <span className="inline-flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-600" />
                  3. DynamoDB
                </span>
                <span className="text-[11px] font-mono text-slate-500">Orders</span>
              </div>
              <div className="mt-2 font-mono text-xs text-slate-700">
                PK: {partitionKey}
              </div>
            </button>
          </div>

          {/* Node Inspector Panel */}
          <div className="border-t border-slate-100 pt-5">
            {selectedNode === 'apigw' && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900">
                  Configure API Gateway Route
                </h4>
                <label className="flex items-center justify-between px-4 py-3 border border-slate-200 rounded-lg cursor-pointer">
                  <div>
                    <div className="text-xs font-medium text-slate-900">
                      Integrate <code className="font-mono">POST /orders</code> with{' '}
                      <code className="font-mono">create-order</code> Lambda
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Forwards JSON request body as <code className="font-mono">event.body</code>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={routeWired}
                    onChange={(e) => setRouteWired(e.target.checked)}
                    className="h-4 w-4 accent-amber-600 rounded"
                  />
                </label>
              </div>
            )}

            {selectedNode === 'lambda' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Memory Allocation (scales CPU proportionally)
                  </label>
                  <div className="inline-flex p-1 bg-slate-100 rounded-lg">
                    {([128, 512, 1024] as const).map((mb) => (
                      <button
                        key={mb}
                        type="button"
                        onClick={() => setMemoryMb(mb)}
                        className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${
                          memoryMb === mb
                            ? 'bg-white text-slate-900 shadow-sm font-semibold'
                            : 'text-slate-600'
                        }`}
                      >
                        {mb} MB
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Timeout ({timeoutSec}s)
                  </label>
                  <input
                    type="range"
                    min={3}
                    max={30}
                    value={timeoutSec}
                    onChange={(e) => setTimeoutSec(Number(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Execution Role IAM Policy
                  </label>
                  <select
                    value={lambdaIamPermission}
                    onChange={(e) =>
                      setLambdaIamPermission(
                        e.target.value as 'none' | 'put-item' | 'admin'
                      )
                    }
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-white text-slate-900"
                  >
                    <option value="none">BasicLambdaLogsOnly (no DynamoDB access)</option>
                    <option value="put-item">
                      Least Privilege: Allow dynamodb:PutItem on Table/Orders
                    </option>
                    <option value="admin">AdministratorAccess (* on * — not least privilege)</option>
                  </select>
                </div>

                <label className="sm:col-span-2 flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={initClientOutsideHandler}
                    onChange={(e) => setInitClientOutsideHandler(e.target.checked)}
                    className="h-4 w-4 accent-amber-600 rounded"
                  />
                  Initialize <code className="font-mono">DynamoDBDocumentClient</code> outside{' '}
                  <code className="font-mono">handler</code> (reuses TCP connection on warm calls)
                </label>
              </div>
            )}

            {selectedNode === 'dynamodb' && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-900">
                  Configure DynamoDB Table Schema
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-start gap-2.5 p-3 border border-slate-200 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="ddb-pk"
                      checked={partitionKey === 'orderId'}
                      onChange={() => setPartitionKey('orderId')}
                      className="mt-0.5 h-4 w-4 accent-amber-600"
                    />
                    <div>
                      <div className="font-mono text-xs font-semibold text-slate-900">
                        orderId (String)
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        High-cardinality unique key—distributes partitions evenly.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 border border-slate-200 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="ddb-pk"
                      checked={partitionKey === 'timestamp'}
                      onChange={() => setPartitionKey('timestamp')}
                      className="mt-0.5 h-4 w-4 accent-amber-600"
                    />
                    <div>
                      <div className="font-mono text-xs font-semibold text-slate-900">
                        timestamp (String)
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Poor lookup key for GET /orders/{'{id}'}.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CloudWatch & DynamoDB Live Output */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">
              CloudWatch Invocation Logs
            </h4>
            {lastTrace ? (
              <div className="space-y-3">
                <div
                  className={`text-xs font-medium px-3 py-2 rounded-lg ${
                    lastTrace.status === 201
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  {lastTrace.message}
                </div>
                <pre className="bg-slate-950 text-slate-200 rounded-lg p-3 text-[11px] font-mono leading-relaxed overflow-x-auto">
                  {lastTrace.logs.join('\n')}
                </pre>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Click &ldquo;Send Test POST /orders&rdquo; to trace cold start vs warm start logs.
              </p>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">
              DynamoDB Table: Orders
            </h4>
            {records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-1.5 font-medium">orderId</th>
                      <th className="py-1.5 font-medium">Start</th>
                      <th className="py-1.5 font-medium text-right">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {records.map((rec) => (
                      <tr key={rec.orderId}>
                        <td className="py-2 font-mono text-slate-900">{rec.orderId}</td>
                        <td className="py-2 text-slate-600">{rec.startType}</td>
                        <td className="py-2 font-mono text-right text-slate-900">
                          {rec.latencyMs} ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No items persisted yet. Successful requests will write items here.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Verification Deck */}
      <aside className="lg:col-span-4 space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-slate-900">Lab Verification</h4>
            <span className="text-xs font-medium text-slate-500 tabular-nums">
              {[checkApiWired, checkLeastPrivilegeIam, checkDynamoKey, checkInvokedSuccessfully].filter(Boolean).length}
              /4 passed
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <CheckLine passed={checkApiWired} label="Wire POST /orders route in API Gateway" />
            <CheckLine
              passed={checkLeastPrivilegeIam}
              label="Attach least-privilege dynamodb:PutItem IAM policy"
            />
            <CheckLine passed={checkDynamoKey} label="Set DynamoDB Partition Key to orderId" />
            <CheckLine
              passed={checkInvokedSuccessfully}
              label="Send a live request & persist an item (try twice for warm start)"
            />
          </div>

          {(checkApiWired &&
            checkLeastPrivilegeIam &&
            checkDynamoKey &&
            checkInvokedSuccessfully) ||
          isCompleted ? (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Lab Completed: Serverless API Live
              </div>
            </div>
          ) : null}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
          <h4 className="text-sm font-semibold text-slate-900">Why DynamoDB with Lambda?</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Traditional Postgres databases limit concurrent TCP connections. Since Lambda can spawn
            hundreds of containers in seconds, DynamoDB&rsquo;s stateless HTTPS API prevents
            connection pool exhaustion.
          </p>
        </div>
      </aside>
    </div>
  );
}

function CheckLine({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <CheckCircle2
        className={`w-4 h-4 mt-0.5 shrink-0 ${passed ? 'text-emerald-600' : 'text-slate-300'}`}
      />
      <span className={passed ? 'text-slate-900 font-medium' : 'text-slate-600'}>{label}</span>
    </div>
  );
}
