import { http, HttpResponse } from 'msw'
import type {
  AutomationAction,
  ExecutionLogEntry,
  SimulationRequest,
  SimulationResponse,
} from '@/types/workflow'
import type { WorkflowNode } from '@/types/nodes'

const ACTIONS: AutomationAction[] = [
  { id: 'send_email', label: 'Send Email', params: ['to', 'subject'] },
  { id: 'generate_doc', label: 'Generate Document', params: ['template', 'recipient'] },
  { id: 'notify_slack', label: 'Notify Slack', params: ['channel', 'message'] },
  { id: 'create_ticket', label: 'Create Ticket', params: ['project', 'summary'] },
  { id: 'update_record', label: 'Update Record', params: ['table', 'record_id'] },
  { id: 'send_webhook', label: 'Send Webhook', params: ['url', 'payload'] },
]

function nodeTitle(node: WorkflowNode): string {
  switch (node.type) {
    case 'start':
      return node.data.title || 'Start'
    case 'task':
      return node.data.title || 'Untitled task'
    case 'approval':
      return node.data.title || 'Approval'
    case 'automated':
      return node.data.title || 'Automated step'
    case 'end':
      return node.data.endMessage || 'End'
  }
}

function nodeMessage(node: WorkflowNode): string {
  switch (node.type) {
    case 'start':
      return 'Workflow initiated'
    case 'task':
      return `Task assigned to ${node.data.assignee || 'unassigned'}`
    case 'approval':
      return `Awaiting approval from ${node.data.approverRole}`
    case 'automated': {
      const action = ACTIONS.find((a) => a.id === node.data.actionId)
      return `Executed: ${action?.label ?? (node.data.actionId || 'no action set')}`
    }
    case 'end':
      return node.data.endMessage || 'Workflow completed'
  }
}

export const handlers = [
  http.get('/automations', () => {
    return HttpResponse.json(ACTIONS)
  }),

  http.post('/simulate', async ({ request }) => {
    const { graph } = (await request.json()) as SimulationRequest
    const { nodes, edges } = graph

    const startNode = nodes.find((n) => n.type === 'start')
    if (!startNode) {
      return HttpResponse.json({ ok: false, log: [], durationMs: 0 } satisfies SimulationResponse)
    }

    // Build adjacency list
    const adjacency = new Map<string, string[]>()
    for (const edge of edges) {
      const targets = adjacency.get(edge.source) ?? []
      targets.push(edge.target)
      adjacency.set(edge.source, targets)
    }

    // Iterative DFS — push targets in reverse so leftmost edge is visited first
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))
    const visited = new Set<string>()
    const order: WorkflowNode[] = []
    const stack = [startNode.id]

    while (stack.length > 0) {
      const id = stack.pop()!
      if (visited.has(id)) continue
      visited.add(id)
      const node = nodeMap.get(id)
      if (node) order.push(node)
      const targets = adjacency.get(id) ?? []
      for (let i = targets.length - 1; i >= 0; i--) {
        if (!visited.has(targets[i]!)) stack.push(targets[i]!)
      }
    }

    const baseTime = Date.now()
    const log: ExecutionLogEntry[] = order.map((node, i) => ({
      step: i + 1,
      nodeId: node.id,
      nodeType: node.type,
      nodeTitle: nodeTitle(node),
      status: 'success',
      message: nodeMessage(node),
      timestamp: new Date(baseTime + i * 500).toISOString(),
    }))

    return HttpResponse.json({
      ok: true,
      log,
      durationMs: order.length * 500,
    } satisfies SimulationResponse)
  }),
]
