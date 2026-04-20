import { ReactFlowProvider } from '@xyflow/react'
import { WorkflowCanvas } from '@/components/canvas/WorkflowCanvas'

export default function App() {
  return (
    <ReactFlowProvider>
      <div className="flex h-full w-full">
        <aside className="h-full w-60 shrink-0 border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]">
          {/* Sidebar goes here (next commit) */}
        </aside>
        <main className="h-full flex-1">
          <WorkflowCanvas />
        </main>
      </div>
    </ReactFlowProvider>
  )
}
