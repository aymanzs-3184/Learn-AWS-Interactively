import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Globe, Lock, Play, Server, AlertTriangle } from 'lucide-react';

interface S3StaticLabProps {
  isCompleted: boolean;
  onComplete: () => void;
}

export function S3StaticLab({ isCompleted, onComplete }: S3StaticLabProps) {
  const [deliveryMode, setDeliveryMode] = useState<'direct-s3' | 'cloudfront-oac'>('direct-s3');
  const [blockPublicAccess, setBlockPublicAccess] = useState<boolean>(true);
  const [indexDocument, setIndexDocument] = useState<'none' | 'index.html'>('none');
  const [spaFallback, setSpaFallback] = useState<boolean>(false);
  const [corsOrigin, setCorsOrigin] = useState<string>('');
  const [corsAllowGet, setCorsAllowGet] = useState<boolean>(false);
  const [hasTested, setHasTested] = useState<boolean>(false);

  const testResults = useMemo(() => {
    const canServeS3Objects =
      deliveryMode === 'cloudfront-oac' || !blockPublicAccess;

    // 1. GET /index.html
    const rootOk = canServeS3Objects && indexDocument === 'index.html';
    const rootStatus = !canServeS3Objects
      ? 403
      : indexDocument === 'none'
        ? 404
        : 200;
    const rootDetail = !canServeS3Objects
      ? '403 AccessDenied: S3 Block Public Access is ON without CloudFront OAC.'
      : indexDocument === 'none'
        ? '404 NoSuchKey: Static website index document is not configured.'
        : deliveryMode === 'cloudfront-oac'
          ? '200 OK via CloudFront HTTPS Edge + Origin Access Control.'
          : '200 OK directly from S3 (HTTP only, bucket is publicly exposed).';

    // 2. GET /dashboard (React Router SPA route)
    const spaOk = canServeS3Objects && indexDocument === 'index.html' && spaFallback;
    const spaStatus = !canServeS3Objects ? 403 : spaOk ? 200 : 404;
    const spaDetail = !canServeS3Objects
      ? '403 AccessDenied from S3.'
      : spaOk
        ? '200 OK: Custom error response rewrites 403/404 -> /index.html for client routing.'
        : '404 NotFound: S3 looks for literal key "dashboard" without SPA error rewrite.';

    // 3. Browser CORS fetch from https://app.cloudbench.dev
    const originMatches =
      corsOrigin.trim() === 'https://app.cloudbench.dev' || corsOrigin.trim() === '*';
    const corsOk = canServeS3Objects && originMatches && corsAllowGet;
    const corsStatus = !canServeS3Objects ? 403 : corsOk ? 200 : 'CORS Blocked';
    const corsDetail = !canServeS3Objects
      ? '403 AccessDenied before CORS headers can be evaluated.'
      : !originMatches
        ? 'Browser error: No Access-Control-Allow-Origin matching https://app.cloudbench.dev.'
        : !corsAllowGet
          ? 'Browser error: GET method not included in AllowedMethods.'
          : `200 OK with header Access-Control-Allow-Origin: ${corsOrigin.trim()}`;

    return [
      { id: 'root', request: 'GET /index.html', ok: rootOk, status: rootStatus, detail: rootDetail },
      { id: 'spa', request: 'GET /dashboard (SPA route)', ok: spaOk, status: spaStatus, detail: spaDetail },
      {
        id: 'cors',
        request: 'fetch() from https://app.cloudbench.dev',
        ok: corsOk,
        status: corsStatus,
        detail: corsDetail,
      },
    ];
  }, [deliveryMode, blockPublicAccess, indexDocument, spaFallback, corsOrigin, corsAllowGet]);

  const checkSecureOrigin = deliveryMode === 'cloudfront-oac' && blockPublicAccess;
  const checkIndexAndSpa = indexDocument === 'index.html' && spaFallback;
  const checkCorsReady =
    corsOrigin.trim() === 'https://app.cloudbench.dev' && corsAllowGet;
  const allPass =
    checkSecureOrigin &&
    checkIndexAndSpa &&
    checkCorsReady &&
    testResults.every((r) => r.ok) &&
    hasTested;

  useEffect(() => {
    if (allPass && !isCompleted) {
      onComplete();
    }
  }, [allPass, isCompleted, onComplete]);

  const applyRecommendedConfig = () => {
    setDeliveryMode('cloudfront-oac');
    setBlockPublicAccess(true);
    setIndexDocument('index.html');
    setSpaFallback(true);
    setCorsOrigin('https://app.cloudbench.dev');
    setCorsAllowGet(true);
    setHasTested(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-8 space-y-6">
        {/* Interactive Traffic Path Diagram */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                S3 + CloudFront Delivery Architecture
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Serve a React SPA over HTTPS while keeping the underlying S3 bucket private.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDeliveryMode('direct-s3');
                setBlockPublicAccess(true);
                setIndexDocument('none');
                setSpaFallback(false);
                setCorsOrigin('');
                setCorsAllowGet(false);
                setHasTested(false);
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              Reset Broken State
            </button>
          </div>

          {/* Visual Node Flow */}
          <div className="my-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                <Globe className="w-4 h-4 text-sky-600" />
                Browser Client
              </div>
              <p className="font-mono text-[11px] text-slate-500 mt-1">
                https://app.cloudbench.dev
              </p>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div
                className={`w-full border rounded-lg p-4 transition-colors ${
                  deliveryMode === 'cloudfront-oac'
                    ? 'border-sky-300 bg-sky-50/60'
                    : 'border-dashed border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                  <span>
                    {deliveryMode === 'cloudfront-oac'
                      ? 'CloudFront CDN + OAC'
                      : 'Direct S3 Endpoint'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  {deliveryMode === 'cloudfront-oac'
                    ? 'Signs origin requests via SigV4 OAC'
                    : 'No HTTPS custom domain; requires public bucket'}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
                <span className="inline-flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-amber-600" />
                  s3://dev-spa-assets
                </span>
                {blockPublicAccess ? (
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {blockPublicAccess ? 'Block Public Access: ON' : 'Public Read Exposed'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
            <div className="space-y-4">
              <div>
                <span className="block text-xs font-medium text-slate-700 mb-2">
                  Delivery Architecture
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('direct-s3')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-colors ${
                      deliveryMode === 'direct-s3'
                        ? 'border-amber-600 bg-amber-50 text-slate-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Direct S3 Website
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMode('cloudfront-oac')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-colors ${
                      deliveryMode === 'cloudfront-oac'
                        ? 'border-amber-600 bg-amber-50 text-slate-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    CloudFront + OAC
                  </button>
                </div>
              </div>

              <label className="flex items-center justify-between px-3 py-2.5 border border-slate-200 rounded-lg cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-slate-900">Block Public Access</div>
                  <div className="text-[11px] text-slate-500">
                    Prevents accidental public bucket policies
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={blockPublicAccess}
                  onChange={(e) => setBlockPublicAccess(e.target.checked)}
                  className="h-4 w-4 accent-amber-600 rounded"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Default Root Object
                  </label>
                  <select
                    value={indexDocument}
                    onChange={(e) => setIndexDocument(e.target.value as 'none' | 'index.html')}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-white text-slate-900"
                  >
                    <option value="none">(not set)</option>
                    <option value="index.html">index.html</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer mt-5">
                  <input
                    type="checkbox"
                    checked={spaFallback}
                    onChange={(e) => setSpaFallback(e.target.checked)}
                    className="h-4 w-4 accent-amber-600 rounded"
                  />
                  <span className="text-xs text-slate-700">SPA 404 → index.html</span>
                </label>
              </div>
            </div>

            {/* CORS Configuration */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  S3 CORS AllowedOrigin
                </label>
                <input
                  type="text"
                  value={corsOrigin}
                  onChange={(e) => setCorsOrigin(e.target.value)}
                  placeholder="https://app.cloudbench.dev"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400"
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setCorsOrigin('https://app.cloudbench.dev')}
                    className="text-[11px] font-mono text-sky-700 hover:underline"
                  >
                    Use https://app.cloudbench.dev
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setCorsOrigin('*')}
                    className="text-[11px] font-mono text-slate-500 hover:underline"
                  >
                    Use *
                  </button>
                </div>
              </div>

              <label className="flex items-center justify-between px-3 py-2.5 border border-slate-200 rounded-lg cursor-pointer">
                <div>
                  <div className="text-xs font-medium text-slate-900">
                    Allow <code className="font-mono">GET</code> & <code className="font-mono">HEAD</code> in CORS
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Required for browser fetch() calls to JSON/font assets
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={corsAllowGet}
                  onChange={(e) => setCorsAllowGet(e.target.checked)}
                  className="h-4 w-4 accent-amber-600 rounded"
                />
              </label>

              <pre className="bg-slate-950 text-slate-200 rounded-lg p-3 text-[11px] font-mono overflow-x-auto">
{`[
  {
    "AllowedOrigins": [${corsOrigin ? `"${corsOrigin}"` : ''}],
    "AllowedMethods": [${corsAllowGet ? '"GET", "HEAD"' : ''}]
  }
]`}
              </pre>
            </div>
          </div>
        </div>

        {/* Request Simulator */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                HTTP & Browser CORS Simulator
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulate real browser requests against your S3 + CloudFront setup.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHasTested(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              Test Live Requests
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {testResults.map((res) => (
              <div key={res.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-mono text-xs font-semibold text-slate-900">
                    {res.request}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {hasTested ? res.detail : 'Click "Test Live Requests" to inspect response.'}
                  </div>
                </div>
                {hasTested && (
                  <span
                    className={`text-xs font-mono font-semibold px-2.5 py-1 rounded shrink-0 ${
                      res.ok
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {res.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Verification Deck */}
      <aside className="lg:col-span-4 space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-slate-900">Lab Verification</h4>
            <span className="text-xs font-medium text-slate-500 tabular-nums">
              {[checkSecureOrigin, checkIndexAndSpa, checkCorsReady].filter(Boolean).length}/3 configured
            </span>
          </div>
          <div className="space-y-3">
            <RowCheck
              passed={checkSecureOrigin}
              label="Use CloudFront + OAC while keeping Block Public Access ON"
            />
            <RowCheck
              passed={checkIndexAndSpa}
              label="Set Default Root Object to index.html and enable SPA rewrite"
            />
            <RowCheck
              passed={checkCorsReady}
              label="Restrict CORS AllowedOrigin to https://app.cloudbench.dev with GET"
            />
          </div>

          {allPass || isCompleted ? (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Lab Completed: Secure Edge Hosting Ready
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={applyRecommendedConfig}
              className="mt-5 w-full px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Apply Recommended Setup
            </button>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2.5">
          <h4 className="text-sm font-semibold text-slate-900">Why Developers Hit 403s on S3</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            By default, every new S3 bucket enables <strong>Block Public Access</strong>. Instead of
            turning security off, place CloudFront in front with <strong>Origin Access Control (OAC)</strong>{' '}
            so only CloudFront can read your bucket.
          </p>
        </div>
      </aside>
    </div>
  );
}

function RowCheck({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div className="flex items-start gap-2.5 text-xs">
      <CheckCircle2
        className={`w-4 h-4 mt-0.5 shrink-0 ${passed ? 'text-emerald-600' : 'text-slate-300'}`}
      />
      <span className={passed ? 'text-slate-900 font-medium' : 'text-slate-600'}>{label}</span>
    </div>
  );
}
