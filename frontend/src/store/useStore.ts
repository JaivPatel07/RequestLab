import { create } from 'zustand';
import axios from 'axios';
import { Collection, Environment, HistoryItem, RequestTab, RequestItem, KeyValuePair } from '../types';
import { getVariableMap, resolveTemplate } from '../utils/variables';

interface RequestLabState {
  collections: Collection[];
  history: HistoryItem[];
  environments: Environment[];
  activeEnvironmentId: string | null;
  tabs: RequestTab[];
  activeTabId: string | null;
  settings: {
    theme: 'light' | 'dark' | 'system';
    fontSize: number;
    autoSave: boolean;
    wordWrap: boolean;
    timeout: number;
  };

  // Collections actions
  loadCollections: () => Promise<void>;
  addCollection: (name: string, parentId?: string | null) => Promise<Collection>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<Collection>;
  deleteCollection: (id: string) => Promise<void>;

  // Requests actions
  addRequest: (name: string, method: string, collectionId: string) => Promise<RequestItem>;
  updateRequest: (id: string, updates: Partial<RequestItem>) => Promise<RequestItem>;
  deleteRequest: (id: string) => Promise<void>;
  duplicateRequest: (id: string) => Promise<void>;
  reorderRequests: (orders: { id: string; order: number; collectionId?: string }[]) => Promise<void>;

  // Environments actions
  loadEnvironments: () => Promise<void>;
  addEnvironment: (name: string, isGlobal?: boolean, variables?: KeyValuePair[]) => Promise<Environment>;
  updateEnvironment: (id: string, updates: Partial<Environment>) => Promise<Environment>;
  deleteEnvironment: (id: string) => Promise<void>;
  setActiveEnvironmentId: (id: string | null) => void;

  // History actions
  loadHistory: () => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;

  // Tabs actions
  addTab: (customTab?: Partial<RequestTab>) => void;
  closeTab: (id: string) => void;
  setActiveTabId: (id: string | null) => void;
  updateTab: (id: string, updates: Partial<RequestTab>) => void;
  updateActiveTab: (updates: Partial<RequestTab>) => void;

  // Settings actions
  updateSettings: (updates: Partial<RequestLabState['settings']>) => void;

  // Request Trigger
  sendRequest: (tabId: string) => Promise<void>;
}

const DEFAULT_TAB = (id: string): RequestTab => ({
  id,
  name: 'New Request',
  method: 'GET',
  url: '',
  headers: [{ key: '', value: '', enabled: true }],
  params: [{ key: '', value: '', enabled: true }],
  authType: 'none',
  authConfig: {},
  bodyType: 'none',
  bodyContent: '',
  cookies: [{ key: '', value: '', enabled: true }],
  settings: { timeout: 30000 },
  loading: false,
  response: null,
  isDirty: false
});

export const useStore = create<RequestLabState>((set, get) => {
  // Read initial theme and settings from localStorage
  const savedSettings = localStorage.getItem('requestlab-settings');
  const initialSettings = savedSettings ? JSON.parse(savedSettings) : {
    theme: 'dark',
    fontSize: 14,
    autoSave: true,
    wordWrap: true,
    timeout: 30000
  };

  return {
    collections: [],
    history: [],
    environments: [],
    activeEnvironmentId: null,
    tabs: [],
    activeTabId: null,
    settings: initialSettings,

    // Collections
    loadCollections: async () => {
      try {
        const response = await axios.get('/api/collections');
        set({ collections: response.data });
      } catch (error) {
        console.error('Failed to load collections', error);
      }
    },
    addCollection: async (name, parentId = null) => {
      const response = await axios.post('/api/collections', { name, parentId });
      await get().loadCollections();
      return response.data;
    },
    updateCollection: async (id, updates) => {
      const response = await axios.patch(`/api/collections/${id}`, updates);
      await get().loadCollections();
      return response.data;
    },
    deleteCollection: async (id) => {
      await axios.delete(`/api/collections/${id}`);
      // Close tabs related to deleted requests in collection
      const state = get();
      await state.loadCollections();
      const updatedCollections = get().collections;
      const allRequestIds = new Set<string>();
      const collectIds = (cols: Collection[]) => {
        for (const c of cols) {
          c.requests.forEach(r => allRequestIds.add(r.id));
        }
      };
      collectIds(updatedCollections);

      const activeTabs = state.tabs.filter(t => !t.requestId || allRequestIds.has(t.requestId));
      let nextActiveId = state.activeTabId;
      if (nextActiveId && !activeTabs.find(t => t.id === nextActiveId)) {
        nextActiveId = activeTabs.length > 0 ? activeTabs[0].id : null;
      }
      set({ tabs: activeTabs, activeTabId: nextActiveId });
    },

    // Requests
    addRequest: async (name, method, collectionId) => {
      const response = await axios.post('/api/collections/requests', {
        name,
        method,
        collectionId,
        headers: JSON.stringify([{ key: '', value: '', enabled: true }]),
        params: JSON.stringify([{ key: '', value: '', enabled: true }]),
        authType: 'none',
        authConfig: '{}',
        bodyType: 'none',
        bodyContent: '',
        cookies: JSON.stringify([{ key: '', value: '', enabled: true }]),
        settings: JSON.stringify({ timeout: get().settings.timeout })
      });
      await get().loadCollections();
      return response.data;
    },
    updateRequest: async (id, updates) => {
      const response = await axios.patch(`/api/collections/requests/${id}`, updates);
      await get().loadCollections();

      // If there is an active tab open for this request, keep it in sync
      const state = get();
      const tabIndex = state.tabs.findIndex(t => t.requestId === id);
      if (tabIndex !== -1) {
        const tab = state.tabs[tabIndex];
        const updatedTab: RequestTab = {
          ...tab,
          name: updates.name ?? tab.name,
          method: updates.method ?? tab.method,
          url: updates.url ?? tab.url,
          headers: updates.headers ? JSON.parse(updates.headers) : tab.headers,
          params: updates.params ? JSON.parse(updates.params) : tab.params,
          authType: (updates.authType as any) ?? tab.authType,
          authConfig: updates.authConfig ? JSON.parse(updates.authConfig) : tab.authConfig,
          bodyType: (updates.bodyType as any) ?? tab.bodyType,
          bodyContent: updates.bodyContent ?? tab.bodyContent,
          cookies: updates.cookies ? JSON.parse(updates.cookies) : tab.cookies,
          settings: updates.settings ? JSON.parse(updates.settings) : tab.settings,
          isDirty: false
        };
        const newTabs = [...state.tabs];
        newTabs[tabIndex] = updatedTab;
        set({ tabs: newTabs });
      }

      return response.data;
    },
    deleteRequest: async (id) => {
      await axios.delete(`/api/collections/requests/${id}`);
      await get().loadCollections();
      // Close matching tab
      get().closeTab(`req-${id}`);
    },
    duplicateRequest: async (id) => {
      await axios.post(`/api/collections/requests/${id}/duplicate`);
      await get().loadCollections();
    },
    reorderRequests: async (orders) => {
      await axios.patch('/api/collections/requests/reorder/batch', { orders });
      await get().loadCollections();
    },

    // Environments
    loadEnvironments: async () => {
      try {
        const response = await axios.get('/api/environments');
        const envs: Environment[] = response.data;
        // Make sure there is always a global environment
        const globalEnv = envs.find(e => e.isGlobal);
        if (!globalEnv) {
          const newGlobal = await axios.post('/api/environments', {
            name: 'Globals',
            isGlobal: true,
            variables: JSON.stringify([{ key: '', value: '', enabled: true }])
          });
          envs.push(newGlobal.data);
        }
        set({ environments: envs });
      } catch (error) {
        console.error('Failed to load environments', error);
      }
    },
    addEnvironment: async (name, isGlobal = false, variables = [{ key: '', value: '', enabled: true }]) => {
      const response = await axios.post('/api/environments', {
        name,
        isGlobal,
        variables: JSON.stringify(variables)
      });
      await get().loadEnvironments();
      return response.data;
    },
    updateEnvironment: async (id, updates) => {
      if (updates.variables && typeof updates.variables !== 'string') {
        updates.variables = JSON.stringify(updates.variables);
      }
      const response = await axios.patch(`/api/environments/${id}`, updates);
      await get().loadEnvironments();
      return response.data;
    },
    deleteEnvironment: async (id) => {
      await axios.delete(`/api/environments/${id}`);
      const state = get();
      await state.loadEnvironments();
      if (state.activeEnvironmentId === id) {
        set({ activeEnvironmentId: null });
      }
    },
    setActiveEnvironmentId: (id) => {
      set({ activeEnvironmentId: id });
    },

    // History
    loadHistory: async () => {
      try {
        const response = await axios.get('/api/history');
        set({ history: response.data });
      } catch (error) {
        console.error('Failed to load history', error);
      }
    },
    deleteHistoryItem: async (id) => {
      await axios.delete(`/api/history/${id}`);
      await get().loadHistory();
    },
    clearHistory: async () => {
      await axios.delete('/api/history');
      set({ history: [] });
    },

    // Tabs
    addTab: (customTab) => {
      const state = get();
      const tabId = customTab?.id || `tab-${Date.now()}`;

      // Check if tab is already open (e.g. for existing request items)
      if (customTab?.requestId) {
        const existingTab = state.tabs.find(t => t.requestId === customTab.requestId);
        if (existingTab) {
          set({ activeTabId: existingTab.id });
          return;
        }
      }

      const newTab: RequestTab = {
        ...DEFAULT_TAB(tabId),
        ...customTab
      };

      set({
        tabs: [...state.tabs, newTab],
        activeTabId: tabId
      });
    },
    closeTab: (id) => {
      const state = get();
      const filtered = state.tabs.filter(t => t.id !== id && t.requestId !== id && `req-${t.requestId}` !== id);

      let nextActiveId = state.activeTabId;
      if (nextActiveId === id || `req-${nextActiveId}` === id) {
        nextActiveId = filtered.length > 0 ? filtered[filtered.length - 1].id : null;
      }

      set({
        tabs: filtered,
        activeTabId: nextActiveId
      });
    },
    setActiveTabId: (id) => {
      set({ activeTabId: id });
    },
    updateTab: (id, updates) => {
      const state = get();
      const tabIndex = state.tabs.findIndex(t => t.id === id);
      if (tabIndex === -1) return;

      const newTabs = [...state.tabs];
      newTabs[tabIndex] = {
        ...newTabs[tabIndex],
        ...updates,
        isDirty: true
      };

      set({ tabs: newTabs });

      // Autosave if linked to a saved RequestItem
      const tab = newTabs[tabIndex];
      if (state.settings.autoSave && tab.requestId) {
        get().updateRequest(tab.requestId, {
          name: tab.name,
          method: tab.method,
          url: tab.url,
          headers: JSON.stringify(tab.headers),
          params: JSON.stringify(tab.params),
          authType: tab.authType,
          authConfig: JSON.stringify(tab.authConfig),
          bodyType: tab.bodyType,
          bodyContent: tab.bodyContent,
          cookies: JSON.stringify(tab.cookies),
          settings: JSON.stringify(tab.settings)
        });
      }
    },
    updateActiveTab: (updates) => {
      const activeId = get().activeTabId;
      if (activeId) get().updateTab(activeId, updates);
    },

    // Settings
    updateSettings: (updates) => {
      const updated = { ...get().settings, ...updates };
      set({ settings: updated });
      localStorage.setItem('requestlab-settings', JSON.stringify(updated));

      // Theme toggle effect
      const root = window.document.documentElement;
      if (updated.theme === 'dark') {
        root.classList.add('dark');
      } else if (updated.theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System preference
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    },

    // Trigger Request
    sendRequest: async (tabId) => {
      const state = get();
      const tabIndex = state.tabs.findIndex(t => t.id === tabId);
      if (tabIndex === -1) return;

      const tab = state.tabs[tabIndex];

      // Set Loading
      const tabsCopy = [...state.tabs];
      tabsCopy[tabIndex] = { ...tab, loading: true, response: null };
      set({ tabs: tabsCopy });

      // Environment variables resolution
      const activeEnv = state.environments.find(e => e.id === state.activeEnvironmentId) || null;
      const globalEnv = state.environments.find(e => e.isGlobal) || null;
      const varMap = getVariableMap(activeEnv, globalEnv);

      const resolvedUrl = resolveTemplate(tab.url, varMap);

      const resolveKeyValuePairs = (list: KeyValuePair[]): KeyValuePair[] => {
        return list.map(item => ({
          ...item,
          key: resolveTemplate(item.key, varMap),
          value: resolveTemplate(item.value, varMap)
        }));
      };

      const resolvedHeaders = resolveKeyValuePairs(tab.headers);
      const resolvedParams = resolveKeyValuePairs(tab.params);
      const resolvedCookies = resolveKeyValuePairs(tab.cookies);

      let resolvedBodyContent = tab.bodyContent;
      if (tab.bodyType === 'json' || tab.bodyType === 'text' || tab.bodyType === 'xml') {
        resolvedBodyContent = resolveTemplate(tab.bodyContent, varMap);
      } else if (tab.bodyType === 'urlencoded' || tab.bodyType === 'formdata') {
        try {
          const parsed = JSON.parse(tab.bodyContent);
          if (Array.isArray(parsed)) {
            const resolvedPairs = resolveKeyValuePairs(parsed);
            resolvedBodyContent = JSON.stringify(resolvedPairs);
          }
        } catch (e) {}
      }

      const resolvedAuthConfig = { ...tab.authConfig };
      if (resolvedAuthConfig.token) resolvedAuthConfig.token = resolveTemplate(resolvedAuthConfig.token, varMap);
      if (resolvedAuthConfig.username) resolvedAuthConfig.username = resolveTemplate(resolvedAuthConfig.username, varMap);
      if (resolvedAuthConfig.password) resolvedAuthConfig.password = resolveTemplate(resolvedAuthConfig.password, varMap);
      if (resolvedAuthConfig.key) resolvedAuthConfig.key = resolveTemplate(resolvedAuthConfig.key, varMap);
      if (resolvedAuthConfig.value) resolvedAuthConfig.value = resolveTemplate(resolvedAuthConfig.value, varMap);

      try {
        const resObj = await axios.post('/api/proxy/send', {
          method: tab.method,
          url: resolvedUrl,
          headers: resolvedHeaders,
          params: resolvedParams,
          authType: tab.authType,
          authConfig: JSON.stringify(resolvedAuthConfig),
          bodyType: tab.bodyType,
          bodyContent: resolvedBodyContent,
          cookies: resolvedCookies,
          settings: JSON.stringify({ ...tab.settings, timeout: state.settings.timeout })
        });

        // Refresh History
        await get().loadHistory();

        // Update Tab Response
        const freshTabs = [...get().tabs];
        const freshTabIndex = freshTabs.findIndex(t => t.id === tabId);
        if (freshTabIndex !== -1) {
          freshTabs[freshTabIndex] = {
            ...freshTabs[freshTabIndex],
            loading: false,
            response: resObj.data
          };
          set({ tabs: freshTabs });
        }
      } catch (error: any) {
        console.error('Request execution failed', error);
        const freshTabs = [...get().tabs];
        const freshTabIndex = freshTabs.findIndex(t => t.id === tabId);
        if (freshTabIndex !== -1) {
          freshTabs[freshTabIndex] = {
            ...freshTabs[freshTabIndex],
            loading: false,
            response: {
              status: 0,
              statusText: 'ERR_FAILED',
              headers: {},
              cookies: [],
              duration: 0,
              size: 0,
              body: error.message || 'Could not connect to proxy server.',
              isError: true
            }
          };
          set({ tabs: freshTabs });
        }
      }
    }
  };
});
