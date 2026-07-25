import axios, { AxiosRequestConfig, Method } from 'axios';
import vm from 'vm';
import { prisma } from '../database/db';

type EnvironmentLike = {
  active?: { variables?: string | Array<{ key: string; value: string; enabled: boolean }> } | null;
  global?: { variables?: string | Array<{ key: string; value: string; enabled: boolean }> } | null;
} | null;

type RequestLike = {
  method: string;
  url: string;
  headers: string;
  params: string;
  authType: string;
  authConfig: string;
  bodyType: string;
  bodyContent: string | null;
  cookies: string | null;
  settings: string | null;
  testScript?: string | null;
  preRequestScript?: string | null;
};

class VM {
  private context: vm.Context;
  private timeout?: number;

  constructor(options: { timeout?: number; sandbox?: Record<string, unknown> }) {
    this.context = vm.createContext(options.sandbox || {});
    this.timeout = options.timeout;
  }

  run(script: string) {
    const scriptInstance = new vm.Script(script);
    return scriptInstance.runInContext(this.context, { timeout: this.timeout });
  }
}

const arrayToRecord = (value: any): Record<string, string> => {
  const record: Record<string, string> = {};
  if (!Array.isArray(value)) return record;

  for (const item of value) {
    if (item && item.enabled !== false && item.key) {
      record[item.key] = item.value || '';
    }
  }

  return record;
};

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (typeof value !== 'string') {
    return value as T;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const buildVariableMap = (environment: EnvironmentLike): Record<string, string> => {
  const map: Record<string, string> = {};
  const sources = [environment?.global, environment?.active];

  for (const source of sources) {
    if (!source?.variables) continue;

    const variables = parseJson<Array<{ key: string; value: string; enabled: boolean }>>(source.variables, []);
    for (const variable of variables) {
      if (variable?.enabled !== false && variable?.key) {
        map[variable.key] = variable.value || '';
      }
    }
  }

  return map;
};

const resolveTemplate = (text: string, varMap: Record<string, string>): string => {
  if (!text) return '';
  return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    return trimmedKey in varMap ? varMap[trimmedKey] : match;
  });
};

export const runRequest = async (request: RequestLike, environment: EnvironmentLike, collectionVariables: Record<string, any>) => {
  const parsedAuthConfig = parseJson<Record<string, any>>(request.authConfig, {});
  const parsedSettings = parseJson<Record<string, any>>(request.settings, {});
  const varMap = { ...buildVariableMap(environment), ...collectionVariables };

  const requestData = {
    headers: arrayToRecord(parseJson<any[]>(request.headers, [])),
    params: arrayToRecord(parseJson<any[]>(request.params, [])),
    body: request.bodyContent ?? '',
    auth: parsedAuthConfig,
  };

  if (request.preRequestScript) {
    const scriptVm = new VM({
      timeout: 1000,
      sandbox: {
        pm: {
          setHeader: (key: string, value: string) => {
            if (typeof key === 'string') requestData.headers[key] = value;
          },
          setQueryParam: (key: string, value: string) => {
            if (typeof key === 'string') requestData.params[key] = value;
          },
          setBody: (body: any) => {
            requestData.body = body;
          },
          variables: collectionVariables,
        },
      },
    });

    try {
      scriptVm.run(request.preRequestScript);
    } catch (error: any) {
      console.error('Pre-request script failed:', error.message);
    }
  }

  const requestHeaders = requestData.headers;

  if (request.authType === 'bearer' && parsedAuthConfig.token) {
    requestHeaders.Authorization = `Bearer ${parsedAuthConfig.token}`;
  } else if (request.authType === 'basic' && (parsedAuthConfig.username || parsedAuthConfig.password)) {
    const credentials = Buffer.from(`${parsedAuthConfig.username || ''}:${parsedAuthConfig.password || ''}`).toString('base64');
    requestHeaders.Authorization = `Basic ${credentials}`;
  } else if (request.authType === 'apikey' && parsedAuthConfig.key) {
    const key = parsedAuthConfig.key;
    const value = parsedAuthConfig.value || '';
    if (parsedAuthConfig.addTo === 'headers') {
      requestHeaders[key] = value;
    }
  }

  const cookieRecord = arrayToRecord(parseJson<any[]>(request.cookies, []));
  const cookieString = Object.entries(cookieRecord)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
  if (cookieString) {
    requestHeaders.Cookie = cookieString;
  }

  let data: any = undefined;
  if (request.bodyType !== 'none' && requestData.body) {
    if (request.bodyType === 'json') {
      try {
        data = typeof requestData.body === 'string' ? JSON.parse(requestData.body) : requestData.body;
      } catch {
        data = requestData.body;
      }
    } else if (request.bodyType === 'urlencoded') {
      const urlencodedRecord = typeof requestData.body === 'string' ? JSON.parse(requestData.body) : requestData.body;
      const searchParams = new URLSearchParams();
      if (Array.isArray(urlencodedRecord)) {
        for (const item of urlencodedRecord) {
          if (item.enabled !== false && item.key) {
            searchParams.append(item.key, item.value || '');
          }
        }
      } else if (typeof urlencodedRecord === 'object' && urlencodedRecord !== null) {
        for (const [key, value] of Object.entries(urlencodedRecord as Record<string, any>)) {
          searchParams.append(key, String(value));
        }
      }
      data = searchParams.toString();
      requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
    } else if (request.bodyType === 'formdata') {
      const formItems = typeof requestData.body === 'string' ? JSON.parse(requestData.body) : requestData.body;
      const fd: Record<string, any> = {};
      if (Array.isArray(formItems)) {
        for (const item of formItems) {
          if (item.enabled !== false && item.key) {
            fd[item.key] = item.value || '';
          }
        }
      }
      data = fd;
    } else if (request.bodyType === 'text') {
      data = resolveTemplate(String(requestData.body), varMap);
      if (!requestHeaders['Content-Type']) {
        requestHeaders['Content-Type'] = 'text/plain';
      }
    } else if (request.bodyType === 'xml') {
      data = resolveTemplate(String(requestData.body), varMap);
      if (!requestHeaders['Content-Type']) {
        requestHeaders['Content-Type'] = 'application/xml';
      }
    }
  }

  const requestParams = requestData.params;
  if (request.authType === 'apikey' && parsedAuthConfig.key && parsedAuthConfig.addTo === 'params') {
    requestParams[parsedAuthConfig.key] = parsedAuthConfig.value || '';
  }

  const timeout = Number(parsedSettings.timeout) || 30000;
  const config: AxiosRequestConfig = {
    method: request.method as Method,
    url: resolveTemplate(request.url, varMap),
    headers: requestHeaders,
    params: requestParams,
    data,
    timeout,
    validateStatus: () => true,
    responseType: 'text',
  };

  const startTime = Date.now();

  try {
    const response = await axios(config);
    const duration = Date.now() - startTime;

    const responseBody = response.data;
    const responseSize = typeof responseBody === 'string' ? Buffer.byteLength(responseBody) : JSON.stringify(responseBody).length;

    let parsedBody = responseBody;
    try {
      parsedBody = JSON.parse(responseBody);
    } catch {
      // Keep the raw body when it is not JSON.
    }

    const testResults: any[] = [];
    if (request.testScript) {
      const testVm = new VM({
        timeout: 1000,
        sandbox: {
          response: {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            body: parsedBody,
            text: () => responseBody,
            json: () => parsedBody,
          },
          expect: (value: any) => ({
            toBe: (expected: any) => {
              testResults.push({
                name: `Expected ${JSON.stringify(value)} to be ${JSON.stringify(expected)}`,
                pass: value === expected,
              });
            },
            toBeDefined: () => {
              testResults.push({
                name: `Expected ${JSON.stringify(value)} to be defined`,
                pass: value !== undefined && value !== null,
              });
            },
          }),
        },
      });

      try {
        testVm.run(request.testScript);
      } catch (error: any) {
        testResults.push({
          name: `Test script execution failed: ${error.message}`,
          pass: false,
          isError: true,
        });
      }
    }

    const setCookieHeaders = response.headers['set-cookie'] || [];

    await prisma.historyItem.create({
      data: {
        method: request.method,
        url: request.url,
        status: response.status,
        statusText: response.statusText || 'OK',
        duration,
        responseSize,
        responseBody: typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody),
        responseHeaders: JSON.stringify(response.headers),
        cookies: JSON.stringify(setCookieHeaders),
      },
    });

    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      cookies: setCookieHeaders,
      duration,
      size: responseSize,
      body: parsedBody,
      testResults,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorMessage = error.message || 'Network error';
    const status = error.response?.status || 0;
    const statusText = error.code || 'ERROR';

    await prisma.historyItem.create({
      data: {
        method: request.method,
        url: request.url,
        status,
        statusText,
        duration,
        responseSize: Buffer.byteLength(errorMessage),
        responseBody: errorMessage,
        responseHeaders: JSON.stringify({}),
        cookies: JSON.stringify([]),
      },
    });

    return {
      status,
      statusText,
      headers: {},
      cookies: [],
      duration,
      size: Buffer.byteLength(errorMessage),
      body: errorMessage,
      isError: true,
      testResults: [],
    };
  }
};