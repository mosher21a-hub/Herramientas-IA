import seedCatalog from '../data/seed-tools.json'
import type { Tool } from './types'

/**
 * Catálogo de demostración: se usa cuando el proyecto Supabase aún no está
 * configurado (.env). Contiene el mismo contenido que la migración 0002_seed.sql.
 */
export const demoCatalog = (
  seedCatalog as unknown as Omit<Tool, 'user_id' | 'is_public'>[],
).map((t) => ({
  ...t,
  user_id: null,
  is_public: true,
})) as Tool[]
