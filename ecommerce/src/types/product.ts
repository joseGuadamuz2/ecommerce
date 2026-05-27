export interface ProductImage {
  id: string
  product_id: string
  url: string
  is_main: boolean
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  discount_percent: number
  featured: boolean
  sizes: string[]
  colors: string[]
  created_at: string
  product_images?: ProductImage[]
}
