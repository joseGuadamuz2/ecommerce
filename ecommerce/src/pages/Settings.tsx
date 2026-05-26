import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { getSettings, updateSettings } from '../services/productService'
import { Save, CheckCircle } from 'lucide-react'

const COUNTRIES = [
  { name: 'Costa Rica', code: '506', flag: '🇨🇷' },
  { name: 'México', code: '52', flag: '🇲🇽' },
  { name: 'Guatemala', code: '502', flag: '🇬🇹' },
  { name: 'Honduras', code: '504', flag: '🇭🇳' },
  { name: 'El Salvador', code: '503', flag: '🇸🇻' },
  { name: 'Nicaragua', code: '505', flag: '🇳🇮' },
  { name: 'Panamá', code: '507', flag: '🇵🇦' },
  { name: 'Colombia', code: '57', flag: '🇨🇴' },
  { name: 'Venezuela', code: '58', flag: '🇻🇪' },
  { name: 'Ecuador', code: '593', flag: '🇪🇨' },
  { name: 'Perú', code: '51', flag: '🇵🇪' },
  { name: 'Chile', code: '56', flag: '🇨🇱' },
  { name: 'Argentina', code: '54', flag: '🇦🇷' },
  { name: 'Uruguay', code: '598', flag: '🇺🇾' },
  { name: 'Brasil', code: '55', flag: '🇧🇷' },
  { name: 'España', code: '34', flag: '🇪🇸' },
  { name: 'Estados Unidos', code: '1', flag: '🇺🇸' },
]

export default function Settings() {
  const [settingsId, setSettingsId] = useState('')
  const [countryCode, setCountryCode] = useState('506')
  const [number, setNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getSettings().then(data => {
      setSettingsId(data.id)
      setCountryCode(data.whatsapp_country_code || '506')
      setNumber(data.whatsapp_number || '')
      setLoading(false)
    })
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!number.trim()) {
      setError('Ingresá un número de WhatsApp')
      return
    }
    setSaving(true)
    setError('')
    try {
      await updateSettings(settingsId, countryCode, number.trim())
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

 // const selectedCountry = COUNTRIES.find(c => c.code === countryCode)
  const preview = number ? `+${countryCode} ${number}` : '—'
  const whatsappLink = number
    ? `https://wa.me/${countryCode}${number.replace(/\s/g, '')}`
    : null

  return (
    <AdminLayout>
      <h1 style={styles.title}>Configuración</h1>
      <p style={styles.subtitle}>Ajustes generales de tu tienda</p>

      {loading ? (
        <p style={{ color: '#999' }}>Cargando...</p>
      ) : (
        <form onSubmit={handleSave} style={styles.card}>
          <h2 style={styles.sectionTitle}>📱 WhatsApp de contacto</h2>
          <p style={styles.hint}>
            Este número recibirá los pedidos cuando un cliente haga click en "Encargar por WhatsApp"
          </p>

          {/* País */}
          <div style={styles.field}>
            <label style={styles.label}>País</label>
            <select
              style={styles.select}
              value={countryCode}
              onChange={e => setCountryCode(e.target.value)}
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name} (+{c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Número */}
          <div style={styles.field}>
            <label style={styles.label}>Número de WhatsApp</label>
            <div style={styles.inputRow}>
              <span style={styles.prefix}>+{countryCode}</span>
              <input
                style={styles.input}
                type="tel"
                placeholder="88887777"
                value={number}
                onChange={e => setNumber(e.target.value.replace(/[^0-9\s]/g, ''))}
              />
            </div>
            <p style={styles.inputHint}>Solo números, sin el código de país</p>
          </div>

          {/* Preview */}
          <div style={styles.preview}>
            <p style={styles.previewLabel}>Vista previa del número</p>
            <p style={styles.previewNumber}>{preview}</p>
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.testLink}
              >
                Probar enlace →
              </a>
            )}
          </div>

          {error && <p style={styles.error}>{error}</p>}

          {saved && (
            <div style={styles.successMsg}>
              <CheckCircle size={16} color="#059669" />
              <span>¡Guardado correctamente!</span>
            </div>
          )}

          <button type="submit" style={styles.saveBtn} disabled={saving}>
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </form>
      )}
    </AdminLayout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  title: { fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px', margin: 0 },
  subtitle: { color: 'var(--text-muted)', marginTop: '0.2rem', marginBottom: '2rem', fontSize: '0.92rem', fontWeight: 500 },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '2.5rem 2rem',
    boxShadow: 'var(--card-shadow)',
    maxWidth: '520px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    border: '1px solid var(--border-color)',
  },
  sectionTitle: {
    fontSize: '1.05rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    margin: 0,
    paddingBottom: '0.65rem',
    borderBottom: '1px solid var(--border-color)',
  },
  hint: {
    fontSize: '0.88rem',
    color: 'var(--text-muted)',
    margin: 0,
    lineHeight: 1.5,
    fontWeight: 500,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
  },
  label: {
    fontWeight: 700,
    fontSize: '0.88rem',
    color: 'var(--text-main)',
  },
  select: {
    padding: '0.7rem 0.95rem',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    fontSize: '0.95rem',
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  prefix: {
    padding: '0.7rem 0.95rem',
    background: 'var(--bg-main)',
    color: 'var(--text-main)',
    fontWeight: 700,
    fontSize: '0.9rem',
    borderRight: '1px solid var(--border-color)',
    whiteSpace: 'nowrap',
  },
  input: {
    flex: 1,
    padding: '0.7rem 0.95rem',
    border: 'none',
    fontSize: '0.95rem',
    outline: 'none',
  },
  inputHint: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    margin: 0,
  },
  preview: {
    background: 'var(--bg-main)',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    border: '1px solid var(--border-color)',
  },
  previewLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    margin: 0,
    textTransform: 'uppercase',
    fontWeight: 700,
    letterSpacing: '0.5px',
  },
  previewNumber: {
    fontSize: '1.35rem',
    fontWeight: 800,
    color: 'var(--text-main)',
    margin: 0,
    letterSpacing: '-0.3px',
  },
  testLink: {
    fontSize: '0.88rem',
    color: 'var(--success)',
    fontWeight: 700,
    textDecoration: 'none',
  },
  successMsg: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: 'var(--success)',
    fontSize: '0.88rem',
    background: 'var(--success-light)',
    padding: '0.65rem 1rem',
    borderRadius: '8px',
    border: '1px solid rgba(16, 185, 129, 0.15)',
  },
  error: {
    color: 'var(--danger)',
    fontSize: '0.88rem',
    background: 'var(--danger-light)',
    padding: '0.5rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    margin: 0,
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
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
  },
}