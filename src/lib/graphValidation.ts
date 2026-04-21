import type { WorkflowGraph, ValidationError, ValidationResult } from '@/types/workflow'
import type { WorkflowNode } from '@/types/nodes'

function nodeLabel(node: WorkflowNode): string {
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

function detectCycle(graph: WorkflowGraph): boolean {
  const adj = new Map<string, string[]>()
  for (const { source, target } of graph.edges) {
    const list = adj.get(source) ?? []
    list.push(target)
    adj.set(source, list)
  }

  // DFS with three-color marking: 0=unvisited, 1=in-stack, 2=done
  const color = new Map<string, 0 | 1 | 2>()
  for (const n of graph.nodes) color.set(n.id, 0)

  function dfs(id: string): boolean {
    color.set(id, 1)
    for (const next of adj.get(id) ?? []) {
      if (color.get(next) === 1) return true // back edge
      if (color.get(next) === 0 && dfs(next)) return true
    }
    color.set(id, 2)
    return false
  }

  for (const n of graph.nodes) {
    if (color.get(n.id) === 0 && dfs(n.id)) return true
  }
  return false
}

export function validateGraph(graph: WorkflowGraph): ValidationResult {
  const { nodes, edges } = graph
  const errors: ValidationError[] = []

  // 1. Must have a Start node
  if (!nodes.some((n) => n.type === 'start')) {
    errors.push({ code: 'no_start', message: 'Workflow must contain a Start node.' })
  }

  // 2. Orphan nodes — any node with no edge in OR out (when graph has >1 node)
  if (nodes.length > 1) {
    const connectedIds = new Set<string>()
    for (const { source, target } of edges) {
      connectedIds.add(source)
      connectedIds.add(target)
    }
    for (const node of nodes) {
      if (!connectedIds.has(node.id)) {
        errors.push({
          code: 'orphan_node',
          message: `"${nodeLabel(node)}" is not connected to the workflow.`,
          nodeId: node.id,
        })
      }
    }
  }

  // 3. Cycles
  if (detectCycle(graph)) {
    errors.push({ code: 'cycle', message: 'Workflow contains a cycle.' })
  }

  const errorsByNode: Record<string, ValidationError[]> = {}
  for (const err of errors) {
    if (err.nodeId) {
      const list = errorsByNode[err.nodeId] ?? []
      list.push(err)
      errorsByNode[err.nodeId] = list
    }
  }

  return { ok: errors.length === 0, errors, errorsByNode }
}
