import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
})

// Limpiar sesión automáticamente si el refresh token es inválido
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED' && !session) {
    supabase.auth.signOut()
  }
})

// Forzar URLs públicas sin transformación
export const getPublicImageUrl = (path: string) => {
  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(path)
  return data.publicUrl
}
