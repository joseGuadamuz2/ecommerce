import { useEffect, useState } from 'react'

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
  const [fadeIn, setFadeIn] = useState(false)

  useEffect(() => {
    if (visible) {
      setStepIndex(0)
      setFadeIn(false)
      setTimeout(() => setFadeIn(true), 10)
    }
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const stepTimer = setInterval(() => {
      setStepIndex(prev => (prev + 1) % STEPS.length)
    }, 1800)
    return () => clearInterval(stepTimer)
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const dotTimer = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 400)
    return () => clearInterval(dotTimer)
  }, [visible])

  if (!visible) return null

  const step = STEPS[stepIndex]

  return (
    <div style={{
      ...styles.overlay,
      opacity: fadeIn ? 1 : 0,
      transition: 'opacity 0.3s ease',
    }}>
      <div style={styles.card}>

        {/* Ícono animado */}
        <div style={styles.iconWrapper}>
          <div style={styles.iconRing} />
          <div style={styles.iconRing2} />
          <span style={styles.icon}>{step.icon}</span>
        </div>

        {/* Título */}
        <p style={styles.title}>Generando PDF</p>

        {/* Paso actual */}
        <div style={styles.stepRow}>
          <p style={styles.stepText}>{step.text}</p>
          <span style={styles.dots}>{dots}</span>
        </div>

        {/* Barra de progreso animada */}
        <div style={styles.progressTrack}>
          <div style={{
            ...styles.progressBar,
            animationDuration: `${STEPS.length * 1.8}s`,
          }} />
        </div>

        {/* Steps indicadores */}
        <div style={styles.stepsRow}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                ...styles.stepDot,
                background: i <= stepIndex ? 'var(--accent)' : '#e2e8f0',
                transform: i === stepIndex ? 'scale(1.3)' : 'scale(1)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        <p style={styles.hint}>Esto puede tomar unos segundos</p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    zIndex: 9999,
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
    maxWidth: '360px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: '0 25px 60px rgba(15, 23, 42, 0.25)',
    border: '1px solid rgba(226, 232, 240, 0.8)',
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
  iconRing: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    border: '3px solid transparent',
    borderTopColor: 'var(--accent)',
    borderRightColor: 'var(--accent)',
    animation: 'spin 1s linear infinite',
  },
  iconRing2: {
    position: 'absolute',
    inset: '8px',
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
    height: '22px',
  },
  stepText: {
    fontSize: '0.88rem',
    color: 'var(--text-muted)',
    margin: 0,
    fontWeight: 500,
    transition: 'all 0.3s ease',
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
  stepsRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  stepDot: {
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
