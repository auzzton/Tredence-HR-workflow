import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { EndNode as EndNodeModel } from '@/types/nodes'
import { NodeShell } from './NodeShell'

export const EndNode = memo(function EndNode({ data, selected }: NodeProps<EndNodeModel>) {
  return (
    <NodeShell
      type="end"
      title={data.endMessage || 'End'}
      subtitle={data.summary ? 'Summary enabled' : 'No summary'}
      selected={selected === true}
      hasError={false}
      handles="target-only"
    />
  )
})
