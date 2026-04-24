# HR Workflow Designer

<!-- SCREENSHOT_PLACEHOLDER — I'll add screenshot.png after deploy -->

**Live Demo:** (https://tredence-hr-workflow-kappa.vercel.app/)

## Overview

HR Workflow Designer is a browser-based visual editor for building and testing internal HR process flows — onboarding checklists, leave approvals, automated notifications, and more. Teams drag nodes onto a canvas, configure each step, then run a sandbox simulation to trace execution order before publishing. Built as the take-home case study for the **Tredence Studio — Full Stack Engineering Intern (AI Agentic Platforms)** application.

## Tech Stack

| Tool | Version | Why |
|------|---------|-----|
| React | 19 | Concurrent features; stable `@types/react 19` type story |
| TypeScript (strict) | 6 | `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` catch real bugs at the canvas/store boundary |
| Vite | 8 | Sub-second HMR, native ESM dev server — no Webpack overhead |
| @xyflow/react | 12 | Purpose-built for node-edge graphs; typed `Node<Data, Type>` generics eliminate data-shape casts |
| Zustand + immer + subscribeWithSelector | 5 | Avoids re-render cascades on high-frequency drag updates; `getState()` in callbacks prevents stale closure captures |
| Tailwind | 4 | CSS-variable design tokens compile to a single stylesheet; no runtime style injection on the hot path |
| react-hook-form + zod | 7 / 4 | Uncontrolled inputs keep form re-renders isolated from the canvas; zod schemas are the single source of node data contracts |
| MSW | 2 | Intercepts `fetch` at the service-worker level — no mock code bleeds into production bundles |
| Vitest + React Testing Library | 4 / 16 | Native ESM, identical runtime to Vite; RTL drives forms the same way a user does |
| lucide-react | 1 | Tree-shakeable icon set; only imported icons ship |
| immer | 11 | Structural sharing in the Zustand store: position-only drags don't invalidate `node.data` references |

## Quick Start

**Prerequisites:** Node 18+, npm 9+

```bash
git clone https://github.com/auzzton/hr-workflow-designer.git
cd hr-workflow-designer
npm install
npm run dev        # dev server + MSW mock API → http://localhost:5173
```

```bash
npm run build      # tsc strict check + Vite production bundle → dist/
npm run preview    # serve the production build locally
npm run test       # Vitest (single run)
npm run typecheck  # tsc --noEmit only
npm run lint       # ESLint
```

---

## Features

- [x] Drag nodes from sidebar onto canvas (Start, Task, Approval, Automated Step, End)
- [x] Connect nodes by dragging from handle to handle; duplicate edges rejected
- [x] Delete nodes (removes dangling edges automatically) and edges
- [x] Pan, zoom, and fit-to-view controls via xyflow built-ins
- [x] Click any node to open a typed form panel on the right
- [x] **Start node** — title + arbitrary key/value metadata pairs
- [x] **Task node** — title, description, assignee, due date, custom key/value fields
- [x] **Approval node** — title, approver role (Manager/HRBP/Director), auto-approve threshold
- [x] **Automated node** — title, action picker (6 actions from `/automations`), dynamic param fields per action
- [x] **End node** — end message, summary flag
- [x] All forms debounce-write to the canvas node in real time (300 ms)
- [x] Graph validation: missing Start node, orphan nodes, cycles
- [x] Validation errors shown in sandbox panel and block simulation
- [x] Simulation sandbox: DFS execution trace with step log (node title + message + timestamp)
- [x] Simulation result cached by graph version — unchanged graph skips the re-fetch
- [x] MSW mock API (`GET /automations`, `POST /simulate`) — works offline, no backend needed
- [x] Production-safe fallbacks: client-side DFS simulation + hardcoded action list when MSW isn't running (Vercel)
- [x] TypeScript strict mode throughout — `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- [x] Vitest integration tests for AutomatedNodeForm (action selection + stale-param flush)

---

## Architecture

```
src/
├── api/
│   ├── client.ts          # apiGet / apiPost — thin fetch wrappers, throws ApiError on !ok
│   └── mocks/
│       ├── handlers.ts    # GET /automations + POST /simulate (delegates to lib/)
│       └── browser.ts     # enableMocks() — lazy-imported in dev only, tree-shaken in prod
├── components/
│   ├── canvas/
│   │   ├── WorkflowCanvas.tsx   # ReactFlow surface + sidebar drag-drop zone
│   │   ├── Sidebar.tsx          # Draggable node palette
│   │   └── useCanvasAdapter.ts  # Bridges xyflow change events → Zustand actions
│   ├── forms/
│   │   ├── fields.tsx           # Shared TextField / SelectField primitives
│   │   ├── NodeFormPanel.tsx    # Selection-driven panel shell (keyed by node id)
│   │   └── *NodeForm.tsx        # Per-type RHF + zod forms
│   ├── nodes/
│   │   ├── NodeShell.tsx        # Shared card layout; handles are siblings to the
│   │   │                        # overflow-hidden card so they aren't pointer-clipped
│   │   └── *.tsx                # Thin memo'd per-type wrappers
│   └── sandbox/
│       └── SandboxPanel.tsx     # Collapsible simulation + validation panel
├── hooks/
│   └── useDebouncedCallback.ts  # Debounce with .cancel() for stale-param flush
├── lib/
│   ├── fallbackActions.ts  # Single source of truth for the 6 automation actions
│   ├── simulate.ts         # DFS traversal — used by MSW handler and prod fallback
│   ├── graphValidation.ts  # validateGraph: start, orphan, cycle checks
│   └── nodeFactory.ts      # createNode with typed defaults per node type
├── store/
│   └── workflowStore.ts    # Zustand store (immer + subscribeWithSelector) + selectors
└── types/
    ├── nodes.ts            # Discriminated-union WorkflowNode + zod schemas
    └── workflow.ts         # Edge, graph, simulation, and validation types
```

**Data flow:** Sidebar drag → `addNode` → Zustand `nodes[]` → ReactFlow renders node → user clicks node → `selectedNodeId` set → `NodeFormPanel` mounts typed form → RHF watches fields → 300 ms debounce → `updateNodeData` → `version++` → SandboxPanel validation re-runs.

---

## Design Decisions

### 1. Zustand `version` counter over deep equality for cache invalidation

Every graph mutation increments a monotonic integer. `SandboxPanel` keys its cached simulation result against this counter (`simCache.version === version`). Deep-equality diffing the node/edge arrays is O(n) per render and silently breaks when object identity changes without content change (immer always produces new references on mutation). The counter is O(1) and never lies.

### 2. `safeParse` (not `parse`) in the `updateNodeData` dev guard

The store has a DEV-only structural guard that validates incoming `data` against the node's zod schema. Using `parse()` (throws on failure) caused a subtle cascade: typing in a title field fired `onChange` → `updateNodeData` → `ZodError` inside React's event dispatch → React silently dropped the pending state batch — both form state and store write failed at once. `safeParse()` + `console.warn` preserves the guard's intent without weaponising it against valid intermediate editing states like `title: ''`.

### 3. Debounced writeback with explicit `.cancel()` on action change

Form fields debounce store writes by 300 ms. When the user switches the action on an Automated node, a pending debounce may carry params for the old action. Without cancellation that debounce would fire 300 ms later and restore stale keys. The fix: `useDebouncedCallback` exposes `.cancel()`; the action-change handler calls `writeback.cancel()` then flushes the clean state synchronously, so the cancelled timer can never overwrite it.

### 4. `selectNodeDataById` returns `node.data`, not the full node

`NodeFormPanel` subscribes via `selectNodeDataById(selectedNodeId)`. Immer preserves object identity for nested properties that weren't mutated — so when a node is *dragged* (only `position` changes), `node.data` keeps the same reference and the selector returns the same value, skipping a re-render. Returning the full `WorkflowNode` would break this: immer produces a new node object on every position tick.

### 5. Iterative DFS for simulation, three-color DFS for cycle detection

Simulation uses an explicit stack (iterative DFS from the start node) to avoid JavaScript's call-stack limit on deep graphs and to make abort-on-re-run cleaner. Cycle detection uses three-color marking (0=unvisited, 1=in-stack, 2=done) to identify back edges; a plain visited-set can't distinguish a shared ancestor from a genuine cycle.

### 6. MSW lazy-imported in dev only — zero production cost

`main.tsx` does `if (import.meta.env.DEV) { const { enableMocks } = await import('./api/mocks/browser'); await enableMocks() }`. The dynamic import inside a dev guard is eliminated from the production bundle by Vite's tree-shaker — MSW's ~200 kB service-worker setup never ships. Awaiting `enableMocks()` before `createRoot` ensures the first `/automations` fetch is intercepted even on cold load.

### 7. `runSimulation` extracted to `src/lib/simulate.ts` — single source for dev and prod

The MSW `/simulate` handler and the `SandboxPanel` production fallback both call `runSimulation(graph)` from the same module. This guarantees byte-identical simulation output between dev (MSW) and production (Vercel), and means the action list (`FALLBACK_ACTIONS`) has exactly one definition shared by both paths.

### 8. AbortController for both fetch effects

`AutomatedNodeForm` aborts the `/automations` fetch on unmount (node deselected while loading). `SandboxPanel` aborts the in-flight `/simulate` POST when Run is clicked again before the previous call returns. Without this, a slow response arriving after a new request would overwrite the newer result — classic stale-closure race.

---

## What I'd add with more time

- **Undo/redo** — Zustand's `temporal` middleware (`zundo`) would give this nearly for free; the main work is deciding snapshot granularity (per-keypress vs. per-blur).
- **Persist to localStorage** — `zustand/middleware/persist` wrapping the store; users could close and reopen without losing work.
- **Export/import JSON** — a Download graph button and file-picker import for sharing workflows.
- **Inline canvas validation** — highlight error nodes directly on the canvas using the `errorsByNode` map already computed by `validateGraph`.
- **Conditional edges** — Approval nodes naturally have Yes/No branches; would need edge labels and branch-selection logic in the simulation.
- **Real backend** — replace MSW handlers with a thin API; `apiGet`/`apiPost` in `client.ts` are the only swap point.
- **Accessibility** — keyboard-navigable canvas, ARIA roles on custom nodes, focus management when the form panel opens.

---

## Known Limitations

- Simulation uses DFS order, which isn't meaningful for DAGs with parallel branches — a real engine would need topological sort or explicit parallelism.
- The mock `/simulate` always returns `status: 'success'`; error and skip branches aren't modelled.
- No auth — any user can edit any workflow. Fine for a demo, not production.

---

## License

[MIT](LICENSE)
