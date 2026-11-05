import { Link } from 'react-router-dom'
import { CATEGORY_LABEL } from '../lib/types'
import type { Tool } from '../lib/types'

interface Props {
  tool: Tool
  selected?: boolean
  onCompare?: (id: string) => void
}

export default function ToolCard({ tool, selected = false, onCompare }: Props) {
  return (
    <article className="flex flex-col gap-2.5 rounded-xl border border-hairline bg-surface p-4 transition-colors hover:border-ink/30 dark:border-night-line dark:bg-night-surface dark:hover:border-night-fg/40">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            to={`/tool/${tool.id}`}
            className="block truncate font-semibold hover:text-terracotta dark:hover:text-night-accent"
          >
            {tool.name}
          </Link>
          <span className="font-mono text-[11px] uppercase tracking-wide text-soft dark:text-night-muted">
            {CATEGORY_LABEL[tool.category] ?? tool.category}
          </span>
        </div>
        <span className="shrink-0 rounded-full border border-hairline px-2 py-0.5 text-[11px] text-soft dark:border-night-line dark:text-night-muted">
          {tool.price}
        </span>
      </div>

      <p className="flex-1 text-sm leading-relaxed text-soft dark:text-night-muted">
        {tool.description}
      </p>

      <div className="flex items-center justify-between border-t border-hairline pt-2.5 dark:border-night-line">
        <Link
          to={`/tool/${tool.id}`}
          className="text-[13px] font-medium hover:text-terracotta dark:hover:text-night-accent"
        >
          Ver detalle →
        </Link>
        {onCompare && (
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-soft dark:text-night-muted">
            <input
              type="checkbox"
              className="accent-terracotta"
              checked={selected}
              onChange={() => onCompare(tool.id)}
            />
            Comparar
          </label>
        )}
      </div>
    </article>
  )
}
