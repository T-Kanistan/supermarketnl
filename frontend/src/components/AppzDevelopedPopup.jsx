import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import AppzDevelopedPopupPanel from './AppzDevelopedPopupPanel';
import './Footer.css';
import './AppzDevelopedPopup.css';

const APPZ_WEBSITE = 'https://appzmake.com';
const HIDE_DELAY_MS = 250;
const POPOVER_GAP = 10;
const VIEWPORT_MARGIN = 8;

/**
 * "Developed by AppZ Makers" trigger + anchored hover/tap popover (portal).
 * Uses the same panel content and styling as the website footer popover.
 */
const AppzDevelopedPopup = ({
  className = '',
  triggerClassName = '',
  triggerLabel = 'Developed by AppZ Makers',
}) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'top' });
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const hideTimerRef = useRef(null);
  const popoverId = useId();
  const titleId = useId();

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const close = useCallback(({ returnFocus = false } = {}) => {
    clearHideTimer();
    setOpen(false);
    if (returnFocus) {
      triggerRef.current?.focus();
    }
  }, [clearHideTimer]);

  const openPopup = useCallback(() => {
    clearHideTimer();
    setOpen(true);
  }, [clearHideTimer]);

  const scheduleClose = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      hideTimerRef.current = null;
    }, HIDE_DELAY_MS);
  }, [clearHideTimer]);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;

    const triggerRect = trigger.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let placement = 'top';
    let top = triggerRect.top - popoverRect.height - POPOVER_GAP;
    if (top < VIEWPORT_MARGIN) {
      placement = 'bottom';
      top = triggerRect.bottom + POPOVER_GAP;
    }

    if (top + popoverRect.height > viewportHeight - VIEWPORT_MARGIN) {
      top = Math.max(VIEWPORT_MARGIN, viewportHeight - popoverRect.height - VIEWPORT_MARGIN);
    }

    const centeredLeft = triggerRect.left + (triggerRect.width / 2) - (popoverRect.width / 2);
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, centeredLeft),
      Math.max(VIEWPORT_MARGIN, viewportWidth - popoverRect.width - VIEWPORT_MARGIN)
    );

    setPosition({ top, left, placement });
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') close({ returnFocus: true });
    };

    const onPointerDown = (e) => {
      const target = e.target;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      close();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return undefined;

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition, triggerLabel]);

  useEffect(() => () => clearHideTimer(), [clearHideTimer]);

  const handleBlur = () => {
    window.setTimeout(() => {
      const activeElement = document.activeElement;
      if (
        triggerRef.current?.contains(activeElement) ||
        popoverRef.current?.contains(activeElement)
      ) {
        return;
      }
      scheduleClose();
    }, 0);
  };

  const handleTriggerClick = (e) => {
    const canHover = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
    if (!canHover) {
      e.preventDefault();
      openPopup();
    }
  };

  const popover = open
    ? createPortal(
        <div
          ref={popoverRef}
          id={popoverId}
          className={`appz-developed-popover-card appz-developed-popover-card--${position.placement}`}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
          onPointerEnter={openPopup}
          onPointerLeave={scheduleClose}
          onFocus={openPopup}
          onBlur={handleBlur}
        >
          <button
            type="button"
            className="appz-developed-modal-close"
            aria-label="Close AppZ Makers popup"
            onClick={() => close({ returnFocus: true })}
          >
            &times;
          </button>
          <span id={titleId} className="visually-hidden">
            AppZ Makers
          </span>
          <AppzDevelopedPopupPanel />
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <span className={className || undefined}>
        <a
          ref={triggerRef}
          className={`appz-developed-trigger${triggerClassName ? ` ${triggerClassName}` : ''}`}
          href={APPZ_WEBSITE}
          target="_blank"
          rel="noopener noreferrer"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? popoverId : undefined}
          onPointerEnter={openPopup}
          onPointerLeave={scheduleClose}
          onFocus={openPopup}
          onBlur={handleBlur}
          onClick={handleTriggerClick}
        >
          {triggerLabel}
        </a>
      </span>
      {popover}
    </>
  );
};

export default AppzDevelopedPopup;
