import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import AdminLayout from '../components/AdminLayout'
import { getProducts, deleteProduct, getSettings } from '../services/productService'
import type { Product } from '../types/product'
import { Plus, Pencil, Trash2, FileDown } from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'
import { generateCatalogPDF } from '../services/pdfService'

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const data = await getProducts()
      setProducts(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProducts() }, [])

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar producto?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
    })

    if (!result.isConfirmed) return

    await deleteProduct(id)
    fetchProducts()

    Swal.fire({
      title: '¡Eliminado!',
      text: 'El producto fue eliminado correctamente.',
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      confirmButtonColor: '#6366f1',
    })
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const settings = await getSettings()
      const storeUrl = window.location.origin
      await generateCatalogPDF(products as any, settings, storeUrl)
    } catch (err) {
      console.error('Error generando PDF:', err)
      Swal.fire({
        title: 'Error',
        text: 'No se pudo generar el PDF. Intentá de nuevo.',
        icon: 'error',
        confirmButtonColor: '#6366f1',
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <AdminLayout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Productos</h1>
          <p style={styles.subtitle}>Gestioná tu catálogo</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            style={{
              ...styles.exportBtn,
              opacity: exporting || products.length === 0 ? 0.6 : 1,
              cursor: exporting || products.length === 0 ? 'not-allowed' : 'pointer',
            }}
            onClick={handleExportPDF}
            disabled={exporting || products.length === 0}
          >
            <FileDown size={18} />
            {isMobile ? '' : exporting ? 'Generando...' : 'Exportar PDF'}
          </button>

          <button
            style={styles.addBtn}
            onClick={() => navigate('/admin/productos/nuevo')}
          >
            <Plus size={18} />
            {!isMobile && 'Nuevo producto'}
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#999' }}>Cargando...</p>
      ) : products.length === 0 ? (
        <div style={styles.empty}>
          <p>Aún no hay productos. ¡Creá el primero!</p>
        </div>
      ) : isMobile ? (
        // ── VISTA MÓVIL: cards ──
        <div style={styles.cardList}>
          {products.map((p: any) => {
            const img = p.product_images?.find((i: any) => i.is_main) || p.product_images?.[0]
            return (
              <div key={p.id} style={styles.mobileCard}>
                <div style={styles.mobileImgBox}>
                  {img
                    ? <img src={img.url} alt={p.name} style={styles.mobileImg} />
                    : <span style={{ fontSize: '1.5rem' }}>👕</span>
                  }
                </div>
                <div style={styles.mobileInfo}>
                  <p style={styles.mobileName}>{p.name}</p>
                  <p style={styles.mobilePrice}>₡{p.price.toLocaleString()}</p>
                  <span style={{
                    ...styles.stockBadge,
                    background: p.stock > 0 ? 'var(--success-light)' : 'var(--danger-light)',
                    color: p.stock > 0 ? 'var(--success)' : 'var(--danger)',
                    borderColor: p.stock > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  }}>
                    {p.stock > 0 ? `${p.stock} uds` : 'Agotado'}
                  </span>
                </div>
                <div style={styles.mobileActions}>
                  <button
                    style={styles.editBtn}
                    onClick={() => navigate(`/admin/productos/editar/${p.id}`)}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // ── VISTA DESKTOP: tabla con miniaturas ──
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Producto</th>
                <th style={styles.th}>Precio</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Tallas</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => {
                const img = p.product_images?.find((i: any) => i.is_main) || p.product_images?.[0]
                return (
                  <tr key={p.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.productCell}>
                        <div style={styles.thumbBox}>
                          {img
                            ? <img src={img.url} alt={p.name} style={styles.thumb} />
                            : <span style={{ fontSize: '1.1rem' }}>👕</span>
                          }
                        </div>
                        <span style={styles.productName}>{p.name}</span>
                      </div>
                    </td>
                    <td style={styles.td}>₡{p.price.toLocaleString()}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.stockBadge,
                        background: p.stock > 0 ? 'var(--success-light)' : 'var(--danger-light)',
                        color: p.stock > 0 ? 'var(--success)' : 'var(--danger)',
                        borderColor: p.stock > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      }}>
                        {p.stock > 0 ? `${p.stock} uds` : 'Agotado'}
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      {p.sizes?.join(', ') || '—'}
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          style={styles.editBtn}
                          onClick={() => navigate(`/admin/productos/editar/${p.id}`)}
                          title="Editar"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          style={styles.deleteBtn}
                          onClick={() => handleDelete(p.id)}
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    gap: '1rem',
  },
  title: { fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px', margin: 0 },
  subtitle: { color: 'var(--text-muted)', marginTop: '0.2rem', fontSize: '0.92rem', fontWeight: 500 },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.65rem 1.25rem',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
  },
  exportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.65rem 1.25rem',
    background: '#fff',
    color: 'var(--text-main)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: 600,
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)',
  },
  empty: {
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
    padding: '4rem 2rem',
    textAlign: 'center',
    color: 'var(--text-muted)',
    boxShadow: 'var(--card-shadow)',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  mobileCard: {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    padding: '0.9rem 1.1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: 'var(--card-shadow)',
  },
  mobileImgBox: {
    width: '52px',
    height: '52px',
    borderRadius: '10px',
    overflow: 'hidden',
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border-color)',
    flexShrink: 0,
  },
  mobileImg: { width: '100%', height: '100%', objectFit: 'cover' },
  mobileInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  mobileName: { fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', margin: 0 },
  mobilePrice: { fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600, margin: 0 },
  mobileActions: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  tableWrapper: {
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--card-shadow)',
    overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '1rem 1.25rem',
    textAlign: 'left',
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border-color)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid var(--border-color)',
    transition: 'background 0.15s',
  },
  td: { padding: '0.85rem 1.25rem', fontSize: '0.92rem', color: 'var(--text-main)' },
  productCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  thumbBox: {
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    overflow: 'hidden',
    background: '#f1f5f9',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  thumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  productName: {
    fontWeight: 600,
    fontSize: '0.92rem',
    color: 'var(--text-main)',
  },
  stockBadge: {
    display: 'inline-block',
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: '20px',
    border: '1px solid transparent',
  },
  editBtn: {
    padding: '0.5rem',
    background: 'var(--accent-light)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: 'var(--accent)',
    display: 'flex',
    transition: 'all 0.2s',
  },
  deleteBtn: {
    padding: '0.5rem',
    background: 'var(--danger-light)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    color: 'var(--danger)',
    display: 'flex',
    transition: 'all 0.2s',
  },
}