import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { LayoutDashboard, Package, LogOut, Menu, X, UserStar, Settings, Store, Users } from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Usuarios', path: '/admin/usuarios', icon: Users },
  { label: 'Productos', path: '/admin/productos', icon: Package },
  { label: 'Configuración', path: '/admin/configuracion', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleNav = (path: string) => {
    navigate(path)
    if (isMobile) setMenuOpen(false)
  }

  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
        <header style={styles.topbar}>
          <div style={styles.topbarLogo}>
            <div style={styles.mobileLogoBg}>
              <UserStar size={16} color="#fff" />
            </div>
            <span style={styles.topbarTitle}>Administrador</span>
          </div>
          <button style={styles.menuBtn} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} color="#fff" /> : <Menu size={22} color="#fff" />}
          </button>
        </header>

        {menuOpen && (
          <div style={styles.drawer}>
            <nav style={styles.drawerNav}>
              {navItems.map(item => {
                const Icon = item.icon
                const active = location.pathname === item.path
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    style={{
                      ...styles.drawerItem,
                      background: active ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.18) 0%, rgba(99, 102, 241, 0.03) 100%)' : 'transparent',
                      borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                      borderRadius: active ? '0 8px 8px 0' : '8px',
                    }}
                  >
                    <Icon size={18} color={active ? 'var(--accent)' : '#94a3b8'} />
                    <span style={{ ...styles.drawerLabel, color: active ? '#fff' : '#cbd5e1', fontWeight: active ? 600 : 500 }}>{item.label}</span>
                  </button>
                )
              })}

              <button
                onClick={() => { navigate("/"); setMenuOpen(false) }}
                style={styles.drawerCatalogBtn}
              >
                <Store size={18} color="#10b981" />
                <span style={{ ...styles.drawerLabel, color: '#10b981', fontWeight: 600 }}>Ver tienda</span>
              </button>

              <button style={styles.drawerLogout} onClick={handleLogout}>
                <LogOut size={18} color="#f43f5e" />
                <span style={{ ...styles.drawerLabel, color: '#f43f5e', fontWeight: 500 }}>Cerrar sesión</span>
              </button>
            </nav>
          </div>
        )}

        <main style={{ flex: 1, padding: '1.5rem', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>
    )
  }

  return (
    <div style={styles.desktopWrapper}>
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? '250px' : '72px' }}>
        <div style={styles.logo}>
          <div style={styles.logoIconBg}>
            <UserStar size={20} color="#fff" />
          </div>
          {sidebarOpen && <span style={styles.logoText}>Administrador</span>}
        </div>

        <button style={styles.toggleBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X size={16} color="#94a3b8" /> : <Menu size={16} color="#94a3b8" />}
        </button>

        <nav style={styles.nav}>
          {navItems.map(item => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  ...styles.navItem,
                  background: active ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.18) 0%, rgba(99, 102, 241, 0.03) 100%)' : 'transparent',
                  borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
                  borderRadius: active ? '0 8px 8px 0' : '8px',
                  paddingLeft: sidebarOpen ? '1rem' : '0.85rem',
                }}
              >
                <Icon size={18} color={active ? 'var(--accent)' : '#94a3b8'} />
                {sidebarOpen && (
                  <span style={{ 
                    ...styles.navLabel, 
                    color: active ? '#fff' : '#94a3b8',
                    fontWeight: active ? 600 : 500 
                  }}>
                    {item.label}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <button
          onClick={() => navigate("/")}
          style={styles.catalogBtn}
          title="Ver tienda"
        >
          <Store size={18} color="#10b981" />
          {sidebarOpen && (
            <span style={{ ...styles.navLabel, color: '#10b981', fontWeight: 600 }}>Ver tienda</span>
          )}
        </button>

        <button style={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={18} color="#f43f5e" />
          {sidebarOpen && <span style={{ ...styles.navLabel, color: '#f43f5e', fontWeight: 500 }}>Cerrar sesión</span>}
        </button>
      </aside>

      <main style={styles.main}>
        {children}
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  desktopWrapper: {
    display: 'flex',
    flexDirection: 'row',
    minHeight: '100vh',
    background: 'var(--bg-main)',
  },
  sidebar: {
    background: 'linear-gradient(180deg, #0b0f19 0%, #0f172a 100%)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflow: 'hidden',
    flexShrink: 0,
    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1.5rem 1rem 1rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  logoIconBg: {
    background: 'var(--accent)',
    padding: '0.4rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)',
  },
  logoText: {
    color: '#fff',
    fontWeight: 800,
    fontSize: '1.05rem',
    whiteSpace: 'nowrap',
    letterSpacing: '-0.3px',
  },
  toggleBtn: {
    background: 'rgba(255,255,255,0.02)',
    border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    cursor: 'pointer',
    padding: '0.6rem 1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    padding: '1rem 0.5rem 1rem 0',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '0.7rem 1rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  navLabel: {
    fontSize: '0.9rem',
    transition: 'color 0.2s',
  },
  catalogBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '0.9rem 1.25rem',
    background: 'rgba(16, 185, 129, 0.05)',
    border: 'none',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    transition: 'all 0.25s',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '0.9rem 1.25rem',
    background: 'rgba(239, 68, 68, 0.02)',
    border: 'none',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.25s',
  },
  main: {
    flex: 1,
    padding: '2.5rem',
    overflow: 'auto',
    minWidth: 0,
  },
  topbar: {
    background: '#0b0f19',
    padding: '0.85rem 1.25rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  topbarLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  mobileLogoBg: {
    background: 'var(--accent)',
    padding: '0.35rem',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topbarTitle: {
    color: '#fff',
    fontWeight: 800,
    fontSize: '0.95rem',
  },
  menuBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  drawer: {
    background: '#0b0f19',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: '50px',
    left: 0,
    right: 0,
    zIndex: 99,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
  },
  drawerNav: {
    display: 'flex',
    flexDirection: 'column',
    padding: '0.75rem',
    gap: '0.4rem',
  },
  drawerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '0.75rem 1rem',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.92rem',
    transition: 'all 0.2s',
  },
  drawerLabel: {
    fontSize: '0.92rem',
  },
  drawerCatalogBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '0.75rem 1rem',
    background: 'rgba(16, 185, 129, 0.08)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  drawerLogout: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '0.85rem 1rem',
    background: 'transparent',
    border: 'none',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    cursor: 'pointer',
    width: '100%',
  },
}