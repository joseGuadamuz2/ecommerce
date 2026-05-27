import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import AdminLayout from '../components/AdminLayout'
import { createProduct, getProductById, updateProduct, uploadImage, deleteProductImage, setMainImage } from '../services/productService'
import { processImage } from '../hooks/useImageProcessor'
import { ArrowLeft, Save, Upload, Trash2, Star } from 'lucide-react'

const COLORS = ['Blanco', 'Negro', 'Azul', 'Rojo', 'Verde', 'Gris', 'Amarillo']

interface LocalImage {
  file: File
  preview: string
  isMain: boolean
}

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = !!id

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [localImages, setLocalImages] = useState<LocalImage[]>([])

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    discount_percent: '0',
    featured: false,
    colors: [] as string[],
  })

  const [savedImages, setSavedImages] = useState<any[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState<boolean>(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 600)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (isEditing) {
      setLoading(true)
      getProductById(id).then(product => {
        setForm({
          name: product.name,
          description: product.description || '',
          price: String(product.price),
          discount_percent: String(product.discount_percent ?? 0),
          featured: product.featured ?? false,
          colors: product.colors || [],
        })
        const imgs = [...(product.product_images || [])]
        imgs.sort((a: any, b: any) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0))
        setSavedImages(imgs)
        setLoading(false)
      })
    }
  }, [id])

  const handleDragStart = (index: number) => setDragIndex(index)

  const handleDrop = async (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) return
    const reordered = [...savedImages]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(dropIndex, 0, moved)
    const updated = reordered.map((img, i) => ({ ...img, is_main: i === 0 }))
    setSavedImages(updated)
    setDragIndex(null)
    if (id && updated[0]) {
      try {
        await setMainImage(updated[0].id, id)
      } catch {
        setError('No se pudo actualizar el orden')
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  const handleRemoveSaved = async (imageId: string, url: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar imagen?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
    })

    if (!result.isConfirmed) return

    try {
      await deleteProductImage(imageId, url)
      setSavedImages(prev => {
        const updated = prev.filter(img => img.id !== imageId)
        return updated.map((img, i) => ({ ...img, is_main: i === 0 }))
      })
    } catch {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo eliminar la imagen.',
        icon: 'error',
        confirmButtonColor: '#6366f1',
      })
    }
  }

  const toggleItem = (list: string[], item: string) =>
    list.includes(item) ? list.filter(i => i !== item) : [...list, item]

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newImages: LocalImage[] = files
      .filter(f => f.size <= 20 * 1024 * 1024)
      .map((file, i) => ({
        file,
        preview: URL.createObjectURL(file),
        isMain: localImages.length === 0 && i === 0,
      }))

    if (files.some(f => f.size > 20 * 1024 * 1024)) {
      Swal.fire({
        title: 'Imágenes ignoradas',
        text: 'Algunas imágenes superan 20MB y fueron ignoradas.',
        icon: 'warning',
        confirmButtonColor: '#6366f1',
        timer: 3000,
        showConfirmButton: false,
      })
    } else {
      setError('')
    }

    setLocalImages(prev => [...prev, ...newImages])
    e.target.value = ''
  }

  const handleRemoveLocal = (index: number) => {
    setLocalImages(prev => {
      const updated = prev.filter((_, i) => i !== index)
      if (prev[index].isMain && updated.length > 0) {
        updated[0].isMain = true
      }
      return updated
    })
  }

  const handleSetMainLocal = (index: number) => {
    setLocalImages(prev =>
      prev.map((img, i) => ({ ...img, isMain: i === index }))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        discount_percent: parseInt(form.discount_percent) || 0,
        featured: form.featured,
        sizes: [],
        colors: form.colors,
      }

      let productId = id

      if (isEditing) {
        await updateProduct(id, payload)
      } else {
        const created = await createProduct(payload)
        productId = created.id
      }

      for (const img of localImages) {
        const processed = await processImage(img.file, {
          maxSize: 1200,
          quality: 0.82,
          format: 'image/webp',
        })
        const url = await uploadImage(processed, productId!)
        await import('../services/productService').then(m =>
          m.saveProductImage(productId!, url, img.isMain)
        )
      }

      await Swal.fire({
        title: '¡Guardado!',
        text: isEditing
          ? 'Producto actualizado correctamente.'
          : 'Producto creado correctamente.',
        icon: 'success',
        timer: 1800,
        showConfirmButton: false,
        confirmButtonColor: '#6366f1',
      })

      navigate('/admin/productos')
    } catch (err: any) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo guardar el producto. Intentá de nuevo.',
        icon: 'error',
        confirmButtonColor: '#6366f1',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLayout><p>Cargando...</p></AdminLayout>

  const discountVal = parseInt(form.discount_percent) || 0
  const originalPrice = parseFloat(form.price) || 0
  const finalPrice = discountVal > 0 ? originalPrice * (1 - discountVal / 100) : originalPrice

  return (
    <AdminLayout>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/admin/productos')}>
          <ArrowLeft size={18} /> Volver
        </button>
        <h1 style={styles.title}>{isEditing ? 'Editar producto' : 'Nuevo producto'}</h1>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>

        {/* ── SECCIÓN IMÁGENES ── */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🖼️ Imágenes</h2>

          <label style={styles.uploadArea}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleAddImages}
              style={{ display: 'none' }}
            />
            <Upload size={26} color="#888" />
            <p style={styles.uploadText}>Hacé click para agregar imágenes</p>
            <span style={styles.uploadHint}>PNG, JPG hasta 20MB · Se recortan en cuadrado y comprimen automáticamente</span>
          </label>

          {localImages.length > 0 && (
            <div style={styles.grid}>
              {localImages.map((img, i) => (
                <div key={i} style={styles.imgCard}>
                  <img src={img.preview} alt="" style={styles.img} />
                  {img.isMain && <div style={styles.mainBadge}>Principal</div>}
                  <div style={styles.imgActions}>
                    {!img.isMain && (
                      <button
                        type="button"
                        style={styles.starBtn}
                        onClick={() => handleSetMainLocal(i)}
                        title="Marcar como principal"
                      >
                        <Star size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      style={styles.deleteImgBtn}
                      onClick={() => handleRemoveLocal(i)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {savedImages.length > 0 && (
            <>
              <p style={styles.dragHint}>
                Imágenes actuales · <strong>arrastrá para reordenar</strong> · la primera es la principal
              </p>
              <div style={styles.grid}>
                {savedImages.map((img, index) => (
                  <div
                    key={img.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={() => setDragIndex(null)}
                    style={{
                      ...styles.imgCard,
                      opacity: dragIndex === index ? 0.35 : 1,
                      cursor: 'grab',
                      outline: dragIndex !== null && dragIndex !== index
                        ? '2px dashed var(--accent)'
                        : '2px solid transparent',
                      transform: dragIndex === index ? 'scale(0.96)' : 'scale(1)',
                      transition: 'opacity 0.2s, outline 0.15s, transform 0.15s',
                    }}
                  >
                    <img src={img.url} alt="" style={styles.img} />
                    {index === 0 && <div style={styles.mainBadge}>Principal</div>}
                    {index !== 0 && <div style={styles.orderBadge}>{index + 1}</div>}
                    <div style={styles.imgActions}>
                      <button
                        type="button"
                        style={styles.deleteImgBtn}
                        onClick={() => handleRemoveSaved(img.id, img.url)}
                        title="Eliminar imagen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── SECCIÓN INFO ── */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📝 Información del producto</h2>

          <div style={styles.field}>
            <label style={styles.label}>Nombre *</label>
            <input
              style={styles.input}
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Descripción</label>
            <textarea
              style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div style={{
            ...styles.row,
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Precio (₡) *</label>
              <input
                style={styles.input}
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Descuento (%)</label>
              <input
                style={styles.input}
                type="number"
                min="0"
                max="99"
                value={form.discount_percent}
                onChange={e => setForm({ ...form, discount_percent: e.target.value })}
              />
              {discountVal > 0 && originalPrice > 0 && (
                <span style={styles.discountPreview}>
                  Precio final: ₡{finalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              )}
            </div>
          </div>

          {/* Toggle Destacado */}
          <div style={styles.field}>
            <label style={styles.label}>Opciones</label>
            <div
              style={{
                ...styles.toggleRow,
                background: form.featured ? '#fef9c3' : '#f8fafc',
                borderColor: form.featured ? '#fbbf24' : 'var(--border-color)',
              }}
              onClick={() => setForm({ ...form, featured: !form.featured })}
            >
              <div style={styles.toggleInfo}>
                <span style={{ fontSize: '1.1rem' }}>⭐</span>
                <div>
                  <p style={styles.toggleTitle}>Producto destacado</p>
                  <p style={styles.toggleSub}>Aparecerá en el filtro de "Destacados"</p>
                </div>
              </div>
              <div style={{
                ...styles.toggle,
                background: form.featured ? '#f59e0b' : '#d1d5db',
              }}>
                <div style={{
                  ...styles.toggleThumb,
                  transform: form.featured ? 'translateX(20px)' : 'translateX(2px)',
                }} />
              </div>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Colores disponibles</label>
            <div style={styles.tagGroup}>
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, colors: toggleItem(form.colors, color) })}
                  style={{
                    ...styles.tag,
                    background: form.colors.includes(color) ? 'var(--accent)' : '#f1f5f9',
                    color: form.colors.includes(color) ? '#fff' : 'var(--text-muted)',
                    boxShadow: form.colors.includes(color) ? '0 4px 10px rgba(99, 102, 241, 0.2)' : 'none',
                    borderColor: form.colors.includes(color) ? 'var(--accent)' : 'transparent',
                  }}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" style={styles.saveBtn} disabled={saving}>
          <Save size={18} />
          {saving ? 'Guardando...' : 'Guardar producto'}
        </button>
      </form>
    </AdminLayout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    marginBottom: '2rem',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    background: '#fff',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '0.5rem 0.9rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    boxShadow: '0 2px 5px rgba(15,23,42,0.02)',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    letterSpacing: '-0.5px',
    margin: 0,
  },
  form: {
    background: '#fff',
    borderRadius: '16px',
    padding: '2.5rem 2rem',
    boxShadow: 'var(--card-shadow)',
    maxWidth: '700px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2.25rem',
    border: '1px solid var(--border-color)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  sectionTitle: {
    fontSize: '1.05rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    margin: 0,
    paddingBottom: '0.65rem',
    borderBottom: '1px solid var(--border-color)',
  },
  uploadArea: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '2.25rem',
    border: '2px dashed var(--border-color)',
    borderRadius: '12px',
    cursor: 'pointer',
    background: 'var(--bg-main)',
    transition: 'all 0.25s',
  },
  uploadText: {
    color: 'var(--text-main)',
    fontSize: '0.92rem',
    fontWeight: 600,
    margin: 0,
  },
  uploadHint: {
    color: 'var(--text-muted)',
    fontSize: '0.78rem',
  },
  dragHint: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    margin: '0.25rem 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
    gap: '0.85rem',
  },
  imgCard: {
    position: 'relative',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
    aspectRatio: '1',
    boxShadow: '0 2px 6px rgba(15,23,42,0.02)',
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  mainBadge: {
    position: 'absolute',
    top: '6px',
    left: '6px',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: '0.65rem',
    padding: '3px 8px',
    borderRadius: '20px',
    fontWeight: 700,
    boxShadow: '0 2px 6px rgba(99,102,241,0.3)',
  },
  orderBadge: {
    position: 'absolute',
    top: '6px',
    left: '6px',
    background: 'rgba(0,0,0,0.45)',
    color: '#fff',
    fontSize: '0.65rem',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
  },
  imgActions: {
    position: 'absolute',
    bottom: '6px',
    right: '6px',
    display: 'flex',
    gap: '0.35rem',
  },
  starBtn: {
    background: '#fffbe6',
    border: '1px solid #ffe58f',
    borderRadius: '6px',
    padding: '5px',
    cursor: 'pointer',
    color: '#d97706',
    display: 'flex',
  },
  deleteImgBtn: {
    background: 'var(--danger-light)',
    border: '1px solid rgba(239,68,68,0.15)',
    borderRadius: '6px',
    padding: '5px',
    cursor: 'pointer',
    color: 'var(--danger)',
    display: 'flex',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
  },
  row: {
    display: 'flex',
    gap: '1.25rem',
  },
  label: {
    fontWeight: 700,
    fontSize: '0.88rem',
    color: 'var(--text-main)',
  },
  input: {
    padding: '0.7rem 0.95rem',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    fontSize: '0.95rem',
    outline: 'none',
    boxShadow: '0 2px 4px rgba(15,23,42,0.01)',
  },
  discountPreview: {
    fontSize: '0.82rem',
    color: '#16a34a',
    fontWeight: 700,
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.2s',
    userSelect: 'none',
  },
  toggleInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  toggleTitle: {
    margin: 0,
    fontWeight: 700,
    fontSize: '0.9rem',
    color: 'var(--text-main)',
  },
  toggleSub: {
    margin: 0,
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
  },
  toggle: {
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    position: 'relative',
    transition: 'background 0.2s',
    flexShrink: 0,
  },
  toggleThumb: {
    position: 'absolute',
    top: '2px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s',
  },
  tagGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  tag: {
    padding: '0.45rem 1rem',
    borderRadius: '20px',
    border: '1px solid var(--border-color)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  saveBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.8rem',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.98rem',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
  },
  error: {
    color: 'var(--danger)',
    fontSize: '0.88rem',
    background: 'var(--danger-light)',
    padding: '0.5rem 0.85rem',
    borderRadius: '6px',
    border: '1px solid rgba(239,68,68,0.15)',
    margin: 0,
  },
}
