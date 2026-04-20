import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { NodeType, WorkflowNode, WorkflowNodeData } from '@/types/nodes'
import { nodeDataSchemaFor } from '@/types/nodes'
import type { WorkflowEdge, WorkflowGraph } from '@/types/workflow'
import { createNode, type NodePosition } from '@/lib/nodeFactory'

export type EdgeConnection = {
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
}

type WorkflowState = {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  selectedNodeId: string | null
  // Monotonic counter bumped on every graph mutation (nodes/edges). Exists so
  // validation and simulation results can be cache-keyed against graph state
  // without deep-equality checks. Selection changes do NOT bump it.
  version: number
}

type WorkflowActions = {
  addNode: (type: NodeType, position: NodePosition) => string
  updateNodeData: (id: string, data: WorkflowNodeData) => void
  removeNode: (id: string) => void
  addEdge: (connection: EdgeConnection) => string | null
  removeEdge: (id: string) => void
  setSelectedNodeId: (id: string | null) => void
  clearSelection: () => void
  loadGraph: (graph: WorkflowGraph) => void
  resetGraph: () => void
  setNodes: (nodes: WorkflowNode[]) => void
  setEdges: (edges: WorkflowEdge[]) => void
}

export type WorkflowStore = WorkflowState & WorkflowActions

const initialState: WorkflowState = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  version: 0,
}

export const useWorkflowStore = create<WorkflowStore>()(
  subscribeWithSelector(
    immer((set) => ({
      ...initialState,

      addNode: (type, position) => {
        const node = createNode(type, position)
        set((state) => {
          state.nodes.push(node)
          state.version++
        })
        return node.id
      },

      updateNodeData: (id, data) => {
        set((state) => {
          const node = state.nodes.find((n) => n.id === id)
          if (!node) return
          // Dev-only guard: verify the incoming shape matches the stored node's
          // type via the per-type zod schema. Throws loudly in dev on boundary
          // violations; tree-shaken in prod so the hot path stays a plain write.
          if (import.meta.env.DEV) {
            nodeDataSchemaFor[node.type].parse(data)
          }
          // The form layer enforces per-type correctness (each node type has its
          // own zod schema wired via RHF) and the dev guard above double-checks
          // the boundary. This is the ONE intentional cast in the codebase.
          node.data = data as typeof node.data
          state.version++
        })
      },

      removeNode: (id) => {
        set((state) => {
          state.nodes = state.nodes.filter((n) => n.id !== id)
          state.edges = state.edges.filter((e) => e.source !== id && e.target !== id)
          if (state.selectedNodeId === id) state.selectedNodeId = null
          state.version++
        })
      },

      addEdge: (connection) => {
        if (!connection.source || !connection.target) return null
        if (connection.source === connection.target) return null
        const id = crypto.randomUUID()
        const edge: WorkflowEdge = {
          id,
          source: connection.source,
          target: connection.target,
          ...(connection.sourceHandle != null ? { sourceHandle: connection.sourceHandle } : {}),
          ...(connection.targetHandle != null ? { targetHandle: connection.targetHandle } : {}),
        }
        let added = false
        set((state) => {
          const exists = state.edges.some(
            (e) =>
              e.source === edge.source &&
              e.target === edge.target &&
              (e.sourceHandle ?? null) === (edge.sourceHandle ?? null) &&
              (e.targetHandle ?? null) === (edge.targetHandle ?? null),
          )
          if (!exists) {
            state.edges.push(edge)
            state.version++
            added = true
          }
        })
        return added ? id : null
      },

      removeEdge: (id) => {
        set((state) => {
          const before = state.edges.length
          state.edges = state.edges.filter((e) => e.id !== id)
          if (state.edges.length !== before) state.version++
        })
      },

      setSelectedNodeId: (id) => {
        set((state) => {
          state.selectedNodeId = id
        })
      },

      clearSelection: () => {
        set((state) => {
          state.selectedNodeId = null
        })
      },

      loadGraph: (graph) => {
        set((state) => {
          state.nodes = graph.nodes
          state.edges = graph.edges
          state.selectedNodeId = null
          state.version++
        })
      },

      resetGraph: () => {
        set((state) => {
          state.nodes = []
          state.edges = []
          state.selectedNodeId = null
          state.version++
        })
      },

      setNodes: (nodes) => {
        set((state) => {
          state.nodes = nodes
          state.version++
        })
      },

      setEdges: (edges) => {
        set((state) => {
          state.edges = edges
          state.version++
        })
      },
    })),
  ),
)

// ─── Selectors ─────────────────────────────────────────────────────────────
// Components subscribe through these so store internals stay private. A
// selector returns a stable reference when its dependencies haven't changed,
// which is what lets the form panel skip re-renders on node-drag updates.

// Arrays are typed non-readonly so they pass to xyflow's ReactFlow props
// without a spread copy. Immer freezes the underlying state, so this is a
// surface-level ergonomic concession — callers still cannot mutate.
export const selectNodes = (state: WorkflowStore): WorkflowNode[] => state.nodes
export const selectEdges = (state: WorkflowStore): WorkflowEdge[] => state.edges
export const selectSelectedNodeId = (state: WorkflowStore): string | null => state.selectedNodeId
export const selectVersion = (state: WorkflowStore): number => state.version

export const selectSelectedNode = (state: WorkflowStore): WorkflowNode | null => {
  const { selectedNodeId, nodes } = state
  if (!selectedNodeId) return null
  return nodes.find((n) => n.id === selectedNodeId) ?? null
}

export const selectGraph = (state: WorkflowStore): WorkflowGraph => ({
  nodes: state.nodes,
  edges: state.edges,
})

export const selectNodeById =
  (id: string) =>
  (state: WorkflowStore): WorkflowNode | null =>
    state.nodes.find((n) => n.id === id) ?? null
