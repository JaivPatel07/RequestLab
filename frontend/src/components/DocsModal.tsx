import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Zap,
  Folder,
  Send,
  Globe,
  Key,
  Terminal,
  History,
  Sliders,
  CheckCircle,
  ChevronRight,
  Code2,
  Layers,
  ShieldCheck
} from 'lucide-react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sections = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'quickstart', label: 'Quick Start', icon: Zap },
  { id: 'requests', label: 'Making Requests', icon: Send },
  { id: 'collections', label: 'Collections', icon: Folder },
  { id: 'environments', label: 'Environments', icon: Sliders },
  { id: 'auth', label: 'Authentication', icon: Key },
  { id: 'history', label: 'History', icon: History },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Terminal },
];

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState('overview');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-5xl h-[85vh] flex flex-col rounded-2xl overflow-hidden border border-slate-800 shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #0d0d13 0%, #0b0c14 100%)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-8 py-5 border-b border-slate-800 shrink-0"
          style={{ background: 'linear-gradient(90deg, rgba(99,102,241,0.08) 0%, transparent 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/15 border border-indigo-500/20">
              <BookOpen size={20} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-slate-100 tracking-tight">RequestLab Docs</h2>
              <p className="text-xs text-slate-400 mt-0.5">Complete guide to using RequestLab</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body: Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left nav */}
          <div className="w-52 border-r border-slate-800 shrink-0 overflow-y-auto py-4 px-2"
            style={{ background: 'rgba(10,10,16,0.6)' }}>
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5 text-left ${
                    isActive
                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-indigo-400' : 'text-slate-500'} />
                  {sec.label}
                  {isActive && <ChevronRight size={12} className="ml-auto text-indigo-400" />}
                </button>
              );
            })}
          </div>

          {/* Right content */}
          <div className="flex-1 overflow-y-auto px-8 py-7 text-sm text-slate-300 leading-relaxed">
            {activeSection === 'overview' && <OverviewSection />}
            {activeSection === 'quickstart' && <QuickStartSection />}
            {activeSection === 'requests' && <RequestsSection />}
            {activeSection === 'collections' && <CollectionsSection />}
            {activeSection === 'environments' && <EnvironmentsSection />}
            {activeSection === 'auth' && <AuthSection />}
            {activeSection === 'history' && <HistorySection />}
            {activeSection === 'shortcuts' && <ShortcutsSection />}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Section Components ─── */

const SectionTitle: React.FC<{ icon: React.ElementType; title: string; subtitle?: string }> = ({ icon: Icon, title, subtitle }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2.5 mb-1.5">
      <Icon size={18} className="text-indigo-400" />
      <h3 className="text-xl font-bold font-heading text-slate-100">{title}</h3>
    </div>
    {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
    <div className="mt-3 h-px bg-gradient-to-r from-indigo-500/40 via-purple-500/20 to-transparent" />
  </div>
);

const Step: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <div className="flex gap-4 mb-5">
    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-bold mt-0.5">{n}</div>
    <div>
      <div className="font-semibold text-slate-200 mb-1">{title}</div>
      <div className="text-slate-400 text-sm">{children}</div>
    </div>
  </div>
);

const Callout: React.FC<{ type?: 'info' | 'tip' | 'warning'; children: React.ReactNode }> = ({ type = 'info', children }) => {
  const styles = {
    info:    'bg-indigo-500/8 border-indigo-500/25 text-indigo-300',
    tip:     'bg-emerald-500/8 border-emerald-500/25 text-emerald-300',
    warning: 'bg-amber-500/8  border-amber-500/25  text-amber-300',
  };
  return (
    <div className={`rounded-lg border px-4 py-3 my-4 text-sm ${styles[type]}`}>{children}</div>
  );
};

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
);

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="bg-slate-800 border border-slate-700 text-slate-200 px-2 py-0.5 rounded text-xs font-mono shadow">{children}</kbd>
);

/* ── 1. Overview ── */
const OverviewSection = () => (
  <div>
    <SectionTitle icon={Globe} title="What is RequestLab?" subtitle="A local-first API testing platform built for speed and privacy." />
    <p className="mb-4 text-slate-300">
      <strong className="text-slate-100">RequestLab</strong> is a modern, open-source API development environment that runs entirely on your machine.
      Unlike cloud-based tools, all your requests, collections, environments, and history are stored in a local SQLite database — meaning nothing ever leaves your computer.
    </p>
    <div className="grid grid-cols-3 gap-3 my-6">
      {[
        { icon: ShieldCheck, label: 'Fully Local', desc: 'SQLite-powered, no cloud sync' },
        { icon: Zap, label: 'CORS Proxy',  desc: 'No browser CORS restrictions' },
        { icon: Layers,    label: 'Collections', desc: 'Organise requests into folders' },
        { icon: Sliders,   label: 'Environments', desc: 'Variable scopes for any stage' },
        { icon: Code2,     label: 'Code Gen',    desc: 'Export as cURL or code snippets' },
        { icon: History,   label: 'History',     desc: 'Re-run any past request instantly' },
      ].map(f => (
        <div key={f.label} className="glass-card p-4 rounded-xl border border-slate-800">
          <f.icon size={16} className="text-indigo-400 mb-2" />
          <div className="font-semibold text-slate-200 text-sm mb-0.5">{f.label}</div>
          <div className="text-slate-500 text-xs">{f.desc}</div>
        </div>
      ))}
    </div>
    <h4 className="font-semibold text-slate-100 mt-5 mb-2">Architecture</h4>
    <p className="text-slate-400 text-sm">
      The frontend is a <strong className="text-slate-300">React + TypeScript</strong> SPA (Vite). The backend is an
      <strong className="text-slate-300"> Express + Prisma</strong> server that acts as a CORS-bypass proxy and persists all data to
      a <strong className="text-slate-300">SQLite</strong> database. Both services start with a single <Code>npm run dev</Code> from the project root.
    </p>
  </div>
);

/* ── 2. Quick Start ── */
const QuickStartSection = () => (
  <div>
    <SectionTitle icon={Zap} title="Quick Start" subtitle="Get your first API request sent in under 60 seconds." />
    <Step n={1} title="Open a new request tab">
      Click <strong className="text-slate-200">New Request</strong> on the Dashboard, or press <Kbd>Ctrl + T</Kbd> anywhere in the app.
      A blank request tab opens with method set to <Code>GET</Code>.
    </Step>
    <Step n={2} title="Enter a URL">
      In the URL bar, type any endpoint. Try a public test API:<br />
      <Code>https://httpbin.org/get</Code>
    </Step>
    <Step n={3} title="Send the request">
      Click the <strong className="text-indigo-300">Send</strong> button or press <Kbd>Ctrl + Enter</Kbd>.
      The response will appear in the right panel with status, headers, body, and timing info.
    </Step>
    <Step n={4} title="Inspect the response">
      Use the <strong className="text-slate-200">Response</strong> panel tabs to switch between Pretty (formatted JSON),
      Raw, Headers, and Cookies views.
    </Step>
    <Callout type="tip">
      💡 The very first request automatically appears in your <strong>History</strong> panel on the left sidebar, so you can re-run it any time.
    </Callout>
  </div>
);

/* ── 3. Making Requests ── */
const RequestsSection = () => (
  <div>
    <SectionTitle icon={Send} title="Making Requests" subtitle="Configure method, URL, headers, params, body, auth, cookies, and settings." />
    <h4 className="font-semibold text-slate-100 mb-2">Method & URL Bar</h4>
    <p className="text-slate-400 text-sm mb-4">
      Select an HTTP method (<Code>GET</Code> <Code>POST</Code> <Code>PUT</Code> <Code>PATCH</Code> <Code>DELETE</Code> <Code>HEAD</Code> <Code>OPTIONS</Code>) from the dropdown, then type the endpoint URL.
      You can embed environment variables directly: <Code>{"{{base_url}}/users/{{user_id}}"}</Code>.
    </p>
    <h4 className="font-semibold text-slate-100 mb-2">Request Tabs</h4>
    <div className="space-y-2 text-sm text-slate-400 mb-4">
      {[
        ['Params', 'Key-value query parameters appended to the URL automatically.'],
        ['Headers', 'Custom request headers. Enable/disable per row.'],
        ['Body', 'Send a JSON, form-data, raw text, or binary payload.'],
        ['Auth', 'Add Bearer Token, Basic Auth, or API Key authentication.'],
        ['Cookies', 'Manually set cookies sent with the request.'],
        ['Settings', 'Per-request options: follow redirects, TLS verify, timeout.'],
      ].map(([tab, desc]) => (
        <div key={tab} className="flex gap-3">
          <span className="text-indigo-400 font-semibold w-20 shrink-0">{tab}</span>
          <span>{desc}</span>
        </div>
      ))}
    </div>
    <Callout type="info">
      All request data is auto-saved to the local database. Unsaved changes are marked with a <strong>dot indicator</strong> on the tab title.
    </Callout>
  </div>
);

/* ── 4. Collections ── */
const CollectionsSection = () => (
  <div>
    <SectionTitle icon={Folder} title="Collections" subtitle="Organise related requests into folders with drag-and-drop support." />
    <p className="text-slate-400 mb-4">Collections are the core organisational unit in RequestLab. Each collection can contain requests and nested sub-folders.</p>
    {[
      ['Create', 'Click the + button in the Sidebar header or the "New Collection" button on the Dashboard.'],
      ['Add a Request', 'Hover a collection row and click the + icon. Give the request a name; it opens as a new tab.'],
      ['Rename', 'Double-click a collection or request name to rename it inline.'],
      ['Reorder', 'Drag a request to move it between collections or change its position.'],
      ['Export', 'Right-click a collection → Export JSON to share or backup.'],
      ['Import', 'Click the Import button in the Sidebar to load a previously exported JSON file.'],
      ['Favourite', 'Star any collection to pin it to the Favourites counter on the Dashboard.'],
      ['Delete', 'Hover a row and click the trash icon. Deleting a collection removes all its requests.'],
    ].map(([action, desc]) => (
      <div key={action} className="flex items-start gap-3 mb-3">
        <CheckCircle size={14} className="text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-semibold text-slate-200">{action} —</span>{' '}
          <span className="text-slate-400">{desc}</span>
        </div>
      </div>
    ))}
  </div>
);

/* ── 5. Environments ── */
const EnvironmentsSection = () => (
  <div>
    <SectionTitle icon={Sliders} title="Environments" subtitle='Use {{variable}} placeholders across any URL, header, or body field.' />
    <p className="text-slate-400 mb-4">
      Environments let you define named key-value pairs (e.g. <Code>base_url</Code>, <Code>api_key</Code>) that are automatically resolved before each request is sent.
    </p>
    <Step n={1} title="Open the Environment Manager">
      Click the sliders icon in the sidebar environment bar, or press <Kbd>Ctrl + E</Kbd>.
    </Step>
    <Step n={2} title="Create an environment">
      Click <strong className="text-slate-200">Add Environment</strong> and give it a name like <Code>Production</Code> or <Code>Staging</Code>.
    </Step>
    <Step n={3} title="Add variables">
      In the right panel, add key-value pairs. Example: key = <Code>base_url</Code>, value = <Code>https://api.example.com</Code>.
    </Step>
    <Step n={4} title="Use in requests">
      In any URL, header, or body field type <Code>{"{{base_url}}"}</Code>. When you send the request, RequestLab replaces it with the variable value.
    </Step>
    <Callout type="tip">
      There is always a <strong>Global</strong> environment. Variables defined there are available across all environments as a fallback.
    </Callout>
  </div>
);

/* ── 6. Auth ── */
const AuthSection = () => (
  <div>
    <SectionTitle icon={Key} title="Authentication" subtitle="Per-request auth configuration with multiple scheme support." />
    <p className="text-slate-400 mb-5">Switch to the <strong className="text-slate-200">Auth</strong> tab inside any open request to configure authentication.</p>
    {[
      { scheme: 'None', desc: 'No auth headers are added (default).' },
      { scheme: 'Bearer Token', desc: 'Adds an Authorization: Bearer <token> header. Supports environment variable tokens.' },
      { scheme: 'Basic Auth', desc: 'Encodes username + password as Base64 and adds the Authorization: Basic header.' },
      { scheme: 'API Key', desc: 'Send a custom header or query parameter name/value pair. Choose Header or Query param location.' },
    ].map(({ scheme, desc }) => (
      <div key={scheme} className="mb-4 p-3 rounded-lg bg-slate-900/40 border border-slate-800">
        <div className="font-semibold text-indigo-300 text-sm mb-1">{scheme}</div>
        <div className="text-slate-400 text-sm">{desc}</div>
      </div>
    ))}
    <Callout type="tip">
      Store sensitive tokens as environment variables (e.g. <Code>{"{{auth_token}}"}</Code>) so they never appear hardcoded in saved requests.
    </Callout>
  </div>
);

/* ── 7. History ── */
const HistorySection = () => (
  <div>
    <SectionTitle icon={History} title="Request History" subtitle="Every sent request is recorded automatically for instant replay." />
    <p className="text-slate-400 mb-4">
      After every successful send, RequestLab records the request and its full response in the local database. Switch to the <strong className="text-slate-200">History</strong> tab in the sidebar to browse past requests.
    </p>
    {[
      ['Re-run', 'Click any history entry to open it as a new request tab pre-filled with the exact same URL, method, and response preview.'],
      ['Filter', 'Use the search bar at the top of the sidebar to filter by URL or method name.'],
      ['Delete entry', 'Hover a history item and click the trash icon to remove a single entry.'],
      ['Clear all', 'Click "Clear History" at the top of the history panel to wipe all records.'],
    ].map(([action, desc]) => (
      <div key={action} className="flex items-start gap-3 mb-3">
        <CheckCircle size={14} className="text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-semibold text-slate-200">{action} —</span>{' '}
          <span className="text-slate-400">{desc}</span>
        </div>
      </div>
    ))}
  </div>
);

/* ── 8. Shortcuts ── */
const ShortcutsSection = () => (
  <div>
    <SectionTitle icon={Terminal} title="Keyboard Shortcuts" subtitle="Boost your workflow with these built-in shortcuts." />
    <div className="space-y-2">
      {[
        { keys: ['Ctrl', 'Enter'],        desc: 'Send the active request' },
        { keys: ['Ctrl', 'S'],            desc: 'Save / sync active request to collection' },
        { keys: ['Ctrl', 'Shift', 'P'],  desc: 'Open the Command Palette' },
        { keys: ['Ctrl', 'T'],            desc: 'Open a new blank request tab' },
        { keys: ['Ctrl', 'W'],            desc: 'Close the active tab' },
        { keys: ['Ctrl', 'E'],            desc: 'Open Environments manager' },
        { keys: ['Esc'],                  desc: 'Close any open modal or palette' },
      ].map(({ keys, desc }) => (
        <div key={desc} className="flex items-center justify-between py-2.5 border-b border-slate-800/60">
          <span className="text-slate-300 text-sm">{desc}</span>
          <div className="flex items-center gap-1">
            {keys.map((k, i) => (
              <React.Fragment key={k}>
                <Kbd>{k}</Kbd>
                {i < keys.length - 1 && <span className="text-slate-600 text-xs">+</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
    <Callout type="info">
      On macOS, replace <Kbd>Ctrl</Kbd> with <Kbd>⌘ Cmd</Kbd>.
    </Callout>
  </div>
);
