import React from 'react';
import { BookOpen, Settings, FolderPlus, FlaskConical } from 'lucide-react';

interface FloatingNavProps {
  onOpenDocs: () => void;
  onOpenSettings: () => void;
  onCreateCollection: () => void;
  onOpenExamples: () => void;
}

export const FloatingNav: React.FC<FloatingNavProps> = ({
  onOpenDocs,
  onOpenSettings,
  onCreateCollection,
  onOpenExamples,
}) => {
  const navItems = [
    { label: 'Docs', icon: BookOpen, action: onOpenDocs },
    { label: 'Examples', icon: FlaskConical, action: onOpenExamples },
    { label: 'Settings', icon: Settings, action: onOpenSettings },
    { label: 'New Collection', icon: FolderPlus, action: onCreateCollection },
  ];

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
      <div className="glass-panel flex items-center gap-2 p-2 rounded-full shadow-lg border border-slate-800">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            title={item.label}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-slate-300
                       hover:bg-slate-800/60 hover:text-white transition-all"
          >
            <item.icon size={14} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};