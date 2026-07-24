import { Router, Request, Response } from 'express';
import axios, { AxiosRequestConfig, Method } from 'axios';
import { prisma } from '../database/db';

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

  // Build Headers
  const requestHeaders = arrayToRecord(headers);

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
  if (bodyType !== 'none' && bodyContent) {
    if (bodyType === 'json') {
      try {
        data = typeof bodyContent === 'string' ? JSON.parse(bodyContent) : bodyContent;
      } catch (e) {
        data = bodyContent; // fallback to raw string if invalid JSON
      }
    } else if (bodyType === 'urlencoded') {
      const urlencodedRecord = typeof bodyContent === 'string' ? JSON.parse(bodyContent) : bodyContent;
      const searchParams = new URLSearchParams();
      if (Array.isArray(urlencodedRecord)) {
        for (const item of urlencodedRecord) {
          if (item.enabled !== false && item.key) {
            searchParams.append(item.key, item.value || '');
          }
        }
      } else if (typeof urlencodedRecord === 'object' && urlencodedRecord !== null) {
        for (const [k, v] of Object.entries(urlencodedRecord)) {
          searchParams.append(k, String(v));
        }
      }
      data = searchParams.toString();
      requestHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
    } else if (bodyType === 'formdata') {
      const formItems = typeof bodyContent === 'string' ? JSON.parse(bodyContent) : bodyContent;
      // We will serialize multipart/form-data as key-value boundary body.
      // For simple MVP text formdata, we can construct search parameters or boundary string.
      // Axios natively handles key-value objects as multipart form-data if structured correctly,
      // or we can form-encode it. Let's serialize as URLSearchParams or key-value object.
      const fd: Record<string, any> = {};
      if (Array.isArray(formItems)) {
        for (const item of formItems) {
          if (item.enabled !== false && item.key) {
            fd[item.key] = item.value || '';
          }
        }
      }
      data = fd;
      // Axios will add multipart boundary automatically when sending an object/FormData.
    } else if (bodyType === 'text') {
      data = bodyContent;
      if (!requestHeaders['Content-Type']) {
        requestHeaders['Content-Type'] = 'text/plain';
      }
    } else if (bodyType === 'xml') {
      data = bodyContent;
      if (!requestHeaders['Content-Type']) {
        requestHeaders['Content-Type'] = 'application/xml';
      }
    }
  }

  // Handle API key addition to params
  const requestParams = arrayToRecord(params);
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
        responseHeaders: JSON.stringify(response.headers),
        cookies: JSON.stringify(setCookieHeaders)
      }
    });

    return res.json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      cookies: setCookieHeaders,
      duration,
      size: responseSize,
      body: parsedBody
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
        responseHeaders: JSON.stringify({}),
        cookies: JSON.stringify([])
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
      isError: true
    });
  }
});
