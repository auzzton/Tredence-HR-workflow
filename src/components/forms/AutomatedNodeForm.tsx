import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Path } from 'react-hook-form'
import { automatedDataSchema, type AutomatedNodeData } from '@/types/nodes'
import type { AutomationAction } from '@/types/workflow'
import { useWorkflowStore } from '@/store/workflowStore'
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback'
import { apiGet } from '@/api/client'
import { FALLBACK_ACTIONS } from '@/lib/fallbackActions'
import { SelectField, TextField } from './fields'

type Props = {
  id: string
  data: AutomatedNodeData
}

export function AutomatedNodeForm({ id, data }: Props) {
  const [actions, setActions] = useState<AutomationAction[]>([])
  const [fetchStatus, setFetchStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const controller = new AbortController()
    apiGet<AutomationAction[]>('/automations', controller.signal)
      .then((result) => {
        setActions(result)
        setFetchStatus('ready')
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return
        console.warn('API unavailable, using fallback actions')
        setActions(FALLBACK_ACTIONS)
        setFetchStatus('ready')
      })
    return () => controller.abort()
  }, [])

  const {
    register,
    watch,
    setValue,
    getValues,
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
  const currentAction: AutomationAction | undefined = actions.find((a) => a.id === actionId)

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
      <TextField
        label="Title"
        placeholder="Automated step"
        error={errors.title?.message}
        {...register('title')}
      />
      {fetchStatus === 'loading' && (
        <p className="text-xs text-[var(--color-text-muted)]">Loading actions…</p>
      )}
      {fetchStatus === 'error' && (
        <p className="text-xs text-[var(--color-danger)]">Failed to load actions.</p>
      )}
      {fetchStatus === 'ready' && (
        <SelectField
          label="Action"
          options={actions.map((a) => ({ value: a.id, label: a.label }))}
          placeholder="Select action"
          error={errors.actionId?.message}
          {...register('actionId', {
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
              const newActionId = e.target.value
              setValue('params', {})
              writeback.cancel()
              useWorkflowStore.getState().updateNodeData(id, {
                title: getValues('title'),
                actionId: newActionId,
                params: {},
              })
            },
          })}
        />
      )}
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
