import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { endDataSchema, type EndNodeData } from '@/types/nodes'
import { useWorkflowStore } from '@/store/workflowStore'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { CheckboxField, TextAreaField } from './fields'

type Props = {
  id: string
  data: EndNodeData
}

export function EndNodeForm({ id, data }: Props) {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm<EndNodeData>({
    resolver: zodResolver(endDataSchema),
    defaultValues: data,
    mode: 'onChange',
  })

  const writeback = useDebouncedCallback((next: EndNodeData) => {
    useWorkflowStore.getState().updateNodeData(id, next)
  }, 300)

  useEffect(() => {
    const sub = watch((values) => {
      const parse = endDataSchema.safeParse(values)
      if (parse.success) writeback(parse.data)
    })
    return () => sub.unsubscribe()
  }, [watch, writeback])

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
      <TextAreaField
        label="End Message"
        placeholder="Workflow complete"
        error={errors.endMessage?.message}
        {...register('endMessage')}
      />
      <CheckboxField
        label="Generate summary report"
        error={errors.summary?.message}
        {...register('summary')}
      />
    </form>
  )
}
