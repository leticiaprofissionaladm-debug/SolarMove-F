import { apiRequest } from './api'

export type CreateOrderData = {
  items: {
    productId: string
    quantity: number
    color?: string
    size?: string
  }[]
  shipping?: number
  shippingAddress?: {
    recipient?: string
    name?: string
    phone?: string
    cep?: string
    zipCode?: string
    address?: string
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
    reference?: string
  }
}

export type ApiOrder = {
  id: string
  code: string
  userId: string
  status: string
  paymentStatus: string
  subtotal: number | string
  shipping: number | string
  total: number | string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  shippingAddress?: Record<string, unknown> | null
  items: {
    id: string
    productId: string
    name: string
    price: number | string
    quantity: number
    color?: string | null
    size?: string | null
    product?: {
      name?: string
      images?: { url: string }[]
    }
  }[]
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name: string
    email: string
    phone?: string | null
  }
}

export async function createOrder(data: CreateOrderData) {
  return apiRequest(
    '/orders',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    'customer',
  ) as Promise<ApiOrder>
}

export async function getMyOrders() {
  return apiRequest(
    '/orders/my',
    {},
    'customer',
  ) as Promise<ApiOrder[]>
}

export async function getAllOrders() {
  return apiRequest(
    '/orders',
    {},
    'admin',
  ) as Promise<ApiOrder[]>
}

export async function updateOrderStatus(
  id: string,
  status:
    | 'PENDING'
    | 'CONFIRMED'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED',
) {
  return apiRequest(
    `/orders/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
    'admin',
  ) as Promise<ApiOrder>
}

export async function updatePaymentStatus(
  id: string,
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED',
) {
  return apiRequest(
    `/orders/${id}/payment`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
    'admin',
  ) as Promise<ApiOrder>
}

export async function deleteOrder(id: string) {
  return apiRequest(
    `/orders/${id}`,
    {
      method: 'DELETE',
    },
    'admin',
  )
}