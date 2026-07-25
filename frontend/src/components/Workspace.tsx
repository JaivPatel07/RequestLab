import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import Editor from '@monaco-editor/react';
import { X, Send, Plus, Trash2, KeyRound, ChevronDown } from 'lucide-react';
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

  const [activeSubTab, setActiveSubTab] = useState<'params' | 'headers' | 'auth' | 'body' | 'prerequest' | 'tests' | 'settings'>('params');

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

  const getBodyLanguage = () => {
    if (activeTab.bodyType === 'json') return 'json';
    if (activeTab.bodyType === 'xml') return 'xml';
    return 'text';
  };

  const methodColorClass = (method: string, element: 'text' | 'bg') => {
    const map = {
      'GET':    { text: 'text-emerald-400', bg: 'bg-emerald-900/50' },
      'POST':   { text: 'text-indigo-400',  bg: 'bg-indigo-900/50'  },
      'PUT':    { text: 'text-amber-400',   bg: 'bg-amber-900/50'   },
      'PATCH':  { text: 'text-purple-400',  bg: 'bg-purple-900/50'  },
      'DELETE': { text: 'text-rose-400',    bg: 'bg-rose-900/50'    },
    };
    return (map as any)[method]?.[element] || 'text-slate-400';
  }

  return (
    <div className="h-full flex flex-col bg-[#0b0b0e] overflow-hidden select-none">
      
      {/* Tabs Header bar */}
      <div className="flex items-end bg-slate-950/40 border-b border-slate-900 overflow-x-auto shrink-0 pr-2">
        {tabs.map((tab) => {
          const active = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group flex items-center gap-2.5 pl-3 pr-2 py-2.5 border-r border-slate-900 cursor-pointer transition-colors text-xs relative ${
                active
                  ? 'bg-[#0f111a] text-slate-100'
                  : 'text-slate-400 hover:bg-slate-900/40'
              }`}
            >
              <span className={`font-bold uppercase text-[9px] w-10 text-center shrink-0 ${methodColorClass(tab.method, 'text')}`}>{tab.method}</span>
              <span className={`max-w-[120px] truncate ${active ? 'font-semibold' : ''}`}>{tab.name}</span>
              {tab.isDirty && !active && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className={`p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition-all ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              >
                <X size={12} />
              </button>
              {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
            </div>
          );
        })}
        
        {/* New Tab Button */}
        <button
          onClick={() => addTab()}
          className="p-3 text-slate-500 hover:text-slate-200 hover:bg-slate-900/40 transition-all"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* URL Entry / Action Bar */}
      <div className="p-3 border-b border-slate-900 bg-slate-950/20 flex items-center gap-2 shrink-0">
        <div className="relative">
          <select
            value={activeTab.method}
            onChange={(e) => updateTab(activeTab.id, { method: e.target.value })}
            className={`appearance-none bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-7 py-2.5 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors ${methodColorClass(activeTab.method, 'text')}`}
          >
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map((m) => (
              <option key={m} value={m} className="bg-slate-900 text-white">{m}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        </div>

        <div className="flex-1 relative flex items-center">
          <input
            type="text"
            placeholder="Enter request URL (e.g. {{base_url}}/users)"
            value={activeTab.url}
            onChange={(e) => updateTab(activeTab.id, { url: e.target.value, name: e.target.value.split('/').pop() || activeTab.name })}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={activeTab.loading}
          className="glass-button-primary rounded-lg py-2.5 px-6 text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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
      <div className="flex border-b border-slate-900/60 bg-slate-950/20 shrink-0 text-xs px-3">
        {[
          { id: 'params', label: 'Params' },
          { id: 'headers', label: 'Headers' },
          { id: 'auth', label: 'Authorization' },
          { id: 'body', label: 'Body' },
          { id: 'prerequest', label: 'Pre-request Script' },
          { id: 'tests', label: 'Tests' },
          { id: 'settings', label: 'Settings' }
        ].map((sub) => (
          <button
            key={sub.id}
            onClick={() => setActiveSubTab(sub.id as any)}
            className={`px-3 py-2.5 font-medium border-b-2 transition-colors ${
              activeSubTab === sub.id
                ? 'border-indigo-500 text-slate-100'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {/* Subtab Configuration Panels */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* 1. PARAMS PANEL */}
        {activeSubTab === 'params' && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Query Parameters</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 text-left border-b border-slate-900 pb-1">
                  <th className="pb-2 font-medium w-8"></th>
                  <th className="pb-2 font-medium w-1/3 pr-2">Key</th>
                  <th className="pb-2 font-medium pr-2">Value</th>
                  <th className="pb-2 font-medium w-8"></th>
                </tr>
              </thead>
              <tbody>
                {(activeTab.params || []).map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-900/40">
                    <td className="py-1">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={row.enabled !== false}
                          onChange={(e) => handleUpdateKeyValueList('params', idx, row.key, row.value, e.target.checked)}
                          className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                        />
                      </div>
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        type="text"
                        placeholder="Parameter name"
                        value={row.key}
                        onChange={(e) => handleUpdateKeyValueList('params', idx, e.target.value, row.value, row.enabled)}
                        className="w-full bg-transparent border-none outline-none text-slate-200 placeholder-slate-600 focus:ring-0 px-2 py-1"
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        type="text"
                        placeholder="Value"
                        value={row.value}
                        onChange={(e) => handleUpdateKeyValueList('params', idx, row.key, e.target.value, row.enabled)}
                        className="w-full bg-transparent border-none outline-none text-slate-200 placeholder-slate-600 focus:ring-0 font-mono px-2 py-1"
                      />
                    </td>
                    <td className="py-1 text-right">
                      {idx < (activeTab.params || []).length - 1 && (
                        <button
                          onClick={() => handleRemoveKeyValueRow('params', idx)}
                          className="text-slate-600 hover:text-rose-500 p-1"
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
                  <th className="pb-2 font-medium w-8"></th>
                  <th className="pb-2 font-medium w-1/3 pr-2">Key</th>
                  <th className="pb-2 font-medium pr-2">Value</th>
                  <th className="pb-2 font-medium w-8"></th>
                </tr>
              </thead>
              <tbody>
                {(activeTab.headers || []).map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-900/40">
                    <td className="py-1">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={row.enabled !== false}
                          onChange={(e) => handleUpdateKeyValueList('headers', idx, row.key, row.value, e.target.checked)}
                          className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                        />
                      </div>
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        type="text"
                        placeholder="Header name"
                        value={row.key}
                        onChange={(e) => handleUpdateKeyValueList('headers', idx, e.target.value, row.value, row.enabled)}
                        className="w-full bg-transparent border-none outline-none text-slate-200 placeholder-slate-600 focus:ring-0 px-2 py-1"
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        type="text"
                        placeholder="Value"
                        value={row.value}
                        onChange={(e) => handleUpdateKeyValueList('headers', idx, row.key, e.target.value, row.enabled)}
                        className="w-full bg-transparent border-none outline-none text-slate-200 placeholder-slate-600 focus:ring-0 font-mono px-2 py-1"
                      />
                    </td>
                    <td className="py-1 text-right">
                      {idx < (activeTab.headers || []).length - 1 && (
                        <button
                          onClick={() => handleRemoveKeyValueRow('headers', idx)}
                          className="text-slate-600 hover:text-rose-500 p-1"
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
              <div className="flex-1 overflow-y-auto"> {(() => {
                const bodyList = (() => {
                  try {
                    const parsed = JSON.parse(activeTab.bodyContent);
                    return Array.isArray(parsed) ? parsed : [{ key: '', value: '', enabled: true }];
                  } catch {
                    return [{ key: '', value: '', enabled: true }];
                  }
                })();

                const updateBodyList = (newList: KeyValuePair[]) => {
                  updateTab(activeTab.id, { bodyContent: JSON.stringify(newList) });
                };

                return (
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
                    {bodyList.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-900/40">
                        <td className="py-1">
                          <input
                            type="checkbox"
                            checked={row.enabled !== false}
                            onChange={(e) => {
                              const newList = [...bodyList];
                              newList[idx] = { ...newList[idx], enabled: e.target.checked };
                              updateBodyList(newList);
                            }}
                            className="rounded bg-slate-900 border-slate-800 text-indigo-650 focus:ring-0"
                          />
                        </td>
                        <td className="py-1 pr-4">
                          <input
                            type="text"
                            placeholder="Key"
                            value={row.key}
                            onChange={(e) => {
                              const newList = [...bodyList];
                              newList[idx] = { ...newList[idx], key: e.target.value };
                              if (idx === newList.length - 1 && e.target.value) newList.push({ key: '', value: '', enabled: true });
                              updateBodyList(newList);
                            }}
                            className="w-full bg-transparent border-none outline-none text-slate-200 placeholder-slate-600 focus:ring-0"
                          />
                        </td>
                        <td className="py-1">
                          <input
                            type="text"
                            placeholder="Value"
                            value={row.value}
                            onChange={(e) => {
                              const newList = [...bodyList];
                              newList[idx] = { ...newList[idx], value: e.target.value };
                              if (idx === newList.length - 1 && e.target.value) newList.push({ key: '', value: '', enabled: true });
                              updateBodyList(newList);
                            }}
                            className="w-full bg-transparent border-none outline-none text-slate-200 placeholder-slate-600 focus:ring-0 font-mono"
                          />
                        </td>
                        <td className="py-1 text-right">
                          {idx < bodyList.length - 1 && (
                            <button
                              onClick={() => {
                                const newList = bodyList.filter((_, i) => i !== idx);
                                updateBodyList(newList.length > 0 ? newList : [{ key: '', value: '', enabled: true }]);
                              }}
                              className="text-slate-600 hover:text-rose-500 p-1"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                );})()}</div>
            )}

            {(activeTab.bodyType === 'json' || activeTab.bodyType === 'text' || activeTab.bodyType === 'xml') && (
              <div className="flex-1 min-h-[220px] rounded-lg overflow-hidden border border-slate-900">
                <Editor
                  height="100%"
                  language={getBodyLanguage()}
                  theme="vs-dark"
                  value={activeTab.bodyContent}
                  onChange={(value) => updateTab(activeTab.id, { bodyContent: value || '' })}
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

        {/* 5. PRE-REQUEST SCRIPT PANEL */}
        {activeSubTab === 'prerequest' && (
          <div className="h-full flex flex-col space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pre-request Script</h3>
            <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-900 text-[11px] text-slate-400">
              This script will execute in a sandboxed environment before the request is sent. You can use it to manipulate request data dynamically.
            </div>
            <div className="flex-1 min-h-[220px] rounded-lg overflow-hidden border border-slate-900">
              <Editor
                height="100%"
                language="javascript"
                theme="vs-dark"
                value={activeTab.preRequestScript || ''}
                onChange={(value) => updateTab(activeTab.id, { preRequestScript: value || '' })}
                options={{
                  minimap: { enabled: false },
                  fontSize: settings.fontSize,
                  wordWrap: settings.wordWrap ? 'on' : 'off',
                  lineNumbers: 'on',
                }}
              />
            </div>
          </div>
        )}

        {/* 6. TESTS PANEL */}
        {activeSubTab === 'tests' && (
          <div className="h-full flex flex-col space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tests</h3>
            <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-900 text-[11px] text-slate-400">
              This script will run after the response is received. Use it to write assertions against the response data.
              Example: <code className="text-indigo-300">expect(response.status).toBe(200)</code>
            </div>
            <div className="flex-1 min-h-[220px] rounded-lg overflow-hidden border border-slate-900">
              <Editor
                height="100%"
                language="javascript"
                theme="vs-dark"
                value={activeTab.testScript || ''}
                onChange={(value) => updateTab(activeTab.id, { testScript: value || '' })}
                options={{
                  minimap: { enabled: false },
                  fontSize: settings.fontSize,
                  wordWrap: settings.wordWrap ? 'on' : 'off',
                  lineNumbers: 'on',
                }}
              />
            </div>
          </div>
        )}

        {/* 7. SETTINGS PANEL */}
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
