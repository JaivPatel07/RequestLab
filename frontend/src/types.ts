export interface KeyValuePair {
  key: string;
  value: string;
  enabled: boolean;
}

export interface Collection {
  id: string;
  name: string;
  parentId: string | null;
  isFavorite: boolean;
  requests: RequestItem[];
  // For client-side tree construction
  subFolders?: Collection[];
}

export interface RequestItem {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: string;
  params: string;
  authType: string;
  authConfig: string;
  bodyType: string;
  bodyContent: string;
  cookies: string;
  preRequestScript?: string;
  testScript?: string;
  settings: string;
  collectionId: string;
  order: number;
}

export interface RequestTab {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  authType: 'none' | 'bearer' | 'basic' | 'apikey';
  authConfig: any;
  bodyType: 'none' | 'json' | 'formdata' | 'urlencoded' | 'text' | 'xml';
  bodyContent: string;
  cookies: KeyValuePair[];
  preRequestScript?: string;
  testScript?: string;
  settings: {
    timeout?: number;
  };
  loading: boolean;
  response: any;
  isDirty: boolean;
  requestId?: string;
  collectionId?: string;
}

export interface HistoryItem extends Omit<RequestItem, 'collectionId' | 'order' | 'authConfig'> {
  createdAt: string;
  status: number;
  statusText: string;
  duration: number;
  responseSize: number;
  responseBody: string;
  responseHeaders: string;
  cookies: string;
  isFavorite?: boolean;
}

export interface Environment {
  id: string;
  name: string;
  isGlobal: boolean;
  variables: string | KeyValuePair[];
}