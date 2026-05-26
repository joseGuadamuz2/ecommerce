import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { createProduct, getProductById, updateProduct, uploadImage, deleteProductImage, setMainImage } from '../services/productService'
import { processImage } from '../hooks/useImageProcessor'
import { ArrowLeft, Save, Upload, Trash2, Star } from 'lucide-react'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
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
    stock: '',
    sizes: [] as string[],
    colors: [] as string[],
  })

  // Para edición: imágenes ya guardadas
  const [savedImages, setSavedImages] = useState<any[]>([])

  // Responsive helper
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
          stock: String(product.stock),
          sizes: product.sizes || [],
          colors: product.colors || [],
        })
        setSavedImages(product.product_images || [])
        setLoading(false)
      })
    }
  }, [id])

  const handleRemoveSaved = async (imageId: string, url: string) => {
    try {
      await deleteProductImage(imageId, url)
      setSavedImages(prev => prev.filter(img => img.id !== imageId))
    } catch {
      setError('No se pudo eliminar la imagen')
    }
  }

  const handleSetMainSaved = async (imageId: string) => {
    if (!id) return
    try {
      await setMainImage(imageId, id)
      setSavedImages(prev => prev.map(img => ({ ...img, is_main: img.id === imageId })))
    } catch {
      setError('No se pudo actualizar la imagen principal')
    }
  }

  const toggleItem = (list: string[], item: string) =>
    list.includes(item) ? list.filter(i => i !== item) : [...list, item]

  // Agregar imágenes locales antes de guardar
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
      setError('Algunas imágenes superan 20MB y fueron ignoradas')
    } else {
      setError('')
    }

    setLocalImages(prev => [...prev, ...newImages])
    e.target.value = ''
  }

  const handleRemoveLocal = (index: number) => {
    setLocalImages(prev => {
      const updated = prev.filter((_, i) => i !== index)
      // Si se eliminó la principal y quedan imágenes, la primera pasa a ser principal
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
        stock: parseInt(form.stock),
        sizes: form.sizes,
        colors: form.colors,
      }

      let productId = id

      if (isEditing) {
        await updateProduct(id, payload)
      } else {
        const created = await createProduct(payload)
        productId = created.id
      }

      // Subir imágenes nuevas (recortadas en cuadrado y comprimidas)
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

      navigate('/admin/productos')
    } catch (err: any) {
      setError('Error al guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AdminLayout><p>Cargando...</p></AdminLayout>

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

          {/* Previews locales */}
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

          {/* Imágenes ya guardadas (modo edición) */}
          {savedImages.length > 0 && (
            <>
              <p style={{ fontSize: '0.85rem', color: '#888', margin: '0.5rem 0' }}>
                Imágenes actuales:
              </p>
              <div style={styles.grid}>
                {savedImages.map(img => (
                  <div key={img.id} style={styles.imgCard}>
                    <img src={img.url} alt="" style={styles.img} />
                    {img.is_main && <div style={styles.mainBadge}>Principal</div>}
                    <div style={styles.imgActions}>
                      {!img.is_main && (
                        <button
                          type="button"
                          style={styles.starBtn}
                          onClick={() => handleSetMainSaved(img.id)}
                          title="Marcar como principal"
                        >
                          <Star size={14} />
                        </button>
                      )}
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
    <label style={styles.label}>Stock *</label>
    <input
      style={styles.input}
      type="number"
      min="0"
      value={form.stock}
      onChange={e => setForm({ ...form, stock: e.target.value })}
      required
    />
  </div>
</div>

          <div style={styles.field}>
            <label style={styles.label}>Tallas disponibles</label>
            <div style={styles.tagGroup}>
              {SIZES.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setForm({ ...form, sizes: toggleItem(form.sizes, size) })}
                  style={{
                    ...styles.tag,
                    background: form.sizes.includes(size) ? 'var(--accent)' : '#f1f5f9',
                    color: form.sizes.includes(size) ? '#fff' : 'var(--text-muted)',
                    boxShadow: form.sizes.includes(size) ? '0 4px 10px rgba(99, 102, 241, 0.2)' : 'none',
                    borderColor: form.sizes.includes(size) ? 'var(--accent)' : 'transparent',
                  }}
                >
                  {size}
                </button>
              ))}
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