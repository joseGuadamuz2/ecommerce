export interface Settings {
  id: string
  whatsapp_country_code: string
  whatsapp_number: string
  updated_at: string
  // Personalización
  store_name: string
  store_logo_url: string | null
  accent_color: string
  banner_label: string
  banner_title: string
  banner_subtitle: string
  product_label: string // ej: "camisas", "productos", "zapatos"
}