import type { ReactNode } from 'react'
import { Handle, Position } from '@xyflow/react'
import { AlertCircle } from 'lucide-react'
import type { NodeType } from '@/types/nodes'

export type HandleRole = 'source-only' | 'target-only' | 'both'

type NodeShellProps = {
  type: NodeType
  title: string
  subtitle?: ReactNode
  selected: boolean
  hasError: boolean
  handles: HandleRole
}

const ACCENT_VAR: Readonly<Record<NodeType, string>> = {
  start: 'var(--color-node-start)',
  task: 'var(--color-node-task)',
  approval: 'var(--color-node-approval)',
  automated: 'var(--color-node-automated)',
  end: 'var(--color-node-end)',
}

/**
 * Shared visual shell for the 5 custom nodes. Keeps the card layout,
 * accent strip, selected/error rings, and handle positions in one place
 * so the per-type components stay thin and declarative.
 *
 * `hasError` is a passthrough today (nodes hardcode `false`); Step 8's
 * graph validation will flip it to a store-derived boolean — a one-line
 * change at each call site.
 */
export function NodeShell({ type, title, subtitle, selected, hasError, handles }: NodeShellProps) {
  const accent = ACCENT_VAR[type]
  const showTarget = handles === 'target-only' || handles === 'both'
  const showSource = handles === 'source-only' || handles === 'both'

  const ringClass = hasError
    ? 'ring-2 ring-[var(--color-danger)]'
    : selected
      ? 'ring-2'
      : 'ring-0'
  const ringStyle = !hasError && selected ? { boxShadow: `0 0 0 2px ${accent}` } : undefined

  return (
    <div
      className={`relative flex min-w-[180px] items-stretch overflow-hidden rounded-[var(--radius-node)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] shadow-sm ${ringClass}`}
      style={ringStyle}
    >
      {showTarget ? (
        <Handle type="target" position={Position.Left} style={{ background: accent }} />
      ) : null}

      <div className="w-1 shrink-0" style={{ background: accent }} />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 px-3 py-2">
        <span className="truncate text-sm font-medium text-[var(--color-text-primary)]">
          {title}
        </span>
        {subtitle != null ? (
          <span className="truncate text-[12px] text-[var(--color-text-secondary)]">
            {subtitle}
          </span>
        ) : null}
      </div>

      {hasError ? (
        <AlertCircle className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-[var(--color-danger)]" />
      ) : null}

      {showSource ? (
        <Handle type="source" position={Position.Right} style={{ background: accent }} />
      ) : null}
    </div>
  )
}
