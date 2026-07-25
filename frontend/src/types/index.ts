export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

export interface AuthConfig {
  token?: string;
  username?: string;
  password?: string;
  key?: string;
  value?: string;
  addTo?: 'headers' | 'params';
}

export interface RequestSettings {
  timeout?: number;
}

export interface RequestItem {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: string; // JSON serialized string of KeyValuePair[]
  params: string;  // JSON serialized string of KeyValuePair[]
  authType: string;
  authConfig: string; // JSON serialized string of AuthConfig
  bodyType: string;
  bodyContent: string | null;
  cookies: string | null; // JSON serialized string of KeyValuePair[]
  testScript: string | null;
  preRequestScript: string | null;
  settings: string | null; // JSON serialized string of RequestSettings
  collectionId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  isFavorite: boolean;
  parentId: string | null;
  requests: RequestItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Environment {
  id: string;
  name: string;
  isGlobal: boolean;
  variables: string; // JSON serialized string of KeyValuePair[]
  createdAt: string;
  updatedAt: string;
}

export interface HistoryItem {
  id: string;
  method: string;
  url: string;
  status: number;
  statusText: string;
  duration: number;
  responseSize: number;
  responseBody?: string | null;
  responseHeaders?: string | null;
  cookies?: string | null;
  createdAt: string;
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  cookies: string[];
  duration: number;
  size: number;
  body: any;
  isError?: boolean;
}

export interface RequestTab {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  authType: 'none' | 'bearer' | 'basic' | 'apikey';
  authConfig: AuthConfig;
  bodyType: 'none' | 'json' | 'formdata' | 'urlencoded' | 'text' | 'xml';
  bodyContent: string;
  cookies: KeyValuePair[];
  testScript: string;
  preRequestScript: string;
  settings: RequestSettings;
  isDirty?: boolean;
  response?: ResponseData | null;
  loading?: boolean;
  requestId?: string; // Links to saved RequestItem.id
  collectionId?: string;
}
