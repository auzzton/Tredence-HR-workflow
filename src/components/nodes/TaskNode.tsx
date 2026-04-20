import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { TaskNode as TaskNodeModel } from '@/types/nodes'
import { NodeShell } from './NodeShell'

export const TaskNode = memo(function TaskNode({ data, selected }: NodeProps<TaskNodeModel>) {
  return (
    <NodeShell
      type="task"
      title={data.title || 'Untitled task'}
      subtitle={data.assignee || 'Unassigned'}
      selected={selected === true}
      hasError={false}
      handles="both"
    />
  )
})
