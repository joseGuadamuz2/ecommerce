import jsPDF from 'jspdf'
import type { Product } from '../types/product'
import type { Settings } from '../types/settings'

// ─────────────────────────────────────────────
//  PALETA
// ─────────────────────────────────────────────
const C = {
  // Portada
  coverBg:      [12, 10, 28]    as const,
  coverBg2:     [20, 16, 48]    as const,
  coverAccent:  [108, 99, 255]  as const,  // púrpura-índigo vibrante
  coverAccent2: [80, 200, 160]  as const,  // verde menta
  coverLine:    [60, 55, 120]   as const,

  // Páginas producto
  pageBg:       [250, 250, 253] as const,
  headerBg:     [18, 14, 48]    as const,

  // Tarjeta
  cardBg:       [255, 255, 255] as const,
  cardBorder:   [230, 228, 245] as const,
  cardImgBg:    [244, 244, 250] as const,
  cardAccent:   [108, 99, 255]  as const,

  // Tipografía
  textDark:     [18, 14, 48]    as const,
  textMid:      [80, 75, 120]   as const,
  textLight:    [150, 145, 180] as const,
  textWhite:    [255, 255, 255] as const,
  priceText:    [60, 50, 180]   as const,
  priceBg:      [235, 233, 255] as const,

  // Botón WA
  waBg:         [16, 185, 129]  as const,
  waBgDark:     [5, 140, 95]    as const,

  // Footer
  footerBorder: [210, 208, 230] as const,
}

const fill = (pdf: jsPDF, c: readonly [number, number, number]) => pdf.setFillColor(...c)
const draw = (pdf: jsPDF, c: readonly [number, number, number]) => pdf.setDrawColor(...c)
const text = (pdf: jsPDF, c: readonly [number, number, number]) => pdf.setTextColor(...c)

// ─────────────────────────────────────────────
//  GENERADOR PRINCIPAL
// ─────────────────────────────────────────────
export const generateCatalogPDF = async (
  products: Product[],
  settings: Settings,
  storeUrl: string
) => {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const W = 210
  const H = 297
  const M = 12          // margen
  const COLS = 2
  const GAP = 6
  const CARD_W = (W - M * 2 - GAP) / COLS
  const CARD_H = 108
  const IMG_H  = 64

  const waNumber = `${settings.whatsapp_country_code}${settings.whatsapp_number.replace(/\s/g, '')}`

  // PORTADA
  drawCover(pdf, W, H, waNumber, products.length)

  // PÁGINAS DE PRODUCTOS
  pdf.addPage()
  drawProductBg(pdf, W, H)
  drawHeader(pdf, W, M)

  let curY = M + 22

  for (let i = 0; i < products.length; i++) {
    const col = i % COLS

    // Al inicio de cada fila nueva, verificar si hay espacio
    if (col === 0 && i !== 0) {
      curY += CARD_H + GAP
    }

    // Si la tarjeta no cabe en la página actual, nueva página
    if (col === 0 && curY + CARD_H > H - M - 14) {
      pdf.addPage()
      drawProductBg(pdf, W, H)
      drawHeader(pdf, W, M)
      curY = M + 22
    }

    const x = M + col * (CARD_W + GAP)
    const productUrl = `${storeUrl}/producto/${products[i].id}`
    const waMsg = `¡Hola! Me interesa:\n${products[i].name}\nPrecio: CRC ${products[i].price.toLocaleString()}\n${productUrl}`
    const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMsg)}`
    await drawCard(pdf, products[i], x, curY, CARD_W, CARD_H, IMG_H, productUrl, waLink)
  }

  // FOOTERS en páginas de productos
  const total = pdf.getNumberOfPages()
  for (let p = 2; p <= total; p++) {
    pdf.setPage(p)
    drawFooter(pdf, W, H, M, storeUrl, p - 1, total - 1)
  }

  pdf.save('catalogo-camisas.pdf')
}

// ─────────────────────────────────────────────
//  PORTADA  —  diseño editorial limpio
// ─────────────────────────────────────────────
const drawCover = (pdf: jsPDF, W: number, H: number, waNumber: string, count: number) => {

  // ── Fondo base ──
  fill(pdf, C.coverBg)
  pdf.rect(0, 0, W, H, 'F')

  // ── Panel izquierdo oscuro ──
  fill(pdf, C.coverBg2)
  pdf.rect(0, 0, 72, H, 'F')

  // ── Línea vertical separadora con degradado simulado ──
  // Sombra difuminada
  for (let i = 0; i < 8; i++) {
    pdf.setFillColor(108, 99, 255, (8 - i) * 4)
    pdf.rect(72 + i * 0.8, 0, 1, H, 'F')
  }
  fill(pdf, C.coverAccent)
  pdf.rect(72, 0, 1.5, H, 'F')

  // ── Bloques decorativos geométricos ──
  // Rectángulo superior derecho
  fill(pdf, [22, 18, 55])
  pdf.rect(73.5, 0, W - 73.5, 45, 'F')

  // Línea de acento horizontal superior
  fill(pdf, C.coverAccent)
  pdf.rect(73.5, 45, W - 73.5, 0.8, 'F')

  // Bloque inferior derecho
  fill(pdf, [16, 13, 42])
  pdf.rect(73.5, H - 55, W - 73.5, 55, 'F')

  // Línea de acento inferior
  fill(pdf, C.coverAccent2)
  pdf.rect(73.5, H - 55, W - 73.5, 0.8, 'F')

  // ── Texto vertical en panel izquierdo ──
  text(pdf, [60, 55, 110])
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  // Texto lateral rotado (aproximado con posiciones)
  pdf.text('CAMISASSHOP  ·  2026', 10, H - 20, { angle: 90 })

  // Línea decorativa vertical en panel izquierdo
  draw(pdf, [50, 45, 100])
  pdf.setLineWidth(0.3)
  pdf.line(36, 20, 36, H - 20)

  // Pequeño rombo en la línea vertical
  fill(pdf, C.coverAccent)
  const rdx = 36, rdy = H / 2
  pdf.triangle(rdx, rdy - 4, rdx - 3, rdy, rdx, rdy + 4, 'F')
  pdf.triangle(rdx, rdy - 4, rdx + 3, rdy, rdx, rdy + 4, 'F')

  // ── Zona central — contenido principal ──
  // Posición X del contenido (centro del panel derecho)
  const rx = 73.5 + (W - 73.5) / 2  // centro del área derecha

  // Etiqueta superior pequeña
  const labelY = 60
  text(pdf, C.coverAccent)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(6.5)
  pdf.text('COLECCION EXCLUSIVA', rx, labelY, { align: 'center', charSpace: 2 })

  // Líneas decorativas flanqueando la etiqueta
  draw(pdf, C.coverLine)
  pdf.setLineWidth(0.3)
  pdf.line(rx - 50, labelY - 2, rx - 28, labelY - 2)
  pdf.line(rx + 28, labelY - 2, rx + 50, labelY - 2)

  // ── TÍTULO PRINCIPAL ──
  const titleY = 95
  text(pdf, C.textWhite)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(52)
  pdf.text('CATA-', rx, titleY, { align: 'center' })
  pdf.text('LOGO', rx, titleY + 38, { align: 'center' })

  // Línea de acento entre las dos palabras del título
  fill(pdf, C.coverAccent)
  pdf.rect(rx - 28, titleY + 8, 56, 1.5, 'F')

  // ── AÑO ──
  text(pdf, [90, 85, 145])
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text('2026', rx, titleY + 52, { align: 'center', charSpace: 6 })

  // ── Separador ornamental ──
  const sepY = titleY + 64
  draw(pdf, C.coverAccent)
  pdf.setLineWidth(0.5)
  pdf.line(rx - 22, sepY, rx - 6, sepY)
  pdf.line(rx + 6, sepY, rx + 22, sepY)
  // Diamante central
  fill(pdf, C.coverAccent)
  pdf.triangle(rx, sepY - 3.5, rx - 4, sepY, rx, sepY + 3.5, 'F')
  pdf.triangle(rx, sepY - 3.5, rx + 4, sepY, rx, sepY + 3.5, 'F')

  // ── Descripción ──
  const dY = sepY + 14
  text(pdf, [170, 165, 210])
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8.5)
  pdf.text('Camisas exclusivas confeccionadas', rx, dY, { align: 'center' })
  pdf.text('con materiales de la mas alta calidad', rx, dY + 7, { align: 'center' })

  // ── Badge cantidad de productos ──
  const bdY = dY + 20
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

  // ── Botón WhatsApp ──
  if (waNumber) {
    const bY = bdY + 18
    const bW = 80
    const bH = 13

    fill(pdf, C.waBgDark)
    pdf.roundedRect(rx - bW / 2 + 0.5, bY + 0.5, bW, bH, 4, 4, 'F')

    fill(pdf, C.waBg)
    pdf.roundedRect(rx - bW / 2, bY, bW, bH, 4, 4, 'F')

    // Brillo
    fill(pdf, [30, 210, 155])
    pdf.roundedRect(rx - bW / 2 + 3, bY + 1, bW - 6, 3.5, 2, 2, 'F')
    fill(pdf, C.waBg)
    pdf.rect(rx - bW / 2 + 3, bY + 2.5, bW - 6, 2, 'F')

    text(pdf, C.textWhite)
    pdf.setFontSize(8.5)
    pdf.setFont('helvetica', 'bold')
    const bt = 'PEDIR POR WHATSAPP'
    const btW = pdf.getTextWidth(bt)
    pdf.textWithLink(bt, rx - btW / 2, bY + bH / 2 + 3, { url: `https://wa.me/${waNumber}` })
  }

  // ── Footer de portada ──
  // Línea horizontal en la zona inferior
  fill(pdf, [20, 17, 50])
  pdf.rect(73.5, H - 54, W - 73.5, 0.5, 'F')

  text(pdf, [100, 95, 155])
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(7.5)
  pdf.text('CAMISASSHOP', rx, H - 40, { align: 'center', charSpace: 1.5 })

  text(pdf, [65, 60, 110])
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6)
  pdf.text('Estilo  ·  Calidad  ·  Elegancia', rx, H - 32, { align: 'center' })

  // Tres puntos decorativos
  for (let i = -1; i <= 1; i++) {
    fill(pdf, i === 0 ? C.coverAccent : [50, 46, 100])
    pdf.circle(rx + i * 5, H - 24, i === 0 ? 1.2 : 0.8, 'F')
  }
}

// ─────────────────────────────────────────────
//  FONDO PÁGINAS DE PRODUCTOS
// ─────────────────────────────────────────────
const drawProductBg = (pdf: jsPDF, W: number, H: number) => {
  // Fondo muy claro
  fill(pdf, C.pageBg)
  pdf.rect(0, 0, W, H, 'F')

  // Franja de header oscura
  fill(pdf, C.headerBg)
  pdf.rect(0, 0, W, 18, 'F')

  // Línea de acento bajo el header
  fill(pdf, C.coverAccent)
  pdf.rect(0, 18, W, 1, 'F')
}

// ─────────────────────────────────────────────
//  HEADER DE PÁGINA
// ─────────────────────────────────────────────
const drawHeader = (pdf: jsPDF, W: number, M: number) => {
  // Logo
  text(pdf, C.textWhite)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  pdf.text('CAMISASSHOP', M, 12)

  // Punto separador
  text(pdf, [108, 99, 255])
  pdf.setFontSize(9)
  pdf.text('·', M + pdf.getTextWidth('CAMISASSHOP') + 2, 12)

  // Subtítulo
  text(pdf, [140, 135, 180])
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.text('Coleccion Exclusiva 2026', M + pdf.getTextWidth('CAMISASSHOP') + 6, 12)

  // Badge derecho
  const badgeW = 28
  fill(pdf, [30, 25, 70])
  pdf.roundedRect(W - M - badgeW, 5, badgeW, 8, 4, 4, 'F')
  text(pdf, [108, 99, 255])
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
  waLink: string
) => {
  const mainImg = product.product_images?.find(i => i.is_main) || product.product_images?.[0]
  const pad = 5

  // Sombra suave
  pdf.setFillColor(200, 198, 225, 60)
  pdf.roundedRect(x + 1, y + 1.5, w, h, 5, 5, 'F')

  // Fondo blanco
  fill(pdf, C.cardBg)
  pdf.roundedRect(x, y, w, h, 5, 5, 'F')

  // Borde sutil
  draw(pdf, C.cardBorder)
  pdf.setLineWidth(0.2)
  pdf.roundedRect(x, y, w, h, 5, 5, 'D')

  // Acento superior (barra de color)
  fill(pdf, C.cardAccent)
  pdf.roundedRect(x, y, w, 2.5, 5, 5, 'F')
  pdf.rect(x, y + 1.5, w, 1, 'F')

  // ── Imagen ──
  const iX = x + pad
  const iY = y + pad + 2
  const iW = w - pad * 2
  const iAreaH = imgH

  fill(pdf, C.cardImgBg)
  pdf.roundedRect(iX, iY, iW, iAreaH, 3, 3, 'F')

  if (mainImg?.url) {
    try {
      const imgData = await loadImg(mainImg.url)
      const ratio = imgData.w / imgData.h
      const cRatio = iW / iAreaH
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

  // ── Información ──
  const infoY = iY + iAreaH + 5

  // Nombre
  text(pdf, C.textDark)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  const maxLen = 24
  const name = product.name.length > maxLen ? product.name.slice(0, maxLen) + '...' : product.name
  pdf.textWithLink(name, x + pad, infoY, { url: productUrl })

  // Precio
  const priceY = infoY + 5.5
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

  // ── Botón WhatsApp ──
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
  const bt = 'Pedir por WhatsApp'
  const btW = pdf.getTextWidth(bt)
  pdf.textWithLink(bt, bX + bW / 2 - btW / 2, bY + bH / 2 + 2.2, { url: waLink })
}

// ─────────────────────────────────────────────
//  FOOTER
// ─────────────────────────────────────────────
const drawFooter = (pdf: jsPDF, W: number, H: number, M: number, storeUrl: string, page: number, total: number) => {
  const fY = H - 12

  draw(pdf, C.footerBorder)
  pdf.setLineWidth(0.15)
  pdf.line(M, fY, W - M, fY)

  // Acento
  fill(pdf, C.coverAccent)
  pdf.rect(M, fY - 0.1, 18, 0.8, 'F')

  text(pdf, C.textMid)
  pdf.setFontSize(6)
  pdf.setFont('helvetica', 'bold')
  pdf.text('CamisasShop', M, fY + 5.5)

  text(pdf, C.textLight)
  pdf.setFont('helvetica', 'normal')
  const urlText = `  ·  ${storeUrl.replace(/^https?:\/\//, '')}`
  pdf.text(urlText, M + pdf.getTextWidth('CamisasShop') + 0.5, fY + 5.5)

  // Paginación
  const pgTxt = `${page} / ${total}`
  const pgW = pdf.getTextWidth(pgTxt) + 7
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
      c.width = img.width
      c.height = img.height
      c.getContext('2d')?.drawImage(img, 0, 0)
      res({ b64: c.toDataURL('image/jpeg', 0.85), w: img.width, h: img.height })
    }
    img.onerror = rej
    img.src = url
  })