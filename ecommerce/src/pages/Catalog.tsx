import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProducts, getSettings } from '../services/productService'
import type { Product } from '../types/product'
import ProductCard from '../components/ProductCard'
import { Shirt, Settings, Search, SlidersHorizontal, FileDown } from 'lucide-react'
import { generateCatalogPDF } from '../services/pdfService'

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStock, setFilterStock] = useState('all') // 'all', 'available', 'outOfStock'
  const [currentPage, setCurrentPage] = useState(1)
  const PRODUCTS_PER_PAGE = 8
  const navigate = useNavigate()

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStock = filterStock === 'all' ? true :
                         filterStock === 'available' ? p.stock > 0 : p.stock === 0
    return matchesSearch && matchesStock
  })

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  )

  const handleSearchChange = (val: string) => {
    setSearchTerm(val)
    setCurrentPage(1)
  }

  const handleFilterChange = (val: string) => {
    setFilterStock(val)
    setCurrentPage(1)
  }

  const handleGeneratePDF = async () => {
    setExporting(true)
    try {
      const settings = await getSettings()
      const storeUrl = window.location.origin
      await generateCatalogPDF(filteredProducts as any, settings, storeUrl)
    } catch (error) {
      console.error('Error generando PDF:', error)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <div style={styles.logoIconBg}>
              <Shirt size={20} color="#fff" />
            </div>
            <span style={styles.logoText}>CamisasShop</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              style={{
                ...styles.adminBtn,
                opacity: exporting || products.length === 0 ? 0.6 : 1,
                cursor: exporting || products.length === 0 ? 'not-allowed' : 'pointer',
              }}
              onClick={handleGeneratePDF}
              disabled={exporting || products.length === 0}
            >
              <FileDown size={15} />
              <span>{exporting ? 'Generando...' : 'PDF'}</span>
            </button>
            <button
              style={styles.adminBtn}
              onClick={() => navigate('/admin')}
            >
              <Settings size={15} />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroOverlay}></div>
        <div style={styles.heroContent}>
          <span style={styles.heroLabel}>Nueva Colección 2026</span>
          <h1 style={styles.heroTitle}>Elegancia & Confort</h1>
          <p style={styles.heroSub}>Camisas exclusivas confeccionadas con materiales de la más alta calidad</p>
        </div>
      </div>

      {/* Contenedor Principal */}
      <main style={styles.main}>
        {/* Barra de Filtros y Búsqueda */}
        <div style={styles.filterBar}>
          <div style={styles.searchBox}>
            <Search size={18} color="var(--text-muted)" style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Buscar camisas..."
              value={searchTerm}
              onChange={e => handleSearchChange(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterOptions}>
            <SlidersHorizontal size={15} color="var(--text-muted)" style={{ marginRight: '0.25rem' }} />
            <button
              onClick={() => handleFilterChange('all')}
              style={{
                ...styles.filterTab,
                background: filterStock === 'all' ? 'var(--accent)' : 'transparent',
                color: filterStock === 'all' ? '#fff' : 'var(--text-muted)',
                borderColor: filterStock === 'all' ? 'var(--accent)' : 'var(--border-color)',
              }}
            >
              Todos
            </button>
            <button
              onClick={() => handleFilterChange('available')}
              style={{
                ...styles.filterTab,
                background: filterStock === 'available' ? 'var(--accent)' : 'transparent',
                color: filterStock === 'available' ? '#fff' : 'var(--text-muted)',
                borderColor: filterStock === 'available' ? 'var(--accent)' : 'var(--border-color)',
              }}
            >
              Disponibles
            </button>
            <button
              onClick={() => handleFilterChange('outOfStock')}
              style={{
                ...styles.filterTab,
                background: filterStock === 'outOfStock' ? 'var(--accent)' : 'transparent',
                color: filterStock === 'outOfStock' ? '#fff' : 'var(--text-muted)',
                borderColor: filterStock === 'outOfStock' ? 'var(--accent)' : 'var(--border-color)',
              }}
            >
              Agotados
            </button>
          </div>
        </div>

        {/* Catálogo Grid */}
        {loading ? (
          <div style={styles.loadingWrapper}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Cargando catálogo exclusivo...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={{ fontSize: '2.5rem' }}>🔍</span>
            <h3 style={{ margin: '1rem 0 0.25rem', fontWeight: 700 }}>No se encontraron camisas</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              Intentá ajustar los filtros o términos de búsqueda.
            </p>
          </div>
        ) : (
          <>
            <div style={styles.grid}>
              {paginatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ←
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    style={{
                      ...styles.pageBtn,
                      background: currentPage === page ? 'var(--accent)' : '#fff',
                      color: currentPage === page ? '#fff' : 'var(--text-main)',
                      borderColor: currentPage === page ? 'var(--accent)' : 'var(--border-color)',
                      fontWeight: currentPage === page ? 700 : 500,
                    }}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}

                <button
                  style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  →
                </button>

                <span style={styles.pageInfo}>
                  {filteredProducts.length} productos · página {currentPage} de {totalPages}
                </span>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerLogo}>
            <Shirt size={18} color="var(--accent)" />
            <span style={styles.footerLogoText}>CamisasShop</span>
          </div>
          <p style={styles.footerCopy}>© 2026 CamisasShop · Confección Premium · Todos los derechos reservados</p>
        </div>
      </footer>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-main)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--glass-border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 10px rgba(15, 23, 42, 0.03)',
  },
  headerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0.85rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  logoIconBg: {
    background: 'var(--accent)',
    padding: '0.4rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(99, 102, 241, 0.25)',
  },
  logoText: {
    fontSize: '1.2rem',
    fontWeight: 800,
    letterSpacing: '-0.3px',
    background: 'linear-gradient(135deg, var(--text-main) 0%, #1e1b4b 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  adminBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.5rem 0.95rem',
    background: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-main)',
    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)',
  },
  hero: {
    background: 'linear-gradient(135deg, #0b0f19 0%, #18182b 100%)',
    position: 'relative',
    color: '#fff',
    textAlign: 'center',
    padding: '5rem 1.5rem',
    overflow: 'hidden',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 60%)',
    pointerEvents: 'none',
  },
  heroContent: {
    position: 'relative',
    maxWidth: '700px',
    margin: '0 auto',
    zIndex: 1,
  },
  heroLabel: {
    fontSize: '0.78rem',
    fontWeight: 700,
    letterSpacing: '1.5px',
    color: 'var(--accent)',
    textTransform: 'uppercase',
    background: 'rgba(99, 102, 241, 0.1)',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  heroTitle: {
    fontSize: '2.8rem',
    fontWeight: 800,
    marginTop: '1.25rem',
    letterSpacing: '-1px',
    lineHeight: '1.15',
  },
  heroSub: {
    fontSize: '1.1rem',
    color: '#94a3b8',
    marginTop: '0.85rem',
    fontWeight: 400,
    lineHeight: '1.5',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2.5rem 1.5rem',
    flex: 1,
    width: '100%',
    boxSizing: 'border-box',
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  searchBox: {
    position: 'relative',
    flex: '1 1 300px',
    maxWidth: '450px',
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  searchInput: {
    width: '100%',
    padding: '0.65rem 1rem 0.65rem 2.6rem',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    fontSize: '0.92rem',
    outline: 'none',
    background: '#fff',
    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)',
  },
  filterOptions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  filterTab: {
    padding: '0.4rem 0.95rem',
    borderRadius: '8px',
    border: '1px solid',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1.75rem',
  },
  loadingWrapper: {
    textAlign: 'center',
    padding: '6rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(99, 102, 241, 0.1)',
    borderTopColor: 'var(--accent)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: 'var(--text-muted)',
    fontSize: '0.92rem',
    fontWeight: 500,
  },
  emptyState: {
    textAlign: 'center',
    padding: '5rem 2rem',
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--card-shadow)',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    marginTop: '2.5rem',
    flexWrap: 'wrap',
  },
  pageBtn: {
    minWidth: '36px',
    height: '36px',
    padding: '0 0.6rem',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: '#fff',
    color: 'var(--text-main)',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  pageInfo: {
    marginLeft: '0.5rem',
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  footer: {
    borderTop: '1px solid var(--border-color)',
    background: '#fff',
    padding: '2rem 1.5rem',
    marginTop: '3rem',
  },
  footerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  footerLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  footerLogoText: {
    fontWeight: 700,
    color: 'var(--text-main)',
    fontSize: '1rem',
  },
  footerCopy: {
    color: 'var(--text-muted)',
    fontSize: '0.82rem',
    margin: 0,
  },
}