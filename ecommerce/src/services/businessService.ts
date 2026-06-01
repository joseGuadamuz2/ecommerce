import { supabase } from './supabaseClient'
import type { Business } from '../types/business'

/**
 * Obtener negocio actual del usuario autenticado
 */
export const getBusinessByUserId = async (userId: string): Promise<Business> => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) throw error
  return data as Business
}

/**
 * Obtener negocio público por slug (para catálogo)
 */
export const getBusinessBySlug = async (slug: string): Promise<Business> => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  
  if (error) throw error
  return data as Business
}

/**
 * Crear nuevo negocio para usuario
 */
export const createBusiness = async (
  userId: string,
  data: {
    name: string
    slug: string
    logo_url?: string | null
    accent_color?: string
    whatsapp_country_code?: string
    whatsapp_number?: string
    banner_label?: string
    banner_title?: string
    banner_subtitle?: string
    product_label?: string
  }
): Promise<Business> => {
  const { data: result, error } = await supabase
    .from('businesses')
    .insert({
      user_id: userId,
      name: data.name,
      slug: data.slug,
      logo_url: data.logo_url || null,
      accent_color: data.accent_color || '#6366f1',
      whatsapp_country_code: data.whatsapp_country_code || '506',
      whatsapp_number: data.whatsapp_number || '',
      banner_label: data.banner_label || '',
      banner_title: data.banner_title || '',
      banner_subtitle: data.banner_subtitle || '',
      product_label: data.product_label || 'productos',
      is_active: true,
    })
    .select('*')
    .single()
  
  if (error) throw error
  return result as Business
}

/**
 * Actualizar negocio
 */
export const updateBusiness = async (
  businessId: string,
  fields: Partial<Omit<Business, 'id' | 'user_id' | 'created_at'>>
): Promise<Business> => {
  const updateData = {
    ...fields,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('businesses')
    .update(updateData)
    .eq('id', businessId)
    .select('*')
    .single()
  
  if (error) throw error
  return data as Business
}

/**
 * Verificar disponibilidad de slug
 */
export const isSlugAvailable = async (slug: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', slug)
    .single()
  
  // Si no encuentra error de "no rows", slug ya existe
  if (!error) return false
  // Si el error es "no rows", slug está disponible
  if (error.code === 'PGRST116') return true
  
  throw error
}

/**
 * Generar slug único a partir de nombre
 */
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar no-alfanuméricos
    .replace(/^-+|-+$/g, '') // Eliminar guiones al inicio/final
    .substring(0, 50) // Limitar longitud
}

/**
 * Generar slug único (con sufijo si es necesario)
 */
export const generateUniqueSlug = async (baseName: string): Promise<string> => {
  let slug = generateSlug(baseName)
  const originalSlug = slug
  let counter = 1

  while (!(await isSlugAvailable(slug))) {
    slug = `${originalSlug}-${counter}`
    counter++
  }

  return slug
}

/**
 * Subir logo de negocio
 */
export const uploadLogo = async (file: File): Promise<string> => {
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('business-logos')
    .upload(fileName, file)

  if (uploadError) throw uploadError

  const { data } = supabase.storage
    .from('business-logos')
    .getPublicUrl(fileName)

  return data.publicUrl
}
