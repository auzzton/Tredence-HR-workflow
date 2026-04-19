import type { Edge as RFEdge } from '@xyflow/react'
import type { NodeType, WorkflowNode } from './nodes'

export type WorkflowEdge = RFEdge

export type WorkflowGraph = {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export type ValidationErrorCode =
  | 'no_start'
  | 'multiple_start'
  | 'no_end'
  | 'start_has_incoming'
  | 'end_has_outgoing'
  | 'orphan_node'
  | 'unreachable'
  | 'cycle'
  | 'missing_required_field'
  | 'invalid_config'

export type ValidationError = {
  code: ValidationErrorCode
  message: string
  nodeId?: string
}

export type ValidationResult = {
  ok: boolean
  errors: ValidationError[]
  errorsByNode: Record<string, ValidationError[]>
}

export type ExecutionStatus = 'success' | 'skipped' | 'error'

export type ExecutionLogEntry = {
  step: number
  nodeId: string
  nodeType: NodeType
  nodeTitle: string
  status: ExecutionStatus
  message: string
  timestamp: string
}

export type SimulationRequest = {
  graph: WorkflowGraph
}

export type SimulationResponse = {
  ok: boolean
  log: ExecutionLogEntry[]
  durationMs: number
}

export type AutomationAction = {
  id: string
  label: string
  params: string[]
}
