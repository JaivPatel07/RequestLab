import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  X, Send, Play, ArrowRight, FileText, Code, Key, Sliders, Cookie,
  Terminal, Globe, Braces, ListTree,
  Search, CheckCircle, Loader
} from 'lucide-react';
import { RequestTab, KeyValuePair } from '../types';

interface ExamplesPageProps {
  onClose: () => void;
}

interface ExampleDef {
  id: string;
  title: string;
  description: string;
  method: string;
  tab: Partial<RequestTab>;
  code: string;
}

const kvList = (...pairs: [string, string, boolean?][]): KeyValuePair[] =>
  pairs.map(([k, v, e]) => ({ key: k, value: v, enabled: e !== false }));

/* ─────────────────────────────────────────────────────────────────
   All examples. Each is a ready-to-load RequestTab partial.
   Uses https://postman-echo.com — a fast, reliable public echo API.
   ───────────────────────────────────────────────────────────────── */
const sections: { title: string; icon: React.ElementType; desc: string; examples: ExampleDef[] }[] = [
  {
    title: 'HTTP Methods',
    icon: Send,
    desc: 'Every HTTP method your application supports, with a live test endpoint.',
    examples: [
      {
        id: 'get',
        title: 'GET — Retrieve data',
        description: 'Fetch a resource from the server. This returns JSON you can inspect in Pretty view.',
        method: 'GET',
        tab: { method: 'GET', url: 'https://postman-echo.com/get', bodyType: 'none', bodyContent: '' },
        code: 'GET https://postman-echo.com/get',
      },
      {
        id: 'post',
        title: 'POST — Create a resource',
        description: 'Send a JSON body to create something. The server echoes back what you sent.',
        method: 'POST',
        tab: {
          method: 'POST',
          url: 'https://postman-echo.com/post',
          bodyType: 'json',
          bodyContent: '{\n  "name": "Jaiv",\n  "role": "developer",\n  "active": true\n}',
        },
        code: `POST https://postman-echo.com/post
Content-Type: application/json

{
  "name": "Jaiv",
  "role": "developer",
  "active": true
}`,
      },
      {
        id: 'put',
        title: 'PUT — Update a resource',
        description: 'Replace an existing resource entirely using the request body.',
        method: 'PUT',
        tab: {
          method: 'PUT',
          url: 'https://postman-echo.com/put',
          bodyType: 'json',
          bodyContent: '{\n  "id": 42,\n  "name": "Updated Name"\n}',
        },
        code: `PUT https://postman-echo.com/put
Content-Type: application/json

{
  "id": 42,
  "name": "Updated Name"
}`,
      },
      {
        id: 'patch',
        title: 'PATCH — Partial update',
        description: 'Send only the fields you want to change on an existing resource.',
        method: 'PATCH',
        tab: {
          method: 'PATCH',
          url: 'https://postman-echo.com/patch',
          bodyType: 'json',
          bodyContent: '{\n  "status": "active"\n}',
        },
        code: `PATCH https://postman-echo.com/patch
Content-Type: application/json

{
  "status": "active"
}`,
      },
      {
        id: 'delete',
        title: 'DELETE — Remove a resource',
        description: 'Delete a resource by its identifier.',
        method: 'DELETE',
        tab: { method: 'DELETE', url: 'https://postman-echo.com/delete', bodyType: 'none', bodyContent: '' },
        code: 'DELETE https://postman-echo.com/delete',
      },
      {
        id: 'options',
        title: 'OPTIONS — Inspect CORS',
        description: 'Ask the server which methods and headers are allowed.',
        method: 'OPTIONS',
        tab: { method: 'OPTIONS', url: 'https://postman-echo.com/get', bodyType: 'none', bodyContent: '' },
        code: 'OPTIONS https://postman-echo.com/get',
      },
    ],
  },
  {
    title: 'Query Params',
    icon: ListTree,
    desc: 'Append key-value query parameters to the URL automatically.',
    examples: [
      {
        id: 'params',
        title: 'Params — Search with filters',
        description: 'Define parameters in the Params tab. They are appended to the URL as a query string.',
        method: 'GET',
        tab: {
          method: 'GET',
          url: 'https://postman-echo.com/get',
          params: kvList(['q', 'requestlab'], ['page', '2'], ['limit', '25'], ['sort', 'desc']),
          bodyType: 'none',
        },
        code: `GET https://postman-echo.com/get
    ?q=requestlab
    &page=2
    &limit=25
    &sort=desc`,
      },
    ],
  },
  {
    title: 'Headers',
    icon: Code,
    desc: 'Send custom request headers using key-value rows.',
    examples: [
      {
        id: 'headers',
        title: 'Headers — Custom metadata',
        description: 'Common headers like Accept, X-Custom, and User-Agent. Toggle rows on/off with the checkbox.',
        method: 'GET',
        tab: {
          method: 'GET',
          url: 'https://postman-echo.com/headers',
          headers: kvList(
            ['Accept', 'application/json'],
            ['X-Custom-Header', 'requestlab-example'],
            ['User-Agent', 'RequestLab/1.0']
          ),
          bodyType: 'none',
        },
        code: `GET https://postman-echo.com/headers
Accept: application/json
X-Custom-Header: requestlab-example
User-Agent: RequestLab/1.0`,
      },
    ],
  },
  {
    title: 'Body Formats',
    icon: Braces,
    desc: 'All the body types your application supports for sending payloads.',
    examples: [
      {
        id: 'body-json',
        title: 'JSON Body',
        description: 'Structured JSON body with a Monaco editor and syntax highlighting.',
        method: 'POST',
        tab: {
          method: 'POST',
          url: 'https://postman-echo.com/post',
          bodyType: 'json',
          bodyContent: '{\n  "user": {\n    "name": "Ada",\n    "email": "ada@example.com"\n  },\n  "tags": ["dev", "api"]\n}',
        },
        code: `POST https://postman-echo.com/post
Content-Type: application/json

{
  "user": {
    "name": "Ada",
    "email": "ada@example.com"
  },
  "tags": ["dev", "api"]
}`,
      },
      {
        id: 'body-xml',
        title: 'XML Body',
        description: 'Raw XML payload with xml syntax highlighting in the editor.',
        method: 'POST',
        tab: {
          method: 'POST',
          url: 'https://postman-echo.com/post',
          bodyType: 'xml',
          bodyContent: `<?xml version="1.0" encoding="UTF-8"?>
<note>
  <to>RequestLab</to>
  <from>User</from>
  <message>Hello from XML!</message>
</note>`,
        },
        code: `POST https://postman-echo.com/post
Content-Type: application/xml

<?xml version="1.0" encoding="UTF-8"?>
<note>
  <to>RequestLab</to>
  <from>User</from>
  <message>Hello from XML!</message>
</note>`,
      },
      {
        id: 'body-form',
        title: 'Form Data (multipart)',
        description: 'Send key-value form fields for things like file-upload forms.',
        method: 'POST',
        tab: {
          method: 'POST',
          url: 'https://postman-echo.com/post',
          bodyType: 'formdata',
          bodyContent: JSON.stringify(kvList(['username', 'jaiv'], ['avatar', 'myfile.png'], ['remember', 'true'])),
        },
        code: `POST https://postman-echo.com/post
Content-Type: multipart/form-data

username=jaiv
avatar=myfile.png
remember=true`,
      },
      {
        id: 'body-urlencoded',
        title: 'URL-encoded Form',
        description: 'Classic application/x-www-form-urlencoded body, used by many web forms.',
        method: 'POST',
        tab: {
          method: 'POST',
          url: 'https://postman-echo.com/post',
          bodyType: 'urlencoded',
          bodyContent: JSON.stringify(kvList(['email', 'user@example.com'], ['password', 'secret123'], ['remember', 'on'])),
        },
        code: `POST https://postman-echo.com/post
Content-Type: application/x-www-form-urlencoded

email=user%40example.com&password=secret123&remember=on`,
      },
      {
        id: 'body-text',
        title: 'Raw Text Body',
        description: 'Free-form plain text payload with text encoding.',
        method: 'POST',
        tab: {
          method: 'POST',
          url: 'https://postman-echo.com/post',
          bodyType: 'text',
          bodyContent: 'Hello RequestLab! This is a raw text body.',
        },
        code: `POST https://postman-echo.com/post
Content-Type: text/plain

Hello RequestLab! This is a raw text body.`,
      },
    ],
  },
  {
    title: 'Authentication',
    icon: Key,
    desc: 'Per-request auth schemes, all injected automatically by the backend proxy.',
    examples: [
      {
        id: 'auth-bearer',
        title: 'Bearer Token',
        description: 'Sends an Authorization: Bearer <token> header. Use {{token}} to pull from an environment variable.',
        method: 'GET',
        tab: {
          method: 'GET',
          url: 'https://postman-echo.com/bearer',
          authType: 'bearer',
          authConfig: { token: '{{token}}' },
          headers: kvList(['Accept', 'application/json']),
          bodyType: 'none',
        },
        code: 'Authorization: Bearer {{token}}',
      },
      {
        id: 'auth-basic',
        title: 'Basic Auth',
        description: 'Base64-encodes username & password into an Authorization: Basic header.',
        method: 'GET',
        tab: {
          method: 'GET',
          url: 'https://postman-echo.com/basic-auth',
          authType: 'basic',
          authConfig: { username: 'postman', password: 'password' },
          bodyType: 'none',
        },
        code: 'Authorization: Basic base64(postman:password)',
      },
      {
        id: 'auth-apikey',
        title: 'API Key (Header)',
        description: 'Send a custom API key as a request header (X-API-Key).',
        method: 'GET',
        tab: {
          method: 'GET',
          url: 'https://postman-echo.com/headers',
          authType: 'apikey',
          authConfig: { key: 'X-API-Key', value: 'sk_live_123456', addTo: 'headers' },
          bodyType: 'none',
        },
        code: 'X-API-Key: sk_live_123456',
      },
      {
        id: 'auth-apikey-param',
        title: 'API Key (Query Params)',
        description: 'Instead of a header, send the API key as a query parameter.',
        method: 'GET',
        tab: {
          method: 'GET',
          url: 'https://postman-echo.com/get',
          authType: 'apikey',
          authConfig: { key: 'api_key', value: 'abcd1234', addTo: 'params' },
          bodyType: 'none',
        },
        code: 'GET https://postman-echo.com/get?api_key=abcd1234',
      },
    ],
  },
  {
    title: 'Cookies',
    icon: Cookie,
    desc: 'Send cookies with a request; inspect set-cookie responses.',
    examples: [
      {
        id: 'cookies',
        title: 'Cookies — Send session data',
        description: 'Define cookies in the request; the proxy forwards them as a Cookie header.',
        method: 'GET',
        tab: {
          method: 'GET',
          url: 'https://postman-echo.com/cookies',
          cookies: kvList(['session_id', 'abc123'], ['theme', 'dark']),
          bodyType: 'none',
        },
        code: 'Cookie: session_id=abc123; theme=dark',
      },
    ],
  },
  {
    title: 'Environment Variables',
    icon: Sliders,
    desc: 'Reusable {{placeholders}} resolved at send time across URLs, headers, auth, and bodies.',
    examples: [
      {
        id: 'env-vars',
        title: 'Variables — {{base_url}} and {{token}}',
        description: 'Create an environment with base_url & token, then reference them anywhere. They resolve automatically.',
        method: 'GET',
        tab: {
          method: 'GET',
          url: 'https://postman-echo.com/post',
          authType: 'bearer',
          authConfig: { token: '{{token}}' },
          bodyType: 'json',
          bodyContent: '{\n  "endpoint": "{{base_url}}",\n  "created": true\n}',
          headers: kvList(['Accept', 'application/json']),
        },
        code: `URL   : https://postman-echo.com/post
Auth  : Bearer {{token}}
Body  : { "endpoint": "{{base_url}}", "created": true }

Create an Environment with:
  base_url = https://postman-echo.com
  token    = my-secret-token`,
      },
    ],
  },
  {
    title: 'Pre-request Scripts',
    icon: Terminal,
    desc: 'Run sandboxed JavaScript before sending to dynamically modify request data.',
    examples: [
      {
        id: 'prerequest',
        title: 'Pre-request — Set headers & params',
        description: 'Use pm.setHeader, pm.setQueryParam and pm.setBody to mutate the outgoing request.',
        method: 'GET',
        tab: {
          method: 'GET',
          url: 'https://postman-echo.com/get',
          headers: kvList(['Accept', 'application/json']),
          bodyType: 'none',
          preRequestScript: `// Runs BEFORE the request is sent
pm.setHeader('X-Trace-Id', 'req-' + Date.now());
pm.setQueryParam('source', 'prerequest');
pm.setQueryParam('ts', Date.now());
// pm.setBody({ hello: 'world' }); // override the body`,
        },
        code: `pm.setHeader('X-Trace-Id', 'req-' + Date.now());
pm.setQueryParam('source', 'prerequest');
pm.setQueryParam('ts', Date.now());
pm.setBody({ hello: 'world' });`,
      },
    ],
  },
  {
    title: 'Tests',
    icon: CheckCircle,
    desc: 'Write assertions with expect() to validate the response, then view results in the Test Results tab.',
    examples: [
      {
        id: 'tests',
        title: 'Tests — Assert response data',
        description: 'Uses response.status, response.body, .text() and .json() plus expect().toBe() / toBeDefined().',
        method: 'GET',
        tab: {
          method: 'GET',
          url: 'https://postman-echo.com/get',
          headers: kvList(['Accept', 'application/json']),
          bodyType: 'none',
          testScript: `// Runs AFTER the response is received
expect(response.status).toBe(200);
expect(response.body.url).toBeDefined();
expect(response.body.args).toBeDefined();
expect(response.headers['content-type']).toBeDefined();`,
        },
        code: `expect(response.status).toBe(200);
expect(response.body.url).toBeDefined();
expect(response.body.args).toBeDefined();
expect(response.headers['content-type']).toBeDefined();`,
      },
      {
        id: 'tests-json',
        title: 'Tests — JSON request & response',
        description: 'Combine a JSON POST with assertions against the echoed body.',
        method: 'POST',
        tab: {
          method: 'POST',
          url: 'https://postman-echo.com/post',
          bodyType: 'json',
          bodyContent: '{\n  "id": 7,\n  "status": "success"\n}',
          headers: kvList(['Accept', 'application/json']),
          testScript: `expect(response.status).toBe(200);
expect(response.body.json.id).toBe(7);
expect(response.body.json.status).toBe('success');
expect(response.body.headers).toBeDefined();`,
        },
        code: `expect(response.status).toBe(200);
expect(response.body.json.id).toBe(7);
expect(response.body.json.status).toBe('success');`,
      },
    ],
  },
  {
    title: 'Settings',
    icon: FileText,
    desc: 'Per-request options like execution timeout.',
    examples: [
      {
        id: 'settings',
        title: 'Settings — Custom timeout',
        description: 'Set a request timeout (in ms) from the Settings tab of a request.',
        method: 'GET',
        tab: {
          method: 'GET',
          url: 'https://postman-echo.com/delay/1',
          bodyType: 'none',
          settings: { timeout: 5000 },
        },
        code: 'timeout: 5000ms  (postman-echo.com/delay/1 responds after 1s)',
      },
    ],
  },
];

const methodColor = (method: string) => {
  const map: Record<string, string> = {
    GET: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    POST: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    PUT: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    PATCH: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    DELETE: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    OPTIONS: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    HEAD: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  };
  return map[method] || 'text-slate-300 bg-slate-500/10 border-slate-500/20';
};

export const ExamplesPage: React.FC<ExamplesPageProps> = ({ onClose }) => {
  const { addTab } = useStore();
  const [query, setQuery] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(sections[0].title);

  const handleLoad = (ex: ExampleDef) => {
    setLoadingId(ex.id);
    addTab({
      name: `${ex.method} — ${ex.title}`,
      headers: kvList(['Accept', 'application/json']),
      params: kvList(['', '', true]),
      cookies: kvList(['', '', true]),
      ...ex.tab,
    });
    setTimeout(() => {
      setLoadingId(null);
      onClose();
    }, 450);
  };

  const isMatching = (ex: ExampleDef) =>
    ex.title.toLowerCase().includes(query.toLowerCase()) ||
    ex.description.toLowerCase().includes(query.toLowerCase()) ||
    ex.method.toLowerCase().includes(query.toLowerCase());

  const filteredSections = sections
    .map(s => ({ ...s, examples: s.examples.filter(isMatching) }))
    .filter(s => s.examples.length > 0);

  const allCount = sections.reduce((n, s) => n + s.examples.length, 0);

  return (
    <div className="h-full w-full flex flex-col bg-[#070709] text-slate-100 overflow-hidden select-none">
      {/* Header */}
      <div className="shrink-0 px-7 py-5 border-b border-slate-900 flex items-center justify-between"
        style={{ background: 'radial-gradient(ellipse 60% 100% at 15% -30%, rgba(99,102,241,0.18) 0%, transparent 70%)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/15 border border-indigo-500/25">
            <Play size={18} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-heading tracking-tight">Examples &amp; How to Test</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {allCount} runnable examples across every kind of request RequestLab supports.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800 transition-all"
        >
          <ArrowRight size={13} />
          Back to app
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left nav */}
        <div className="w-64 shrink-0 border-r border-slate-900 overflow-y-auto py-4 px-3 bg-[#0b0b0f]/60">
          <div className="relative flex items-center mb-4">
            <Search size={14} className="absolute left-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Filter examples..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-900/70 border border-slate-800 rounded-lg py-1.5 pl-8 pr-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          {filteredSections.map(s => {
            const Icon = s.icon;
            const active = activeSection === s.title;
            return (
              <button
                key={s.title}
                onClick={() => setActiveSection(s.title)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left mb-1 transition-all ${
                  active
                    ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon size={14} className={active ? 'text-indigo-400' : 'text-slate-500'} />
                <span className="flex-1 truncate">{s.title}</span>
                <span className="text-[10px] text-slate-500">{s.examples.length}</span>
              </button>
            );
          })}
        </div>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {filteredSections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm">
              <Search size={28} className="opacity-25 mb-3" />
              No examples match "{query}".
            </div>
          ) : (
            filteredSections.map(section => {
              const Icon = section.icon;
              return (
                <section key={section.title} className="mb-10">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Icon size={16} />
                    </div>
                    <h2 className="text-xl font-bold font-heading text-slate-100">{section.title}</h2>
                  </div>
                  <p className="text-sm text-slate-400 mb-5 ml-1">{section.desc}</p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {section.examples.map(ex => {
                      const MethodIcon = ex.method === 'GET' ? Globe : ex.method === 'DELETE' ? X : Send;
                      const loading = loadingId === ex.id;
                      return (
                        <div
                          key={ex.id}
                          className="glass-card rounded-xl border border-slate-800 overflow-hidden hover:border-indigo-500/30 transition-all flex flex-col"
                        >
                          {/* Card header */}
                          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-800/70 bg-slate-900/20">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${methodColor(ex.method)}`}>
                                <MethodIcon size={10} />
                                {ex.method}
                              </span>
                              <span className="truncate text-xs font-semibold text-slate-200">{ex.title}</span>
                            </div>
                            <button
                              onClick={() => handleLoad(ex)}
                              disabled={loading}
                              className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold glass-button-primary text-white disabled:opacity-60"
                            >
                              {loading ? (
                                <Loader size={12} className="animate-spin" />
                              ) : (
                                <Play size={12} />
                              )}
                              {loading ? 'Loading...' : 'Load Example'}
                            </button>
                          </div>

                          {/* Description */}
                          <p className="px-4 pt-3 pb-2 text-[11px] text-slate-400 leading-relaxed">
                            {ex.description}
                          </p>

                          {/* Code preview */}
                          <div className="mx-4 mb-4 flex-1 rounded-lg overflow-hidden border border-slate-800 bg-slate-950/60">
                            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/50 border-b border-slate-800">
                              <div className="w-2 h-2 rounded-full bg-rose-500/60" />
                              <div className="w-2 h-2 rounded-full bg-amber-500/60" />
                              <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
                              <span className="ml-2 text-[10px] text-slate-500 font-mono">{ex.method} request</span>
                            </div>
                            <pre
                              className="p-3 text-[11px] font-mono text-indigo-300 leading-relaxed whitespace-pre-wrap break-words select-text"
                              style={{ maxHeight: '180px', overflowY: 'auto' }}
                            >
                              {ex.code}
                            </pre>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
