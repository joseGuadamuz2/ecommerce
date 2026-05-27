import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const STEPS = [
  { icon: '📋', text: 'Preparando el catálogo...' },
  { icon: '🖼️', text: 'Cargando imágenes...' },
  { icon: '📐', text: 'Componiendo páginas...' },
  { icon: '✨', text: 'Aplicando estilos...' },
  { icon: '📄', text: 'Generando PDF...' },
]

export default function PdfLoadingOverlay({ visible }: { visible: boolean }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [dots, setDots] = useState('')
  const [mounted, setMounted] = useState(false)

  // Montar solo en cliente
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (visible) setStepIndex(0)
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const t = setInterval(() => {
      setStepIndex(prev => (prev + 1) % STEPS.length)
    }, 1800)
    return () => clearInterval(t)
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const t = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 400)
    return () => clearInterval(t)
  }, [visible])

  // Bloquear scroll del body mientras está visible
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [visible])

  if (!mounted || !visible) return null

  const step = STEPS[stepIndex]

  // Portal directo al body para evitar problemas de stacking context en móvil
  return createPortal(
    <div style={styles.overlay}>
      <div style={styles.card}>

        {/* Anillos giratorios + ícono */}
        <div style={styles.iconWrapper}>
          <div style={styles.ring1} />
          <div style={styles.ring2} />
          <span style={styles.icon}>{step.icon}</span>
        </div>

        <p style={styles.title}>Generando PDF</p>

        <div style={styles.stepRow}>
          <p style={styles.stepText}>{step.text}</p>
          <span style={styles.dots}>{dots}</span>
        </div>

        <div style={styles.progressTrack}>
          <div style={{
            ...styles.progressBar,
            animationDuration: `${STEPS.length * 1.8}s`,
          }} />
        </div>

        <div style={styles.dotsRow}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.dot,
                background: i <= stepIndex ? 'var(--accent)' : '#e2e8f0',
                transform: i === stepIndex ? 'scale(1.35)' : 'scale(1)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        <p style={styles.hint}>Esto puede tomar unos segundos</p>
      </div>
    </div>,
    document.body
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Sin backdrop-filter — causa stacking context en móvil
    background: 'rgba(15, 23, 42, 0.75)',
    zIndex: 99999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  card: {
    background: '#fff',
    borderRadius: '24px',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '340px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: '0 25px 60px rgba(15, 23, 42, 0.35)',
    border: '1px solid #e2e8f0',
  },
  iconWrapper: {
    position: 'relative',
    width: '80px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.25rem',
  },
  ring1: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    border: '3px solid transparent',
    borderTopColor: 'var(--accent)',
    borderRightColor: 'var(--accent)',
    animation: 'spin 1s linear infinite',
  },
  ring2: {
    position: 'absolute',
    inset: '9px',
    borderRadius: '50%',
    border: '2px solid transparent',
    borderBottomColor: 'var(--accent)',
    opacity: 0.4,
    animation: 'spin 1.5s linear infinite reverse',
  },
  icon: {
    fontSize: '2rem',
    animation: 'pdfIconPulse 1.8s ease-in-out infinite',
    display: 'block',
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    margin: 0,
    letterSpacing: '-0.3px',
  },
  stepRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.1rem',
    minHeight: '22px',
  },
  stepText: {
    fontSize: '0.88rem',
    color: 'var(--text-muted)',
    margin: 0,
    fontWeight: 500,
  },
  dots: {
    fontSize: '0.88rem',
    color: 'var(--accent)',
    fontWeight: 700,
    width: '20px',
    display: 'inline-block',
  },
  progressTrack: {
    width: '100%',
    height: '6px',
    background: '#f1f5f9',
    borderRadius: '99px',
    overflow: 'hidden',
    marginTop: '0.25rem',
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--accent), #818cf8)',
    borderRadius: '99px',
    animation: 'pdfProgress linear forwards',
    width: '0%',
  },
  dotsRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  hint: {
    fontSize: '0.75rem',
    color: '#cbd5e1',
    margin: 0,
    fontWeight: 500,
  },
}
