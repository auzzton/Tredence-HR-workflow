import { useCallback } from 'react'
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'
import type { WorkflowNode } from '@/types/nodes'
import type { WorkflowEdge } from '@/types/workflow'
import { selectEdges, selectNodes, useWorkflowStore } from '@/store/workflowStore'

/**
 * Single-boundary translator between @xyflow/react's change stream and the
 * Zustand store. Components never import applyNodeChanges / applyEdgeChanges
 * directly — if they need canvas state, they go through this hook.
 *
 * Remove changes are routed to the store's cascading `removeNode` /
 * `removeEdge` so that deleting a node also drops its attached edges. All
 * other change types (position, dimensions, select, …) flow through the
 * regular apply-then-setNodes path.
 *
 * Callbacks read the store via `getState()` instead of closing over
 * selector values, so they remain stable identities across renders and
 * cannot capture stale graph state mid-drag.
 */
export function useCanvasAdapter() {
  const nodes = useWorkflowStore(selectNodes)
  const edges = useWorkflowStore(selectEdges)

  const onNodesChange = useCallback<OnNodesChange<WorkflowNode>>((changes) => {
    const store = useWorkflowStore.getState()
    const removes = changes.filter((c) => c.type === 'remove')
    const others = changes.filter((c) => c.type !== 'remove')
    for (const r of removes) store.removeNode(r.id)
    if (others.length > 0) {
      const fresh = useWorkflowStore.getState().nodes
      useWorkflowStore.getState().setNodes(applyNodeChanges(others, fresh))
    }
  }, [])

  const onEdgesChange = useCallback<OnEdgesChange<WorkflowEdge>>((changes) => {
    const store = useWorkflowStore.getState()
    const removes = changes.filter((c) => c.type === 'remove')
    const others = changes.filter((c) => c.type !== 'remove')
    for (const r of removes) store.removeEdge(r.id)
    if (others.length > 0) {
      const fresh = useWorkflowStore.getState().edges
      useWorkflowStore.getState().setEdges(applyEdgeChanges(others, fresh))
    }
  }, [])

  const onConnect = useCallback<OnConnect>((connection: Connection) => {
    if (!connection.source || !connection.target) return
    useWorkflowStore.getState().addEdge({
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    })
  }, [])

  const onNodeClick = useCallback((_: unknown, node: WorkflowNode) => {
    useWorkflowStore.getState().setSelectedNodeId(node.id)
  }, [])

  const onPaneClick = useCallback(() => {
    useWorkflowStore.getState().clearSelection()
  }, [])

  return { nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onPaneClick }
}
