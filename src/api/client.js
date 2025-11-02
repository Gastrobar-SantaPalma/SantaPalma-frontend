// Use VITE_BACKEND_URL if provided (allows direct requests to backend). If not
// provided, fall back to relative paths so Vite's proxy can be used in dev.
const BASE = import.meta.env.VITE_BACKEND_URL || ''

let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

export function setToken(t){
  token = t
  if(typeof window !== 'undefined') localStorage.setItem('token', t)
}

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
  del: (p, opts) => request(p, { ...opts, method: 'DELETE' }),
}
