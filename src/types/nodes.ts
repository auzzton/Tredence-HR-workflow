import { z } from 'zod'
import type { Node as RFNode } from '@xyflow/react'

export const NODE_TYPES = ['start', 'task', 'approval', 'automated', 'end'] as const
export type NodeType = (typeof NODE_TYPES)[number]

export const NODE_TYPE_LABELS: Readonly<Record<NodeType, string>> = {
  start: 'Start',
  task: 'Task',
  approval: 'Approval',
  automated: 'Automated Step',
  end: 'End',
}

export const APPROVER_ROLES = ['Manager', 'HRBP', 'Director'] as const
export type ApproverRole = (typeof APPROVER_ROLES)[number]

export const keyValuePairSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string(),
})
export type KeyValuePair = z.infer<typeof keyValuePairSchema>

export const startDataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  metadata: z.array(keyValuePairSchema),
})
export type StartNodeData = z.infer<typeof startDataSchema>

export const taskDataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
  assignee: z.string(),
  dueDate: z.string(),
  customFields: z.array(keyValuePairSchema),
})
export type TaskNodeData = z.infer<typeof taskDataSchema>

export const approvalDataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  approverRole: z.enum(APPROVER_ROLES),
  autoApproveThreshold: z
    .number({ message: 'Must be a number' })
    .min(0, 'Must be ≥ 0'),
})
export type ApprovalNodeData = z.infer<typeof approvalDataSchema>

export const automatedDataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  actionId: z.string().min(1, 'Select an action'),
  params: z.record(z.string(), z.string()),
})
export type AutomatedNodeData = z.infer<typeof automatedDataSchema>

export const endDataSchema = z.object({
  endMessage: z.string().min(1, 'End message is required'),
  summary: z.boolean(),
})
export type EndNodeData = z.infer<typeof endDataSchema>

export type StartNode = RFNode<StartNodeData, 'start'>
export type TaskNode = RFNode<TaskNodeData, 'task'>
export type ApprovalNode = RFNode<ApprovalNodeData, 'approval'>
export type AutomatedNode = RFNode<AutomatedNodeData, 'automated'>
export type EndNode = RFNode<EndNodeData, 'end'>

export type WorkflowNode = StartNode | TaskNode | ApprovalNode | AutomatedNode | EndNode

export type WorkflowNodeData =
  | StartNodeData
  | TaskNodeData
  | ApprovalNodeData
  | AutomatedNodeData
  | EndNodeData

export type NodeDataFor<T extends NodeType> = Extract<WorkflowNode, { type: T }>['data']

export function assertNever(value: never): never {
  throw new Error(`Unhandled discriminant: ${JSON.stringify(value)}`)
}

export function createDefaultNodeData(type: 'start'): StartNodeData
export function createDefaultNodeData(type: 'task'): TaskNodeData
export function createDefaultNodeData(type: 'approval'): ApprovalNodeData
export function createDefaultNodeData(type: 'automated'): AutomatedNodeData
export function createDefaultNodeData(type: 'end'): EndNodeData
export function createDefaultNodeData(type: NodeType): WorkflowNodeData
export function createDefaultNodeData(type: NodeType): WorkflowNodeData {
  switch (type) {
    case 'start':
      return { title: 'Start', metadata: [] }
    case 'task':
      return { title: '', description: '', assignee: '', dueDate: '', customFields: [] }
    case 'approval':
      return { title: '', approverRole: 'Manager', autoApproveThreshold: 0 }
    case 'automated':
      return { title: '', actionId: '', params: {} }
    case 'end':
      return { endMessage: 'Workflow complete', summary: false }
    default:
      return assertNever(type)
  }
}

export const nodeDataSchemaFor: Readonly<Record<NodeType, z.ZodTypeAny>> = {
  start: startDataSchema,
  task: taskDataSchema,
  approval: approvalDataSchema,
  automated: automatedDataSchema,
  end: endDataSchema,
}
