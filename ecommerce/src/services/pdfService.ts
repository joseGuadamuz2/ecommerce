import jsPDF from 'jspdf'
import type { Product } from '../types/product'
import type { Settings } from '../types/settings'

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
const fill = (pdf: jsPDF, c: readonly [number, number, number]) => pdf.setFillColor(...c)
const draw = (pdf: jsPDF, c: readonly [number, number, number]) => pdf.setDrawColor(...c)
const text = (pdf: jsPDF, c: readonly [number, number, number]) => pdf.setTextColor(...c)

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ]
}

// Aclara un color RGB mezclándolo con blanco
function lighten(rgb: [number, number, number], amount = 160): [number, number, number] {
  return [
    Math.min(255, rgb[0] + amount),
    Math.min(255, rgb[1] + amount),
    Math.min(255, rgb[2] + amount),
  ]
}

// Oscurece un color RGB
function darken(rgb: [number, number, number], amount = 40): [number, number, number] {
  return [
    Math.max(0, rgb[0] - amount),
    Math.max(0, rgb[1] - amount),
    Math.max(0, rgb[2] - amount),
  ]
}

// ─────────────────────────────────────────────
//  PALETA BASE (independiente del acento)
// ─────────────────────────────────────────────
const BASE = {
  coverBg:      [12, 10, 28]    as [number, number, number],
  coverBg2:     [20, 16, 48]    as [number, number, number],
  coverLine:    [60, 55, 120]   as [number, number, number],
  pageBg:       [250, 250, 253] as [number, number, number],
  headerBg:     [18, 14, 48]    as [number, number, number],
  cardBg:       [255, 255, 255] as [number, number, number],
  cardBorder:   [230, 228, 245] as [number, number, number],
  cardImgBg:    [244, 244, 250] as [number, number, number],
  textDark:     [18, 14, 48]    as [number, number, number],
  textMid:      [80, 75, 120]   as [number, number, number],
  textLight:    [150, 145, 180] as [number, number, number],
  textWhite:    [255, 255, 255] as [number, number, number],
  waBg:         [16, 185, 129]  as [number, number, number],
  waBgDark:     [5, 140, 95]    as [number, number, number],
  footerBorder: [210, 208, 230] as [number, number, number],
}

// ─────────────────────────────────────────────
//  GENERADOR PRINCIPAL
// ─────────────────────────────────────────────
export const generateCatalogPDF = async (
  products: Product[],
  settings: Settings,
  storeUrl: string
) => {
  // ── Colores dinámicos según accent_color ──
  const accentHex   = (settings as any).accent_color || '#6363ff'
  const accent      = hexToRgb(accentHex)
  const accentLight = lighten(accent, 160)
  const accentDark  = darken(accent, 40)
  const storeName   = (settings as any).store_name || 'Mi Tienda'
  const storeUpper  = storeName.toUpperCase()
  const bannerSub   = (settings as any).banner_subtitle || 'Productos de calidad'

  const C = {
    ...BASE,
    coverAccent:  accent,
    coverAccent2: [80, 200, 160] as [number, number, number],
    cardAccent:   accent,
    priceText:    accentDark,
    priceBg:      accentLight,
  }

  const pdf     = new jsPDF('p', 'mm', 'a4')
  const W       = 210
  const H       = 297
  const M       = 12
  const COLS    = 2
  const GAP     = 6
  const CARD_W  = (W - M * 2 - GAP) / COLS
  const CARD_H  = 108
  const IMG_H   = 64

  const waNumber = `${settings.whatsapp_country_code}${settings.whatsapp_number.replace(/\s/g, '')}`

  // ── PORTADA ──
  drawCover(pdf, W, H, waNumber, products.length, C, storeUpper, bannerSub)

  // ── PÁGINAS DE PRODUCTOS ──
  pdf.addPage()
  drawProductBg(pdf, W, H, C)
  drawHeader(pdf, W, M, C, storeName, accent)

  let curY = M + 22

  for (let i = 0; i < products.length; i++) {
    const col = i % COLS

    if (col === 0 && i !== 0) {
      curY += CARD_H + GAP
    }

    if (col === 0 && curY + CARD_H > H - M - 14) {
      pdf.addPage()
      drawProductBg(pdf, W, H, C)
      drawHeader(pdf, W, M, C, storeName, accent)
      curY = M + 22
    }

    const x          = M + col * (CARD_W + GAP)
    const productUrl = `${storeUrl}/producto/${products[i].id}`
    const waMsg      = `¡Hola! Me interesa:\n${products[i].name}\nPrecio: CRC ${products[i].price.toLocaleString()}\n${productUrl}`
    const waLink     = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMsg)}`
    await drawCard(pdf, products[i], x, curY, CARD_W, CARD_H, IMG_H, productUrl, waLink, C)
  }

  // ── FOOTERS ──
  const total = pdf.getNumberOfPages()
  for (let p = 2; p <= total; p++) {
    pdf.setPage(p)
    drawFooter(pdf, W, H, M, storeUrl, p - 1, total - 1, C, storeName)
  }

  const slug = storeName.toLowerCase().replace(/\s+/g, '-')
  pdf.save(`catalogo-${slug}.pdf`)
}

// ─────────────────────────────────────────────
//  PORTADA
// ─────────────────────────────────────────────
const drawCover = (
  pdf: jsPDF,
  W: number,
  H: number,
  waNumber: string,
  count: number,
  C: any,
  storeUpper: string,
  bannerSub: string,
) => {
  // Fondo base
  fill(pdf, C.coverBg)
  pdf.rect(0, 0, W, H, 'F')

  // Panel izquierdo
  fill(pdf, C.coverBg2)
  pdf.rect(0, 0, 72, H, 'F')

  // Línea vertical separadora con brillo
for (let i = 0; i < 8; i++) {
  pdf.setFillColor(C.coverAccent[0], C.coverAccent[1], C.coverAccent[2])
  pdf.rect(72 + i * 0.8, 0, 1, H, 'F')
}
  fill(pdf, C.coverAccent)
  pdf.rect(72, 0, 1.5, H, 'F')

  // Bloques decorativos
  fill(pdf, [22, 18, 55])
  pdf.rect(73.5, 0, W - 73.5, 45, 'F')
  fill(pdf, C.coverAccent)
  pdf.rect(73.5, 45, W - 73.5, 0.8, 'F')
  fill(pdf, [16, 13, 42])
  pdf.rect(73.5, H - 55, W - 73.5, 55, 'F')
  fill(pdf, C.coverAccent2)
  pdf.rect(73.5, H - 55, W - 73.5, 0.8, 'F')

  // Texto lateral izquierdo
  text(pdf, [60, 55, 110])
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.text(`${storeUpper}  ·  ${new Date().getFullYear()}`, 10, H - 20, { angle: 90 })

  // Línea decorativa vertical
  draw(pdf, [50, 45, 100])
  pdf.setLineWidth(0.3)
  pdf.line(36, 20, 36, H - 20)

  // Rombo en la línea
  fill(pdf, C.coverAccent)
  const rdx = 36, rdy = H / 2
  pdf.triangle(rdx, rdy - 4, rdx - 3, rdy, rdx, rdy + 4, 'F')
  pdf.triangle(rdx, rdy - 4, rdx + 3, rdy, rdx, rdy + 4, 'F')

  // Centro del panel derecho
  const rx = 73.5 + (W - 73.5) / 2

  // Etiqueta superior
  const labelY = 60
  text(pdf, C.coverAccent)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(6.5)
  pdf.text('COLECCION EXCLUSIVA', rx, labelY, { align: 'center', charSpace: 2 })

  draw(pdf, C.coverLine)
  pdf.setLineWidth(0.3)
  pdf.line(rx - 50, labelY - 2, rx - 28, labelY - 2)
  pdf.line(rx + 28, labelY - 2, rx + 50, labelY - 2)

  // Título principal
  const titleY = 95
  text(pdf, C.textWhite)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(52)
  pdf.text('CATA-', rx, titleY, { align: 'center' })
  pdf.text('LOGO', rx, titleY + 38, { align: 'center' })

  fill(pdf, C.coverAccent)
  pdf.rect(rx - 28, titleY + 8, 56, 1.5, 'F')

  // Año
  text(pdf, [90, 85, 145])
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(String(new Date().getFullYear()), rx, titleY + 52, { align: 'center', charSpace: 6 })

  // Separador ornamental
  const sepY = titleY + 64
  draw(pdf, C.coverAccent)
  pdf.setLineWidth(0.5)
  pdf.line(rx - 22, sepY, rx - 6, sepY)
  pdf.line(rx + 6, sepY, rx + 22, sepY)
  fill(pdf, C.coverAccent)
  pdf.triangle(rx, sepY - 3.5, rx - 4, sepY, rx, sepY + 3.5, 'F')
  pdf.triangle(rx, sepY - 3.5, rx + 4, sepY, rx, sepY + 3.5, 'F')

  // Descripción (banner_subtitle)
  const dY = sepY + 14
  text(pdf, [170, 165, 210])
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.5)
  const lines = pdf.splitTextToSize(bannerSub, 100)
  lines.slice(0, 2).forEach((line: string, i: number) => {
    pdf.text(line, rx, dY + i * 7, { align: 'center' })
  })

  // Badge de cantidad
  const bdY = dY + 22
  const bdW = 58
  fill(pdf, [28, 22, 68])
  pdf.roundedRect(rx - bdW / 2, bdY, bdW, 10, 5, 5, 'F')
  draw(pdf, C.coverAccent)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(rx - bdW / 2, bdY, bdW, 10, 5, 5, 'D')
  text(pdf, C.coverAccent)
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`${count} PRODUCTOS`, rx, bdY + 6.8, { align: 'center' })

  // Botón WhatsApp
  if (waNumber) {
    const bY = bdY + 18
    const bW = 80
    const bH = 13

    fill(pdf, C.waBgDark)
    pdf.roundedRect(rx - bW / 2 + 0.5, bY + 0.5, bW, bH, 4, 4, 'F')
    fill(pdf, C.waBg)
    pdf.roundedRect(rx - bW / 2, bY, bW, bH, 4, 4, 'F')
    fill(pdf, [30, 210, 155])
    pdf.roundedRect(rx - bW / 2 + 3, bY + 1, bW - 6, 3.5, 2, 2, 'F')
    fill(pdf, C.waBg)
    pdf.rect(rx - bW / 2 + 3, bY + 2.5, bW - 6, 2, 'F')

    text(pdf, C.textWhite)
    pdf.setFontSize(8.5)
    pdf.setFont('helvetica', 'bold')
    const bt  = 'PEDIR POR WHATSAPP'
    const btW = pdf.getTextWidth(bt)
    pdf.textWithLink(bt, rx - btW / 2, bY + bH / 2 + 3, { url: `https://wa.me/${waNumber}` })
  }

  // Footer portada
  fill(pdf, [20, 17, 50])
  pdf.rect(73.5, H - 54, W - 73.5, 0.5, 'F')

  text(pdf, C.coverAccent)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7.5)
  pdf.text(storeUpper, rx, H - 40, { align: 'center', charSpace: 1.5 })

  text(pdf, [65, 60, 110])
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6)
  pdf.text('Estilo  ·  Calidad  ·  Elegancia', rx, H - 32, { align: 'center' })

  for (let i = -1; i <= 1; i++) {
    fill(pdf, i === 0 ? C.coverAccent : [50, 46, 100])
    pdf.circle(rx + i * 5, H - 24, i === 0 ? 1.2 : 0.8, 'F')
  }
}

// ─────────────────────────────────────────────
//  FONDO PÁGINAS DE PRODUCTOS
// ─────────────────────────────────────────────
const drawProductBg = (pdf: jsPDF, W: number, H: number, C: any) => {
  fill(pdf, C.pageBg)
  pdf.rect(0, 0, W, H, 'F')
  fill(pdf, C.headerBg)
  pdf.rect(0, 0, W, 18, 'F')
  fill(pdf, C.coverAccent)
  pdf.rect(0, 18, W, 1, 'F')
}

// ─────────────────────────────────────────────
//  HEADER DE PÁGINA
// ─────────────────────────────────────────────
const drawHeader = (
  pdf: jsPDF,
  W: number,
  M: number,
  C: any,
  storeName: string,
  accent: [number, number, number],
) => {
  const storeUpper = storeName.toUpperCase()

  text(pdf, C.textWhite)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text(storeUpper, M, 12)

  text(pdf, accent)
  pdf.setFontSize(9)
  pdf.text('·', M + pdf.getTextWidth(storeUpper) + 2, 12)

  text(pdf, [140, 135, 180])
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.text('Catalogo de productos', M + pdf.getTextWidth(storeUpper) + 6, 12)

  const badgeW = 28
  fill(pdf, [30, 25, 70])
  pdf.roundedRect(W - M - badgeW, 5, badgeW, 8, 4, 4, 'F')
  text(pdf, accent)
  pdf.setFontSize(6)
  pdf.setFont('helvetica', 'bold')
  pdf.text('CATALOGO', W - M - badgeW / 2, 10.5, { align: 'center' })
}

// ─────────────────────────────────────────────
//  TARJETA DE PRODUCTO
// ─────────────────────────────────────────────
const drawCard = async (
  pdf: jsPDF,
  product: Product,
  x: number, y: number,
  w: number, h: number,
  imgH: number,
  productUrl: string,
  waLink: string,
  C: any,
) => {
  const mainImg = product.product_images?.find(i => i.is_main) || product.product_images?.[0]
  const pad = 5

  // Sombra
  pdf.setFillColor(200, 198, 225)
  pdf.roundedRect(x + 1, y + 1.5, w, h, 5, 5, 'F')

  // Fondo blanco
  fill(pdf, C.cardBg)
  pdf.roundedRect(x, y, w, h, 5, 5, 'F')

  // Borde
  draw(pdf, C.cardBorder)
  pdf.setLineWidth(0.2)
  pdf.roundedRect(x, y, w, h, 5, 5, 'D')

  // Barra de acento superior
  fill(pdf, C.cardAccent)
  pdf.roundedRect(x, y, w, 2.5, 5, 5, 'F')
  pdf.rect(x, y + 1.5, w, 1, 'F')

  // Imagen
  const iX     = x + pad
  const iY     = y + pad + 2
  const iW     = w - pad * 2
  const iAreaH = imgH

  fill(pdf, C.cardImgBg)
  pdf.roundedRect(iX, iY, iW, iAreaH, 3, 3, 'F')

  if (mainImg?.url) {
    try {
      const imgData = await loadImg(mainImg.url)
      const ratio   = imgData.w / imgData.h
      const cRatio  = iW / iAreaH
      let fw = iW - 2, fh = iAreaH - 2
      if (ratio > cRatio) fh = fw / ratio
      else fw = fh * ratio
      const ox = iX + 1 + (iW - 2 - fw) / 2
      const oy = iY + 1 + (iAreaH - 2 - fh) / 2
      pdf.addImage(imgData.b64, 'JPEG', ox, oy, fw, fh, undefined, 'FAST')
    } catch {
      drawPlaceholder(pdf, iX, iY, iW, iAreaH)
    }
  } else {
    drawPlaceholder(pdf, iX, iY, iW, iAreaH)
  }

  // Info
  const infoY = iY + iAreaH + 5

  text(pdf, C.textDark)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  const maxLen = 24
  const name   = product.name.length > maxLen ? product.name.slice(0, maxLen) + '...' : product.name
  pdf.textWithLink(name, x + pad, infoY, { url: productUrl })

  // Precio con badge de color
  const priceY   = infoY + 5.5
  const priceStr = `CRC ${product.price.toLocaleString()}`
  pdf.setFontSize(8.5)
  const pw = pdf.getTextWidth(priceStr) + 8
  fill(pdf, C.priceBg)
  pdf.roundedRect(x + pad - 1, priceY - 4, pw, 6.5, 3, 3, 'F')
  text(pdf, C.priceText)
  pdf.setFont('helvetica', 'bold')
  pdf.text(priceStr, x + pad + 3, priceY + 0.5)

  // Tallas
  if (product.sizes?.length) {
    const szY = priceY + 6
    text(pdf, C.textLight)
    pdf.setFontSize(6.5)
    pdf.setFont('helvetica', 'normal')
    const sz = `Tallas: ${product.sizes.join(' · ')}`
    pdf.text(sz.length > 32 ? sz.slice(0, 32) + '...' : sz, x + pad, szY)
  }

  // Botón WhatsApp
  const bW = w - pad * 2
  const bH = 9.5
  const bX = x + pad
  const bY = y + h - bH - pad

  fill(pdf, C.waBgDark)
  pdf.roundedRect(bX + 0.4, bY + 0.4, bW, bH, 3, 3, 'F')
  fill(pdf, C.waBg)
  pdf.roundedRect(bX, bY, bW, bH, 3, 3, 'F')
  draw(pdf, [34, 200, 150])
  pdf.setLineWidth(0.2)
  pdf.line(bX + 4, bY + 0.4, bX + bW - 4, bY + 0.4)

  text(pdf, C.textWhite)
  pdf.setFontSize(7.5)
  pdf.setFont('helvetica', 'bold')
  const bt  = 'Pedir por WhatsApp'
  const btW = pdf.getTextWidth(bt)
  pdf.textWithLink(bt, bX + bW / 2 - btW / 2, bY + bH / 2 + 2.2, { url: waLink })
}

// ─────────────────────────────────────────────
//  FOOTER
// ─────────────────────────────────────────────
const drawFooter = (
  pdf: jsPDF,
  W: number, H: number, M: number,
  storeUrl: string,
  page: number, total: number,
  C: any,
  storeName: string,
) => {
  const fY = H - 12

  draw(pdf, C.footerBorder)
  pdf.setLineWidth(0.15)
  pdf.line(M, fY, W - M, fY)

  fill(pdf, C.coverAccent)
  pdf.rect(M, fY - 0.1, 18, 0.8, 'F')

  text(pdf, C.textMid)
  pdf.setFontSize(6)
  pdf.setFont('helvetica', 'bold')
  pdf.text(storeName, M, fY + 5.5)

  text(pdf, C.textLight)
  pdf.setFont('helvetica', 'normal')
  const urlText = `  ·  ${storeUrl.replace(/^https?:\/\//, '')}`
  pdf.text(urlText, M + pdf.getTextWidth(storeName) + 0.5, fY + 5.5)

  // Paginación
  const pgTxt = `${page} / ${total}`
  const pgW   = pdf.getTextWidth(pgTxt) + 7
  fill(pdf, C.priceBg)
  pdf.roundedRect(W - M - pgW, fY + 1, pgW, 6.5, 3, 3, 'F')
  text(pdf, C.priceText)
  pdf.setFontSize(6)
  pdf.setFont('helvetica', 'bold')
  pdf.text(pgTxt, W - M - pgW / 2, fY + 5.5, { align: 'center' })
}

// ─────────────────────────────────────────────
//  PLACEHOLDER
// ─────────────────────────────────────────────
const drawPlaceholder = (pdf: jsPDF, x: number, y: number, w: number, h: number) => {
  fill(pdf, [240, 239, 248])
  pdf.roundedRect(x, y, w, h, 3, 3, 'F')

  const cx = x + w / 2
  const cy = y + h / 2 - 3
  draw(pdf, [195, 190, 225])
  pdf.setLineWidth(0.6)
  pdf.rect(cx - 7, cy - 5, 14, 12, 'D')
  pdf.triangle(cx - 4, cy - 5, cx, cy - 2, cx + 4, cy - 5, 'D')

  text(pdf, [180, 175, 210])
  pdf.setFontSize(6.5)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Sin imagen', cx, cy + 14, { align: 'center' })
}

// ─────────────────────────────────────────────
//  UTILIDAD: carga de imagen
// ─────────────────────────────────────────────
const loadImg = (url: string): Promise<{ b64: string; w: number; h: number }> =>
  new Promise((res, rej) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width  = img.width
      c.height = img.height
      c.getContext('2d')?.drawImage(img, 0, 0)
      res({ b64: c.toDataURL('image/jpeg', 0.85), w: img.width, h: img.height })
    }
    img.onerror = rej
    img.src = url
  })