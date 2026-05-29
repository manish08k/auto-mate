import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useWorkflowStore from '../../store/workflowStore.js'

// ─────────────────────────────────────────────
// CanvasShell
// Full-screen layout for the workflow canvas editor.
// No sidebar. Just: back arrow | workflow name (editable) | status | run controls.
// Children = <Canvas /> page rendered inside the canvas area.
// ─────────────────────────────────────────────
export default function CanvasShell({ children }) {
  const navigate       = useNavigate()
  const { workflowId } = useParams()

  const workflow       = useWorkflowStore((s) => s.workflow)
  const isSaving       = useWorkflowStore((s) => s.isSaving)
  const isRunning      = useWorkflowStore((s) => s.isRunning)
  const lastSavedAt    = useWorkflowStore((s) => s.lastSavedAt)
  const updateName     = useWorkflowStore((s) => s.updateName)
  const runWorkflow    = useWorkflowStore((s) => s.runWorkflow)
  const toggleActive   = useWorkflowStore((s) => s.toggleActive)

  const [editingName, setEditingName] = useState(false)
  const [nameValue,   setNameValue]   = useState('')

  const handleNameClick = () => {
    setNameValue(workflow?.name ?? 'Untitled workflow')
    setEditingName(true)
  }

  const handleNameBlur = () => {
    setEditingName(false)
    if (nameValue.trim() && nameValue !== workflow?.name) {
      updateName(nameValue.trim())
    }
  }

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur()
    if (e.key === 'Escape') {
      setEditingName(false)
      setNameValue(workflow?.name ?? '')
    }
  }

  const saveStatus = () => {
    if (isSaving) return { label: 'Saving…', cls: 'saving' }
    if (lastSavedAt) {
      const diff = Math.round((Date.now() - lastSavedAt) / 1000)
      if (diff < 5)  return { label: 'Saved', cls: 'saved' }
      if (diff < 60) return { label: `Saved ${diff}s ago`, cls: 'saved' }
      return { label: 'Saved', cls: 'saved' }
    }
    return null
  }

  const status = saveStatus()

  return (
    <div className="canvas-shell">

      {/* ── Top bar ── */}
      <header className="canvas-topbar" role="banner">

        {/* Left: back + name */}
        <div className="canvas-topbar__left">
          <button
            className="canvas-topbar__back"
            onClick={() => navigate('/dashboard')}
            aria-label="Back to dashboard"
            title="Back to dashboard"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="canvas-topbar__divider" aria-hidden="true" />

          {/* Breadcrumb: Workflows / name */}
          <div className="canvas-topbar__breadcrumb">
            <button
              className="canvas-topbar__breadcrumb-home"
              onClick={() => navigate('/dashboard')}
              aria-label="All workflows"
            >
              Workflows
            </button>
            <span className="canvas-topbar__breadcrumb-sep" aria-hidden="true">/</span>

            {editingName ? (
              <input
                className="canvas-topbar__name-input"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={handleNameBlur}
                onKeyDown={handleNameKeyDown}
                autoFocus
                maxLength={80}
                aria-label="Workflow name"
              />
            ) : (
              <button
                className="canvas-topbar__name"
                onClick={handleNameClick}
                aria-label="Edit workflow name"
                title="Click to rename"
              >
                {workflow?.name ?? 'Untitled workflow'}
              </button>
            )}
          </div>

          {/* Auto-save status */}
          {status && (
            <span className={`canvas-topbar__save-status canvas-topbar__save-status--${status.cls}`} aria-live="polite">
              {status.cls === 'saving' && (
                <svg className="canvas-topbar__save-spinner" width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                  <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 20" strokeLinecap="round"/>
                </svg>
              )}
              {status.cls === 'saved' && (
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                  <path d="M2 5.5L4.5 8L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {status.label}
            </span>
          )}
        </div>

        {/* Center: active/inactive toggle */}
        <div className="canvas-topbar__center">
          {workflow && (
            <button
              className={`canvas-topbar__active-toggle ${workflow.isActive ? 'canvas-topbar__active-toggle--on' : ''}`}
              onClick={() => toggleActive()}
              aria-pressed={workflow.isActive}
              title={workflow.isActive ? 'Workflow is active — click to deactivate' : 'Workflow is inactive — click to activate'}
            >
              <span className="canvas-topbar__active-dot" aria-hidden="true" />
              {workflow.isActive ? 'Active' : 'Inactive'}
            </button>
          )}
        </div>

        {/* Right: zoom display + run controls */}
        <div className="canvas-topbar__right">

          {/* Keyboard shortcut hint */}
          <span className="canvas-topbar__hint" aria-hidden="true">
            Cmd+K to search
          </span>

          <div className="canvas-topbar__divider" aria-hidden="true" />

          {/* Test / run */}
          <button
            className="canvas-topbar__btn canvas-topbar__btn--ghost"
            onClick={() => runWorkflow({ mode: 'test' })}
            disabled={isRunning}
            title="Test workflow with sample data"
            aria-label="Test run"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 2.5L12 7L2 11.5V2.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
            </svg>
            Test
          </button>

          {/* Deploy / run live */}
          <button
            className={`canvas-topbar__btn canvas-topbar__btn--primary ${isRunning ? 'canvas-topbar__btn--loading' : ''}`}
            onClick={() => runWorkflow({ mode: 'production' })}
            disabled={isRunning}
            title="Run workflow in production mode"
            aria-label={isRunning ? 'Running…' : 'Run workflow'}
          >
            {isRunning ? (
              <>
                <svg className="canvas-topbar__run-spinner" width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="8 24" strokeLinecap="round"/>
                </svg>
                Running…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <path d="M2 1.5L11.5 6.5L2 11.5V1.5Z" fill="currentColor"/>
                </svg>
                Run
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Canvas area ── */}
      <div className="canvas-shell__body" role="main" id="main-content">
        {children}
      </div>

    </div>
  )
}
