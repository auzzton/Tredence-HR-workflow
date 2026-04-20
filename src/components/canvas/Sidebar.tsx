import type { DragEvent } from 'react'
import { Circle, CircleDot, ClipboardCheck, Sparkles, Square } from 'lucide-react'
import { NODE_TYPE_LABELS, NODE_TYPES, type NodeType } from '@/types/nodes'

export const NODE_DRAG_MIME = 'application/x-workflow-node-type'

const ICONS: Readonly<Record<NodeType, typeof Circle>> = {
  start: CircleDot,
  task: ClipboardCheck,
  approval: Square,
  automated: Sparkles,
  end: Circle,
}

function onDragStart(event: DragEvent<HTMLDivElement>, type: NodeType): void {
  event.dataTransfer.setData(NODE_DRAG_MIME, type)
  event.dataTransfer.effectAllowed = 'move'
}

/**
 * Palette of draggable node types. Uses the HTML5 drag API (no react-dnd —
 * a single mime-typed string is enough). The canvas owns the drop logic and
 * coord translation; this component only originates drags.
 */
export function Sidebar() {
  return (
    <div className="flex h-full flex-col gap-1 p-3">
      <p className="px-1 pb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
        Nodes
      </p>
      {NODE_TYPES.map((type) => {
        const Icon = ICONS[type]
        return (
          <div
            key={type}
            draggable
            onDragStart={(event) => onDragStart(event, type)}
            className="flex cursor-grab items-center gap-2 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] active:cursor-grabbing"
          >
            <Icon className="h-4 w-4 text-[var(--color-text-secondary)]" />
            <span>{NODE_TYPE_LABELS[type]}</span>
          </div>
        )
      })}
    </div>
  )
}
