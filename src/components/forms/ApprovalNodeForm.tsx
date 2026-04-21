import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { approvalDataSchema, APPROVER_ROLES, type ApprovalNodeData } from '@/types/nodes'
import { useWorkflowStore } from '@/store/workflowStore'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { NumberField, SelectField, TextField } from './fields'

type Props = {
  id: string
  data: ApprovalNodeData
}

export function ApprovalNodeForm({ id, data }: Props) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<ApprovalNodeData>({
    resolver: zodResolver(approvalDataSchema),
    defaultValues: data,
    mode: 'onChange',
  })

  const writeback = useDebouncedCallback((next: ApprovalNodeData) => {
    useWorkflowStore.getState().updateNodeData(id, next)
  }, 300)

  useEffect(() => {
    const sub = watch((values) => {
      const parse = approvalDataSchema.safeParse(values)
      if (parse.success) writeback(parse.data)
    })
    return () => sub.unsubscribe()
  }, [watch, writeback])

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
      <TextField
        label="Title"
        placeholder="Approval step"
        error={errors.title?.message}
        {...register('title')}
      />
      <SelectField
        label="Approver Role"
        options={APPROVER_ROLES.map((r) => ({ value: r, label: r }))}
        placeholder="Select role"
        error={errors.approverRole?.message}
        {...register('approverRole')}
      />
      <NumberField
        label="Auto-Approve Threshold (days)"
        placeholder="0"
        error={errors.autoApproveThreshold?.message}
        {...register('autoApproveThreshold', { valueAsNumber: true })}
      />
    </form>
  )
}
