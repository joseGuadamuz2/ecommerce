import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProductById, getSettings } from '../services/productService'
import { ArrowLeft, MessageCircle } from 'lucide-react'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState<any>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [whatsappBase, setWhatsappBase] = useState('')

  // Zoom state
  const [zoomed, setZoomed] = useState(false)
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 })
  const imgBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([
      getProductById(id),
      getSettings(),
    ]).then(([p, settings]) => {
      setProduct(p)
      const main = p.product_images?.find((i: any) => i.is_main) || p.product_images?.[0]
      setSelectedImage(main?.url || null)
      const code = settings?.whatsapp_country_code || '506'
      const number = settings?.whatsapp_number?.replace(/\s/g, '') || ''
      setWhatsappBase(`${code}${number}`)
      setLoading(false)
    })
  }, [id])

  const handleWhatsApp = () => {
    if (!whatsappBase || !product) return
    const productUrl = `${window.location.origin}/producto/${product.id}`
    const msg = encodeURIComponent(
      `Hola! Me interesa este producto:\n` +
      `*${product.name}*\n` +
      `Precio: ₡${product.price.toLocaleString()}\n` +
      `Código: ${product.id.slice(0, 8).toUpperCase()}\n` +
      `Ver producto: ${productUrl}`
    )
    window.open(`https://wa.me/${whatsappBase}?text=${msg}`, '_blank')
  }

  const ZOOM_FACTOR = 2.5
  const LENS_SIZE = 120

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const box = imgBoxRef.current
    if (!box) return
    const rect = box.getBoundingClientRect()
    let x = e.clientX - rect.left
    let y = e.clientY - rect.top
    // Clamp so lens stays inside
    x = Math.max(LENS_SIZE / 2, Math.min(rect.width - LENS_SIZE / 2, x))
    y = Math.max(LENS_SIZE / 2, Math.min(rect.height - LENS_SIZE / 2, y))
    setLensPos({ x, y })
  }

  if (loading) return <p style={{ padding: '2rem' }}>Cargando...</p>
  if (!product) return <p style={{ padding: '2rem' }}>Producto no encontrado.</p>

  const sortedImages = [...(product.product_images || [])].sort(
    (a: any, b: any) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0)
  )

  const bgX = lensPos.x * ZOOM_FACTOR - LENS_SIZE / 2
  const bgY = lensPos.y * ZOOM_FACTOR - LENS_SIZE / 2

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <button onClick={() => navigate(-1)} style={styles.back}>
        <ArrowLeft size={16} /> Volver
      </button>

      <div style={styles.layout}>
        {/* Imágenes */}
        <div style={styles.gallery}>
          <div
            ref={imgBoxRef}
            style={{ ...styles.mainImgBox, cursor: zoomed ? 'zoom-out' : 'zoom-in' }}
            onMouseEnter={() => setZoomed(true)}
            onMouseLeave={() => setZoomed(false)}
            onMouseMove={handleMouseMove}
          >
            {selectedImage ? (
              <>
                <img src={selectedImage} alt={product.name} style={styles.mainImg} />
                {/* Zoom lens */}
                {zoomed && (
                  <div
                    style={{
                      position: 'absolute',
                      width: `${LENS_SIZE}px`,
                      height: `${LENS_SIZE}px`,
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.8)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                      overflow: 'hidden',
                      pointerEvents: 'none',
                      left: lensPos.x - LENS_SIZE / 2,
                      top: lensPos.y - LENS_SIZE / 2,
                      zIndex: 10,
                      backgroundImage: `url(${selectedImage})`,
                      backgroundSize: `${imgBoxRef.current ? imgBoxRef.current.offsetWidth * ZOOM_FACTOR : 600}px auto`,
                      backgroundPosition: `-${bgX}px -${bgY}px`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                )}
              </>
            ) : (
              <span style={{ fontSize: '4rem' }}>👕</span>
            )}
          </div>

          {sortedImages.length > 1 && (
            <div style={styles.thumbs}>
              {sortedImages.map((img: any) => (
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
                    opacity: selectedImage === img.url ? 1 : 0.7,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={styles.info}>
          <p style={styles.productCode}>
            Código: <strong>{product.id.slice(0, 8).toUpperCase()}</strong>
          </p>

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

          {/* Botón WhatsApp — sin restricción de stock */}
          <button
            onClick={handleWhatsApp}
            disabled={!whatsappBase}
            style={{
              ...styles.whatsappBtn,
              opacity: !whatsappBase ? 0.5 : 1,
              cursor: !whatsappBase ? 'not-allowed' : 'pointer',
            }}
          >
            <MessageCircle size={20} />
            Pedir por WhatsApp
          </button>
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
    position: 'relative',
    userSelect: 'none',
  },
  mainImg: { width: '100%', height: '100%', objectFit: 'cover' },
  thumbs: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  thumb: {
    width: '64px', height: '64px', borderRadius: '8px',
    objectFit: 'cover', cursor: 'pointer',
    transition: 'opacity 0.15s, border 0.15s',
  },
  info: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  productCode: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    margin: 0,
    fontFamily: 'monospace',
    background: 'var(--bg-main)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    padding: '4px 10px',
    alignSelf: 'flex-start',
  },
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
  whatsappBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
    padding: '0.9rem 1.5rem',
    background: '#25d366',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: 700,
    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.35)',
    marginTop: '0.5rem',
    transition: 'opacity 0.2s',
  },
}