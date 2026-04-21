import { ReactFlowProvider } from '@xyflow/react'
import { Sidebar } from '@/components/canvas/Sidebar'
import { WorkflowCanvas } from '@/components/canvas/WorkflowCanvas'
import { NodeFormPanel } from '@/components/forms/NodeFormPanel'

export default function App() {
  return (
    <ReactFlowProvider>
      <div className="flex h-full w-full">
        <aside className="h-full w-60 shrink-0 border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]">
          <Sidebar />
        </aside>
        <main className="h-full min-w-0 flex-1">
          <WorkflowCanvas />
        </main>
        <NodeFormPanel />
      </div>
    </ReactFlowProvider>
  )
}
