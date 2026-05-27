import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { getProducts } from '../services/productService'
import { Package, Image, AlertTriangle, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getProducts().then(data => {
      setProducts(data)
      setLoading(false)
    })
  }, [])

  const totalProducts = products.length
  const totalImages = products.reduce((acc, p) => acc + (p.product_images?.length || 0), 0)
  const destacados = products.filter(p => p.featured).length
  const conDescuento = products.filter(p => (p.discount_percent ?? 0) > 0).length

  const stats = [
    { label: 'Productos', value: totalProducts, icon: Package, color: '#4f46e5', bg: '#ede9fe' },
    { label: 'Imágenes', value: totalImages, icon: Image, color: '#0891b2', bg: '#e0f2fe' },
    { label: 'Destacados', value: destacados, icon: AlertTriangle, color: '#d97706', bg: '#fef3c7' },
    { label: 'Con descuento', value: conDescuento, icon: TrendingUp, color: '#059669', bg: '#d1fae5' },
  ]

  return (
    <AdminLayout>
      <h1 style={styles.title}>Dashboard</h1>
      <p style={styles.subtitle}>Resumen de tu tienda</p>

      {/* Stats */}
      <div style={styles.statsGrid}>
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} style={styles.statCard}>
              <div style={{ ...styles.iconBox, background: stat.bg }}>
                <Icon size={22} color={stat.color} />
              </div>
              <div>
                <p style={styles.statValue}>
                  {loading ? '...' : stat.value}
                </p>
                <p style={styles.statLabel}>{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Últimos productos */}
      <div style={styles.recentSection}>
        <div style={styles.recentHeader}>
          <h2 style={styles.recentTitle}>Últimos productos</h2>
          <button
            style={styles.verTodos}
            onClick={() => navigate('/admin/productos')}
          >
            Ver todos →
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#999' }}>Cargando...</p>
        ) : products.length === 0 ? (
          <p style={{ color: '#999' }}>No hay productos aún.</p>
        ) : (
          <div style={styles.recentGrid}>
            {products.slice(0, 4).map(p => {
              const img = p.product_images?.find((i: any) => i.is_main) || p.product_images?.[0]
              return (
                <div
                  key={p.id}
                  style={styles.recentCard}
                  onClick={() => navigate(`/admin/productos/editar/${p.id}`)}
                >
                  <div style={styles.recentImgBox}>
                    {img ? (
                      <img src={img.url} alt={p.name} style={styles.recentImg} />
                    ) : (
                      <span style={{ fontSize: '1.5rem' }}>📦</span>
                    )}
                  </div>
                  <div style={styles.recentInfo}>
                    <p style={styles.recentName}>{p.name}</p>
                    <p style={styles.recentPrice}>₡{p.price.toLocaleString()}</p>
                  </div>
                  {p.discount_percent > 0 && (
                    <span style={{ ...styles.stockBadge, background: '#fef2f2', color: '#ef4444', borderColor: '#fecaca' }}>
                      -{p.discount_percent}%
                    </span>
                  )}
                  {p.featured && (
                    <span style={{ ...styles.stockBadge, background: '#fefce8', color: '#d97706', borderColor: '#fde68a' }}>
                      ⭐
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  title: { fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' },
  subtitle: { color: 'var(--text-muted)', marginTop: '0.2rem', marginBottom: '2rem', fontSize: '0.92rem', fontWeight: 500 },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.25rem',
    marginBottom: '2.5rem',
  },
  statCard: {
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
    padding: '1.5rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    boxShadow: 'var(--card-shadow)',
  },
  iconBox: {
    borderRadius: '12px',
    padding: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.02)',
  },
  statValue: { fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.5px' },
  statLabel: { color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' },
  recentSection: {
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
    padding: '1.75rem',
    boxShadow: 'var(--card-shadow)',
  },
  recentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.25rem',
  },
  recentTitle: { fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' },
  verTodos: {
    background: 'transparent',
    border: 'none',
    color: 'var(--accent)',
    cursor: 'pointer',
    fontSize: '0.88rem',
    fontWeight: 700,
  },
  recentGrid: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  recentCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.1rem',
    padding: '0.85rem 1rem',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: 'var(--bg-main)',
    border: '1px solid var(--border-color)',
  },
  recentImgBox: {
    width: '52px',
    height: '52px',
    borderRadius: '10px',
    overflow: 'hidden',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border: '1px solid var(--border-color)',
  },
  recentImg: { width: '100%', height: '100%', objectFit: 'cover' },
  recentInfo: { flex: 1 },
  recentName: { fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', margin: 0 },
  recentPrice: { fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600, marginTop: '0.15rem', margin: 0 },
  stockBadge: {
    fontSize: '0.78rem',
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: '20px',
    whiteSpace: 'nowrap',
    border: '1px solid transparent',
  },
}