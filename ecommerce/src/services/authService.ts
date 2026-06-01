import { supabase } from './supabaseClient'

/**
 * Crear nuevo usuario (Admin)
 */
export const createUserAsAdmin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) throw error
  return data.user
}

/**
 * Listar todos los usuarios (Admin)
 */
export const listAllUsers = async () => {
  const { data, error } = await supabase.auth.admin.listUsers()

  if (error) throw error
  return data.users
}

/**
 * Actualizar usuario (Admin)
 */
export const updateUserAsAdmin = async (userId: string, { email, password }: { email?: string; password?: string }) => {
  const updateData: any = {}
  
  if (email) updateData.email = email
  if (password) updateData.password = password

  const { data, error } = await supabase.auth.admin.updateUserById(userId, updateData)

  if (error) throw error
  return data.user
}

/**
 * Eliminar usuario (Admin)
 */
export const deleteUserAsAdmin = async (userId: string) => {
  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) throw error
}
