import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getBusinessBySlug } from '../services/businessService'
import { getPublicProductsByBusiness } from '../services/productService'
import type { Business } from '../types/business'
import type { Product } from '../types/product'
import ProductCard from '../components/ProductCard'
import { Search, SlidersHorizontal, FileDown } from 'lucide-react'
import { generateCatalogPDF } from '../services/pdfService'
import PdfLoadingOverlay from '../components/PdfLoadingOverlay'

type FilterType = 'all' | 'featured' | 'discount' | 'recent'

export default function PublicCatalog() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  
  const [business, setBusiness] = useState<Business | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const PRODUCTS_PER_PAGE = 8

  useEffect(() => {
    if (!slug) return

    Promise.all([
      getBusinessBySlug(slug),
    ])
      .then(async ([biz]) => {
        setBusiness(biz)
        
        // Aplicar color accent del negocio
        if (biz.accent_color) {
          document.documentElement.style.setProperty('--accent', biz.accent_color)
        }
        
        // Cargar productos del negocio
        const prods = await getPublicProductsByBusiness(biz.id)
        setProducts(prods)
        setLoading(false)
      })
      .catch(() => {
        setNotFound(true)
        setLoading(false)
      })
  }, [slug])

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))

    let matchesFilter = true
    if (activeFilter === 'featured') matchesFilter = !!(p as any).featured
    else if (activeFilter === 'discount') matchesFilter = ((p as any).discount_percent ?? 0) > 0
    else if (activeFilter === 'recent') {
      const created = new Date(p.created_at).getTime()
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
      matchesFilter = created >= cutoff
    }

    return matchesSearch && matchesFilter
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

  const handleFilterChange = (val: FilterType) => {
    setActiveFilter(val)
    setCurrentPage(1)
  }

  const handleGeneratePDF = async () => {
    if (!business) return
    setExporting(true)
    try {
      await generateCatalogPDF(filteredProducts as any, business, window.location.origin)
    } catch (error) {
      console.error('Error generando PDF:', error)
    } finally {
      setExporting(false)
    }
  }

  const FILTERS: { key: FilterType; label: string; icon: string }[] = [
    { key: 'all', label: 'Todos', icon: '🛍️' },
    { key: 'featured', label: 'Destacados', icon: '⭐' },
    { key: 'discount', label: 'Con descuento', icon: '🏷️' },
    { key: 'recent', label: 'Recientes', icon: '🆕' },
  ]

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.loadingText}>Cargando catálogo...</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={styles.container}>
        <div style={styles.notFoundBox}>
          <h1 style={styles.notFoundTitle}>Catálogo no encontrado</h1>
          <p style={styles.notFoundText}>El negocio que buscas no existe o está inactivo.</p>
          <button style={styles.homeBtn} onClick={() => navigate('/')}>
            ← Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      {exporting && <PdfLoadingOverlay />}
      
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          {business?.logo_url && (
            <img src={business.logo_url} alt={business.name} style={styles.logo} />
          )}
          <div>
            <h1 style={styles.storeName}>{business?.name}</h1>
            {business?.banner_subtitle && (
              <p style={styles.storeSubtitle}>{business.banner_subtitle}</p>
            )}
          </div>
        </div>
      </div>

      <div style={styles.container}>
        {/* Search & Filters */}
        <div style={styles.toolbar}>
          <div style={styles.searchBox}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder={`Buscar ${business?.product_label || 'productos'}...`}
              value={searchTerm}
              onChange={e => handleSearchChange(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.controls}>
            <button
              style={{
                ...styles.filterBtn,
                background: activeFilter !== 'all' ? 'var(--accent)' : 'transparent',
                color: activeFilter !== 'all' ? '#fff' : 'var(--text-muted)',
              }}
              onClick={() => handleFilterChange('all')}
            >
              <SlidersHorizontal size={16} />
              Filtros
            </button>

            <button
              style={styles.pdfBtn}
              onClick={handleGeneratePDF}
              title="Descargar PDF del catálogo"
            >
              <FileDown size={16} />
              PDF
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div style={styles.filterPills}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              style={{
                ...styles.pill,
                background: activeFilter === f.key ? 'var(--accent)' : 'transparent',
                color: activeFilter === f.key ? '#fff' : 'var(--text-muted)',
                borderColor: activeFilter === f.key ? 'var(--accent)' : 'var(--border-color)',
              }}
              onClick={() => handleFilterChange(f.key)}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {paginatedProducts.length > 0 ? (
          <>
            <div style={styles.grid}>
              {paginatedProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onNavigate={() => navigate(`/producto/${product.id}`)}
                  whatsappBase={`${business?.whatsapp_country_code}${business?.whatsapp_number}`}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  style={styles.paginationBtn}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ← Anterior
                </button>
                <span style={styles.pageInfo}>
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  style={styles.paginationBtn}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>
              No hay {business?.product_label || 'productos'} que coincidan con tu búsqueda.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          © {new Date().getFullYear()} {business?.name}. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f8f9fa',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: 'linear-gradient(135deg, var(--accent) 0%, rgba(99,102,241,0.8) 100%)',
    color: '#fff',
    padding: '3rem 2rem',
    textAlign: 'center',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  logo: {
    height: '80px',
    width: 'auto',
    objectFit: 'contain',
  },
  storeName: {
    fontSize: '2.2rem',
    fontWeight: 800,
    margin: 0,
    letterSpacing: '-0.5px',
  },
  storeSubtitle: {
    fontSize: '1rem',
    opacity: 0.9,
    margin: '0.5rem 0 0 0',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
    width: '100%',
    flex: 1,
  },
  toolbar: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '0.7rem 1rem',
    flex: 1,
    minWidth: '200px',
    boxShadow: '0 2px 6px rgba(15,23,42,0.04)',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '0.95rem',
    width: '100%',
    background: 'transparent',
    color: 'var(--text-main)',
  },
  controls: {
    display: 'flex',
    gap: '0.75rem',
  },
  filterBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.65rem 1rem',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    transition: 'all 0.2s',
    background: '#fff',
    boxShadow: '0 2px 6px rgba(15,23,42,0.04)',
  },
  pdfBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.65rem 1rem',
    background: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    transition: 'all 0.2s',
    boxShadow: '0 2px 6px rgba(15,23,42,0.04)',
  },
  filterPills: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  pill: {
    padding: '0.6rem 1.1rem',
    border: '1px solid',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    transition: 'all 0.2s',
    background: '#fff',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5rem',
    marginTop: '2rem',
  },
  paginationBtn: {
    padding: '0.6rem 1.2rem',
    background: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-main)',
    transition: 'all 0.2s',
  },
  pageInfo: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem 1rem',
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
  },
  emptyText: {
    color: 'var(--text-muted)',
    fontSize: '1rem',
    margin: 0,
  },
  footer: {
    borderTop: '1px solid var(--border-color)',
    padding: '2rem',
    textAlign: 'center',
    background: '#fff',
  },
  footerText: {
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    margin: 0,
  },
  loadingText: {
    textAlign: 'center',
    padding: '3rem 1rem',
    color: 'var(--text-muted)',
  },
  notFoundBox: {
    textAlign: 'center',
    padding: '3rem 1rem',
    margin: 'auto',
  },
  notFoundTitle: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    margin: '0 0 1rem 0',
  },
  notFoundText: {
    color: 'var(--text-muted)',
    fontSize: '1rem',
    margin: '0 0 1.5rem 0',
  },
  homeBtn: {
    padding: '0.7rem 1.5rem',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 600,
  },
}
