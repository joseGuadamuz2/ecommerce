import { supabase } from './supabaseClient'

export type UserRole = 'admin' | 'user'

export interface UserRoleData {
  id: string
  user_id: string
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

/**
 * Obtener rol del usuario
 */
export const getUserRole = async (userId: string): Promise<UserRole> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found, es normal para usuarios sin rol
    throw error
  }

  // Si no existe, es un usuario normal
  return data?.role || 'user'
}

/**
 * Asignar rol a un usuario (Admin)
 */
export const assignRoleToUser = async (userId: string, email: string, role: UserRole) => {
  // Intentar actualizar primero
  const { data: existingData } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (existingData) {
    // Actualizar existente
    const { error } = await supabase
      .from('user_roles')
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (error) throw error
  } else {
    // Crear nuevo
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        email,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (error) throw error
  }
}

/**
 * Obtener todos los usuarios con sus roles (Admin)
 */
export const getAllUserRoles = async (): Promise<UserRoleData[]> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Eliminar rol de usuario (Admin)
 */
export const removeUserRole = async (userId: string) => {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)

  if (error) throw error
}
