import { supabase } from './supabaseClient'
import type { Product } from '../types/product'

/**
 * Obtener productos de un negocio específico
 */
export const getProductsByBusiness = async (businessId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

/**
 * Obtener producto por ID (con verificación de negocio)
 */
export const getProductById = async (id: string, businessId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .eq('id', id)
    .eq('business_id', businessId)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Obtener producto público por slug (para catálogo)
 */
export const getPublicProductBySlug = async (businessId: string, productId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .eq('id', productId)
    .eq('business_id', businessId)
    .eq('is_active', true)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Crear producto para un negocio
 */
export const createProduct = async (
  product: Omit<Product, 'id' | 'created_at'>,
  businessId: string
) => {
  const { data, error } = await supabase
    .from('products')
    .insert({
      ...product,
      business_id: businessId,
    })
    .select('*')
    .single()
  
  if (error) throw error
  return data
}

/**
 * Actualizar producto (verificar pertenencia a negocio)
 */
export const updateProduct = async (
  id: string,
  product: Partial<Product>,
  businessId: string
) => {
  const { data, error } = await supabase
    .from('products')
    .update({
      ...product,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('business_id', businessId)
    .select('*')
    .single()
  
  if (error) throw error
  return data
}

/**
 * Eliminar producto (verificar pertenencia a negocio)
 */
export const deleteProduct = async (id: string, businessId: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('business_id', businessId)
  
  if (error) throw error
}

/**
 * Subir imagen de producto
 */
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

/**
 * Guardar referencia de imagen de producto
 */
export const saveProductImage = async (
  productId: string,
  url: string,
  isMain: boolean
) => {
  const { error } = await supabase
    .from('product_images')
    .insert({
      product_id: productId,
      url,
      is_main: isMain,
    })
  
  if (error) throw error
}

/**
 * Eliminar imagen de producto
 */
export const deleteProductImage = async (imageId: string, url: string) => {
  const path = url.split('/product-images/')[1]

  const { error: storageError } = await supabase.storage
    .from('product-images')
    .remove([path])
  
  if (storageError) throw storageError

  const { error } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId)

  if (error) throw error
}

/**
 * Marcar imagen como principal
 */
export const setMainImage = async (imageId: string, productId: string) => {
  // Desmarcar todas
  const { error: clearError } = await supabase
    .from('product_images')
    .update({ is_main: false })
    .eq('product_id', productId)

  if (clearError) throw clearError

  // Marcar la seleccionada
  const { error } = await supabase
    .from('product_images')
    .update({ is_main: true })
    .eq('id', imageId)

  if (error) throw error
}

/**
 * Obtener productos públicos de un negocio (catálogo)
 */
export const getPublicProductsByBusiness = async (businessId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(*)')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}
