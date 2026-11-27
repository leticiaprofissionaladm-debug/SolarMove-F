import { apiRequest } from './api'

export type Category = {
  id: string
  name: string
  slug: string
  active: boolean
}

export async function getCategories(): Promise<Category[]> {
  return apiRequest('/categories')


}