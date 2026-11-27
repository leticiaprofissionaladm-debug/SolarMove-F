import { apiRequest } from './api'

export type AuthUser = {
  id: string
  name: string
  email: string
  phone?: string
  role: 'ADMIN' | 'CUSTOMER'
}

type AuthResponse = {
  message: string
  user: AuthUser
  access_token: string
}

// LOGIN ÚNICO: identifica automaticamente cliente ou administrador
export async function loginUser(email: string, password: string) {
  const response: AuthResponse = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  if (response.user.role === 'ADMIN') {
    sessionStorage.setItem('sm-admin-token', response.access_token)
    sessionStorage.removeItem('sm-customer-token')
  } else if (response.user.role === 'CUSTOMER') {
    sessionStorage.setItem('sm-customer-token', response.access_token)
    sessionStorage.removeItem('sm-admin-token')
  } else {
    throw new Error('Perfil de usuário inválido.')
  }

  return response.user
}

export async function adminLogin(email: string, password: string) {
  const user = await loginUser(email, password)

  if (user.role !== 'ADMIN') {
    customerLogout()
    throw new Error('Acesso permitido somente para administradores.')
  }

  return user
}

export async function customerRegister(data: {
  name: string
  email: string
  phone: string
  password: string
}) {
  const response: AuthResponse = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (response.user.role !== 'CUSTOMER') {
    throw new Error('Não foi possível criar a conta de cliente.')
  }

  sessionStorage.setItem('sm-customer-token', response.access_token)
  sessionStorage.removeItem('sm-admin-token')

  return response.user
}

export async function adminRegister(data: {
  name: string
  email: string
  phone: string
  password: string
}) {
  const response: AuthResponse = await apiRequest('/auth/admin/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (response.user.role !== 'ADMIN') {
    throw new Error('Não foi possível criar a conta de administrador.')
  }

  sessionStorage.setItem('sm-admin-token', response.access_token)
  sessionStorage.removeItem('sm-customer-token')

  return response.user
}

export async function customerLogin(email: string, password: string) {
  const user = await loginUser(email, password)

  if (user.role !== 'CUSTOMER') {
    adminLogout()
    throw new Error('Esta conta não é uma conta de cliente.')
  }

  return user
}

export async function getCurrentCustomer() {
  return apiRequest('/auth/me', {}, 'customer') as Promise<AuthUser>
}

export function customerLogout() {
  sessionStorage.removeItem('sm-customer-token')
}

export function adminLogout() {
  sessionStorage.removeItem('sm-admin-token')
}