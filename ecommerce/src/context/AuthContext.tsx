import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../services/supabaseClient'
import { getBusinessByUserId } from '../services/businessService'
import { getUserRole } from '../services/roleService'
import type { Business } from '../types/business'
import type { UserRole } from '../services/roleService'

export interface AuthContextType {
  userId: string | null
  email: string | null
  business: Business | null
  role: UserRole
  loading: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [role, setRole] = useState<UserRole>('user')
  const [loading, setLoading] = useState(true)

  const initializeAuth = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        setUserId(data.session.user.id)
        setEmail(data.session.user.email || null)
        
        try {
          const userRole = await getUserRole(data.session.user.id)
          setRole(userRole)
        } catch (error) {
          console.error('Error fetching user role:', error)
          setRole('user')
        }

        try {
          const biz = await getBusinessByUserId(data.session.user.id)
          setBusiness(biz)
        } catch (error) {
          console.error('Error fetching business:', error)
          setBusiness(null)
        }
      } else {
        setUserId(null)
        setEmail(null)
        setBusiness(null)
        setRole('user')
      }
    } catch (error) {
      console.error('Error in initializeAuth:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id)
        setEmail(session.user.email || null)
        
        getUserRole(session.user.id)
          .then(userRole => setRole(userRole))
          .catch(() => setRole('user'))
        
        getBusinessByUserId(session.user.id).catch(() => setBusiness(null))
      } else {
        setUserId(null)
        setEmail(null)
        setBusiness(null)
        setRole('user')
      }
    })

    return () => subscription?.unsubscribe()
  }, [initializeAuth])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUserId(null)
    setEmail(null)
    setBusiness(null)
    setRole('user')
  }

  return (
    <AuthContext.Provider value={{ userId, email, business, role, loading, isAdmin: role === 'admin', signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}