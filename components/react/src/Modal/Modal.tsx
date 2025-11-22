import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useId } from '@reach/auto-id';

export interface ModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'full';
  /** Close on overlay click */
  closeOnOverlayClick?: boolean;
  /** Close on Escape key */
  closeOnEscape?: boolean;
  /** Initial focus element */
  initialFocusRef?: React.RefObject<HTMLElement>;
  /** Custom className */
  className?: string;
}

/**
 * Accessible modal dialog following WCAG 2.1 AA standards
 *
 * Features:
 * - Focus trap (keeps focus inside modal)
 * - Focus restoration (returns to trigger on close)
 * - Escape key handling
 * - Overlay click handling
 * - ARIA labels and roles
 * - Screen reader announcements
 * - Scroll locking
 *
 * @example
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Delete Account"
 * >
 *   <p>Are you sure?</p>
 * </Modal>
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  initialFocusRef,
  className = '',
}: ModalProps) {
  const titleId = useId();
  const contentId = useId();
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  // Portal mounting
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Focus management
  useEffect(() => {
    if (!isOpen) return;

    // Store current focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus initial element or first focusable element
    const focusElement = initialFocusRef?.current || getFirstFocusable(modalRef.current);
    focusElement?.focus();

    // Restore focus on unmount
    return () => {
      previousFocusRef.current?.focus();
    };
  }, [isOpen, initialFocusRef]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = getFocusableElements(modalRef.current);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Overlay click handler
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen || !mounted) return null;

  const modal = (
    <div
      ref={overlayRef}
      className="a11y-modal-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`a11y-modal a11y-modal--${size} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={contentId}
      >
        <div className="a11y-modal__header">
          <h2 id={titleId} className="a11y-modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="a11y-modal__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div id={contentId} className="a11y-modal__content">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// Helper functions
function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];

  const selector = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  return Array.from(container.querySelectorAll(selector));
}

function getFirstFocusable(container: HTMLElement | null): HTMLElement | null {
  const elements = getFocusableElements(container);
  return elements[0] || null;
}
