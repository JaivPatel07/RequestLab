import React, { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { ResponsePanel } from './components/ResponsePanel';
import { Dashboard } from './components/Dashboard';
import { SettingsModal } from './components/SettingsModal';
import { EnvironmentModal } from './components/EnvironmentModal';
import { CommandPalette } from './components/CommandPalette';
import { CollectionRunnerModal } from './components/CollectionRunnerModal';
import { DocsModal } from './components/DocsModal';

const App: React.FC = () => {
  const {
    loadCollections,
    loadEnvironments,
    loadHistory,
    tabs,
    activeTabId,
    sendRequest,
    updateSettings
  } = useStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEnvironmentsOpen, setIsEnvironmentsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    loadCollections();
    loadEnvironments();
    loadHistory();
    
    // Apply theme
    const root = window.document.documentElement;
    root.classList.add('dark');
  }, []);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Enter / Cmd+Enter: Send request
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (activeTabId) {
          sendRequest(activeTabId);
        }
      }
      
      // Ctrl+S / Cmd+S: Save request
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (activeTab && activeTab.requestId) {
          useStore.getState().updateRequest(activeTab.requestId, {
            name: activeTab.name,
            method: activeTab.method,
            url: activeTab.url,
            headers: JSON.stringify(activeTab.headers),
            params: JSON.stringify(activeTab.params),
            authType: activeTab.authType,
            authConfig: JSON.stringify(activeTab.authConfig),
            bodyType: activeTab.bodyType,
            bodyContent: activeTab.bodyContent,
            cookies: JSON.stringify(activeTab.cookies),
            settings: JSON.stringify(activeTab.settings)
          });
          alert('Request Saved!');
        }
      }

      // Ctrl+Shift+P / Cmd+Shift+P: Command Palette
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, tabs]);

  const handleCreateCollectionFromDashboard = async () => {
    const name = prompt('Enter collection name:');
    if (name) {
      await useStore.getState().addCollection(name);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#070709] text-slate-100 flex flex-col font-sans overflow-hidden">
      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal" className="h-full w-full">
          {/* Left panel: Sidebar */}
          <Panel defaultSize={20} minSize={15} maxSize={35}>
            <Sidebar
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenEnvironments={() => setIsEnvironmentsOpen(true)}
              onOpenDocs={() => setIsDocsOpen(true)}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-[#121217] hover:bg-indigo-500 cursor-col-resize transition-all" />

          {/* Right side: Editor + Response OR Dashboard */}
          <Panel defaultSize={80}>
            {tabs.length === 0 ? (
              <Dashboard
                onOpenSettings={() => setIsSettingsOpen(true)}
                onCreateCollection={handleCreateCollectionFromDashboard}
                onOpenDocs={() => setIsDocsOpen(true)}
              />
            ) : (
              <PanelGroup direction="horizontal" className="h-full w-full">
                {/* Request Panel */}
                <Panel defaultSize={50} minSize={30}>
                  <Workspace />
                </Panel>

                <PanelResizeHandle className="w-1 bg-[#121217] hover:bg-indigo-500 cursor-col-resize transition-all" />

                {/* Response Panel */}
                <Panel defaultSize={50} minSize={30}>
                  <ResponsePanel />
                </Panel>
              </PanelGroup>
            )}
          </Panel>
        </PanelGroup>
      </div>

      {/* Modals & Dialogs */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <EnvironmentModal isOpen={isEnvironmentsOpen} onClose={() => setIsEnvironmentsOpen(false)} />
      <DocsModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
      <CollectionRunnerModal />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenSettings={() => {
          setIsCommandPaletteOpen(false);
          setIsSettingsOpen(true);
        }}
        onCreateCollection={async () => {
          setIsCommandPaletteOpen(false);
          await handleCreateCollectionFromDashboard();
        }}
      />

      {/* Ad Banner Area */}
      <div className="h-[90px] bg-slate-950/50 border-t border-slate-800 flex items-center justify-center shrink-0">
        <span className="text-slate-700 text-sm font-medium">Advertisement Area</span>
      </div>
    </div>
  );
};

export default App;
