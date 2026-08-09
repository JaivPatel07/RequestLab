import { create } from 'zustand';
import axios from 'axios';
import { Collection, Environment, HistoryItem, RequestTab, RequestItem, KeyValuePair } from '../types';
import { getVariableMap, resolveTemplate } from '../utils/variables';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface RequestLabState {
  collections: Collection[];
  history: HistoryItem[];
  environments: Environment[];
  activeEnvironmentId: string | null;
  tabs: RequestTab[];
  activeTabId: string | null;
  settings: {
    fontSize: number;
    autoSave: boolean;
    wordWrap: boolean;
    timeout: number;
  };
runnerState: {
    isOpen: boolean;
    isRunning: boolean;
    collectionId: string | null;
    results: any | null;
  };
  toasts: ToastMessage[];
  loadTestState: {
    isOpen: boolean;
    isRunning: boolean;
    results: any | null;
  };

  // Collections actions
  loadCollections: () => Promise<void>;
  addCollection: (name: string, parentId?: string | null) => Promise<Collection>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<Collection>;
  deleteCollection: (id: string) => Promise<void>;
  duplicateCollection: (id: string) => Promise<void>;

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
  updateHistoryItem: (id: string, updates: Partial<HistoryItem>) => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;

  // Tabs actions
  addTab: (customTab?: Partial<RequestTab>) => void;
  closeTab: (id: string) => void;
  setActiveTabId: (id: string | null) => void;
  updateTab: (id: string, updates: Partial<RequestTab>) => void;

  // Settings actions
  updateSettings: (updates: Partial<RequestLabState['settings']>) => void;

  // Request Trigger
  sendRequest: (tabId: string) => Promise<void>;

  // Collection Runner actions
  openRunner: (collectionId: string) => void;
  closeRunner: () => void;
  runCollection: (collectionId:string) => Promise<void>;

  // Toast actions
  showToast: (message: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;

  // Load Test actions
  openLoadTest: () => void;
  closeLoadTest: () => void;
  runLoadTest: (config: Partial<RequestTab> & { users: number; concurrency: number }) => Promise<void>;
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
  preRequestScript: '',
  testScript: '',
  settings: { timeout: 30000 },
  loading: false,
  response: null,
  isDirty: false
});

export const useStore = create<RequestLabState>((set, get) => {
  // Read initial theme and settings from localStorage
  const savedSettings = localStorage.getItem('requestlab-settings');
  const initialSettings = savedSettings ? JSON.parse(savedSettings) : {
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
runnerState: {
      isOpen: false,
      isRunning: false,
      collectionId: null,
      results: null,
    },
    toasts: [],
    loadTestState: {
      isOpen: false,
      isRunning: false,
      results: null,
    },

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
      await state.loadCollections(); // Refresh collections list

      // Find all collections/folders being deleted (the collection and its children)
      const deletedCollectionIds = new Set([id]);
      const findChildren = (parentId: string) => {
        get().collections.filter(c => c.parentId === parentId).forEach(c => {
          deletedCollectionIds.add(c.id);
          findChildren(c.id);
        });
      };
      findChildren(id);

      const activeTabs = state.tabs.filter(t => !t.collectionId || !deletedCollectionIds.has(t.collectionId));
      let nextActiveId = state.activeTabId;
      if (nextActiveId && !activeTabs.find(t => t.id === nextActiveId)) {
        nextActiveId = activeTabs.length > 0 ? activeTabs[0].id : null;
      }
      set({ tabs: activeTabs, activeTabId: nextActiveId });
    },
    duplicateCollection: async (id) => {
      await axios.post(`/api/collections/${id}/duplicate`);
      await get().loadCollections();
    },

    // Requests
    addRequest: async (name, method, collectionId) => {
      const response = await axios.post('/api/collections/requests', {
        name,
        method,
        collectionId,
        testScript: '',
        preRequestScript: '',
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
        const requestUpdates = updates as Partial<RequestItem>;
        const updatedTab = {
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
          testScript: requestUpdates.testScript ?? tab.testScript,
          preRequestScript: requestUpdates.preRequestScript ?? tab.preRequestScript,
          settings: updates.settings ? JSON.parse(updates.settings) : tab.settings,
          isDirty: false
        } as RequestTab;
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
    updateHistoryItem: async (id, updates) => {
      await axios.patch(`/api/history/${id}`, updates);
      await get().loadHistory();
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
      const tabIndex = state.tabs.findIndex(t => t.id === id);
      if (tabIndex === -1) return;

      const filtered = state.tabs.filter(t => t.id !== id);
      let nextActiveId = state.activeTabId;
      if (nextActiveId === id) {
        nextActiveId = filtered[tabIndex] ? filtered[tabIndex].id : filtered[tabIndex - 1] ? filtered[tabIndex - 1].id : null;
      }

      set({ tabs: filtered, activeTabId: nextActiveId });
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
          testScript: tab.testScript,
          preRequestScript: tab.preRequestScript,
          settings: JSON.stringify(tab.settings)
        });
      }
    },

    // Settings
    updateSettings: (updates) => {
      const updated = { ...get().settings, ...updates };
      set({ settings: updated });
      localStorage.setItem('requestlab-settings', JSON.stringify(updated));
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
          testScript: tab.testScript,
          preRequestScript: tab.preRequestScript,
          settings: JSON.stringify({ ...tab.settings, timeout: tab.settings?.timeout ?? state.settings.timeout })
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
    },

    // Collection Runner
    openRunner: (collectionId) => {
      set({ runnerState: { isOpen: true, isRunning: false, collectionId, results: null } });
    },
    closeRunner: () => {
      set({ runnerState: { isOpen: false, isRunning: false, collectionId: null, results: null } });
    },
    runCollection: async (collectionId) => {
      const state = get();
      set({ runnerState: { ...state.runnerState, isRunning: true, results: null } });

      try {
        const activeEnv = state.environments.find(e => e.id === state.activeEnvironmentId) || null;
        const globalEnv = state.environments.find(e => e.isGlobal) || null;
        
        const response = await axios.post(`/api/collections/${collectionId}/run`, {
          environment: {
            active: activeEnv,
            global: globalEnv,
          }
        });

set({ runnerState: { ...state.runnerState, isRunning: false, results: response.data } });
      } catch (error) {
        console.error('Collection run failed', error);
        set({ runnerState: { ...state.runnerState, isRunning: false } });
      }
    },

    // Toasts
    showToast: (message, type = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const toast: ToastMessage = { id, type, message };
      set({ toasts: [...get().toasts, toast] });
      // Auto-dismiss after 3.5 seconds
      setTimeout(() => {
        get().dismissToast(id);
      }, 3500);
    },
    dismissToast: (id) => {
      set({ toasts: get().toasts.filter(t => t.id !== id) });
    },

    // Load Test
    openLoadTest: () => {
      set({ loadTestState: { isOpen: true, isRunning: false, results: null } });
    },
    closeLoadTest: () => {
      set({ loadTestState: { isOpen: false, isRunning: false, results: null } });
    },
    runLoadTest: async (config) => {
      const state = get();
      set({ loadTestState: { ...state.loadTestState, isRunning: true, results: null } });

      // Resolve environment variables
      const activeEnv = state.environments.find(e => e.id === state.activeEnvironmentId) || null;
      const globalEnv = state.environments.find(e => e.isGlobal) || null;
      const varMap = getVariableMap(activeEnv, globalEnv);

      const resolvePairs = (list: KeyValuePair[]): KeyValuePair[] =>
        list.map(it => ({ ...it, key: resolveTemplate(it.key, varMap), value: resolveTemplate(it.value, varMap) }));

      const resolvedAuthConfig = { ...config.authConfig };
      if (resolvedAuthConfig.token) resolvedAuthConfig.token = resolveTemplate(resolvedAuthConfig.token, varMap);

      try {
        const response = await axios.post('/api/proxy/load-test', {
          method: config.method,
          url: resolveTemplate(config.url || '', varMap),
          headers: resolvePairs(config.headers || []),
          params: resolvePairs(config.params || []),
          authType: config.authType || 'none',
          authConfig: JSON.stringify(resolvedAuthConfig),
          bodyType: config.bodyType || 'none',
          bodyContent: config.bodyContent || '',
          cookies: resolvePairs(config.cookies || []),
          users: config.users,
          concurrency: config.concurrency,
        });

        set({ loadTestState: { ...get().loadTestState, isRunning: false, results: response.data } });
        get().showToast(`Load test complete: ${response.data.summary.totalRequests} requests in ${response.data.summary.totalTimeMs}ms`, 'success');
      } catch (error: any) {
        console.error('Load test failed', error);
        set({ loadTestState: { ...get().loadTestState, isRunning: false } });
        get().showToast(error.message || 'Load test failed', 'error');
      }
    },

  };
});
