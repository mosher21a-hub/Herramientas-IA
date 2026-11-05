export type Role = 'admin' | 'user'

export interface Profile {
  id: string
  email: string
  role: Role
}

export type Category =
  | 'chat'
  | 'image'
  | 'video'
  | 'writing'
  | 'coding'
  | 'productivity'
  | 'websites'
  | 'learning'
  | 'finance'

/** Filas de la tabla `tools` en Supabase */
export interface Tool {
  id: string
  name: string
  description: string
  price: string
  url: string
  category: string
  description_long?: string | null
  competitor?: string | null
  competitor_diffs?: string | null
  signup_steps?: string | null
  user_id: string | null
  is_public: boolean
  created_at?: string
}

/** Datos de formulario para crear/editar una herramienta */
export interface ToolInput {
  name: string
  description: string
  price: string
  url: string
  category: string
  description_long?: string
  competitor?: string
  competitor_diffs?: string
}

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'chat', label: 'Chat y Asistentes' },
  { value: 'image', label: 'Imagen y Diseño' },
  { value: 'video', label: 'Video y Audio' },
  { value: 'writing', label: 'Escritura e Investigación' },
  { value: 'coding', label: 'Código y Desarrollo' },
  { value: 'productivity', label: 'Productividad y Automatización' },
  { value: 'websites', label: 'Sitios Web y Hosting' },
  { value: 'learning', label: 'Aprendizaje e Idiomas' },
  { value: 'finance', label: 'Finanzas e Inversión' },
]

export const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
)
