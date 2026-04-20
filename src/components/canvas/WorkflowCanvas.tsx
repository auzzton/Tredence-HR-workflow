import type { DragEvent } from 'react'
import { useCallback } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
} from '@xyflow/react'
import { NODE_TYPES, type NodeType } from '@/types/nodes'
import { nodeTypes } from '@/components/nodes/nodeTypes'
import { useWorkflowStore } from '@/store/workflowStore'
import { useCanvasAdapter } from './useCanvasAdapter'
import { NODE_DRAG_MIME } from './Sidebar'

function isNodeType(value: string): value is NodeType {
  return (NODE_TYPES as readonly string[]).includes(value)
}

/**
 * Canvas surface. All xyflow change handling lives behind `useCanvasAdapter`
 * so this component never touches applyNodeChanges / applyEdgeChanges
 * directly. Drop handling translates sidebar-originated drags into
 * store.addNode via screenToFlowPosition.
 */
export function WorkflowCanvas() {
  const adapter = useCanvasAdapter()
  const { screenToFlowPosition } = useReactFlow()

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      const raw = event.dataTransfer.getData(NODE_DRAG_MIME)
      if (!isNodeType(raw)) return
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      useWorkflowStore.getState().addNode(raw, position)
    },
    [screenToFlowPosition],
  )

  return (
    <div className="h-full w-full" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={adapter.nodes}
        edges={adapter.edges}
        nodeTypes={nodeTypes}
        onNodesChange={adapter.onNodesChange}
        onEdgesChange={adapter.onEdgesChange}
        onConnect={adapter.onConnect}
        onNodeClick={adapter.onNodeClick}
        onPaneClick={adapter.onPaneClick}
        deleteKeyCode={['Delete', 'Backspace']}
        proOptions={{ hideAttribution: true }}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  )
}
