import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Plus, Trash2, Globe, Database, ToggleLeft } from 'lucide-react';
import { KeyValuePair } from '../types';

interface EnvironmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnvironmentModal: React.FC<EnvironmentModalProps> = ({ isOpen, onClose }) => {
  const { environments, addEnvironment, updateEnvironment, deleteEnvironment } = useStore();
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  const [newEnvName, setNewEnvName] = useState('');

  if (!isOpen) return null;

  const currentEnv = environments.find(e => e.id === selectedEnvId) || environments.find(e => e.isGlobal) || null;

  const handleAddEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvName.trim()) return;
    const newEnv = await addEnvironment(newEnvName.trim(), false, [{ key: '', value: '', enabled: true }]);
    setSelectedEnvId(newEnv.id);
    setNewEnvName('');
  };

  const handleUpdateVariables = (vars: KeyValuePair[]) => {
    if (!currentEnv) return;
    updateEnvironment(currentEnv.id, { variables: JSON.stringify(vars) });
  };

  const handleAddVariableRow = () => {
    if (!currentEnv) return;
    const vars = typeof currentEnv.variables === 'string' ? JSON.parse(currentEnv.variables) : [...currentEnv.variables];
    vars.push({ key: '', value: '', enabled: true });
    handleUpdateVariables(vars);
  };

  const handleUpdateVariableRow = (index: number, key: string, value: string, enabled: boolean) => {
    if (!currentEnv) return;
    const vars = typeof currentEnv.variables === 'string' ? JSON.parse(currentEnv.variables) : [...currentEnv.variables];
    vars[index] = { key, value, enabled };
    handleUpdateVariables(vars);
  };

  const handleRemoveVariableRow = (index: number) => {
    if (!currentEnv) return;
    const vars = typeof currentEnv.variables === 'string' ? JSON.parse(currentEnv.variables) : [...currentEnv.variables];
    vars.splice(index, 1);
    handleUpdateVariables(vars);
  };

  const variablesList: KeyValuePair[] = currentEnv
    ? (typeof currentEnv.variables === 'string' ? JSON.parse(currentEnv.variables) : currentEnv.variables)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex h-[500px]">
        
        {/* Left pane: Environments list */}
        <div className="w-1/3 border-r border-slate-800/80 bg-slate-950/45 p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <ToggleLeft size={14} className="text-indigo-400" /> Environments
            </h3>

            {/* List */}
            <div className="space-y-1 overflow-y-auto max-h-[320px] pr-1">
              {environments.map((env) => (
                <button
                  key={env.id}
                  onClick={() => setSelectedEnvId(env.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                    (selectedEnvId === env.id || (!selectedEnvId && env.isGlobal))
                      ? 'bg-indigo-500/10 text-indigo-400 font-semibold'
                      : 'text-slate-350 hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {env.isGlobal ? <Globe size={13} className="text-indigo-400" /> : <Database size={13} />}
                    <span className="truncate">{env.name}</span>
                  </div>
                  {!env.isGlobal && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this environment?')) {
                          deleteEnvironment(env.id);
                          setSelectedEnvId(null);
                        }
                      }}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Add environment form */}
          <form onSubmit={handleAddEnv} className="mt-4 pt-4 border-t border-slate-900">
            <input
              type="text"
              placeholder="New Environment..."
              value={newEnvName}
              onChange={(e) => setNewEnvName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 mb-2"
            />
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-1.5 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <Plus size={13} /> Add
            </button>
          </form>
        </div>

        {/* Right pane: Variables editor */}
        <div className="flex-1 flex flex-col justify-between p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-200">
                {currentEnv?.name || 'Environment Variables'}
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {currentEnv?.isGlobal ? 'Global scopes are available across all requests.' : 'Active when selected in the main panel.'}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Variables Table */}
          <div className="flex-1 overflow-y-auto pr-1">
            {currentEnv ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 text-left border-b border-slate-900">
                    <th className="pb-2 font-medium w-6"></th>
                    <th className="pb-2 font-medium pr-4 w-1/3">Variable</th>
                    <th className="pb-2 font-medium">Value</th>
                    <th className="pb-2 font-medium w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {variablesList.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-900/50">
                      <td className="py-1">
                        <input
                          type="checkbox"
                          checked={row.enabled !== false}
                          onChange={(e) => handleUpdateVariableRow(idx, row.key, row.value, e.target.checked)}
                          className="rounded bg-slate-900 border-slate-800 text-indigo-650 focus:ring-0 focus:ring-offset-0"
                        />
                      </td>
                      <td className="py-1 pr-4">
                        <input
                          type="text"
                          placeholder="Variable name"
                          value={row.key}
                          onChange={(e) => handleUpdateVariableRow(idx, e.target.value, row.value, row.enabled)}
                          className="w-full bg-transparent border-none outline-none text-slate-200 placeholder-slate-600 focus:ring-0"
                        />
                      </td>
                      <td className="py-1">
                        <input
                          type="text"
                          placeholder="Value"
                          value={row.value}
                          onChange={(e) => handleUpdateVariableRow(idx, row.key, e.target.value, row.enabled)}
                          className="w-full bg-transparent border-none outline-none text-slate-200 placeholder-slate-600 focus:ring-0 font-mono"
                        />
                      </td>
                      <td className="py-1 text-right">
                        <button
                          onClick={() => handleRemoveVariableRow(idx)}
                          className="text-slate-600 hover:text-rose-400 p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                No environment selected.
              </div>
            )}
          </div>

          {/* Action Row */}
          {currentEnv && (
            <div className="pt-4 border-t border-slate-900 flex justify-between items-center shrink-0">
              <button
                onClick={handleAddVariableRow}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                <Plus size={13} /> Add Row
              </button>
              <button
                onClick={onClose}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors"
              >
                Save & Close
              </button>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};
