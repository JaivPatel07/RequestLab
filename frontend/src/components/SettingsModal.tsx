import React from 'react';
import { useStore } from '../store/useStore';
import { X, Sliders, Monitor, Sun, Moon, Info } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
            <Sliders size={18} className="text-indigo-400" /> Settings
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Editor Font Size */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Editor Font Size (px)</label>
            <input
              type="number"
              min="10"
              max="24"
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
              className="w-full bg-slate-900/50 border border-slate-850 rounded-lg py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Auto Save Toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <label className="block text-sm font-semibold text-slate-200">Auto Save</label>
              <span className="text-xs text-slate-500">Automatically sync tab edits to collections</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => updateSettings({ autoSave: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500 peer-checked:after:bg-white peer-checked:after:border-white"></div>
            </label>
          </div>

          {/* Word Wrap Toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <label className="block text-sm font-semibold text-slate-200">Editor Word Wrap</label>
              <span className="text-xs text-slate-500">Wrap long lines in JSON and body editors</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.wordWrap}
                onChange={(e) => updateSettings({ wordWrap: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500 peer-checked:after:bg-white peer-checked:after:border-white"></div>
            </label>
          </div>

          {/* Request Timeout */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Request Timeout (ms)</label>
            <input
              type="number"
              min="1000"
              max="120000"
              step="1000"
              value={settings.timeout}
              onChange={(e) => updateSettings({ timeout: Number(e.target.value) })}
              className="w-full bg-slate-900/50 border border-slate-850 rounded-lg py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* App Info Info-Box */}
          <div className="flex items-start gap-2.5 p-3.5 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-xs text-slate-400">
            <Info size={15} className="text-indigo-400 shrink-0 mt-0.5" />
            <p>
              Proxy execution is processed locally on <code className="text-indigo-300">http://localhost:5050</code>. This avoids CORS blocks when calling third-party services.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/40 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
