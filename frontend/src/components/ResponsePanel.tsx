import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import Editor from '@monaco-editor/react';
import { Terminal, Copy, Check, Eye, Code, FileText, Globe } from 'lucide-react';
import { KeyValuePair, RequestTab } from '../types';

export const ResponsePanel: React.FC = () => {
  const { tabs, activeTabId, settings } = useStore();
  const [activeSubTab, setActiveSubTab] = useState<'body' | 'headers' | 'cookies' | 'codegen'>('body');
  const [bodyMode, setBodyMode] = useState<'pretty' | 'raw' | 'preview'>('pretty');
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'javascript' | 'axios' | 'python'>('curl');

  const activeTab = tabs.find(t => t.id === activeTabId) || null;

  if (!activeTab) return null;

  const { response, loading } = activeTab;

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0d0d11] text-slate-400 select-none">
        <span className="w-8 h-8 rounded-full border-3 border-indigo-500/20 border-t-indigo-500 animate-spin mb-3"></span>
        <span className="text-xs font-semibold">Running request...</span>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#0d0d11] text-slate-500 text-xs border-l border-slate-900 select-none">
        <Terminal size={32} className="opacity-25 mb-2.5 text-indigo-400" />
        <span>Send a request to see the response.</span>
      </div>
    );
  }

  const isSuccess = response.status >= 200 && response.status < 300;
  const isClientError = response.status >= 400 && response.status < 500;
  const statusColor = isSuccess
    ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
    : isClientError
      ? 'text-amber-400 border-amber-500/20 bg-amber-500/5'
      : 'text-rose-400 border-rose-500/20 bg-rose-500/5';

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  // Generate code snippet
  const generateSnippet = (): string => {
    const method = activeTab.method;
    const url = activeTab.url || 'http://api.example.com';
    const headersRecord: Record<string, string> = {};
    activeTab.headers.forEach(h => {
      if (h.enabled && h.key) headersRecord[h.key] = h.value;
    });

    if (activeTab.authType === 'bearer' && activeTab.authConfig.token) {
      headersRecord['Authorization'] = `Bearer ${activeTab.authConfig.token}`;
    }

    let rawBody = '';
    if (activeTab.bodyType === 'json' && activeTab.bodyContent) {
      rawBody = activeTab.bodyContent;
    } else if (activeTab.bodyType === 'urlencoded' || activeTab.bodyType === 'formdata') {
      try {
        const parsed = JSON.parse(activeTab.bodyContent);
        if (Array.isArray(parsed)) {
          rawBody = parsed.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
        }
      } catch (e) { }
    } else if (activeTab.bodyContent) {
      rawBody = activeTab.bodyContent;
    }

    if (selectedLanguage === 'curl') {
      let headersStr = Object.entries(headersRecord).map(([k, v]) => `  -H "${k}: ${v}"`).join(' \\\n');
      if (headersStr) headersStr = ` \\\n${headersStr}`;
      let bodyStr = rawBody ? ` \\\n  -d '${rawBody}'` : '';
      return `curl -X ${method} "${url}"${headersStr}${bodyStr}`;
    }

    if (selectedLanguage === 'javascript') {
      const fetchOpts: any = { method };
      if (Object.keys(headersRecord).length > 0) fetchOpts.headers = headersRecord;
      if (rawBody) fetchOpts.body = rawBody;
      return `fetch("${url}", ${JSON.stringify(fetchOpts, null, 2)});`;
    }

    if (selectedLanguage === 'axios') {
      const axiosConfig: any = { method, url };
      if (Object.keys(headersRecord).length > 0) axiosConfig.headers = headersRecord;
      if (rawBody) {
        try {
          axiosConfig.data = JSON.parse(rawBody);
        } catch (e) {
          axiosConfig.data = rawBody;
        }
      }
      return `import axios from 'axios';\n\naxios(${JSON.stringify(axiosConfig, null, 2)});`;
    }

    if (selectedLanguage === 'python') {
      let headersPy = '';
      if (Object.keys(headersRecord).length > 0) {
        headersPy = `\nheaders = ${JSON.stringify(headersRecord, null, 4)}`;
      }
      let bodyPy = '';
      if (rawBody) {
        try {
          bodyPy = `\ndata = ${JSON.stringify(JSON.parse(rawBody), null, 4)}`;
        } catch (e) {
          bodyPy = `\ndata = """${rawBody}"""`;
        }
      }
      return `import requests\n${headersPy}${bodyPy}\n\nresponse = requests.${method.toLowerCase()}(\n    "${url}",\n    ${headersPy ? 'headers=headers,' : ''}\n    ${bodyPy ? 'data=data' : ''}\n)`;
    }

    return '';
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generateSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Format response body for printing
  const prettyResponseBody = typeof response.body === 'object'
    ? JSON.stringify(response.body, null, 2)
    : String(response.body);

  const getLanguage = () => {
    if (typeof response.body === 'object') return 'json';
    const contentType = response.headers?.['content-type'] || '';
    if (contentType.includes('html')) return 'html';
    if (contentType.includes('xml')) return 'xml';
    return 'text';
  };

  return (
    <div className="h-full flex flex-col bg-[#0d0d11]/95 border-l border-slate-900 overflow-hidden select-none">

      {/* Response Status / Metrics Header */}
      <div className="p-4 border-b border-slate-900 bg-slate-950/20 flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center gap-3">
          <span className={`font-bold px-2 py-1 border rounded-lg ${statusColor}`}>
            {response.status} {response.statusText}
          </span>
          <span className="text-slate-400 font-semibold">{response.duration} ms</span>
          <span className="text-slate-400 font-semibold">{formatSize(response.size)}</span>
        </div>
      </div>

      {/* Response Panel Sub-tabs */}
      <div className="flex border-b border-slate-900/60 bg-slate-950/5 shrink-0 text-xs px-2">
        {[
          { id: 'body', label: 'Response Body' },
          { id: 'headers', label: 'Headers' },
          { id: 'cookies', label: 'Cookies' },
          { id: 'codegen', label: 'Code Snippet' }
        ].map((sub) => (
          <button
            key={sub.id}
            onClick={() => setActiveSubTab(sub.id as any)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeSubTab === sub.id
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {/* Details Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {/* 1. RESPONSE BODY */}
        {activeSubTab === 'body' && (
          <div className="flex-1 flex flex-col space-y-3 h-full">
            {/* View Mode controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setBodyMode('pretty')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md flex items-center gap-1 transition-all ${bodyMode === 'pretty' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-900/50 text-slate-500 hover:text-slate-350'
                  }`}
              >
                <FileText size={12} /> Pretty
              </button>
              <button
                onClick={() => setBodyMode('raw')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md flex items-center gap-1 transition-all ${bodyMode === 'raw' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-900/50 text-slate-500 hover:text-slate-350'
                  }`}
              >
                <Code size={12} /> Raw
              </button>
              <button
                onClick={() => setBodyMode('preview')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md flex items-center gap-1 transition-all ${bodyMode === 'preview' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-900/50 text-slate-500 hover:text-slate-350'
                  }`}
              >
                <Eye size={12} /> Preview
              </button>
            </div>

            {/* Content Display */}
            {bodyMode === 'pretty' && (
              <div className="flex-1 min-h-[220px] rounded-lg overflow-hidden border border-slate-900">
                <Editor
                  height="100%"
                  language={getLanguage()}
                  theme="vs-dark"
                  value={prettyResponseBody}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: settings.fontSize,
                    wordWrap: settings.wordWrap ? 'on' : 'off',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    lineNumbers: 'on',
                  }}
                />
              </div>
            )}

            {bodyMode === 'raw' && (
              <textarea
                readOnly
                value={prettyResponseBody}
                className="flex-1 min-h-[220px] w-full bg-slate-950/60 border border-slate-900 rounded-lg p-3 text-xs text-slate-300 font-mono focus:outline-none resize-none"
              />
            )}

            {bodyMode === 'preview' && (
              <div className="flex-1 min-h-[220px] rounded-lg border border-slate-900 bg-white overflow-hidden">
                <iframe
                  title="Response Preview"
                  srcDoc={prettyResponseBody}
                  className="w-full h-full border-none"
                  sandbox="allow-scripts"
                />
              </div>
            )}
          </div>
        )}

        {/* 2. HEADERS */}
        {activeSubTab === 'headers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-slate-500 border-b border-slate-900">
                  <th className="pb-2 font-medium w-1/3">Name</th>
                  <th className="pb-2 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(response.headers || {}).map(([key, val]) => (
                  <tr key={key} className="border-b border-slate-900/40">
                    <td className="py-2 pr-4 font-semibold text-slate-400">{key}</td>
                    <td className="py-2 font-mono text-slate-300 select-text selection:bg-indigo-500/20">{String(val)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. COOKIES */}
        {activeSubTab === 'cookies' && (
          <div>
            {(response.cookies || []).length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No cookies returned in the response.
              </div>
            ) : (
              <div className="space-y-2">
                {response.cookies.map((cookie: string, index: number) => (
                  <div key={index} className="p-3 bg-slate-900/30 border border-slate-900 rounded-lg font-mono text-xs text-slate-300 break-all select-text">
                    {cookie}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. CODE SNIPPETS */}
        {activeSubTab === 'codegen' && (
          <div className="flex-1 flex flex-col space-y-3 h-full">
            <div className="flex items-center justify-between shrink-0">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg py-1 px-2.5 text-xs focus:outline-none focus:border-indigo-550 cursor-pointer"
              >
                <option value="curl">cURL</option>
                <option value="javascript">JavaScript Fetch</option>
                <option value="axios">Axios Client</option>
                <option value="python">Python Requests</option>
              </select>

              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-850/50 text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-all"
              >
                {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="flex-1 min-h-[220px] rounded-lg overflow-hidden border border-slate-900">
              <Editor
                height="100%"
                language={selectedLanguage === 'python' ? 'python' : 'javascript'}
                theme="vs-dark"
                value={generateSnippet()}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: settings.fontSize,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  lineNumbers: 'on',
                }}
              />
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
