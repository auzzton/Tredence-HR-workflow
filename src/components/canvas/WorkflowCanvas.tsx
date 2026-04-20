import { Background, BackgroundVariant, Controls, MiniMap, ReactFlow } from '@xyflow/react'
import { useCanvasAdapter } from './useCanvasAdapter'

/**
 * Canvas surface. All xyflow change handling lives behind `useCanvasAdapter`
 * so this component never touches applyNodeChanges / applyEdgeChanges
 * directly. Node types and the sidebar drop handler arrive in follow-up
 * commits.
 */
export function WorkflowCanvas() {
  const adapter = useCanvasAdapter()
  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={adapter.nodes}
        edges={adapter.edges}
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
