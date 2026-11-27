
import { apiRequest } from './api'
import type { Product } from '../store'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export type ProductPayload = {
  name: string
  slug: string
  description: string
  price: number
  categoryId: string
  active: boolean
  featured: boolean
  images: { url: string }[]
  colors: { name: string; hex: string }[]
  inventories: {
    color: string
    size: string
    quantity: number
  }[]
}

type UploadResponse = {
  message: string
  url: string
}

export async function uploadProductImage(
  file: File,
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const token = sessionStorage.getItem('sm-admin-token')

  const response = await fetch(`${API_URL}/products/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      data?.message || 'Não foi possível enviar a imagem.',
    )
  }

  return (data as UploadResponse).url
}

export async function getProducts(): Promise<Product[]> {
  return apiRequest('/products')
}

export async function createProduct(payload: ProductPayload) {
  return apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateProduct(
  id: string,
  payload: Partial<ProductPayload>,
) {
  return apiRequest(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteProduct(id: string) {
  return apiRequest(`/products/${id}`, {
    method: 'DELETE',
  })
}
