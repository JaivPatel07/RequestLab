import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Play, Users, Activity, Gauge, Clock, CheckCircle, XCircle, Zap } from 'lucide-react';

export const LoadTestModal: React.FC = () => {
  const { tabs, activeTabId, loadTestState, openLoadTest, closeLoadTest, runLoadTest } = useStore();

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0] || null;

  const [users, setUsers] = useState(100);
  const [concurrency, setConcurrency] = useState(20);

  const { isOpen, isRunning, results } = loadTestState;

  if (!isOpen) return null;

  const handleRun = async () => {
    if (!activeTab) return;
    await runLoadTest({
      method: activeTab.method,
      url: activeTab.url,
      headers: activeTab.headers,
      params: activeTab.params,
      authType: activeTab.authType,
      authConfig: activeTab.authConfig,
      bodyType: activeTab.bodyType,
      bodyContent: activeTab.bodyContent,
      cookies: activeTab.cookies,
      users,
      concurrency,
    });
  };

  const summary = results?.summary;
  const statusCodes = results?.statusCodes || {};

  const statusColor = (code: number) => {
    if (code >= 200 && code < 300) return 'text-emerald-400';
    if (code >= 400 && code < 500) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && closeLoadTest()}
    >
      <div className="glass-panel w-full max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
              <Activity size={18} className="text-indigo-400" /> Load Test
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Fire <span className="font-semibold text-indigo-300">{users} virtual users</span> against your API concurrently.
            </p>
          </div>
          <button onClick={closeLoadTest} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 flex items-center gap-2">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${activeTab ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 bg-slate-500/10'}`}>
              {activeTab?.method || 'GET'}
            </span>
            <span className="text-xs font-mono text-slate-300 truncate">{activeTab?.url || 'No request tab open'}</span>
          </div>

          {/* Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                <Users size={13} className="text-indigo-400" /> Total Users
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={users}
                  onChange={(e) => setUsers(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  onClick={openLoadTest}
                  className="px-2 py-1 rounded text-[10px] text-indigo-400 hover:bg-slate-800 border border-slate-800"
                  title="Open a request tab to edit the target"
                >
                  Edit
                </button>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">How many total requests to fire (max 1000).</span>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
                <Gauge size={13} className="text-emerald-400" /> Concurrency
              </label>
              <input
                type="number"
                min={1}
                max={200}
                value={concurrency}
                onChange={(e) => setConcurrency(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Requests running simultaneously (max 200).</span>
            </div>
          </div>

          {/* Run Button */}
          <button
            onClick={handleRun}
            disabled={isRunning || !activeTab?.url}
            className="w-full glass-button-primary flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                Running load test...
              </>
            ) : (
              <>
                <Play size={15} />
                Start Load Test ({users} users)
              </>
            )}
          </button>

          {/* Results */}
          {summary && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-slate-100">{summary.totalRequests}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Requests</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-emerald-400">{summary.requestsPerSecond}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Req/s</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-indigo-400">{summary.totalTimeMs} ms</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Total time</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-400">{summary.avgMs} ms</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Avg latency</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-slate-300">{summary.minMs} ms</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Min latency</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-slate-300">{summary.maxMs} ms</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Max latency</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-rose-400">{summary.p95Ms} ms</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">P95 latency</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-lg">
                    <CheckCircle size={16} className="text-emerald-400" />
                    <span className="font-bold text-emerald-400">{summary.success}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-lg">
                    <XCircle size={16} className="text-rose-400" />
                    <span className="font-bold text-rose-400">{summary.errors}</span>
                  </div>
                </div>
              </div>

              {/* Status distribution */}
              {Object.keys(statusCodes).length > 0 && (
                <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Zap size={13} className="text-amber-400" />
                    <span className="text-xs font-semibold text-slate-300">Status Code Distribution</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statusCodes).map(([code, count]) => (
                      <div key={code} className="flex items-center gap-1.5 bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-1.5">
                        <span className={`text-sm font-bold ${statusColor(Number(code))}`}>{code}</span>
                        <span className="text-xs text-slate-400">× {count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!results && !isRunning && (
            <div className="text-center py-6 text-slate-500 text-xs flex flex-col items-center gap-2">
              <Clock size={20} className="opacity-30" />
              Set the number of users and click "Start Load Test".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
