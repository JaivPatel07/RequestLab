import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Search, Terminal, Moon, Sun, Monitor, Trash2, Plus, Settings, Folder } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onCreateCollection: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onCreateCollection
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { updateSettings, clearHistory, addTab, collections } = useStore();

  const commands = [
    {
      id: 'new-request',
      name: 'Create New Request Tab',
      category: 'Request',
      icon: Plus,
      action: () => addTab()
    },
    {
      id: 'new-collection',
      name: 'Create New Collection',
      category: 'Collection',
      icon: Folder,
      action: onCreateCollection
    },
    {
      id: 'clear-history',
      name: 'Clear Request History',
      category: 'History',
      icon: Trash2,
      action: clearHistory
    },
    {
      id: 'open-settings',
      name: 'Open Settings Panel',
      category: 'Configuration',
      icon: Settings,
      action: onOpenSettings
    }
  ];

  // Add saved requests to search target
  const requestCommands = collections.flatMap(c =>
    c.requests.map(r => ({
      id: `req-${r.id}`,
      name: `Open saved request: ${r.name} (${r.method})`,
      category: `Collection: ${c.name}`,
      icon: Terminal,
      action: () => addTab({
        id: `req-${r.id}`,
        name: r.name,
        method: r.method,
        url: r.url,
        headers: JSON.parse(r.headers),
        params: JSON.parse(r.params),
        authType: r.authType as any,
        authConfig: JSON.parse(r.authConfig),
        bodyType: r.bodyType as any,
        bodyContent: r.bodyContent || '',
        cookies: r.cookies ? JSON.parse(r.cookies) : [],
        settings: r.settings ? JSON.parse(r.settings) : {},
        requestId: r.id,
        collectionId: r.collectionId
      })
    }))
  );

  const allTargets = [...commands, ...requestCommands];
  const filtered = allTargets.filter(cmd =>
    cmd.name.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/65 backdrop-blur-xs animate-fade-in">
      <div
        ref={containerRef}
        className="glass-panel w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border border-slate-800 flex flex-col max-h-[450px]"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 shrink-0">
          <Search size={18} className="text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search requests..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent border-none outline-none text-slate-100 text-sm placeholder-slate-500 focus:ring-0"
          />
          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">ESC</span>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 p-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No matching commands found.
            </div>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((cmd, index) => {
                const Icon = cmd.icon;
                const active = index === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-all ${
                      active ? 'bg-indigo-500/15 border-indigo-500/30 text-slate-100' : 'text-slate-350 hover:bg-slate-900/35'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-1.5 rounded-md ${active ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-900 text-slate-400'}`}>
                        <Icon size={14} />
                      </div>
                      <div className="truncate">
                        <div className="font-medium">{cmd.name}</div>
                        <div className="text-[10px] text-slate-500">{cmd.category}</div>
                      </div>
                    </div>
                    {active && (
                      <span className="text-[10px] text-indigo-400 font-mono">⏎ ENTER</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
