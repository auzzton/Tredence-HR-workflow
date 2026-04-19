import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { NodeType, WorkflowNode, WorkflowNodeData } from '@/types/nodes'
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
}

export const useWorkflowStore = create<WorkflowStore>()(
  subscribeWithSelector(
    immer((set) => ({
      ...initialState,

      addNode: (type, position) => {
        const node = createNode(type, position)
        set((state) => {
          state.nodes.push(node)
        })
        return node.id
      },

      updateNodeData: (id, data) => {
        set((state) => {
          const node = state.nodes.find((n) => n.id === id)
          if (!node) return
          // The form layer enforces per-type correctness (each node type has its
          // own zod schema wired via RHF), so at this store boundary the shape
          // is trusted to match `node.type`. This is the ONE intentional cast.
          node.data = data as typeof node.data
        })
      },

      removeNode: (id) => {
        set((state) => {
          state.nodes = state.nodes.filter((n) => n.id !== id)
          state.edges = state.edges.filter((e) => e.source !== id && e.target !== id)
          if (state.selectedNodeId === id) state.selectedNodeId = null
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
        set((state) => {
          const exists = state.edges.some(
            (e) =>
              e.source === edge.source &&
              e.target === edge.target &&
              (e.sourceHandle ?? null) === (edge.sourceHandle ?? null) &&
              (e.targetHandle ?? null) === (edge.targetHandle ?? null),
          )
          if (!exists) state.edges.push(edge)
        })
        return id
      },

      removeEdge: (id) => {
        set((state) => {
          state.edges = state.edges.filter((e) => e.id !== id)
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
        })
      },

      resetGraph: () => {
        set((state) => {
          state.nodes = []
          state.edges = []
          state.selectedNodeId = null
        })
      },

      setNodes: (nodes) => {
        set((state) => {
          state.nodes = nodes
        })
      },

      setEdges: (edges) => {
        set((state) => {
          state.edges = edges
        })
      },
    })),
  ),
)

// ─── Selectors ─────────────────────────────────────────────────────────────
// Components subscribe through these so store internals stay private. A
// selector returns a stable reference when its dependencies haven't changed,
// which is what lets the form panel skip re-renders on node-drag updates.

export const selectNodes = (state: WorkflowStore): readonly WorkflowNode[] => state.nodes
export const selectEdges = (state: WorkflowStore): readonly WorkflowEdge[] => state.edges
export const selectSelectedNodeId = (state: WorkflowStore): string | null => state.selectedNodeId

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
