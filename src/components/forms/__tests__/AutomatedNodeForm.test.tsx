import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// globals (describe/it/expect/vi/beforeEach/afterEach) injected by vitest — no explicit import needed
import { AutomatedNodeForm } from '../AutomatedNodeForm'
import { useWorkflowStore } from '@/store/workflowStore'
import type { AutomatedNodeData } from '@/types/nodes'

const MOCK_ACTIONS = [
  { id: 'send_email', label: 'Send Email', params: ['to', 'subject'] },
  { id: 'generate_doc', label: 'Generate Document', params: ['template', 'recipient'] },
]

beforeEach(() => {
  // Stub fetch so the /automations call resolves immediately without MSW
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_ACTIONS),
    }),
  )
  useWorkflowStore.setState({ nodes: [], edges: [], selectedNodeId: null, version: 0 })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

// ─── Action selection ──────────────────────────────────────────────────────

describe('action selection', () => {
  it('renders param fields after picking an action', async () => {
    const user = userEvent.setup()
    const nodeId = useWorkflowStore.getState().addNode('automated', { x: 0, y: 0 })

    render(<AutomatedNodeForm id={nodeId} data={{ title: '', actionId: '', params: {} }} />)

    // Select only mounts after /automations fetch resolves
    await user.selectOptions(await screen.findByRole('combobox'), 'send_email')

    expect(screen.getByPlaceholderText('to')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('subject')).toBeInTheDocument()
  })

  it('writes { actionId, params: {} } to the store immediately on selection', async () => {
    const user = userEvent.setup()
    const nodeId = useWorkflowStore.getState().addNode('automated', { x: 0, y: 0 })

    render(<AutomatedNodeForm id={nodeId} data={{ title: '', actionId: '', params: {} }} />)

    await user.selectOptions(await screen.findByRole('combobox'), 'send_email')

    const data = useWorkflowStore
      .getState()
      .nodes.find((n) => n.id === nodeId)?.data as AutomatedNodeData | undefined

    expect(data?.actionId).toBe('send_email')
    expect(data?.params).toEqual({})
  })
})

// ─── Stale-param flush ─────────────────────────────────────────────────────

describe('stale-param flush on action switch', () => {
  it('clears previous action params synchronously when action changes', async () => {
    const nodeId = useWorkflowStore.getState().addNode('automated', { x: 0, y: 0 })
    // Seed the store as if the 300ms debounce had already fired after user typed
    useWorkflowStore.getState().updateNodeData(nodeId, {
      title: 'My automation',
      actionId: 'send_email',
      params: { to: 'test@test.com', subject: 'hello' },
    })

    const user = userEvent.setup()
    render(
      <AutomatedNodeForm
        id={nodeId}
        data={{
          title: 'My automation',
          actionId: 'send_email',
          params: { to: 'test@test.com', subject: 'hello' },
        }}
      />,
    )

    // Wait for fetch + currentAction resolution so param inputs appear
    await screen.findByPlaceholderText('to')

    // Switch to Generate Document
    await user.selectOptions(screen.getByRole('combobox'), 'generate_doc')

    // Immediately (no timer advance) the store must have clean params
    const data = useWorkflowStore
      .getState()
      .nodes.find((n) => n.id === nodeId)?.data as AutomatedNodeData

    expect(data.actionId).toBe('generate_doc')
    expect(data.params).toEqual({})

    // New action's param fields must be in DOM
    expect(screen.getByPlaceholderText('template')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('recipient')).toBeInTheDocument()
  })

  it('cancelled debounce does not overwrite the flush after action switch', async () => {
    const nodeId = useWorkflowStore.getState().addNode('automated', { x: 0, y: 0 })
    useWorkflowStore.getState().updateNodeData(nodeId, {
      title: 'My automation',
      actionId: 'send_email',
      params: {},
    })

    render(
      <AutomatedNodeForm
        id={nodeId}
        data={{ title: 'My automation', actionId: 'send_email', params: {} }}
      />,
    )

    // Wait for fetch to resolve so param inputs are present (real timers)
    const toInput = await screen.findByPlaceholderText('to')

    // Install fake timers NOW — only the debounce needs timer control
    vi.useFakeTimers()

    // Type into 'to' — creates a 300ms pending debounce write to the store
    fireEvent.change(toInput, { target: { value: 'test@test.com' } })

    // Debounce NOT yet fired — store still has empty params
    let data = useWorkflowStore.getState().nodes.find((n) => n.id === nodeId)
      ?.data as AutomatedNodeData
    expect(data.params).toEqual({})

    // Switch action — must cancel() the pending debounce, then flush synchronously
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'generate_doc' } })

    data = useWorkflowStore.getState().nodes.find((n) => n.id === nodeId)
      ?.data as AutomatedNodeData
    expect(data.actionId).toBe('generate_doc')
    expect(data.params).toEqual({})

    // Advance past where the pending debounce would have fired
    vi.advanceTimersByTime(400)

    // The cancelled debounce must NOT restore stale params
    data = useWorkflowStore.getState().nodes.find((n) => n.id === nodeId)
      ?.data as AutomatedNodeData
    expect(data.actionId).toBe('generate_doc')
    expect(data.params).toEqual({}) // must NOT be { to: 'test@test.com' }
  })
})
