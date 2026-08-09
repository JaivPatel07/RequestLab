import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Play, CheckCircle, XCircle, ChevronDown, Clock, TestTube2, Activity } from 'lucide-react';

export const CollectionRunnerModal: React.FC = () => {
  const { collections, runnerState, runCollection, closeRunner } = useStore();
  const [expandedRequests, setExpandedRequests] = useState<Record<string, boolean>>({});

  const { isOpen, isRunning, collectionId, results } = runnerState;

  if (!isOpen || !collectionId) return null;

  const collection = collections.find(c => c.id === collectionId);
  if (!collection) return null;

  const toggleExpand = (requestId: string) => {
    setExpandedRequests(prev => ({ ...prev, [requestId]: !prev[requestId] }));
  };

  const totalDuration = results?.results.reduce((sum: number, r: any) => sum + r.duration, 0) || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && closeRunner()}
    >
      <div className="glass-panel w-full max-w-2xl h-[70vh] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
              <Play size={18} className="text-emerald-400" /> Collection Runner
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Running collection: <span className="font-semibold text-indigo-300">{collection.name}</span>
            </p>
          </div>
          <button onClick={closeRunner} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          {/* Run Controls & Summary */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
            <button
              onClick={() => runCollection(collectionId)}
              disabled={isRunning}
              className="glass-button-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                  Running...
                </>
              ) : (
                <>
                  <Play size={14} />
                  Start Run
                </>
              )}
            </button>

            {results && (
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle size={14} />
                  <span className="font-bold">{results.summary.passed}</span>
                  <span className="text-slate-400">Passed</span>
                </div>
                <div className={`flex items-center gap-1.5 ${results.summary.failed > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  <XCircle size={14} />
                  <span className="font-bold">{results.summary.failed}</span>
                  <span className="text-slate-400">Failed</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock size={14} />
                  <span className="font-bold">{totalDuration} ms</span>
                </div>
              </div>
            )}
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto mt-4 pr-2 -mr-2">
            {!results && !isRunning && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                <Activity size={32} className="opacity-30 mb-2" />
                Click "Start Run" to execute all requests.
              </div>
            )}

            {isRunning && !results && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                <div className="w-8 h-8 rounded-full border-3 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4"></div>
                Executing requests...
              </div>
            )}

            {results && (
              <div className="space-y-2">
                {results.results.map((res: any, index: number) => {
                  const req = collection.requests.find(r => r.id === res.requestId);
                  const tests = res.testResults || [];
                  const testsPassed = tests.filter((t: any) => t.pass).length;
                  const allTestsPassed = testsPassed === tests.length;

                  return (
                    <div key={index} className="bg-slate-900/50 border border-slate-800 rounded-lg">
                      {/* Request Header */}
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer"
                        onClick={() => toggleExpand(res.requestId)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`font-bold text-xs w-12 text-center shrink-0 ${allTestsPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {allTestsPassed ? 'PASS' : 'FAIL'}
                          </span>
                          <span className="truncate text-sm text-slate-200">{req?.name || 'Unknown Request'}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
                          <span>{res.status}</span>
                          <span>{res.duration} ms</span>
                          <ChevronDown size={16} className={`transition-transform ${expandedRequests[res.requestId] ? 'rotate-180' : ''}`} />
                        </div>
                      </div>

                      {/* Expanded Test Details */}
                      {expandedRequests[res.requestId] && (
                        <div className="px-3 pb-3 border-t border-slate-800">
                          <h4 className="text-xs font-semibold text-slate-400 my-2 flex items-center gap-1.5">
                            <TestTube2 size={13} /> Test Results ({testsPassed}/{tests.length})
                          </h4>
                          {tests.length > 0 ? (
                            <div className="space-y-1 pl-4">
                              {tests.map((test: any, i: number) => (
                                <div key={i} className={`flex items-center gap-2 text-xs ${test.pass ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {test.pass ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                  <span>{test.name}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500 pl-4">No tests were run for this request.</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};