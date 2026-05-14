import type { User } from "@prisma/client"

export type SafeUser = Omit<User, "passwordHash">

export interface CartItem {
  id: string
  productId: string
  name: string
  slug: string
  price: number
  image: string
  quantity: number
  stock: number
}

export interface SearchParams {
  q?: string
  category?: string
  minPrice?: string
  maxPrice?: string
  sort?: string
  page?: string
}

export interface PaginationParams {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface ReviewStats {
  average: number
  total: number
  distribution: Record<number, number>
}

export interface SEOData {
  title: string
  description: string
  keywords?: string
  ogImage?: string
  ogType?: string
  canonical?: string
  noindex?: boolean
  nofollow?: boolean
  articlePublishedTime?: string
  articleModifiedTime?: string
  articleAuthors?: string[]
  articleTags?: string[]
}
