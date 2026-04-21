import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Path } from 'react-hook-form'
import { automatedDataSchema, type AutomatedNodeData } from '@/types/nodes'
import { useWorkflowStore } from '@/store/workflowStore'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { SelectField, TextField } from './fields'

// TODO-STEP-7: swap for fetch('/automations')
const STUB_ACTIONS = [
  { id: 'send_email', label: 'Send Email', params: ['to', 'subject'] },
  { id: 'generate_doc', label: 'Generate Document', params: ['template', 'recipient'] },
  { id: 'notify_slack', label: 'Notify Slack', params: ['channel', 'message'] },
  { id: 'create_ticket', label: 'Create Ticket', params: ['project', 'summary'] },
] as const

type StubAction = (typeof STUB_ACTIONS)[number]

type Props = {
  id: string
  data: AutomatedNodeData
}

export function AutomatedNodeForm({ id, data }: Props) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AutomatedNodeData>({
    resolver: zodResolver(automatedDataSchema),
    defaultValues: data,
    mode: 'onChange',
  })

  const writeback = useDebouncedCallback((next: AutomatedNodeData) => {
    useWorkflowStore.getState().updateNodeData(id, next)
  }, 300)

  useEffect(() => {
    const sub = watch((values) => {
      const parse = automatedDataSchema.safeParse(values)
      if (parse.success) writeback(parse.data)
    })
    return () => sub.unsubscribe()
  }, [watch, writeback])

  const actionId = watch('actionId')
  const currentAction: StubAction | undefined = STUB_ACTIONS.find((a) => a.id === actionId)

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
      <TextField
        label="Title"
        placeholder="Automated step"
        error={errors.title?.message}
        {...register('title')}
      />
      <SelectField
        label="Action"
        options={STUB_ACTIONS.map((a) => ({ value: a.id, label: a.label }))}
        placeholder="Select action"
        error={errors.actionId?.message}
        {...register('actionId', {
          onChange: () => setValue('params', {}),
        })}
      />
      {currentAction?.params.map((param) => (
        <TextField
          key={param}
          label={param.charAt(0).toUpperCase() + param.slice(1).replace(/_/g, ' ')}
          placeholder={param}
          // Path<AutomatedNodeData> can't be inferred for template literal params paths
          {...register(`params.${param}` as Path<AutomatedNodeData>)}
        />
      ))}
    </form>
  )
}
