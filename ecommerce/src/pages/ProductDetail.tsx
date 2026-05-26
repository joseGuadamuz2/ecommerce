import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProductById } from '../services/productService'
import { ArrowLeft } from 'lucide-react'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getProductById(id).then(p => {
      setProduct(p)
      const main = p.product_images?.find((i: any) => i.is_main) || p.product_images?.[0]
      setSelectedImage(main?.url || null)
      setLoading(false)
    })
  }, [id])

  if (loading) return <p style={{ padding: '2rem' }}>Cargando...</p>
  if (!product) return <p style={{ padding: '2rem' }}>Producto no encontrado.</p>

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <button onClick={() => navigate(-1)} style={styles.back}>
        <ArrowLeft size={16} /> Volver
      </button>

      <div style={styles.layout}>
        {/* Imágenes */}
        <div style={styles.gallery}>
          <div style={styles.mainImgBox}>
            {selectedImage
              ? <img src={selectedImage} alt={product.name} style={styles.mainImg} />
              : <span style={{ fontSize: '4rem' }}>👕</span>
            }
          </div>
          {product.product_images?.length > 1 && (
            <div style={styles.thumbs}>
              {product.product_images.map((img: any) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt=""
                  onClick={() => setSelectedImage(img.url)}
                  style={{
                    ...styles.thumb,
                    border: selectedImage === img.url
                      ? '2px solid var(--accent)'
                      : '2px solid transparent',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={styles.info}>
          <h1 style={styles.name}>{product.name}</h1>
          <p style={styles.price}>₡{product.price.toLocaleString()}</p>

          {product.description && (
            <p style={styles.description}>{product.description}</p>
          )}

          {product.sizes?.length > 0 && (
            <div style={styles.section}>
              <p style={styles.label}>Tallas disponibles</p>
              <div style={styles.tags}>
                {product.sizes.map((s: string) => (
                  <span key={s} style={styles.tag}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {product.colors?.length > 0 && (
            <div style={styles.section}>
              <p style={styles.label}>Colores</p>
              <div style={styles.tags}>
                {product.colors.map((c: string) => (
                  <span key={c} style={styles.tag}>{c}</span>
                ))}
              </div>
            </div>
          )}

          <p style={{
            ...styles.stock,
            color: product.stock > 0 ? 'var(--success)' : 'var(--danger)',
          }}>
            {product.stock > 0 ? `✓ ${product.stock} unidades disponibles` : '✗ Agotado'}
          </p>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  back: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    background: '#fff', border: '1px solid var(--border-color)',
    borderRadius: '8px', padding: '0.5rem 0.9rem',
    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
    color: 'var(--text-muted)', marginBottom: '1.5rem',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2.5rem',
  },
  gallery: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  mainImgBox: {
    width: '100%', aspectRatio: '1',
    borderRadius: '16px', overflow: 'hidden',
    background: '#f1f5f9', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    border: '1px solid var(--border-color)',
  },
  mainImg: { width: '100%', height: '100%', objectFit: 'cover' },
  thumbs: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  thumb: {
    width: '64px', height: '64px', borderRadius: '8px',
    objectFit: 'cover', cursor: 'pointer',
  },
  info: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  name: { fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 },
  price: { fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', margin: 0 },
  description: { color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 },
  section: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', margin: 0 },
  tags: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' },
  tag: {
    padding: '0.35rem 0.85rem', borderRadius: '20px',
    background: '#f1f5f9', fontSize: '0.82rem',
    fontWeight: 600, color: 'var(--text-muted)',
    border: '1px solid var(--border-color)',
  },
  stock: { fontWeight: 700, fontSize: '0.9rem' },
}