import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { AutomatedNode as AutomatedNodeModel } from '@/types/nodes'
import { NodeShell } from './NodeShell'

export const AutomatedNode = memo(function AutomatedNode({
  data,
  selected,
}: NodeProps<AutomatedNodeModel>) {
  return (
    <NodeShell
      type="automated"
      title={data.title || 'Untitled automation'}
      subtitle={data.actionId || 'No action selected'}
      selected={selected === true}
      hasError={false}
      handles="both"
    />
  )
})
