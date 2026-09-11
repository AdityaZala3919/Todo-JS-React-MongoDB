import { useEffect, useRef } from 'react';

/**
 * Hook to manage keyboard shortcuts inside modals and overlay forms.
 *
 * @param {Object} options
 * @param {() => void} [options.onSubmit] - Called on Shift+Enter or Ctrl/Cmd+Enter
 * @param {() => void} [options.onClose] - Called on Escape
 * @param {boolean} [options.allowShiftEnter=true] - Enable Shift+Enter submission
 * @param {boolean} [options.allowCmdEnter=true] - Enable Ctrl/Cmd+Enter submission
 * @param {boolean} [options.allowEscape=true] - Enable Escape to close
 */
export function useModalKeyboard({
  onSubmit,
  onClose,
  allowShiftEnter = true,
  allowCmdEnter = true,
  allowEscape = true,
}) {
  const submitRef = useRef(onSubmit);
  const closeRef = useRef(onClose);

  submitRef.current = onSubmit;
  closeRef.current = onClose;

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape to close
      if (allowEscape && e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeRef.current?.();
        return;
      }

      // Shift+Enter or Ctrl/Cmd+Enter to submit
      const isShiftEnter = allowShiftEnter && e.key === 'Enter' && e.shiftKey;
      const isCmdEnter = allowCmdEnter && e.key === 'Enter' && (e.ctrlKey || e.metaKey);

      if ((isShiftEnter || isCmdEnter) && submitRef.current) {
        e.preventDefault();
        e.stopPropagation();
        submitRef.current(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [allowShiftEnter, allowCmdEnter, allowEscape]);
}
