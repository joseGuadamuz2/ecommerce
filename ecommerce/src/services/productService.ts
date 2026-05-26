import { supabase } from './supabaseClient'
import type { Product } from '../types/product'

export const getProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const getProductById = async (id: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export const createProduct = async (product: Omit<Product, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export const updateProduct = async (id: string, product: Partial<Product>) => {
  const { data, error } = await supabase
    .from('products')
    .update(product)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export const deleteProduct = async (id: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export const uploadImage = async (file: File, productId: string) => {
  const ext = file.name.split('.').pop()
  const fileName = `${productId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, file)

  if (uploadError) throw uploadError

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName)

  return data.publicUrl
}

export const saveProductImage = async (productId: string, url: string, isMain: boolean) => {
  const { error } = await supabase
    .from('product_images')
    .insert({ product_id: productId, url, is_main: isMain })
  if (error) throw error
}

export const deleteProductImage = async (imageId: string, url: string) => {
  const path = url.split('/product-images/')[1]

  const { error: storageError } = await supabase.storage.from('product-images').remove([path])
  if (storageError) throw storageError

  const { error } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId)

  if (error) throw error
}

export const setMainImage = async (imageId: string, productId: string) => {
  // Quitar main de todas las imágenes del producto
  const { error: clearError } = await supabase
    .from('product_images')
    .update({ is_main: false })
    .eq('product_id', productId)

  if (clearError) throw clearError

  // Poner main en la seleccionada
  const { error } = await supabase
    .from('product_images')
    .update({ is_main: true })
    .eq('id', imageId)

  if (error) throw error
}

export const getSettings = async () => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .single()
  if (error) throw error
  return data
}

export const updateSettings = async (id: string, countryCode: string, number: string) => {
  const { data, error } = await supabase
    .from('settings')
    .update({
      whatsapp_country_code: countryCode,
      whatsapp_number: number,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
  return data
}
