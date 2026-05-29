/**
 * Modal.jsx — FlowOS UI
 *
 * Sizes:  'sm' (400px) | 'md' (560px) | 'lg' (720px) | 'xl' (900px)
 *
 * Usage:
 *   <Modal open={open} onClose={() => setOpen(false)} title="Delete Workflow">
 *     <p>Are you sure?</p>
 *     <Modal.Footer>
 *       <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
 *       <Button variant="danger">Delete</Button>
 *     </Modal.Footer>
 *   </Modal>
 */

import { useEffect, useRef } from 'react';
import { createPortal }       from 'react-dom';

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

function ModalFooter({ children }) {
  return <div className="flowos-modal__footer">{children}</div>;
}

function Modal({
  open,
  onClose,
  title,
  description,
  size      = 'md',
  hideClose = false,
  children,
}) {
  const overlayRef = useRef(null);
  const dialogRef  = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else      document.body.style.overflow = '';
    return   () => { document.body.style.overflow = ''; };
  }, [open]);

  // Auto-focus dialog
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="flowos-modal-overlay"
      onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-desc' : undefined}
        tabIndex={-1}
        className={`flowos-modal flowos-modal--${size}`}
      >
        {/* Header */}
        <div className="flowos-modal__header">
          <div className="flowos-modal__titles">
            {title && <h2 id="modal-title" className="flowos-modal__title">{title}</h2>}
            {description && <p id="modal-desc" className="flowos-modal__desc">{description}</p>}
          </div>
          {!hideClose && (
            <button className="flowos-modal__close" onClick={onClose} aria-label="Close">
              <CloseIcon />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flowos-modal__body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

Modal.Footer = ModalFooter;
export default Modal;
