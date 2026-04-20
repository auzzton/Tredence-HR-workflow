import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { StartNode as StartNodeModel } from '@/types/nodes'
import { NodeShell } from './NodeShell'

export const StartNode = memo(function StartNode({ data, selected }: NodeProps<StartNodeModel>) {
  const count = data.metadata.length
  return (
    <NodeShell
      type="start"
      title={data.title || 'Start'}
      subtitle={count > 0 ? `${count} metadata field${count === 1 ? '' : 's'}` : 'No metadata'}
      selected={selected === true}
      hasError={false}
      handles="source-only"
    />
  )
})
