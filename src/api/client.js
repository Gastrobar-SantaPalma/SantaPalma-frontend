// ... [código anterior, hasta el final de export const api] ...

export const api = {
  get: (p, opts) => request(p, { ...opts, method: 'GET' }),
  post: (p, body, opts) => request(p, { ...opts, method: 'POST', body }),
  put: (p, body, opts) => request(p, { ...opts, method: 'PUT', body }),
  patch: (p, body, opts) => request(p, { ...opts, method: 'PATCH', body }),
  del: (p, opts) => request(p, { ...opts, method: 'DELETE' }),
}

// Helper to fetch binary/blob responses while reusing BASE and Authorization handling.
async function requestBlob(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`
  if (typeof window !== 'undefined') console.debug('[api] request (blob) url ->', url, 'BASE=', BASE)
  const headers = { ...(options.headers||{}) }
  if(!options.noAuth && token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, {
    headers,
    credentials: options.credentials || 'include',
    method: options.method || 'GET',
    body: options.body
  })

  if (!res.ok) {
    let text = ''
    try{ text = await res.text() }catch(_){ text = '' }
    const err = new Error(text || res.statusText)
    err.status = res.status
    err.data = text
    throw err
  }

  const blob = await res.blob()
  return blob
}

export const apiBlob = {
  getBlob: (p, opts) => requestBlob(p, { ...opts, method: 'GET' }),
  // generic fetch for blob responses allowing explicit method (POST/GET)
  fetchBlob: (p, opts) => requestBlob(p, opts),
}

// Default export for consumers that import the module as a default (builds or third-party code)
export default {
  api,
  apiBlob,
  setToken,
  clearToken,
}