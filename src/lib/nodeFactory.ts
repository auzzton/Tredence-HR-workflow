import type { NodeType, WorkflowNode } from '@/types/nodes'
import { assertNever, createDefaultNodeData } from '@/types/nodes'

export type NodePosition = { x: number; y: number }

export function createNode(type: NodeType, position: NodePosition): WorkflowNode {
  const id = crypto.randomUUID()
  switch (type) {
    case 'start':
      return { id, type: 'start', position, data: createDefaultNodeData('start') }
    case 'task':
      return { id, type: 'task', position, data: createDefaultNodeData('task') }
    case 'approval':
      return { id, type: 'approval', position, data: createDefaultNodeData('approval') }
    case 'automated':
      return { id, type: 'automated', position, data: createDefaultNodeData('automated') }
    case 'end':
      return { id, type: 'end', position, data: createDefaultNodeData('end') }
    default:
      return assertNever(type)
  }
}
