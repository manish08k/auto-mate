import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'

// ─────────────────────────────────────────────
// workflowStore — active workflow on canvas
//
// Holds the single workflow currently open in
// the canvas editor. Not persisted — loaded fresh
// from API each time the canvas route mounts.
// ─────────────────────────────────────────────

const useWorkflowStore = create(
  devtools(
    subscribeWithSelector((set, get) => ({
      // ── State ──
      workflow:    null,   // { id, name, isActive, nodes, edges, settings }
      isSaving:    false,
      isRunning:   false,
      lastSavedAt: null,
      isDirty:     false,  // unsaved changes exist
      runResult:   null,   // last test/run result

      // ── Actions ──

      /**
       * loadWorkflow(id)
       * Fetches workflow from backend and populates store.
       */
      loadWorkflow: async (id) => {
        const { getWorkflow } = await import('../services/workflowService.js')
        const wf = await getWorkflow(id)
        set({ workflow: wf, isDirty: false })
        // Update canvas title
        document.title = `${wf.name} — FlowOS`
        return wf
      },

      /**
       * saveWorkflow()
       * Debounced by callers. Sends current workflow state to backend.
       */
      saveWorkflow: async () => {
        const { workflow } = get()
        if (!workflow) return
        set({ isSaving: true })
        try {
          const { updateWorkflow } = await import('../services/workflowService.js')
          await updateWorkflow(workflow.id, workflow)
          set({ isSaving: false, isDirty: false, lastSavedAt: Date.now() })
        } catch (err) {
          set({ isSaving: false })
          throw err
        }
      },

      /**
       * updateName(name)
       * Renames the workflow locally + triggers save.
       */
      updateName: (name) => {
        set((s) => ({ workflow: { ...s.workflow, name }, isDirty: true }))
        document.title = `${name} — FlowOS`
        get().saveWorkflow()
      },

      /**
       * toggleActive()
       * Flips workflow active state and saves.
       */
      toggleActive: () => {
        set((s) => ({
          workflow: { ...s.workflow, isActive: !s.workflow?.isActive },
          isDirty:  true,
        }))
        get().saveWorkflow()
      },

      /**
       * runWorkflow({ mode: 'test' | 'production' })
       */
      runWorkflow: async ({ mode }) => {
        const { workflow } = get()
        if (!workflow || get().isRunning) return
        set({ isRunning: true, runResult: null })
        try {
          const { executeWorkflow } = await import('../services/executionService.js')
          const result = await executeWorkflow(workflow.id, { mode })
          set({ isRunning: false, runResult: result })
          return result
        } catch (err) {
          set({ isRunning: false })
          throw err
        }
      },

      /**
       * setNodes / setEdges — called by ReactFlow on drag/connect
       */
      setNodes: (nodes) => {
        set((s) => ({ workflow: { ...s.workflow, nodes }, isDirty: true }))
      },
      setEdges: (edges) => {
        set((s) => ({ workflow: { ...s.workflow, edges }, isDirty: true }))
      },

      /**
       * reset()
       * Clears canvas state when navigating away.
       */
      reset: () => {
        set({ workflow: null, isSaving: false, isRunning: false, lastSavedAt: null, isDirty: false, runResult: null })
      },
    })),
    { name: 'workflowStore' }
  )
)

export default useWorkflowStore
