let identityEpoch = 0;
export const advanceIdentityEpoch = () => { identityEpoch++; };
export const getIdentityEpoch = () => identityEpoch;

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'NETWORK_ERROR', fields, requestId, data, cause } = {}) {
    super(message, { cause });
    this.name = 'ApiError';
    Object.assign(this, { status, code, fields, requestId, data });
  }
}

// Shared transport; authService supplies the CSRF token through the singleton hook.
export function createHttpClient({ baseUrl = '/api/v1', timeoutMs = 15000,
  fetchImpl = globalThis.fetch, getCsrfToken = () => undefined,
  createRequestId = () => globalThis.crypto.randomUUID() } = {}) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new Error('Invalid API timeout');
  const base = String(baseUrl).replace(/\/$/, '');
  const url = new URL(base, 'http://relative.invalid');
  if ((!base.startsWith('/') && !/^https?:\/\//.test(base)) || base.startsWith('//') ||
    url.username || url.password || url.search || url.hash || /[\\\s]/.test(base)) throw new Error('Invalid API base URL');

  return {
    async request(endpoint, { method = 'GET', json, formData, headers = {}, signal, onUploadProgress, timeout = timeoutMs } = {}) {
      if (json !== undefined && formData !== undefined) throw new Error('Choose one request body');
      const issuedEpoch = identityEpoch;
      // Endpoint is a path under the configured API; do not allow credential leaks
      // via a caller-provided absolute URL, traversal or redirect.
      if (typeof endpoint !== 'string' || !/^\/(?!\/)/.test(endpoint)) throw new Error('Invalid API endpoint');
      const decodedPath = decodeURIComponent(endpoint.split('?')[0]);
      if (/[\\#?\u0000-\u0020]/.test(decodedPath) || decodedPath.startsWith('//') ||
        decodedPath.split('/').some(part => part === '.' || part === '..')) throw new Error('Invalid API endpoint');
      if (!Number.isSafeInteger(timeout) || timeout <= 0) throw new Error('Invalid API timeout');
      const controller = new AbortController();
      let timedOut = false;
      const abort = () => controller.abort();
      if (signal?.aborted) controller.abort();
      else signal?.addEventListener('abort', abort, { once: true });
      const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeout);
      let requestId;
      try {
        requestId = createRequestId();
        const requestHeaders = new Headers(headers);
        requestHeaders.set('Accept', 'application/json');
        requestHeaders.set('X-Request-ID', requestId);
        if (json !== undefined) requestHeaders.set('Content-Type', 'application/json');
        const token = await getCsrfToken();
        if (token && !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) requestHeaders.set('X-CSRF-Token', token);
        const response = formData !== undefined && onUploadProgress && typeof XMLHttpRequest !== 'undefined'
          ? await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest(), cancel = () => xhr.abort();
            const finish = fn => value => { controller.signal.removeEventListener('abort', cancel); fn(value); };
            xhr.open(method, `${base}${endpoint}`); xhr.withCredentials = true;
            requestHeaders.forEach((value, name) => xhr.setRequestHeader(name, value));
            xhr.upload.onprogress = e => onUploadProgress(e.lengthComputable ? Math.min(100, Math.round(e.loaded / e.total * 100)) : null);
            xhr.onerror = finish(() => reject(new Error('Upload network error')));
            xhr.onabort = finish(() => reject(new Error('Upload cancelled')));
            xhr.onload = finish(() => {
              if (xhr.responseURL !== new URL(`${base}${endpoint}`, window.location.href).href) return reject(new Error('Unexpected upload redirect'));
              const responseHeaders = new Headers();
              for (const line of xhr.getAllResponseHeaders().trim().split(/[\r\n]+/)) { const i = line.indexOf(':'); if(i > 0) responseHeaders.append(line.slice(0,i),line.slice(i+1).trim()); }
              resolve(new Response(xhr.status === 204 ? null : xhr.responseText, {status:xhr.status,headers:responseHeaders}));
            });
            controller.signal.addEventListener('abort', cancel, {once:true});
            if(controller.signal.aborted) { cancel(); reject(new Error('Upload cancelled')); } else xhr.send(formData);
          })
          : await fetchImpl(`${base}${endpoint}`, { method, headers: requestHeaders,
            credentials: 'include', redirect: 'error', signal: controller.signal,
            ...(formData !== undefined ? { body: formData } : json === undefined ? {} : { body: JSON.stringify(json) }) });
        const responseRequestId = response.headers.get('X-Request-ID') || requestId;
        if (response.status === 204) return { data: null, requestId: responseRequestId };
        let payload;
        try {
          if (!response.headers.get('Content-Type')?.includes('application/json')) throw new Error('Non-JSON response');
          payload = await response.json();
        } catch (cause) {
          if (controller.signal.aborted) throw cause;
          throw new ApiError('Invalid API response', { status: response.status, code: 'INVALID_RESPONSE', requestId: responseRequestId, cause });
        }
        if (!response.ok) {
          if (response.status === 401 && issuedEpoch === identityEpoch && typeof window !== 'undefined') window.dispatchEvent(new Event('kitss:session-expired'));
          throw new ApiError(payload?.error?.message || 'API request failed', {
          status: response.status, code: payload?.error?.code || payload?.data?.code || 'HTTP_ERROR', fields: payload?.error?.fields, data: payload?.data,
          requestId: payload?.requestId || responseRequestId,
        }); }
        if (!payload || typeof payload !== 'object' || !Object.hasOwn(payload, 'data')) throw new ApiError('Invalid API response', { status: response.status, code: 'INVALID_RESPONSE', requestId: responseRequestId });
        return payload;
      } catch (error) {
        if (controller.signal.aborted) throw new ApiError(timedOut ? 'API request timed out' : 'API request cancelled', { code: timedOut ? 'TIMEOUT' : 'ABORTED', requestId, cause: error });
        if (error instanceof ApiError) throw error;
        throw new ApiError('Could not reach the API', { requestId, cause: error });
      } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
    },
  };
}

let csrfToken;
export const setCsrfToken = value => { csrfToken = value; };
export const httpClient = createHttpClient({
  getCsrfToken: () => csrfToken,
  baseUrl: import.meta.env?.VITE_API_BASE_URL || '/api/v1',
  timeoutMs: Number(import.meta.env?.VITE_API_TIMEOUT_MS || 15000),
});
