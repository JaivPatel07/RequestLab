import { KeyValuePair, Environment } from '../types';

export const getVariableMap = (
  activeEnv: Environment | null,
  globalEnv: Environment | null
): Record<string, string> => {
  const map: Record<string, string> = {};

  // Load global variables first
  if (globalEnv) {
    try {
      const vars: KeyValuePair[] = typeof globalEnv.variables === 'string' 
        ? JSON.parse(globalEnv.variables) 
        : globalEnv.variables;
      for (const v of vars) {
        if (v.enabled && v.key) {
          map[v.key] = v.value || '';
        }
      }
    } catch (e) {}
  }

  // Active environment overrides global variables
  if (activeEnv) {
    try {
      const vars: KeyValuePair[] = typeof activeEnv.variables === 'string' 
        ? JSON.parse(activeEnv.variables) 
        : activeEnv.variables;
      for (const v of vars) {
        if (v.enabled && v.key) {
          map[v.key] = v.value || '';
        }
      }
    } catch (e) {}
  }

  return map;
};

export const resolveTemplate = (text: string, varMap: Record<string, string>): string => {
  if (!text) return '';
  return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    return trimmedKey in varMap ? varMap[trimmedKey] : match;
  });
};
