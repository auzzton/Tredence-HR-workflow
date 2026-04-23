import { useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Play } from 'lucide-react'
import { apiPost } from '@/api/client'
import { runSimulation } from '@/lib/simulate'
import { validateGraph } from '@/lib/graphValidation'
import {
  selectEdges,
  selectNodes,
  selectVersion,
  useWorkflowStore,
} from '@/store/workflowStore'
import type { SimulationRequest, SimulationResponse } from '@/types/workflow'

type SimCache = { version: number; result: SimulationResponse }

export function SandboxPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [simStatus, setSimStatus] = useState<'idle' | 'running' | 'error'>('idle')
  const [simCache, setSimCache] = useState<SimCache | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const nodes = useWorkflowStore(selectNodes)
  const edges = useWorkflowStore(selectEdges)
  const version = useWorkflowStore(selectVersion)

  const graph = useMemo(() => ({ nodes, edges }), [nodes, edges])
  const validation = useMemo(() => validateGraph(graph), [graph])

  // Cached result is only valid for the current graph version
  const cachedResult = simCache?.version === version ? simCache.result : null

  async function handleRunSimulation() {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setSimStatus('running')
    try {
      const result = await apiPost<SimulationRequest, SimulationResponse>(
        '/simulate',
        { graph },
        controller.signal,
      )
      if (!controller.signal.aborted) {
        setSimCache({ version, result })
        setSimStatus('idle')
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      const result = runSimulation(graph)
      setSimCache({ version, result })
      setSimStatus('idle')
    }
  }

  const displayResult = cachedResult ?? null

  return (
    <div className="flex shrink-0 flex-col border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]">
      {/* Toggle tab */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
      >
        {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        Simulation
        {!validation.ok && (
          <span className="ml-auto text-[var(--color-danger)]">
            {validation.errors.length} error{validation.errors.length > 1 ? 's' : ''}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="flex h-52 flex-col gap-2 overflow-hidden p-3">
          {/* Validation errors block simulation */}
          {!validation.ok && (
            <div className="flex flex-col gap-1">
              {validation.errors.map((err, i) => (
                <p key={i} className="text-xs text-[var(--color-danger)]">
                  {err.message}
                </p>
              ))}
            </div>
          )}

          {validation.ok && (
            <>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  disabled={simStatus === 'running'}
                  className="flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  <Play className="h-3 w-3" />
                  {simStatus === 'running' ? 'Running…' : 'Run Simulation'}
                </button>
                {simStatus === 'error' && (
                  <span className="text-xs text-[var(--color-danger)]">Simulation failed.</span>
                )}
                {displayResult && (
                  <span className="ml-auto text-xs text-[var(--color-text-muted)]">
                    {displayResult.durationMs}ms simulated · {displayResult.log.length} steps
                  </span>
                )}
              </div>

              {displayResult && (
                <div className="flex-1 overflow-y-auto rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-2">
                  {displayResult.log.map((entry) => (
                    <div key={entry.step} className="flex gap-2 py-0.5 text-xs">
                      <span className="w-4 shrink-0 text-right text-[var(--color-text-muted)]">
                        {entry.step}.
                      </span>
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {entry.nodeTitle}
                      </span>
                      <span className="text-[var(--color-text-secondary)]">—</span>
                      <span className="text-[var(--color-text-secondary)]">{entry.message}</span>
                      <span className="ml-auto shrink-0 text-[var(--color-success)]">
                        ✓
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {!displayResult && simStatus === 'idle' && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Run the simulation to trace execution order.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
