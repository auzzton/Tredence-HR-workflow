import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { taskDataSchema, type TaskNodeData } from '@/types/nodes'
import { useWorkflowStore } from '@/store/workflowStore'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { KeyValueListField, TextAreaField, TextField } from './fields'

type Props = {
  id: string
  data: TaskNodeData
}

/**
 * Reference implementation for per-type forms. The other 4 forms follow
 * this shape:
 *  - `useForm` seeds from the `data` prop once at mount; React keys this
 *    component by node id at the panel level so selecting a different
 *    node remounts and reseeds.
 *  - `mode: 'onChange'` — inline zod errors update as the user types.
 *  - `watch` subscribes to every field change; on each keystroke we try
 *    a zod parse, and only valid values reach the debounced writeback.
 *    Invalid values surface as inline errors but stay out of the store.
 *  - Writeback is debounced 300ms so a burst of keystrokes produces a
 *    single store mutation, not one per character.
 */
export function TaskNodeForm({ id, data }: Props) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useForm<TaskNodeData>({
    resolver: zodResolver(taskDataSchema),
    defaultValues: data,
    mode: 'onChange',
  })

  const writeback = useDebouncedCallback((next: TaskNodeData) => {
    useWorkflowStore.getState().updateNodeData(id, next)
  }, 300)

  useEffect(() => {
    const sub = watch((values) => {
      const parse = taskDataSchema.safeParse(values)
      if (parse.success) writeback(parse.data)
    })
    return () => sub.unsubscribe()
  }, [watch, writeback])

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
      <TextField
        label="Title"
        placeholder="Task name"
        error={errors.title?.message}
        {...register('title')}
      />
      <TextAreaField
        label="Description"
        placeholder="What needs doing?"
        error={errors.description?.message}
        {...register('description')}
      />
      <TextField
        label="Assignee"
        placeholder="Role or person"
        error={errors.assignee?.message}
        {...register('assignee')}
      />
      <TextField
        label="Due Date"
        type="date"
        error={errors.dueDate?.message}
        {...register('dueDate')}
      />
      <KeyValueListField
        label="Custom Fields"
        control={control}
        register={register}
        name="customFields"
      />
    </form>
  )
}
