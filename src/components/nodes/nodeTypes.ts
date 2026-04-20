import type { NodeTypes } from '@xyflow/react'
import { ApprovalNode } from './ApprovalNode'
import { AutomatedNode } from './AutomatedNode'
import { EndNode } from './EndNode'
import { StartNode } from './StartNode'
import { TaskNode } from './TaskNode'

/**
 * Stable module-scope map handed to ReactFlow's `nodeTypes` prop. xyflow
 * warns on fresh identities here because it uses this to lookup the
 * component per node on every render — a new reference triggers
 * full-canvas remounts.
 */
export const nodeTypes = {
  start: StartNode,
  task: TaskNode,
  approval: ApprovalNode,
  automated: AutomatedNode,
  end: EndNode,
} as const satisfies NodeTypes
