import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      // Si el refresh token es inválido, limpiar sesión y redirigir al login
      if (error?.message?.toLowerCase().includes('refresh token')) {
        supabase.auth.signOut().then(() => {
          setAuthenticated(false)
          setLoading(false)
        })
        return
      }
      setAuthenticated(!!data.session)
      setLoading(false)
    })
  }, [])

  if (loading) return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Cargando...</p>
  if (!authenticated) return <Navigate to="/login" />
  return <>{children}</>
}
