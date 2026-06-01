import { useEffect, useRef, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { uploadLogo } from '../services/businessService'
import { updateBusiness } from '../services/businessService'
import { useAuth } from '../context/AuthContext'
import { Save, CheckCircle, Upload, X } from 'lucide-react'

const COUNTRIES = [
  { name: 'Costa Rica',     code: '506', flag: '🇨🇷' },
  { name: 'México',         code: '52',  flag: '🇲🇽' },
  { name: 'Guatemala',      code: '502', flag: '🇬🇹' },
  { name: 'Honduras',       code: '504', flag: '🇭🇳' },
  { name: 'El Salvador',    code: '503', flag: '🇸🇻' },
  { name: 'Nicaragua',      code: '505', flag: '🇳🇮' },
  { name: 'Panamá',         code: '507', flag: '🇵🇦' },
  { name: 'Colombia',       code: '57',  flag: '🇨🇴' },
  { name: 'Venezuela',      code: '58',  flag: '🇻🇪' },
  { name: 'Ecuador',        code: '593', flag: '🇪🇨' },
  { name: 'Perú',           code: '51',  flag: '🇵🇪' },
  { name: 'Chile',          code: '56',  flag: '🇨🇱' },
  { name: 'Argentina',      code: '54',  flag: '🇦🇷' },
  { name: 'Uruguay',        code: '598', flag: '🇺🇾' },
  { name: 'Brasil',         code: '55',  flag: '🇧🇷' },
  { name: 'España',         code: '34',  flag: '🇪🇸' },
  { name: 'Estados Unidos', code: '1',   flag: '🇺🇸' },
]

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#0ea5e9', '#3b82f6', '#64748b', '#000000',
]

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

export default function Settings() {
  const { business } = useAuth()
  const [countryCode, setCountryCode]     = useState('506')
  const [number, setNumber]               = useState('')
  const [storeName, setStoreName]         = useState('')
  const [logoUrl, setLogoUrl]             = useState<string | null>(null)
  const [accentColor, setAccentColor]     = useState('#6366f1')
  const [bannerLabel, setBannerLabel]     = useState('')
  const [bannerTitle, setBannerTitle]     = useState('')
  const [bannerSubtitle, setBannerSubtitle] = useState('')
  const [productLabel, setProductLabel]   = useState('')
  const [loading, setLoading]             = useState(true)
  const [saving, setSaving]               = useState(false)
  const [saved, setSaved]                 = useState(false)
  const [error, setError]                 = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (business) {
      setCountryCode(business.whatsapp_country_code || '506')
      setNumber(business.whatsapp_number || '')
      setStoreName(business.name || '')
      setLogoUrl(business.logo_url || null)
      setAccentColor(business.accent_color || '#6366f1')
      setBannerLabel(business.banner_label || '')
      setBannerTitle(business.banner_title || '')
      setBannerSubtitle(business.banner_subtitle || '')
      setProductLabel(business.product_label || '')
      setLoading(false)
    }
  }, [business])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !business?.id) return
    setUploadingLogo(true)
    try {
      const url = await uploadLogo(file)
      setLogoUrl(url)
      await updateBusiness(business.id, { logo_url: url })
    } catch {
      setError('No se pudo subir el logo')
    } finally {
      setUploadingLogo(false)
      e.target.value = ''
    }
  }

  const handleRemoveLogo = async () => {
    if (!business?.id) return
    setLogoUrl(null)
    await updateBusiness(business.id, { logo_url: null })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!number.trim()) { setError('Ingresá un número de WhatsApp'); return }
    if (!business?.id) return
    setSaving(true)
    setError('')
    try {
      await updateBusiness(business.id, {
        whatsapp_country_code: countryCode,
        whatsapp_number: number.trim(),
        name: storeName.trim(),
        accent_color: accentColor,
        banner_label: bannerLabel.trim(),
        banner_title: bannerTitle.trim(),
        banner_subtitle: bannerSubtitle.trim(),
        product_label: productLabel.trim(),
      })
      // Aplicar color en tiempo real
      document.documentElement.style.setProperty('--accent', accentColor)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const preview = number ? `+${countryCode} ${number}` : '—'
  const [r, g, b] = hexToRgb(accentColor)

  if (loading) return <AdminLayout><p>Cargando...</p></AdminLayout>

  return (
    <AdminLayout>
      <h1 style={styles.title}>Configuración</h1>
      <p style={styles.subtitle}>Personalizá tu tienda</p>

      <form onSubmit={handleSave} style={styles.wrapper}>

        {/* ── IDENTIDAD ── */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>🏪 Identidad de la tienda</h2>

          <div style={styles.field}>
            <label style={styles.label}>Nombre de la tienda</label>
            <input
              style={styles.input}
              value={storeName}
              placeholder="Mi Tienda"
              onChange={e => setStoreName(e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Tipo de producto (plural)</label>
            <input
              style={styles.input}
              value={productLabel}
              placeholder="camisas, zapatos, accesorios..."
              onChange={e => setProductLabel(e.target.value)}
            />
            <span style={styles.hint}>Se usa en el buscador y textos del catálogo</span>
          </div>

          {/* Logo */}
          <div style={styles.field}>
            <label style={styles.label}>Logo</label>
            <div style={styles.logoRow}>
              <div style={styles.logoPreview}>
                {logoUrl
                  ? <img src={logoUrl} alt="logo" style={styles.logoImg} />
                  : <span style={{ fontSize: '1.5rem' }}>🏪</span>
                }
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  style={styles.uploadBtn}
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  <Upload size={14} />
                  {uploadingLogo ? 'Subiendo...' : 'Subir logo'}
                </button>
                {logoUrl && (
                  <button type="button" style={styles.removeBtn} onClick={handleRemoveLogo}>
                    <X size={14} /> Quitar
                  </button>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleLogoUpload}
              />
            </div>
            <span style={styles.hint}>PNG o SVG transparente recomendado</span>
          </div>
        </div>

        {/* ── COLORES ── */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>🎨 Color principal</h2>
          <p style={styles.hint}>
            Afecta botones, precios, enlaces y el color del PDF
          </p>

          <div style={styles.colorGrid}>
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setAccentColor(c)}
                style={{
                  ...styles.colorSwatch,
                  background: c,
                  outline: accentColor === c ? `3px solid ${c}` : '3px solid transparent',
                  outlineOffset: '2px',
                  transform: accentColor === c ? 'scale(1.15)' : 'scale(1)',
                }}
                title={c}
              />
            ))}
          </div>

          <div style={styles.colorCustomRow}>
            <label style={styles.label}>Color personalizado</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="color"
                value={accentColor}
                onChange={e => setAccentColor(e.target.value)}
                style={styles.colorPicker}
              />
              <span style={{ ...styles.colorHex, color: accentColor }}>{accentColor.toUpperCase()}</span>
              <span style={styles.hint}>RGB: {r}, {g}, {b}</span>
            </div>
          </div>

          {/* Preview */}
          <div style={styles.colorPreview}>
            <button style={{ ...styles.previewBtn, background: accentColor }}>Botón de ejemplo</button>
            <span style={{ ...styles.previewPrice, color: accentColor }}>₡12,500</span>
            <span style={{ ...styles.previewBadge, background: accentColor + '20', color: accentColor }}>
              Destacado
            </span>
          </div>
        </div>

        {/* ── BANNER ── */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>🖼️ Banner del catálogo</h2>

          <div style={styles.field}>
            <label style={styles.label}>Etiqueta superior</label>
            <input
              style={styles.input}
              value={bannerLabel}
              placeholder="Nueva Colección 2026"
              onChange={e => setBannerLabel(e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Título principal</label>
            <input
              style={styles.input}
              value={bannerTitle}
              placeholder="Elegancia & Confort"
              onChange={e => setBannerTitle(e.target.value)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Subtítulo</label>
            <textarea
              style={{ ...styles.input, minHeight: '72px', resize: 'vertical' }}
              value={bannerSubtitle}
              placeholder="Describí tu tienda en una frase..."
              onChange={e => setBannerSubtitle(e.target.value)}
            />
          </div>

          {/* Preview del banner */}
          <div style={{ ...styles.bannerPreview, background: `linear-gradient(135deg, #0b0f19 0%, #18182b 100%)` }}>
            {bannerLabel && (
              <span style={{ ...styles.bpLabel, background: accentColor + '22', color: accentColor }}>
                {bannerLabel}
              </span>
            )}
            <h3 style={styles.bpTitle}>{bannerTitle || 'Título del banner'}</h3>
            <p style={styles.bpSub}>{bannerSubtitle || 'Subtítulo del banner'}</p>
          </div>
        </div>

        {/* ── WHATSAPP ── */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>📱 WhatsApp de contacto</h2>

          <div style={styles.field}>
            <label style={styles.label}>País</label>
            <select style={styles.select} value={countryCode} onChange={e => setCountryCode(e.target.value)}>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.name} (+{c.code})</option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Número de WhatsApp</label>
            <div style={styles.inputRow}>
              <span style={styles.prefix}>+{countryCode}</span>
              <input
                style={{ ...styles.input, border: 'none', flex: 1, borderRadius: 0 }}
                type="tel"
                placeholder="88887777"
                value={number}
                onChange={e => setNumber(e.target.value.replace(/[^0-9\s]/g, ''))}
              />
            </div>
          </div>

          <div style={styles.previewBox}>
            <span style={styles.previewLabel}>Vista previa</span>
            <span style={styles.previewNumber}>{preview}</span>
          </div>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {saved && (
          <div style={styles.successMsg}>
            <CheckCircle size={16} color="#059669" />
            <span>¡Guardado correctamente!</span>
          </div>
        )}

        <button type="submit" style={{ ...styles.saveBtn, background: accentColor }} disabled={saving}>
          <Save size={18} />
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </form>
    </AdminLayout>
  )
}

const styles: Record<string, React.CSSProperties> = {
  title:    { fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px', margin: 0 },
  subtitle: { color: 'var(--text-muted)', marginTop: '0.2rem', marginBottom: '2rem', fontSize: '0.92rem' },
  wrapper:  { display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '620px' },
  card: {
    background: '#fff', borderRadius: '16px', padding: '2rem',
    boxShadow: 'var(--card-shadow)', border: '1px solid var(--border-color)',
    display: 'flex', flexDirection: 'column', gap: '1.25rem',
  },
  sectionTitle: {
    fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)',
    margin: 0, paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-color)',
  },
  field:  { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label:  { fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' },
  hint:   { fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 },
  input: {
    padding: '0.7rem 0.95rem', borderRadius: '10px',
    border: '1px solid var(--border-color)', fontSize: '0.95rem', outline: 'none',
  },
  select: {
    padding: '0.7rem 0.95rem', borderRadius: '10px',
    border: '1px solid var(--border-color)', fontSize: '0.95rem',
    background: '#fff', cursor: 'pointer', outline: 'none',
  },
  inputRow: {
    display: 'flex', alignItems: 'center',
    border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden',
  },
  prefix: {
    padding: '0.7rem 0.95rem', background: 'var(--bg-main)',
    fontWeight: 700, fontSize: '0.9rem', borderRight: '1px solid var(--border-color)',
    whiteSpace: 'nowrap', color: 'var(--text-main)',
  },
  logoRow:    { display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' },
  logoPreview: {
    width: '64px', height: '64px', borderRadius: '12px',
    border: '1px solid var(--border-color)', background: 'var(--bg-main)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
  },
  logoImg:  { width: '100%', height: '100%', objectFit: 'contain' },
  uploadBtn: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.5rem 1rem', background: 'var(--bg-main)',
    border: '1px solid var(--border-color)', borderRadius: '8px',
    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)',
  },
  removeBtn: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.5rem 1rem', background: 'var(--danger-light)',
    border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px',
    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--danger)',
  },
  colorGrid: { display: 'flex', flexWrap: 'wrap', gap: '0.6rem' },
  colorSwatch: {
    width: '32px', height: '32px', borderRadius: '50%',
    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
  },
  colorCustomRow: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  colorPicker: { width: '48px', height: '36px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', padding: '2px' },
  colorHex:   { fontSize: '1rem', fontWeight: 800, fontFamily: 'monospace' },
  colorPreview: {
    display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
    padding: '1rem', background: 'var(--bg-main)', borderRadius: '10px',
    border: '1px solid var(--border-color)',
  },
  previewBtn: {
    padding: '0.5rem 1.2rem', color: '#fff', border: 'none',
    borderRadius: '8px', fontWeight: 700, fontSize: '0.88rem', cursor: 'default',
  },
  previewPrice:  { fontSize: '1.2rem', fontWeight: 800 },
  previewBadge: {
    padding: '0.3rem 0.8rem', borderRadius: '20px',
    fontSize: '0.82rem', fontWeight: 700,
  },
  bannerPreview: {
    borderRadius: '12px', padding: '2rem 1.5rem',
    display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start',
  },
  bpLabel:   { fontSize: '0.72rem', fontWeight: 700, letterSpacing: '1px', padding: '3px 10px', borderRadius: '20px' },
  bpTitle:   { fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.5px' },
  bpSub:     { fontSize: '0.88rem', color: '#94a3b8', margin: 0 },
  previewBox: {
    background: 'var(--bg-main)', borderRadius: '10px', padding: '1rem',
    display: 'flex', flexDirection: 'column', gap: '0.25rem',
    border: '1px solid var(--border-color)',
  },
  previewLabel:  { fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' },
  previewNumber: { fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' },
  successMsg: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    color: 'var(--success)', fontSize: '0.88rem',
    background: 'var(--success-light)', padding: '0.65rem 1rem',
    borderRadius: '8px', border: '1px solid rgba(16,185,129,0.15)',
  },
  error: {
    color: 'var(--danger)', fontSize: '0.88rem',
    background: 'var(--danger-light)', padding: '0.5rem 0.85rem',
    borderRadius: '8px', border: '1px solid rgba(239,68,68,0.15)', margin: 0,
  },
  saveBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    padding: '0.85rem', color: '#fff', border: 'none',
    borderRadius: '10px', fontSize: '0.98rem', fontWeight: 700, cursor: 'pointer',
  },
}