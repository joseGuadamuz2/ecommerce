export interface Business {
  id: string
  user_id: string
  slug: string // URL pública: /catalogo/{slug}
  name: string
  logo_url: string | null
  accent_color: string
  whatsapp_country_code: string
  whatsapp_number: string
  banner_label: string
  banner_title: string
  banner_subtitle: string
  product_label: string // ej: "camisas", "productos"
  is_active: boolean
  created_at: string
  updated_at: string
}