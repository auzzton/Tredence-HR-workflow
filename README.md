# HR Workflow Designer

Visual, drag-and-drop workflow designer for HR processes — onboarding, leave approval, document verification, and beyond. Built as the take-home case study for the **Tredence Studio — Full Stack Engineering Intern (AI Agentic Platforms)** application.

![HR Workflow Designer](docs/screenshot.png)

**Live demo:** https://tredence-hr-workflow.vercel.app *(deploy URL — update after `vercel --prod`)*

---

## Quick start

```bash
git clone https://github.com/auzzton/tredence.git
cd tredence
npm install
npm run dev        # dev server + MSW mock API on http://localhost:5173
npm run build      # type-check + Vite production bundle → dist/
npm run test       # Vitest unit/integration suite
npm run typecheck  # tsc strict check only, no emit
```

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Build | **Vite 8** | Sub-second HMR, first-class TS/JSX, native ESM — no Webpack overhead |
| UI framework | **React 19** | Concurrent features, stable type story with `@types/react 19` |
| Canvas | **@xyflow/react v12** | Purpose-built for node-edge graphs; handles pan/zoom/selection/connection natively — saves ~thousands of lines vs. a canvas-from-scratch |
| State | **Zustand 5** + `immer` + `subscribeWithSelector` | Tiny footprint, no boilerplate, immer lets mutation-style reducers stay type-safe, subscribeWithSelector enables selector memoisation |
| Forms | **react-hook-form 7** + **zod 4** | Uncontrolled inputs avoid re-renders on every keystroke; zod schemas are the single source of truth for both runtime and TypeScript types |
| Styles | **Tailwind v4** via `@tailwindcss/vite` | Zero-config PostCSS, CSS custom properties for the design token layer |
| Mock API | **MSW 2** | Intercepts real `fetch` at the service-worker/browser layer — tests and dev use identical code paths |
| Testing | **Vitest 4** + **@testing-library/react** | Native ESM, identical runtime to Vite, no Jest config translation |
| Types | **TypeScript 6** strict | `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals` — no escape hatches |

---

## Architecture

```
src/
├── api/
│   ├── client.ts          # apiGet / apiPost — thin fetch wrappers
│   └── mocks/
│       ├── handlers.ts    # MSW GET /automations + POST /simulate
│       └── browser.ts     # enableMocks() — lazy-imported in dev only
├── components/
│   ├── canvas/
│   │   ├── WorkflowCanvas.tsx   # ReactFlow root, drag-to-add, edge wiring
│   │   ├── Sidebar.tsx          # Draggable node palette
│   │   └── useCanvasAdapter.ts  # Bridges xyflow callbacks → Zustand actions
│   ├── forms/
│   │   ├── fields.tsx           # Shared field components (TextField, SelectField, …)
│   │   ├── NodeFormPanel.tsx    # Right panel — mounts per-type form for selected node
│   │   ├── StartNodeForm.tsx
│   │   ├── TaskNodeForm.tsx
│   │   ├── ApprovalNodeForm.tsx
│   │   ├── AutomatedNodeForm.tsx
│   │   └── EndNodeForm.tsx
│   ├── nodes/
│   │   ├── NodeShell.tsx        # Common chrome: title bar, delete button, selection ring
│   │   └── {Start,Task,Approval,Automated,End}Node.tsx
│   └── sandbox/
│       └── SandboxPanel.tsx     # Bottom drawer: validation + simulation runner
├── hooks/
│   └── useDebouncedCallback.ts  # Debounce with .cancel() for stale-param flush
├── lib/
│   ├── graphValidation.ts       # validateGraph — start check, orphan check, cycle DFS
│   └── nodeFactory.ts           # createNode — stamped defaults per type
├── store/
│   └── workflowStore.ts         # Zustand store, selectors, version counter
└── types/
    ├── nodes.ts                 # Zod schemas + inferred TS types for all 5 node types
    └── workflow.ts              # Graph, edge, simulation, validation types
```

**Data flow:** Sidebar drag → `addNode` → Zustand `nodes[]` → ReactFlow renders canvas node → user clicks node → `selectedNodeId` set → `NodeFormPanel` mounts typed form → RHF watches fields → 300 ms debounce fires → `updateNodeData` → `version++` → SandboxPanel validation re-runs.

---

## Design decisions

### 1. Zustand `version` counter over deep equality for cache invalidation

Every graph mutation (`addNode`, `updateNodeData`, `addEdge`, `removeNode`, `removeEdge`) increments a monotonic integer. `SandboxPanel` keys its cached simulation result against this counter (`simCache.version === version`). The alternative — deep-equality diffing the entire node/edge arrays before re-simulating — is O(n) on every render and silently breaks when object identity changes without content change (e.g. immer always produces new references). The counter is O(1) and never lies.

### 2. `safeParse` (not `parse`) in the `updateNodeData` dev guard

The store has a DEV-only structural type guard that validates incoming `data` against the node's zod schema. Using `parse()` (throws on failure) caused a subtle cascade: when a user types in a title field, RHF fires `onChange` which calls `register`'s custom handler, which calls `updateNodeData`, which threw a `ZodError` *inside React's event dispatch*. React silently discards the entire pending state batch — both the form's internal state and the store write fail at once, making it look like the select/inputs are broken. `safeParse()` + `console.warn` preserves the guard's intent (catch structural mismatches in development) without weaponising it against valid intermediate editing states like `title: ''`.

### 3. Debounced writeback with an explicit `.cancel()` on the debounced function

Form fields debounce store writes by 300 ms so typing doesn't thrash Zustand and ReactFlow on every keystroke. When the user switches the action on an Automated node, there may be a pending debounce carrying params for the old action. Without cancellation that debounce would fire 300 ms later and restore stale keys. The fix: `useDebouncedCallback` returns a function with an attached `.cancel()` method; the action-change handler calls `writeback.cancel()` then immediately flushes the clean state synchronously, so the cancelled timer can never overwrite it.

### 4. `selectNodeDataById` returns `node.data`, not the full node

`NodeFormPanel` subscribes via `selectNodeDataById(selectedNodeId)`. Immer preserves object identity for nested properties that weren't mutated — so when a node is *dragged* (only `position` changes), `node.data` keeps the same reference and the form panel's selector returns the same value, skipping a re-render. Returning the full `WorkflowNode` would not have this property because immer produces a new node object on every position tick from ReactFlow.

### 5. Iterative DFS for simulation, three-color DFS for cycle detection

Simulation uses an explicit stack (iterative DFS from the start node) to build execution order. The recursive alternative hits JavaScript's call stack limit on deep graphs and makes cancellation harder to reason about. Cycle detection uses the classic three-color marking (0=unvisited, 1=in-stack, 2=done) to detect back edges; a plain visited-set can't distinguish a shared ancestor from a genuine cycle.

### 6. MSW lazy-imported in dev only, never in production build

`main.tsx` does `if (import.meta.env.DEV) { const { enableMocks } = await import('./api/mocks/browser'); await enableMocks() }`. This is a dynamic import inside a dev guard, which Vite's tree-shaker eliminates from the production bundle entirely — MSW's ~200 kB service-worker setup code never ships. Awaiting `enableMocks()` before `ReactDOM.createRoot` ensures the first `/automations` fetch in `AutomatedNodeForm` is intercepted even on cold load.

### 7. Uncontrolled inputs via RHF, zod schema as single source of truth

Each form uses `useForm` with `zodResolver`. The zod schema lives in `src/types/nodes.ts` alongside the inferred TypeScript type — there is exactly one definition for what valid node data looks like, and it's used for: TypeScript types, runtime form validation, the store's dev guard, and the simulation type contracts. No `interface`/`type` that could drift from validation rules.

### 8. AbortController for both fetch and simulation requests

`AutomatedNodeForm` aborts the `/automations` fetch on unmount (node deselected while loading). `SandboxPanel` aborts the in-flight `/simulate` POST when `Run Simulation` is clicked again before the previous call returns. Without this, a slow response that arrives after a new request would overwrite the newer result — classic stale-closure race.

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
- [x] Simulation sandbox: DFS execution trace, step log with node title + message
- [x] Simulation result cached by graph version — clicking Run again on unchanged graph skips the API call
- [x] MSW mock API (`GET /automations`, `POST /simulate`) — works offline, no backend needed
- [x] TypeScript strict mode throughout — `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- [x] Vitest integration tests for AutomatedNodeForm (action selection + stale-param flush)

---

## What I'd add with more time

- **Undo/redo** — Zustand's `temporal` middleware (from `zundo`) would give this nearly for free; the main work is deciding what granularity to snapshot (per-keypress vs. per-blur).
- **Persist to localStorage** — `zustand/middleware/persist` wrapping the store; would let users close and reopen a workflow without losing work.
- **Export/import JSON** — a `Download graph` button and a file-picker import; useful for sharing workflows between users.
- **Validation on the canvas node itself** — highlight nodes with errors directly on the canvas (red border via the `errorsByNode` map already computed in `validateGraph`).
- **Conditional edges** — approval nodes naturally have Yes/No branches; the data model and MSW simulation would need to carry edge labels and branch-selection logic.
- **Real backend** — replace MSW handlers with a thin Express or Hono API; the `apiGet`/`apiPost` wrappers in `client.ts` are the only swap point.
- **Accessibility** — keyboard-navigable canvas, ARIA roles on custom nodes, focus management when the form panel opens.

---

## Known limitations

- Simulation uses DFS execution order, which isn't meaningful for DAGs with parallel branches — a real workflow engine would need topological sort or explicit parallelism primitives.
- The mock `/simulate` endpoint always returns `status: 'success'` for every node; error and skip branches aren't modelled.
- No auth — any user can edit any workflow. Fine for a demo, not for production.
- `autoApproveThreshold` accepts 0 as a valid value (treated as "no auto-approve threshold"), which may be ambiguous in a real product.
