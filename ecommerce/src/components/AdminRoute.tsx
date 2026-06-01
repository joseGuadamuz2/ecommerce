import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../services/roleService'

interface Props {
  children: React.ReactNode
  requiredRole?: UserRole | UserRole[]
}

export default function AdminRoute({ children, requiredRole }: Props) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const { role } = useAuth()

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
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

  // Verificar rol si se especifica
  if (requiredRole) {
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!requiredRoles.includes(role)) {
      return <Navigate to="/admin" />
    }
  }

  return <>{children}</>
}
