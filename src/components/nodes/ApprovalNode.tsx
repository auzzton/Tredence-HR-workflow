import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { ApprovalNode as ApprovalNodeModel } from '@/types/nodes'
import { NodeShell } from './NodeShell'

export const ApprovalNode = memo(function ApprovalNode({
  data,
  selected,
}: NodeProps<ApprovalNodeModel>) {
  return (
    <NodeShell
      type="approval"
      title={data.title || 'Untitled approval'}
      subtitle={`${data.approverRole} · auto ≥ ${data.autoApproveThreshold}`}
      selected={selected === true}
      hasError={false}
      handles="both"
    />
  )
})
