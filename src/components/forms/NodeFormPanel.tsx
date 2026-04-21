import { Trash2 } from 'lucide-react'
import {
  selectNodeDataById,
  selectNodeTypeById,
  selectSelectedNodeId,
  useWorkflowStore,
} from '@/store/workflowStore'
import {
  NODE_TYPE_LABELS,
  type ApprovalNodeData,
  type EndNodeData,
  type NodeType,
  type StartNodeData,
  type TaskNodeData,
  type WorkflowNodeData,
} from '@/types/nodes'
import { ApprovalNodeForm } from './ApprovalNodeForm'
import { EndNodeForm } from './EndNodeForm'
import { StartNodeForm } from './StartNodeForm'
import { TaskNodeForm } from './TaskNodeForm'

/**
 * Right-side configuration panel. Subscribes to `selectedId` so the shell
 * itself only re-renders when selection changes — NOT when the selected
 * node is dragged around the canvas. The inner `PanelBody` subscribes
 * separately via data/type selectors, both of which are stable across
 * position-only mutations (immer preserves `data` refs; `type` is a
 * literal that never changes over a node's lifetime).
 *
 * The body is keyed by node id so switching selection remounts it and
 * re-seeds RHF's default values. Without the key, RHF would hold the
 * prior node's form state.
 */
export function NodeFormPanel() {
  const selectedId = useWorkflowStore(selectSelectedNodeId)
  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]">
      {selectedId ? <PanelBody key={selectedId} id={selectedId} /> : <EmptyState />}
    </aside>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium text-[var(--color-text-primary)]">No node selected</p>
      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
        Click a node on the canvas to edit its configuration.
      </p>
    </div>
  )
}

function PanelBody({ id }: { id: string }) {
  const type = useWorkflowStore(selectNodeTypeById(id))
  const data = useWorkflowStore(selectNodeDataById(id))

  if (!type || !data) return <EmptyState />

  return (
    <>
      <header className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            {NODE_TYPE_LABELS[type]}
          </span>
          <span className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
            Configure node
          </span>
        </div>
        <button
          type="button"
          onClick={() => useWorkflowStore.getState().removeNode(id)}
          className="rounded-md p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-danger)]"
          aria-label="Delete node"
          title="Delete node"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        <FormForType id={id} type={type} data={data} />
      </div>
    </>
  )
}

/**
 * Narrows the `WorkflowNodeData` union via the type discriminator. Each
 * branch casts `data` to the arm's concrete type — safe because the store
 * invariant (updateNodeData's dev guard + zod-gated writebacks) keeps
 * `node.data` aligned with `node.type`.
 */
function FormForType({
  id,
  type,
  data,
}: {
  id: string
  type: NodeType
  data: WorkflowNodeData
}) {
  switch (type) {
    case 'start':
      return <StartNodeForm id={id} data={data as StartNodeData} />
    case 'task':
      return <TaskNodeForm id={id} data={data as TaskNodeData} />
    case 'approval':
      return <ApprovalNodeForm id={id} data={data as ApprovalNodeData} />
    case 'end':
      return <EndNodeForm id={id} data={data as EndNodeData} />
    case 'automated':
      return (
        <p className="text-xs text-[var(--color-text-muted)]">
          Form coming in a follow-up commit.
        </p>
      )
  }
}
