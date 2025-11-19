// Use relative paths in development so Vite's proxy can forward /api to the backend
// In production, prefer VITE_BACKEND_URL if provided.
const BASE =
  import.meta.env.MODE === "development"
    ? "http://localhost:4000" 
    : import.meta.env.VITE_BACKEND_URL || "";


let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

// ESTA DEFINICIÓN ESTABA FALTANDO (o se perdió en el conflicto)
// La restauramos para que sea accesible en todo el archivo.
export function setToken(t){ 
  // Accept either a raw token string or an object containing the token in several possible shapes.
  let final = t
  if (final && typeof final === 'object') {
    // common shapes: { token: '...', accessToken: '...' } or { data: { token: '...' } }
    final = final.token || final.accessToken || final.tokenString || (final.data && (final.data.token || final.data.accessToken)) || (final.result && final.result.token) || null
  }
  if (final == null) {
    token = null
    if(typeof window !== 'undefined') localStorage.removeItem('token')
    return
  }
  if (typeof final !== 'string') final = String(final)
  token = final
  if(typeof window !== 'undefined') localStorage.setItem('token', final)
}

// ESTA DEFINICIÓN ESTABA FALTANDO (o se perdió en el conflicto)
export function clearToken(){
  token = null
  if(typeof window !== 'undefined') localStorage.removeItem('token')
}

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`
  // debug: print resolved URL so we can see if proxy will be used (relative) or an absolute backend URL
  if (typeof window !== 'undefined') console.debug('[api] request url ->', url, 'BASE=', BASE)
  const headers = { 'Content-Type': 'application/json' , ...(options.headers||{})}
  // allow skipping Authorization header per-request (useful for login)
  if(!options.noAuth && token) headers.Authorization = `Bearer ${token}`

  // If the body is a FormData instance, let the browser set the Content-Type
  let fetchBody
  if (options.body instanceof FormData) {
    fetchBody = options.body
    // delete Content-Type so browser adds the correct multipart boundary
    delete headers['Content-Type']
  } else {
    fetchBody = options.body ? JSON.stringify(options.body) : undefined
  }

  const IS_DEV = import.meta.env.MODE === 'development' && typeof window !== 'undefined'
  if (IS_DEV) {
    // Mask token for logs (show only first 6 chars)
    const authHeader = headers.Authorization || null
    const maskedAuth = authHeader ? authHeader.replace(/(Bearer\s+)(.{6})(.*)/, '$1$2...') : null
    const headersForLog = { ...headers, Authorization: maskedAuth }
    console.debug('[api][dev] ->', { method: options.method || 'GET', url, headers: headersForLog, bodyPreview: options.body && typeof options.body !== 'object' ? String(options.body).slice(0,200) : (options.body ? '[object]' : undefined) })
  }

  const res = await fetch(url, {
    headers,
    credentials: options.credentials || 'include',
    method: options.method || 'GET',
    body: fetchBody,
  })

  const text = await res.text()
    let data
    try {
      data = text ? JSON.parse(text) : null
    } catch (e) {
      data = text
    }

  if (IS_DEV) {
    // safe preview of response body
    let bodyPreview
    try {
      bodyPreview = typeof data === 'string' ? data.slice(0,200) : JSON.stringify(data).slice(0,400)
    } catch (e) {
      bodyPreview = '[unserializable]'
    }
    console.debug('[api][dev] <-', { method: options.method || 'GET', url, status: res.status, bodyPreview })
  }

  if (!res.ok) {
    const err = new Error(data && data.message ? data.message : res.statusText)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

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

//Devolver pedidos confirmados en listado de pedidos
export async function fetchUserOrders(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, payment_state, products, total, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
