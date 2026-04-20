import { Background, BackgroundVariant, Controls, MiniMap, ReactFlow } from '@xyflow/react'

/**
 * Canvas shell. Renders an empty ReactFlow surface with the dotted grid,
 * minimap, and controls. The store↔xyflow adapter, node types, and drop
 * handler are wired in later commits so this shell stays independently
 * reviewable.
 */
export function WorkflowCanvas() {
  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={[]}
        edges={[]}
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
