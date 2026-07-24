import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import Editor from '@monaco-editor/react';
import { X, Send, Plus, Trash2, KeyRound } from 'lucide-react';
import { KeyValuePair } from '../types';

export const Workspace: React.FC = () => {
  const {
    tabs,
    activeTabId,
    setActiveTabId,
    closeTab,
    updateTab,
    addTab,
    sendRequest,
    settings
  } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'params' | 'headers' | 'auth' | 'body' | 'settings'>('params');

  const activeTab = tabs.find(t => t.id === activeTabId) || null;

  if (!activeTab) {
    return null;
  }

  const handleSend = () => {
    if (activeTabId) {
      sendRequest(activeTabId);
    }
  };

  // Helper to update fields
  const handleUpdateKeyValueList = (
    field: 'params' | 'headers' | 'cookies',
    index: number,
    key: string,
    value: string,
    enabled: boolean
  ) => {
    const list = [...(activeTab[field] || [])];
    list[index] = { key, value, enabled };

    // Automatically append empty row if we just typed in the last row
    if (index === list.length - 1 && (key || value)) {
      list.push({ key: '', value: '', enabled: true });
    }

    updateTab(activeTab.id, { [field]: list });
  };

  const handleRemoveKeyValueRow = (field: 'params' | 'headers' | 'cookies', index: number) => {
    const list = [...(activeTab[field] || [])];
    list.splice(index, 1);
    // Always keep at least one row
    if (list.length === 0) {
      list.push({ key: '', value: '', enabled: true });
    }
    updateTab(activeTab.id, { [field]: list });
  };

  // Monaco editor change handler
  const handleBodyChange = (value: string | undefined) => {
    updateTab(activeTab.id, { bodyContent: value || '' });
  };

  // Parse Body for Form Data / urlencoded list representation
  const getBodyKeyValueList = (): KeyValuePair[] => {
    try {
      const list = JSON.parse(activeTab.bodyContent);
      if (Array.isArray(list)) return list;
    } catch (e) {}
    return [{ key: '', value: '', enabled: true }];
  };

  const handleUpdateBodyKeyValueList = (index: number, key: string, value: string, enabled: boolean) => {
    const list = getBodyKeyValueList();
    list[index] = { key, value, enabled };
    if (index === list.length - 1 && (key || value)) {
      list.push({ key: '', value: '', enabled: true });
    }
    updateTab(activeTab.id, { bodyContent: JSON.stringify(list) });
  };

  const handleRemoveBodyKeyValueRow = (index: number) => {
    const list = getBodyKeyValueList();
    list.splice(index, 1);
    if (list.length === 0) {
      list.push({ key: '', value: '', enabled: true });
    }
    updateTab(activeTab.id, { bodyContent: JSON.stringify(list) });
  };

  const getBodyLanguage = () => {
    if (activeTab.bodyType === 'json') return 'json';
    if (activeTab.bodyType === 'xml') return 'xml';
    return 'text';
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0b0e] overflow-hidden select-none">
      
      {/* Tabs Header bar */}
      <div className="flex items-center bg-slate-950/40 border-b border-slate-900 overflow-x-auto shrink-0 pr-10">
        {tabs.map((tab) => {
          const active = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 border-r border-slate-900 cursor-pointer transition-all text-xs ${
                active
                  ? 'bg-[#0f0f13] text-indigo-400 font-semibold border-b border-b-indigo-500'
                  : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900/10'
              }`}
            >
              <span className={`font-extrabold uppercase text-[9px] ${
                tab.method === 'GET' ? 'text-emerald-400' : tab.method === 'POST' ? 'text-indigo-400' : 'text-amber-400'
              }`}>
                {tab.method}
              </span>
              <span className="max-w-[100px] truncate">{tab.name}</span>
              {tab.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="p-0.5 rounded-full hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
        
        {/* New Tab Button */}
        <button
          onClick={() => addTab()}
          className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-900/20 transition-all"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* URL Entry / Action Bar */}
      <div className="p-4 border-b border-slate-900 bg-slate-950/10 flex items-center gap-2 shrink-0">
        <select
          value={activeTab.method}
          onChange={(e) => updateTab(activeTab.id, { method: e.target.value })}
          className="bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            placeholder="Enter request URL (e.g. {{base_url}}/users)"
            value={activeTab.url}
            onChange={(e) => updateTab(activeTab.id, { url: e.target.value, name: e.target.value.split('/').pop() || activeTab.name })}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-550 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={activeTab.loading}
          className="glass-button-primary rounded-lg py-2 px-5 text-xs font-bold text-white flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {activeTab.loading ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
              Sending...
            </>
          ) : (
            <>
              <Send size={13} />
              Send
            </>
          )}
        </button>
      </div>

      {/* Configuration Tabs Header */}
      <div className="flex border-b border-slate-900/60 bg-slate-950/5 shrink-0 text-xs px-2">
        {[
          { id: 'params', label: 'Params' },
          { id: 'headers', label: 'Headers' },
          { id: 'auth', label: 'Authorization' },
          { id: 'body', label: 'Body' },
          { id: 'settings', label: 'Settings' }
        ].map((sub) => (
          <button
            key={sub.id}
            onClick={() => setActiveSubTab(sub.id as any)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeSubTab === sub.id
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {/* Subtab Configuration Panels */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 1. PARAMS PANEL */}
        {activeSubTab === 'params' && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Query Parameters</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 text-left border-b border-slate-900 pb-1">
                  <th className="pb-2 font-medium w-6"></th>
                  <th className="pb-2 font-medium w-1/3 pr-4">Key</th>
                  <th className="pb-2 font-medium">Value</th>
                  <th className="pb-2 font-medium w-8"></th>
                </tr>
              </thead>
              <tbody>
                {(activeTab.params || []).map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-900/40">
                    <td className="py-1">
                      <input
                        type="checkbox"
                        checked={row.enabled !== false}
                        onChange={(e) => handleUpdateKeyValueList('params', idx, row.key, row.value, e.target.checked)}
                        className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0"
                      />
                    </td>
                    <td className="py-1 pr-4">
                      <input
                        type="text"
                        placeholder="Parameter name"
                        value={row.key}
                        onChange={(e) => handleUpdateKeyValueList('params', idx, e.target.value, row.value, row.enabled)}
                        className="w-full bg-transparent border-none outline-none text-slate-200 placeholder-slate-600 focus:ring-0"
                      />
                    </td>
                    <td className="py-1">
                      <input
                        type="text"
                        placeholder="Value"
                        value={row.value}
                        onChange={(e) => handleUpdateKeyValueList('params', idx, row.key, e.target.value, row.enabled)}
                        className="w-full bg-transparent border-none outline-none text-slate-200 placeholder-slate-600 focus:ring-0 font-mono"
                      />
                    </td>
                    <td className="py-1 text-right">
                      {idx < (activeTab.params || []).length - 1 && (
                        <button
                          onClick={() => handleRemoveKeyValueRow('params', idx)}
                          className="text-slate-600 hover:text-rose-450 p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. HEADERS PANEL */}
        {activeSubTab === 'headers' && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Request Headers</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 text-left border-b border-slate-900 pb-1">
                  <th className="pb-2 font-medium w-6"></th>
                  <th className="pb-2 font-medium w-1/3 pr-4">Key</th>
                  <th className="pb-2 font-medium">Value</th>
                  <th className="pb-2 font-medium w-8"></th>
                </tr>
              </thead>
              <tbody>
                {(activeTab.headers || []).map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-900/40">
                    <td className="py-1">
                      <input
                        type="checkbox"
                        checked={row.enabled !== false}
                        onChange={(e) => handleUpdateKeyValueList('headers', idx, row.key, row.value, e.target.checked)}
                        className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0"
                      />
                    </td>
                    <td className="py-1 pr-4">
                      <input
                        type="text"
                        placeholder="Header name"
                        value={row.key}
                        onChange={(e) => handleUpdateKeyValueList('headers', idx, e.target.value, row.value, row.enabled)}
                        className="w-full bg-transparent border-none outline-none text-slate-200 placeholder-slate-600 focus:ring-0"
                      />
                    </td>
                    <td className="py-1">
                      <input
                        type="text"
                        placeholder="Value"
                        value={row.value}
                        onChange={(e) => handleUpdateKeyValueList('headers', idx, row.key, e.target.value, row.enabled)}
                        className="w-full bg-transparent border-none outline-none text-slate-200 placeholder-slate-600 focus:ring-0 font-mono"
                      />
                    </td>
                    <td className="py-1 text-right">
                      {idx < (activeTab.headers || []).length - 1 && (
                        <button
                          onClick={() => handleRemoveKeyValueRow('headers', idx)}
                          className="text-slate-600 hover:text-rose-450 p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. AUTHORIZATION PANEL */}
        {activeSubTab === 'auth' && (
          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Auth Type</label>
              <select
                value={activeTab.authType}
                onChange={(e) => updateTab(activeTab.id, { authType: e.target.value as any })}
                className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg py-1.5 px-3 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="none">No Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="apikey">API Key</option>
              </select>
            </div>

            {activeTab.authType === 'bearer' && (
              <div className="space-y-1">
                <label className="block text-xs text-slate-400 font-medium">Token</label>
                <input
                  type="password"
                  placeholder="Enter Bearer Token (e.g. {{token}})"
                  value={activeTab.authConfig.token || ''}
                  onChange={(e) => updateTab(activeTab.id, { authConfig: { ...activeTab.authConfig, token: e.target.value } })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            )}

            {activeTab.authType === 'basic' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs text-slate-400 font-medium">Username</label>
                  <input
                    type="text"
                    placeholder="Username"
                    value={activeTab.authConfig.username || ''}
                    onChange={(e) => updateTab(activeTab.id, { authConfig: { ...activeTab.authConfig, username: e.target.value } })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs text-slate-400 font-medium">Password</label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={activeTab.authConfig.password || ''}
                    onChange={(e) => updateTab(activeTab.id, { authConfig: { ...activeTab.authConfig, password: e.target.value } })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {activeTab.authType === 'apikey' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs text-slate-400 font-medium">Key</label>
                    <input
                      type="text"
                      placeholder="X-API-Key"
                      value={activeTab.authConfig.key || ''}
                      onChange={(e) => updateTab(activeTab.id, { authConfig: { ...activeTab.authConfig, key: e.target.value } })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs text-slate-400 font-medium">Value</label>
                    <input
                      type="text"
                      placeholder="Value"
                      value={activeTab.authConfig.value || ''}
                      onChange={(e) => updateTab(activeTab.id, { authConfig: { ...activeTab.authConfig, value: e.target.value } })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-medium mb-1">Add To</label>
                  <select
                    value={activeTab.authConfig.addTo || 'headers'}
                    onChange={(e) => updateTab(activeTab.id, { authConfig: { ...activeTab.authConfig, addTo: e.target.value as any } })}
                    className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg py-1 px-2.5 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="headers">Headers</option>
                    <option value="params">Query Params</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab.authType !== 'none' && (
              <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-900 flex items-start gap-2.5 text-[11px] text-slate-400">
                <KeyRound size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                <p>Auth headers will be automatically injected by the backend proxy before sending request.</p>
              </div>
            )}
          </div>
        )}

        {/* 4. BODY PANEL */}
        {activeSubTab === 'body' && (
          <div className="h-full flex flex-col space-y-3">
            <div className="flex items-center gap-3 shrink-0">
              <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Body Format</label>
              <select
                value={activeTab.bodyType}
                onChange={(e) => {
                  const type = e.target.value;
                  let content = activeTab.bodyContent;
                  if (type === 'formdata' || type === 'urlencoded') {
                    content = JSON.stringify([{ key: '', value: '', enabled: true }]);
                  } else if (type === 'json' && !content) {
                    content = '{\n  \n}';
                  } else if (type === 'none') {
                    content = '';
                  }
                  updateTab(activeTab.id, { bodyType: type as any, bodyContent: content });
                }}
                className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg py-1 px-2.5 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="none">None</option>
                <option value="json">JSON</option>
                <option value="formdata">Form Data</option>
                <option value="urlencoded">x-www-form-urlencoded</option>
                <option value="text">Raw Text</option>
                <option value="xml">XML</option>
              </select>
            </div>

            {/* Render Editor / Table depending on type */}
            {activeTab.bodyType === 'none' && (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-900 rounded-xl py-12 text-slate-500 text-xs">
                <span>This request has no body payload.</span>
              </div>
            )}

            {(activeTab.bodyType === 'formdata' || activeTab.bodyType === 'urlencoded') && (
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 text-left border-b border-slate-900">
                      <th className="pb-2 font-medium w-6"></th>
                      <th className="pb-2 font-medium w-1/3 pr-4">Key</th>
                      <th className="pb-2 font-medium">Value</th>
                      <th className="pb-2 font-medium w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {getBodyKeyValueList().map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-900/40">
                        <td className="py-1">
                          <input
                            type="checkbox"
                            checked={row.enabled !== false}
                            onChange={(e) => handleUpdateBodyKeyValueList(idx, row.key, row.value, e.target.checked)}
                            className="rounded bg-slate-900 border-slate-800 text-indigo-650 focus:ring-0"
                          />
                        </td>
                        <td className="py-1 pr-4">
                          <input
                            type="text"
                            placeholder="Key"
                            value={row.key}
                            onChange={(e) => handleUpdateBodyKeyValueList(idx, e.target.value, row.value, row.enabled)}
                            className="w-full bg-transparent border-none outline-none text-slate-200 placeholder-slate-600 focus:ring-0"
                          />
                        </td>
                        <td className="py-1">
                          <input
                            type="text"
                            placeholder="Value"
                            value={row.value}
                            onChange={(e) => handleUpdateBodyKeyValueList(idx, row.key, e.target.value, row.enabled)}
                            className="w-full bg-transparent border-none outline-none text-slate-200 placeholder-slate-600 focus:ring-0 font-mono"
                          />
                        </td>
                        <td className="py-1 text-right">
                          {idx < getBodyKeyValueList().length - 1 && (
                            <button
                              onClick={() => handleRemoveBodyKeyValueRow(idx)}
                              className="text-slate-600 hover:text-rose-450 p-1"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {(activeTab.bodyType === 'json' || activeTab.bodyType === 'text' || activeTab.bodyType === 'xml') && (
              <div className="flex-1 min-h-[220px] rounded-lg overflow-hidden border border-slate-900">
                <Editor
                  height="100%"
                  language={getBodyLanguage()}
                  theme="vs-dark"
                  value={activeTab.bodyContent}
                  onChange={handleBodyChange}
                  options={{
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
          </div>
        )}

        {/* 5. SETTINGS PANEL */}
        {activeSubTab === 'settings' && (
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1">Request Timeout (ms)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={activeTab.settings?.timeout || 30000}
                onChange={(e) => updateTab(activeTab.id, { settings: { ...activeTab.settings, timeout: Number(e.target.value) } })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Specify execution timeout. Defaults to 30 seconds.</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
