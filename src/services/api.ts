
const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

type AuthMode = 'admin' | 'customer' | 'auto' | 'none'

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  authMode: AuthMode = 'auto',
) {
  const adminToken = sessionStorage.getItem('sm-admin-token')
  const customerToken = sessionStorage.getItem('sm-customer-token')

  let token: string | null = null

  if (authMode === 'admin') {
    token = adminToken
  } else if (authMode === 'customer') {
    token = customerToken
  } else if (authMode === 'auto') {
    token = adminToken || customerToken
  }

  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  } else {
    headers.delete('Authorization')
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      data?.message || 'Não foi possível realizar a operação.',
    )
  }

  return data
}
