import React from 'react';
import { useStore } from '../store/useStore';
import {
  Plus, History, Settings, Folder, Star, Zap, Terminal,
  Globe, ArrowRight, Activity, BookOpen
} from 'lucide-react';

interface DashboardProps {
  onOpenSettings: () => void;
  onCreateCollection: () => void;
  onOpenDocs?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenSettings,
  onCreateCollection,
  onOpenDocs
}) => {
  const { collections, history, addTab } = useStore();

  const favorites    = collections.filter(c => c.isFavorite);
  const recentHistory = history.slice(0, 6);

  const stats = [
    { label: 'Collections',       value: collections.length, icon: Folder,   color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/15' },
    { label: 'Favourites',        value: favorites.length,   icon: Star,     color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/15'  },
    { label: 'Total Requests',    value: history.length,     icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15'},
  ];

  const quickActions = [
    {
      icon: Plus,
      label: 'New Request',
      sub: 'Open a blank request tab',
      accent: 'indigo',
      onClick: () => addTab(),
    },
    {
      icon: Folder,
      label: 'New Collection',
      sub: 'Group & organise requests',
      accent: 'purple',
      onClick: onCreateCollection,
    },
    {
      icon: Settings,
      label: 'App Settings',
      sub: 'Theme, fonts & behaviour',
      accent: 'rose',
      onClick: onOpenSettings,
    },
    {
      icon: BookOpen,
      label: 'Documentation',
      sub: 'How to use RequestLab',
      accent: 'sky',
      onClick: onOpenDocs,
    },
  ];

  const accentMap: Record<string, { icon: string; btn: string }> = {
    indigo: { icon: 'bg-indigo-500/12 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white',  btn: 'hover:border-indigo-500/40' },
    purple: { icon: 'bg-purple-500/12 text-purple-400 group-hover:bg-purple-500 group-hover:text-white',  btn: 'hover:border-purple-500/40' },
    rose:   { icon: 'bg-rose-500/12   text-rose-400   group-hover:bg-rose-500   group-hover:text-white',   btn: 'hover:border-rose-500/40'   },
    sky:    { icon: 'bg-sky-500/12    text-sky-400    group-hover:bg-sky-500    group-hover:text-white',    btn: 'hover:border-sky-500/40'    },
  };

  const methodColor = (method: string) => {
    const map: Record<string, string> = {
      GET: 'text-emerald-400 bg-emerald-500/10',
      POST: 'text-indigo-400 bg-indigo-500/10',
      PUT: 'text-amber-400 bg-amber-500/10',
      PATCH: 'text-orange-400 bg-orange-500/10',
      DELETE: 'text-rose-400 bg-rose-500/10',
    };
    return map[method] || 'text-slate-400 bg-slate-500/10';
  };

  const statusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-emerald-400';
    if (status >= 300 && status < 400) return 'text-indigo-400';
    if (status >= 400 && status < 500) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Hero gradient strip */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.35) 0%, transparent 70%)',
          }}
        />
        <div className="relative px-10 pt-12 pb-6 max-w-5xl mx-auto animate-fade-in">
          {/* Header */}
          <div className="flex items-start justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
                  style={{
                    background: 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    color: '#818cf8',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  Proxy Active
                </span>
              </div>
              <h1 className="text-5xl font-extrabold font-heading tracking-tight leading-none mb-3">
                <span
                  style={{
                    background: 'linear-gradient(90deg,#818cf8 0%,#c084fc 50%,#f472b6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  RequestLab
                </span>
              </h1>
              <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                A local-first API testing environment — no cloud, no limits, blazingly fast.
              </p>
            </div>

            <button
              onClick={() => addTab()}
              className="glass-button-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shrink-0 mt-1"
              id="dashboard-new-request-btn"
            >
              <Plus size={15} />
              New Request
              <ArrowRight size={13} className="opacity-70" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className={`glass-card rounded-2xl p-5 flex items-center gap-4 border ${s.border}`}
                >
                  <div className={`p-3 rounded-xl ${s.bg} ${s.color} shrink-0`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-slate-100 leading-none">{s.value}</div>
                    <div className="text-xs text-slate-400 mt-1">{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-10 pb-10 max-w-5xl mx-auto">

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Quick Actions */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Zap size={15} className="text-indigo-400" />
              <span className="text-sm font-semibold text-slate-200 font-heading">Quick Actions</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((a) => {
                const Icon = a.icon;
                const ac = accentMap[a.accent];
                return (
                  <button
                    key={a.label}
                    onClick={a.onClick}
                    disabled={!a.onClick}
                    className={`group flex items-center gap-3 p-3.5 rounded-xl border border-slate-800/60 bg-slate-900/30
                      hover:bg-slate-800/40 transition-all text-left ${ac.btn}
                      disabled:opacity-40 disabled:cursor-not-allowed`}
                    id={`dashboard-action-${a.label.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <div className={`p-2 rounded-lg transition-all shrink-0 ${ac.icon}`}>
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate">{a.label}</div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{a.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent History */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <History size={15} className="text-emerald-400" />
                <span className="text-sm font-semibold text-slate-200 font-heading">Recent Requests</span>
              </div>
              {recentHistory.length > 0 && (
                <span className="text-[10px] text-slate-500">{history.length} total</span>
              )}
            </div>
            {recentHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 rounded-xl border border-dashed border-slate-800 text-slate-600">
                <History size={22} className="opacity-30 mb-2" />
                <span className="text-xs">No history yet — send your first request!</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      addTab({
                        name: item.url.split('/').pop() || 'Request',
                        method: item.method,
                        url: item.url,
                        response: {
                          status: item.status,
                          statusText: item.statusText,
                          headers: JSON.parse(item.responseHeaders || '{}'),
                          cookies: JSON.parse(item.cookies || '[]'),
                          duration: item.duration,
                          size: item.responseSize,
                          body: (() => {
                            try { return JSON.parse(item.responseBody || '""'); }
                            catch { return item.responseBody || ''; }
                          })(),
                        },
                      })
                    }
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800/40 border border-transparent hover:border-slate-700/40 transition-all text-left group"
                    id={`history-item-${item.id}`}
                  >
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${methodColor(item.method)}`}>
                      {item.method}
                    </span>
                    <span className="truncate text-[11px] font-mono text-slate-300 flex-1">{item.url}</span>
                    <span className={`text-[10px] font-semibold shrink-0 ${statusColor(item.status)}`}>
                      {item.status === 0 ? 'ERR' : item.status}
                    </span>
                    <span className="text-[10px] text-slate-600 shrink-0">{item.duration}ms</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* How It Works */}
        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Globe size={15} className="text-indigo-400" />
              <span className="text-sm font-semibold text-slate-200 font-heading">How It Works</span>
            </div>
            <div className="space-y-4 text-xs text-slate-400 leading-relaxed">
              {[
                {
                  n: '1',
                  title: 'CORS Bypass Proxy',
                  body: 'Requests are forwarded through a local Node.js server, bypassing browser CORS restrictions entirely.',
                },
                {
                  n: '2',
                  title: 'Environment Variables',
                  body: 'Use {{placeholders}} in URLs, headers & bodies. Values resolve automatically at send time.',
                },
                {
                  n: '3',
                  title: 'Local SQLite Storage',
                  body: 'All collections, history and settings are persisted locally via Prisma ORM — no internet needed.',
                },
              ].map((item) => (
                <div key={item.n} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 text-[10px] font-bold shrink-0 mt-0.5">
                    {item.n}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200 text-xs mb-0.5">{item.title}</div>
                    <p className="text-slate-500">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Terminal size={15} className="text-amber-400" />
              <span className="text-sm font-semibold text-slate-200 font-heading">Keyboard Shortcuts</span>
            </div>
            <div className="space-y-2.5">
              {[
                { keys: ['Ctrl', 'Enter'],       label: 'Send request' },
                { keys: ['Ctrl', 'S'],            label: 'Save request' },
                { keys: ['Ctrl', 'Shift', 'P'],  label: 'Command palette' },
                { keys: ['Ctrl', 'T'],            label: 'New tab' },
                { keys: ['Ctrl', 'W'],            label: 'Close tab' },
              ].map(({ keys, label }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{label}</span>
                  <div className="flex items-center gap-1">
                    {keys.map((k, i) => (
                      <React.Fragment key={k}>
                        <kbd className="bg-slate-800 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">
                          {k}
                        </kbd>
                        {i < keys.length - 1 && <span className="text-slate-600 text-[10px]">+</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800/60">
              {onOpenDocs && (
                <button
                  onClick={onOpenDocs}
                  className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors group"
                  id="dashboard-open-docs-btn"
                >
                  <BookOpen size={13} />
                  View full documentation
                  <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-700 mt-8 pb-2">
          RequestLab MVP &nbsp;•&nbsp; React + TypeScript + Node.js
        </div>
      </div>
    </div>
  );
};
