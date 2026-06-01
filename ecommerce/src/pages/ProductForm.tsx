import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import AdminLayout from '../components/AdminLayout'
import { createProduct, getProductById, updateProduct, uploadImage, deleteProductImage, setMainImage, saveProductImage } from '../services/productService'
import { processImage } from '../hooks/useImageProcessor'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Save, Upload, Trash2, Star } from 'lucide-react'

interface LocalImage {
  file: File
  preview: string
  isMain: boolean
}

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { business } = useAuth()
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
  })

  const [savedImages, setSavedImages] = useState<any[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  useEffect(() => {
    if (isEditing && business) {
      setLoading(true)
      getProductById(id, business.id).then(product => {
        setForm({
          name: product.name,
          description: product.description || '',
          price: String(product.price),
          discount_percent: String(product.discount_percent ?? 0),
          featured: product.featured ?? false,
        })
        const imgs = [...(product.product_images || [])]
        imgs.sort((a: any, b: any) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0))
        setSavedImages(imgs)
        setLoading(false)
      }).catch(() => {
        setError('No se pudo cargar el producto')
        setLoading(false)
      })
    }
  }, [id, business])

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

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newImages: LocalImage[] = files
      .filter(f => f.size <= 20 * 1024 * 1024)
      .map((file, i) => ({
        file,
        preview: URL.createObjectURL(file),
        isMain: localImages.length === 0 && savedImages.length === 0 && i === 0,
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

  const handleSetMainSaved = (index: number) => {
    setSavedImages(prev =>
      prev.map((img, i) => ({ ...img, is_main: i === index }))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!business) {
      setError('No se pudo obtener tu negocio')
      return
    }

    setSaving(true)
    setError('')

    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        discount_percent: parseInt(form.discount_percent) || 0,
        featured: form.featured,
        is_active: true,
        sizes: [],
      }

      let productId = id

      if (isEditing) {
        await updateProduct(id, payload, business.id)
      } else {
        const created = await createProduct(payload, business.id)
        productId = created.id
      }

      // Guardar nuevas imágenes
      let imageErrors = false
      for (const img of localImages) {
        try {
          const processed = await processImage(img.file, {
            maxSize: 1200,
            quality: 0.82,
            format: 'image/webp',
          })
          const url = await uploadImage(processed, productId!)
          await saveProductImage(productId!, url, img.isMain)
        } catch (imgErr) {
          console.error('Error al guardar imagen:', imgErr)
          imageErrors = true
        }
      }

      // Actualizar imagen principal si fue modificada
      try {
        if (isEditing && savedImages[0]) {
          const mainImage = savedImages.find(img => img.is_main)
          if (mainImage && mainImage.id !== savedImages[0].id) {
            await setMainImage(mainImage.id, productId!)
          }
        }
      } catch (err) {
        console.error('Error al actualizar imagen principal:', err)
      }

      await Swal.fire({
        title: '¡Guardado!',
        text: isEditing
          ? 'Producto actualizado correctamente.'
          : 'Producto creado correctamente.' + (imageErrors ? ' (algunas imágenes no se guardaron)' : ''),
        icon: imageErrors ? 'warning' : 'success',
        timer: 1800,
        showConfirmButton: false,
        confirmButtonColor: '#6366f1',
      })

      navigate('/admin/productos')
    } catch (err: any) {
      console.error('Error al guardar producto:', err)
      Swal.fire({
        title: 'Error',
        text: err?.message || 'No se pudo guardar el producto. Intentá de nuevo.',
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

          {/* Imágenes guardadas (editando) */}
          {savedImages.length > 0 && (
            <div style={styles.subsection}>
              <h3 style={styles.subsectionTitle}>Imágenes actuales</h3>
              <div style={styles.grid}>
                {savedImages.map((img, i) => (
                  <div
                    key={img.id}
                    style={styles.imgCard}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDrop={() => handleDrop(i)}
                    onDragOver={handleDragOver}
                  >
                    <img src={img.url} alt="" style={styles.img} />
                    {img.is_main && <div style={styles.mainBadge}>Principal</div>}
                    <div style={styles.imgActions}>
                      {!img.is_main && (
                        <button
                          type="button"
                          style={styles.starBtn}
                          onClick={() => handleSetMainSaved(i)}
                          title="Marcar como principal"
                        >
                          <Star size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        style={styles.deleteImgBtn}
                        onClick={() => handleRemoveSaved(img.id, img.url)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Imágenes nuevas */}
          {localImages.length > 0 && (
            <div style={styles.subsection}>
              <h3 style={styles.subsectionTitle}>Nuevas imágenes</h3>
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
            </div>
          )}
        </div>

        {/* ── INFORMACIÓN ── */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📋 Información</h2>

          <div style={styles.field}>
            <label style={styles.label}>Nombre del producto *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              style={styles.input}
              placeholder="Ej: Camiseta Premium"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Descripción</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
              placeholder="Detalles sobre el producto..."
            />
          </div>
        </div>

        {/* ── PRECIOS ── */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>💰 Precios y Promoción</h2>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Precio *</label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                style={styles.input}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Descuento (%)</label>
              <input
                type="number"
                value={form.discount_percent}
                onChange={e => setForm({ ...form, discount_percent: e.target.value })}
                style={styles.input}
                placeholder="0"
                min="0"
                max="100"
              />
            </div>
          </div>

          {discountVal > 0 && (
            <p style={styles.discountPreview}>
              💚 Precio final: ₡{finalPrice.toFixed(2)} (ahorrás ₡{(originalPrice - finalPrice).toFixed(2)})
            </p>
          )}
        </div>

        {/* ── OPCIONES ── */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>⭐ Opciones</h2>

          <div
            style={{
              ...styles.toggleRow,
              borderColor: form.featured ? 'var(--accent)' : 'var(--border-color)',
              background: form.featured ? 'rgba(99, 102, 241, 0.04)' : '#fff',
            }}
            onClick={() => setForm({ ...form, featured: !form.featured })}
          >
            <div style={styles.toggleInfo}>
              <div style={styles.toggleTitle}>Destacado</div>
              <p style={styles.toggleSub}>Mostrar en sección de destacados</p>
            </div>
            <div
              style={{
                ...styles.toggle,
                background: form.featured ? 'var(--accent)' : '#ddd',
              }}
            >
              <div
                style={{
                  ...styles.toggleThumb,
                  transform: form.featured ? 'translateX(20px)' : 'translateX(0)',
                }}
              />
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
  subsection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  subsectionTitle: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    margin: 0,
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
    cursor: 'grab',
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
    alignItems: 'flex-start',
    gap: '0.75rem',
    flexDirection: 'column',
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
