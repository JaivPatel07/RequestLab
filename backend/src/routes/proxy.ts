import { Router, Request, Response } from 'express';
import axios, { AxiosRequestConfig, Method } from 'axios';
import { prisma } from '../database/db';
import vm from 'vm';

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

export const proxyRouter = Router();

// Helper to convert array of key-value-enabled objects to record
const arrayToRecord = (arr: any[]): Record<string, string> => {
  const record: Record<string, string> = {};
  if (!Array.isArray(arr)) return record;
  for (const item of arr) {
    if (item && item.enabled !== false && item.key) {
      record[item.key] = item.value || '';
    }
  }
  return record;
};

proxyRouter.post('/send', async (req: Request, res: Response) => {
  const {
    method = 'GET',
    url,
    headers = [],
    params = [],
    authType = 'none',
    authConfig = '{}',
    bodyType = 'none',
    bodyContent,
    cookies = [],
    testScript = '',
    preRequestScript = '',
    settings = '{}'
  } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Parse configurations
  let parsedAuthConfig: any = {};
  try {
    parsedAuthConfig = typeof authConfig === 'string' ? JSON.parse(authConfig) : authConfig;
  } catch (e) {}

  let parsedSettings: any = {};
  try {
    parsedSettings = typeof settings === 'string' ? JSON.parse(settings) : settings;
  } catch (e) {}

  // --- PRE-REQUEST SCRIPT EXECUTION ---
  const requestData = {
    headers: arrayToRecord(headers),
    params: arrayToRecord(params),
    body: bodyContent,
    auth: parsedAuthConfig
  };

  if (preRequestScript) {
    const vm = new VM({
      timeout: 1000, // 1 second timeout
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
          }
        }
      }
    });

    try {
      vm.run(preRequestScript);
    } catch (e: any) {
      console.error('Pre-request script failed:', e.message);
      // Optionally, you could stop execution and return an error to the user here.
    }
  }

  // Build Headers
  const requestHeaders = requestData.headers;

  // Inject Authorization Headers
  if (authType === 'bearer' && parsedAuthConfig.token) {
    requestHeaders['Authorization'] = `Bearer ${parsedAuthConfig.token}`;
  } else if (authType === 'basic' && (parsedAuthConfig.username || parsedAuthConfig.password)) {
    const credentials = Buffer.from(`${parsedAuthConfig.username || ''}:${parsedAuthConfig.password || ''}`).toString('base64');
    requestHeaders['Authorization'] = `Basic ${credentials}`;
  } else if (authType === 'apikey' && parsedAuthConfig.key) {
    const key = parsedAuthConfig.key;
    const value = parsedAuthConfig.value || '';
    if (parsedAuthConfig.addTo === 'headers') {
      requestHeaders[key] = value;
    }
  }

  // Inject Cookies Header
  const cookieRecord = arrayToRecord(cookies);
  const cookieString = Object.entries(cookieRecord)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  if (cookieString) {
    requestHeaders['Cookie'] = cookieString;
  }

  // Prepare Body
  let data: any = undefined;
  if (bodyType !== 'none' && requestData.body) {
    if (bodyType === 'json') {
      try {
        data = typeof requestData.body === 'string' ? JSON.parse(requestData.body) : requestData.body;
      } catch (e) {
        data = requestData.body; // fallback to raw string if invalid JSON
      }
    } else if (bodyType === 'urlencoded') {
      const urlencodedRecord = typeof requestData.body === 'string' ? JSON.parse(requestData.body) : requestData.body;
      const searchParams = new URLSearchParams();
      if (Array.isArray(urlencodedRecord)) {
        for (const item of urlencodedRecord) {
          if (item.enabled !== false && item.key) {
            searchParams.append(item.key, item.value || '');
          }
        }
      } else if (typeof urlencodedRecord === 'object' && urlencodedRecord !== null) {
        for (const [k, v] of Object.entries(urlencodedRecord as Record<string, any>)) {
          searchParams.append(k, String(v));
        }
      }
      data = searchParams.toString();
      requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
    } else if (bodyType === 'formdata') {
      const formItems = typeof requestData.body === 'string' ? JSON.parse(requestData.body) : requestData.body;
      // We will serialize multipart/form-data as key-value boundary body.
      // For simple MVP text formdata, we can construct search parameters or boundary string.
      // Axios natively handles key-value objects as multipart form-data if structured correctly,
      // or we can form-encode it. Let's serialize as URLSearchParams or key-value object.
      const fd: Record<string, any> = {};
      if (Array.isArray(formItems)) {
        for (const item of (formItems as any[])) {
          if (item.enabled !== false && item.key) {
            fd[item.key] = item.value || '';
          }
        }
      }
      data = fd;
      // Axios will add multipart boundary automatically when sending an object/FormData.
    } else if (bodyType === 'text') {
      data = requestData.body;
      if (!requestHeaders['Content-Type']) {
        requestHeaders['Content-Type'] = 'text/plain';
      }
    } else if (bodyType === 'xml') {
      data = requestData.body;
      if (!requestHeaders['Content-Type']) {
        requestHeaders['Content-Type'] = 'application/xml';
      }
    }
  }

  // Handle API key addition to params
  const requestParams = requestData.params;
  if (authType === 'apikey' && parsedAuthConfig.key && parsedAuthConfig.addTo === 'params') {
    requestParams[parsedAuthConfig.key] = parsedAuthConfig.value || '';
  }

  // Axios Request Config
  const timeout = Number(parsedSettings.timeout) || 30000;
  const config: AxiosRequestConfig = {
    method: method as Method,
    url,
    headers: requestHeaders,
    params: requestParams,
    data,
    timeout,
    validateStatus: () => true, // resolve promise for any status code
    responseType: 'text' // get raw text to calculate exact size and handle multiple formats
  };

  const startTime = Date.now();

  try {
    const response = await axios(config);
    const endTime = Date.now();
    const duration = endTime - startTime;

    let responseBody = response.data;
    const responseSize = typeof responseBody === 'string' ? Buffer.byteLength(responseBody) : JSON.stringify(responseBody).length;

    // Check if JSON and try to parse it (so front-end can display collapsible viewer)
    let parsedBody = responseBody;
    try {
      parsedBody = JSON.parse(responseBody);
    } catch (e) {}

    // --- TEST SCRIPT EXECUTION ---
    const testResults: any[] = [];
    if (testScript) {
      const vm = new VM({
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
              const pass = value === expected;
              testResults.push({
                name: `Expected ${JSON.stringify(value)} to be ${JSON.stringify(expected)}`,
                pass,
              });
            },
            toBeDefined: () => {
              const pass = value !== undefined && value !== null;
              testResults.push({
                name: `Expected ${JSON.stringify(value)} to be defined`,
                pass,
              });
            },
          }),
        },
      });

      try {
        vm.run(testScript);
      } catch (e: any) {
        testResults.push({
          name: `Test script execution failed: ${e.message}`,
          pass: false,
          isError: true,
        });
      }
    }

    // Extract set-cookie headers
    const setCookieHeaders = response.headers['set-cookie'] || [];

    // Save to request history
    await prisma.historyItem.create({
      data: {
        method,
        url,
        status: response.status,
        statusText: response.statusText || 'OK',
        duration,
        responseSize,
        responseBody: typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody),
        responseHeaders: JSON.stringify(response.headers)
        // cookies are part of response headers (`set-cookie`)
      }
    });

    return res.json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      cookies: setCookieHeaders,
      duration,
      size: responseSize,
      body: parsedBody,
      testResults,
    });
  } catch (error: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    const errorMessage = error.message || 'Network error';
    const status = error.response?.status || 0;
    const statusText = error.code || 'ERROR';

    // Log failed execution in history
    await prisma.historyItem.create({
      data: {
        method,
        url,
        status,
        statusText,
        duration,
        responseSize: Buffer.byteLength(errorMessage),
        responseBody: errorMessage,
        responseHeaders: JSON.stringify({})
      }
    });

    return res.status(200).json({
      status,
      statusText,
      headers: {},
      cookies: [],
      duration,
      size: Buffer.byteLength(errorMessage),
      body: errorMessage,
      isError: true,
      testResults: [],
    });
  }
});
