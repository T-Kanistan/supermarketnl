import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AppzDevelopedPopupPanel from './AppzDevelopedPopupPanel';
import './Footer.css';
import './AppzDevelopedPopup.css';

/**
 * "Developed by AppZ Makers" trigger + centered modal (portal).
 * Uses the same panel content and styling as the website footer popover.
 */
const AppzDevelopedPopup = ({ className = '', triggerClassName = '' }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const titleId = useId();

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const openPopup = useCallback(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('keydown', onKeyDown);

    dialogRef.current?.querySelector('.appz-developed-modal-close')?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return undefined;

    const handleTab = (e) => {
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [open]);

  const modal = open
    ? createPortal(
        <div
          className="appz-developed-overlay"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          onTouchStart={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            ref={dialogRef}
            className="appz-developed-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="appz-developed-modal-close"
              aria-label="Close AppZ Makers popup"
              onClick={close}
            >
              &times;
            </button>
            <span id={titleId} className="visually-hidden">
              AppZ Makers
            </span>
            <AppzDevelopedPopupPanel onClose={close} />
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div className={className || undefined}>
        <button
          ref={triggerRef}
          type="button"
          className={`appz-developed-trigger${triggerClassName ? ` ${triggerClassName}` : ''}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={openPopup}
        >
          Developed by AppZ Makers
        </button>
      </div>
      {modal}
    </>
  );
};

export default AppzDevelopedPopup;
