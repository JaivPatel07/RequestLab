import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Plus,
  Folder,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit,
  Star,
  Settings,
  FolderPlus,
  Search,
  Sliders,
  Sparkles,
  Copy,
  BookOpen
} from 'lucide-react';
import { Collection } from '../types';

interface SidebarProps {
  onOpenSettings: () => void;
  onOpenEnvironments: () => void;
  onOpenDocs: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings, onOpenEnvironments, onOpenDocs }) => {
  const {
    collections,
    addCollection,
    updateCollection,
    deleteCollection,
    addRequest,
    deleteRequest,
    duplicateRequest,
    reorderRequests,
    environments,
    activeEnvironmentId,
    setActiveEnvironmentId,
    history,
    deleteHistoryItem,
    clearHistory,
    addTab
  } = useStore();

  const [activeTab, setActiveTab] = useState<'collections' | 'history'>('collections');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  // Inline renaming state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState('');

  const toggleFolder = (id: string) => {
    setOpenFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateCollection = async () => {
    const name = prompt('Enter collection name:');
    if (name) await addCollection(name);
  };

  const handleCreateFolder = async (parentId: string) => {
    const name = prompt('Enter folder name:');
    if (name) await addCollection(name, parentId);
  };

  const handleCreateRequest = async (collectionId: string) => {
    const name = prompt('Enter request name:');
    if (name) {
      const method = 'GET';
      const req = await addRequest(name, method, collectionId);
      // Open in tab
      addTab({
        id: `req-${req.id}`,
        name: req.name,
        method: req.method,
        url: req.url,
        headers: JSON.parse(req.headers),
        params: JSON.parse(req.params),
        authType: req.authType as any,
        authConfig: JSON.parse(req.authConfig),
        bodyType: req.bodyType as any,
        bodyContent: req.bodyContent || '',
        cookies: req.cookies ? JSON.parse(req.cookies) : [],
        settings: req.settings ? JSON.parse(req.settings) : {},
        requestId: req.id,
        collectionId: req.collectionId
      });
    }
  };

  const startRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenamingName(currentName);
  };

  const finishRename = async (id: string, type: 'collection' | 'request') => {
    if (!renamingName.trim()) return;
    if (type === 'collection') {
      await updateCollection(id, { name: renamingName });
    } else {
      const item = collections.flatMap(c => c.requests).find(r => r.id === id);
      if (item) {
        await useStore.getState().updateRequest(id, { name: renamingName });
      }
    }
    setRenamingId(null);
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, requestId: string) => {
    e.dataTransfer.setData('text/plain', requestId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetCollectionId: string) => {
    e.preventDefault();
    const requestId = e.dataTransfer.getData('text/plain');
    if (!requestId) return;

    // Get current requests of target collection to append at the end
    const targetColl = collections.find(c => c.id === targetCollectionId);
    if (!targetColl) return;

    const maxOrder = targetColl.requests.reduce((max, r) => Math.max(max, r.order), 0);

    // Call reorder with updated parent and order
    await reorderRequests([
      { id: requestId, order: maxOrder + 1, collectionId: targetCollectionId }
    ]);
  };

  const handleExportCollection = (c: Collection) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(c, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${c.name}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportCollection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = async (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (!imported.name) {
            alert("Invalid collection format. Must contain a 'name'.");
            return;
          }
          
          // 1. Create collection
          const newCol = await addCollection(imported.name);
          
          // 2. Import requests if present
          if (Array.isArray(imported.requests)) {
            for (const req of imported.requests) {
              const created = await addRequest(req.name || 'Imported Request', req.method || 'GET', newCol.id);
              
              // Apply config
              await useStore.getState().updateRequest(created.id, {
                url: req.url || '',
                headers: typeof req.headers === 'object' ? JSON.stringify(req.headers) : req.headers,
                params: typeof req.params === 'object' ? JSON.stringify(req.params) : req.params,
                authType: req.authType || 'none',
                authConfig: typeof req.authConfig === 'object' ? JSON.stringify(req.authConfig) : req.authConfig,
                bodyType: req.bodyType || 'none',
                bodyContent: req.bodyContent || '',
                cookies: typeof req.cookies === 'object' ? JSON.stringify(req.cookies) : req.cookies,
                settings: typeof req.settings === 'object' ? JSON.stringify(req.settings) : req.settings
              });
            }
          }
          alert("Collection imported successfully!");
        } catch (err) {
          alert("Failed to parse JSON file.");
        }
      };
    }
  };

  // Filter lists
  const otherEnvs = environments.filter(e => !e.isGlobal);

  const filteredCollections = collections
    .filter(c => !c.parentId) // Only root level collections
    .map(c => {
      const folderRequests = c.requests.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.url.toLowerCase().includes(searchQuery.toLowerCase())
      );
      // Recursively include child folders
      const subFolders = collections.filter(sub => sub.parentId === c.id);

      return { ...c, requests: folderRequests, subFolders };
    })
    .filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.requests.length > 0 ||
      c.subFolders.length > 0
    );

  const filteredHistory = history.filter(h =>
    h.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#0d0d11]/95 border-r border-slate-900 overflow-hidden shrink-0 select-none">
      
      {/* Top Brand Bar */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-900 bg-slate-950/20 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-400 animate-pulse" />
          <span className="font-heading font-bold text-sm tracking-wide text-slate-200">RequestLab</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenDocs}
            title="Documentation"
            className="p-1.5 rounded-md hover:bg-slate-800/60 text-slate-400 hover:text-indigo-400 transition-colors"
          >
            <BookOpen size={15} />
          </button>
          <button
            onClick={onOpenSettings}
            title="Settings"
            className="p-1.5 rounded-md hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* Environments Picker */}
      <div className="px-4 py-2 border-b border-slate-900 bg-slate-950/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <Sliders size={13} className="text-slate-500 shrink-0" />
          <select
            value={activeEnvironmentId || ''}
            onChange={(e) => setActiveEnvironmentId(e.target.value || null)}
            className="bg-transparent text-xs text-slate-300 font-semibold focus:outline-none cursor-pointer truncate max-w-full"
          >
            <option value="" className="bg-[#0f0f13] text-slate-400">No Environment</option>
            {otherEnvs.map(e => (
              <option key={e.id} value={e.id} className="bg-[#0f0f13] text-slate-200">
                {e.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={onOpenEnvironments}
          title="Manage Environments"
          className="p-1 rounded hover:bg-slate-800/80 text-slate-400 hover:text-indigo-400 transition-colors shrink-0"
        >
          <Sliders size={13} />
        </button>
      </div>

      {/* Navigation tabs (Collections vs History) */}
      <div className="flex border-b border-slate-900 shrink-0 text-xs">
        <button
          onClick={() => setActiveTab('collections')}
          className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
            activeTab === 'collections'
              ? 'border-indigo-500 text-indigo-400 font-semibold bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          Collections
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-center font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-indigo-500 text-indigo-400 font-semibold bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
          }`}
        >
          History
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-2 border-b border-slate-900/70 bg-slate-950/10 shrink-0">
        <div className="relative flex items-center">
          <Search size={12} className="absolute left-2.5 text-slate-500" />
          <input
            type="text"
            placeholder={activeTab === 'collections' ? 'Filter collections...' : 'Search history...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-900 rounded px-2.5 py-1 pl-7 text-[11px] text-slate-200 placeholder-slate-550 focus:outline-none focus:border-indigo-550"
          />
        </div>
      </div>

      {/* Content Scroller */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {activeTab === 'collections' ? (
          <div>
            {/* Create Collection Button */}
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Collections</span>
              <div className="flex items-center gap-2">
                <label className="px-1.5 py-0.5 rounded hover:bg-slate-800 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer" title="Import JSON Collection">
                  Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportCollection}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleCreateCollection}
                  className="p-0.5 rounded hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 transition-colors"
                  title="Create New Collection"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* List */}
            {filteredCollections.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-550">
                No collections found.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredCollections.map(c => {
                  const isOpen = openFolders[c.id];
                  return (
                    <div
                      key={c.id}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, c.id)}
                      className="border border-slate-900/40 rounded-lg p-1 bg-slate-900/10 hover:border-slate-800/40 transition-colors"
                    >
                      {/* Collection Header */}
                      <div className="flex items-center justify-between p-1.5 rounded hover:bg-slate-900/50 group text-xs text-slate-350">
                        <div className="flex items-center gap-1.5 min-w-0 cursor-pointer" onClick={() => toggleFolder(c.id)}>
                          <span className="text-slate-500">
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </span>
                          <Folder size={14} className="text-indigo-400 shrink-0" />
                          {renamingId === c.id ? (
                            <input
                              type="text"
                              value={renamingName}
                              onChange={(e) => setRenamingName(e.target.value)}
                              onBlur={() => finishRename(c.id, 'collection')}
                              onKeyDown={(e) => e.key === 'Enter' && finishRename(c.id, 'collection')}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                              className="bg-slate-800 border border-indigo-500 rounded px-1 text-[11px] text-slate-100 max-w-[120px]"
                            />
                          ) : (
                            <span className="truncate font-medium text-slate-200">{c.name}</span>
                          )}
                          {c.isFavorite && <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />}
                        </div>

                        {/* Options */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateRequest(c.id);
                            }}
                            title="Add Request"
                            className="p-0.5 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-800"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateFolder(c.id);
                            }}
                            title="Add Folder"
                            className="p-0.5 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-800"
                          >
                            <FolderPlus size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCollection(c.id, { isFavorite: !c.isFavorite });
                            }}
                            title="Favorite"
                            className="p-0.5 text-slate-400 hover:text-amber-400 rounded hover:bg-slate-800"
                          >
                            <Star size={12} className={c.isFavorite ? 'fill-amber-400 text-amber-400' : ''} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startRename(c.id, c.name);
                            }}
                            title="Rename"
                            className="p-0.5 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-800"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportCollection(c);
                            }}
                            title="Export Collection"
                            className="p-0.5 text-slate-400 hover:text-indigo-400 rounded hover:bg-slate-800"
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete collection "${c.name}"?`)) {
                                deleteCollection(c.id);
                              }
                            }}
                            title="Delete"
                            className="p-0.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Collection Requests & Folders */}
                      {isOpen && (
                        <div className="pl-4 mt-1 space-y-0.5 border-l border-slate-900 ml-2.5">
                          {/* Render Subfolders */}
                          {c.subFolders.map(sub => {
                            const subOpen = openFolders[sub.id];
                            return (
                              <div key={sub.id} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, sub.id)}>
                                <div className="flex items-center justify-between p-1 rounded hover:bg-slate-900/50 group text-xs text-slate-400">
                                  <div className="flex items-center gap-1 min-w-0 cursor-pointer" onClick={() => toggleFolder(sub.id)}>
                                    <span className="text-slate-600">
                                      {subOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                    </span>
                                    <Folder size={13} className="text-indigo-400/80 shrink-0" />
                                    {renamingId === sub.id ? (
                                      <input
                                        type="text"
                                        value={renamingName}
                                        onChange={(e) => setRenamingName(e.target.value)}
                                        onBlur={() => finishRename(sub.id, 'collection')}
                                        onKeyDown={(e) => e.key === 'Enter' && finishRename(sub.id, 'collection')}
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                        className="bg-slate-800 border border-indigo-500 rounded px-1 text-[11px] text-slate-100 max-w-[120px]"
                                      />
                                    ) : (
                                      <span className="truncate font-medium text-slate-350">{sub.name}</span>
                                    )}
                                  </div>
                                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
                                    <button
                                      onClick={() => handleCreateRequest(sub.id)}
                                      className="p-0.5 hover:text-indigo-400"
                                      title="Add Request"
                                    >
                                      <Plus size={11} />
                                    </button>
                                    <button
                                      onClick={() => startRename(sub.id, sub.name)}
                                      className="p-0.5 hover:text-indigo-400"
                                      title="Rename"
                                    >
                                      <Edit size={11} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Delete folder "${sub.name}"?`)) {
                                          deleteCollection(sub.id);
                                        }
                                      }}
                                      className="p-0.5 hover:text-rose-450"
                                      title="Delete"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>

                                {/* Requests in folder */}
                                {subOpen && (
                                  <div className="pl-3 space-y-0.5 border-l border-slate-900 ml-1.5">
                                    {collections.find(x => x.id === sub.id)?.requests.map(r => (
                                      <div
                                        key={r.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, r.id)}
                                        onClick={() => addTab({
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
                                        })}
                                        className="flex items-center justify-between p-1 rounded hover:bg-slate-900/60 cursor-pointer group text-[11px]"
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className={`font-extrabold uppercase text-[9px] w-8 text-center shrink-0 ${
                                            r.method === 'GET' ? 'text-emerald-450' : r.method === 'POST' ? 'text-indigo-400' : 'text-amber-450'
                                          }`}>
                                            {r.method}
                                          </span>
                                          <span className="truncate text-slate-300">{r.name}</span>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              duplicateRequest(r.id);
                                            }}
                                            title="Duplicate"
                                            className="p-0.5 text-slate-500 hover:text-indigo-400"
                                          >
                                            <Copy size={10} />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (confirm(`Delete request "${r.name}"?`)) {
                                                deleteRequest(r.id);
                                              }
                                            }}
                                            title="Delete"
                                            className="p-0.5 text-slate-500 hover:text-rose-450"
                                          >
                                            <Trash2 size={10} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Render Requests in main Collection */}
                          {c.requests.map(r => (
                            <div
                              key={r.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, r.id)}
                              onClick={() => addTab({
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
                              })}
                              className="flex items-center justify-between p-1 rounded hover:bg-slate-900/60 cursor-pointer group text-[11px]"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`font-extrabold uppercase text-[9px] w-8 text-center shrink-0 ${
                                  r.method === 'GET' ? 'text-emerald-400' : r.method === 'POST' ? 'text-indigo-400' : 'text-amber-400'
                                }`}>
                                  {r.method}
                                </span>
                                <span className="truncate text-slate-350">{r.name}</span>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    duplicateRequest(r.id);
                                  }}
                                  title="Duplicate"
                                  className="p-0.5 text-slate-500 hover:text-indigo-400"
                                >
                                  <Copy size={10} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Delete request "${r.name}"?`)) {
                                      deleteRequest(r.id);
                                    }
                                  }}
                                  title="Delete"
                                  className="p-0.5 text-slate-500 hover:text-rose-400"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* History Panel */}
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">History Log</span>
              <button
                onClick={clearHistory}
                className="text-[10px] text-rose-400 hover:text-rose-350 font-semibold"
              >
                Clear All
              </button>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-550">
                No request history.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredHistory.map(item => {
                  const isSuccess = item.status >= 200 && item.status < 300;
                  const isClientError = item.status >= 400 && item.status < 500;
                  const statusColor = isSuccess
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : isClientError
                    ? 'text-amber-400 bg-amber-500/10'
                    : 'text-rose-400 bg-rose-500/10';

                  return (
                    <div
                      key={item.id}
                      onClick={() => addTab({
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
                            try {
                              return JSON.parse(item.responseBody || '""');
                            } catch (e) {
                              return item.responseBody || '';
                            }
                          })()
                        }
                      })}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30 border border-slate-900/50 hover:bg-slate-800/30 cursor-pointer group text-[11px]"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`font-bold px-1 py-0.5 rounded text-[9px] uppercase w-10 text-center ${statusColor}`}>
                          {item.method}
                        </span>
                        <span className="truncate text-slate-300 font-mono text-[10px]">{item.url}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] shrink-0 text-slate-500">
                        <span className={item.status === 0 ? 'text-rose-450' : 'text-slate-450'}>
                          {item.status === 0 ? 'ERR' : item.status}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHistoryItem(item.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 transition-opacity"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
