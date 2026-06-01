import { useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'

interface Props {
  product: any
  whatsappBase?: string
  onNavigate?: () => void
}

export default function ProductCard({ product, whatsappBase, onNavigate }: Props) {
  const navigate = useNavigate()
  const mainImage = product.product_images?.find((img: any) => img.is_main)
  const fallback = product.product_images?.[0]
  const imageUrl = mainImage?.url || fallback?.url

  const discount = product.discount_percent ?? 0
  const finalPrice = discount > 0
    ? product.price * (1 - discount / 100)
    : product.price

  const handleCardClick = () => {
    if (onNavigate) {
      onNavigate()
    } else {
      navigate(`/producto/${product.id}`)
    }
  }

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!whatsappBase) return
    const productUrl = `${window.location.origin}/producto/${product.id}`
    const msg = encodeURIComponent(
      `Hola! Me interesa este producto:\n` +
      `*${product.name}*\n` +
      `Precio: ₡${finalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}\n` +
      `Código: ${product.id.slice(0, 8).toUpperCase()}\n` +
      `Ver producto: ${productUrl}`
    )
    window.open(`https://wa.me/${whatsappBase}?text=${msg}`, '_blank')
  }

  return (
    <div
      className="product-card"
      onClick={handleCardClick}
    >
      <div style={styles.imgWrapper}>
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="product-card-img" />
        ) : (
          <div style={styles.noImg}>
            <span style={{ fontSize: '2.5rem' }}>📦</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Sin imagen</span>
          </div>
        )}
        {discount > 0 && (
          <div style={styles.discountBadge}>-{discount}%</div>
        )}
        {product.featured && (
          <div style={styles.featuredBadge}>⭐ Destacado</div>
        )}
      </div>

      <div style={styles.info}>
        <h3 style={styles.name}>{product.name}</h3>
        <p style={styles.code}>#{product.id.slice(0, 8).toUpperCase()}</p>

        {product.colors?.length > 0 && (
          <p style={styles.colors}>{product.colors.join(' · ')}</p>
        )}

        <div style={styles.footer}>
          <div style={styles.priceBlock}>
            {discount > 0 && (
              <span style={styles.originalPrice}>₡{product.price.toLocaleString()}</span>
            )}
            <p style={styles.price}>₡{finalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <span style={styles.viewBtn}>Ver detalles →</span>
        </div>

        {whatsappBase && (
          <button onClick={handleWhatsApp} style={styles.whatsappBtn}>
            <MessageCircle size={14} />
            Pedir por WhatsApp
          </button>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  imgWrapper: {
    width: '100%', aspectRatio: '3/4', overflow: 'hidden',
    background: '#f1f5f9', position: 'relative',
    borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
  },
  noImg: {
    width: '100%', height: '100%', display: 'flex',
    flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '0.5rem', background: '#f8fafc',
  },
  discountBadge: {
    position: 'absolute', top: '12px', right: '12px',
    background: '#ef4444', color: '#fff',
    fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px',
    borderRadius: '20px', letterSpacing: '0.3px',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
  },
  featuredBadge: {
    position: 'absolute', top: '12px', left: '12px',
    background: '#fbbf24', color: '#fff',
    fontSize: '0.68rem', fontWeight: 700, padding: '4px 9px',
    borderRadius: '20px',
    boxShadow: '0 4px 10px rgba(251, 191, 36, 0.35)',
  },
  info: {
    padding: '1.1rem 1.2rem 1.2rem', display: 'flex',
    flexDirection: 'column', gap: '0.45rem',
  },
  name: { fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: '1.3', margin: 0 },
  code: { fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', margin: 0, fontWeight: 600 },
  colors: { fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, margin: 0 },
  footer: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: '0.5rem', paddingTop: '0.5rem',
    borderTop: '1px solid rgba(226, 232, 240, 0.4)',
  },
  priceBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
  },
  originalPrice: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    textDecoration: 'line-through',
    fontWeight: 500,
  },
  price: { fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)', margin: 0 },
  viewBtn: { fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 },
  whatsappBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '0.4rem', padding: '0.55rem 0.9rem',
    background: '#25d366', color: '#fff', border: 'none',
    borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
    cursor: 'pointer', marginTop: '0.25rem',
    boxShadow: '0 3px 8px rgba(37, 211, 102, 0.3)',
  },
}
