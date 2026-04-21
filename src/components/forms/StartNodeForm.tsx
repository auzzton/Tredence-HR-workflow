import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { startDataSchema, type StartNodeData } from '@/types/nodes'
import { useWorkflowStore } from '@/store/workflowStore'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { KeyValueListField, TextField } from './fields'

type Props = {
  id: string
  data: StartNodeData
}

export function StartNodeForm({ id, data }: Props) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useForm<StartNodeData>({
    resolver: zodResolver(startDataSchema),
    defaultValues: data,
    mode: 'onChange',
  })

  const writeback = useDebouncedCallback((next: StartNodeData) => {
    useWorkflowStore.getState().updateNodeData(id, next)
  }, 300)

  useEffect(() => {
    const sub = watch((values) => {
      const parse = startDataSchema.safeParse(values)
      if (parse.success) writeback(parse.data)
    })
    return () => sub.unsubscribe()
  }, [watch, writeback])

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
      <TextField
        label="Title"
        placeholder="Workflow start"
        error={errors.title?.message}
        {...register('title')}
      />
      <KeyValueListField
        label="Metadata"
        control={control}
        register={register}
        name="metadata"
      />
    </form>
  )
}
