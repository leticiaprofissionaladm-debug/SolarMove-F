
import { apiRequest } from './api'

export type ApiCartItem = {
  id: string
  cartId: string
  productId: string
  quantity: number
  color: string
  size: string
  product: {
    id: string
    name: string
    price: number | string
    images: {
      url: string
    }[]
    colors: {
      name: string
    }[]
    inventories: {
      color: string
      size: string
      quantity: number
    }[]
  }
}

export type ApiCart = {
  id: string | null
  userId: string
  items: ApiCartItem[]
}

export async function getCart() {
  return apiRequest('/cart', {}, 'customer') as Promise<ApiCart>
}

export async function addCartItem(data: {
  productId: string
  quantity: number
  color: string
  size: string
}) {
  return apiRequest(
    '/cart/items',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    'customer',
  )
}

export async function updateCartItem(
  itemId: string,
  quantity: number,
) {
  return apiRequest(
    `/cart/items/${itemId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    },
    'customer',
  )
}

export async function removeCartItem(itemId: string) {
  return apiRequest(
    `/cart/items/${itemId}`,
    {
      method: 'DELETE',
    },
    'customer',
  )
}

export async function clearCartApi() {
  return apiRequest(
    '/cart',
    {
      method: 'DELETE',
    },
    'customer',
  )
}
