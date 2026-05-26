// src/utils/catalogAdapter.ts

export interface CatalogProduct {
  id: string
  name: string
  price: number
  image: string
}

export const mapProductsToCatalog = (products: any[]): CatalogProduct[] => {
  return products.map((p) => {
    const mainImage =
      p.product_images?.find((img: any) => img.is_main)?.url ||
      p.product_images?.[0]?.url ||
      'https://via.placeholder.com/300x300?text=No+Image'

    return {
      id: p.id,
      name: p.name,
      price: p.price,
      image: mainImage,
    }
  })
}