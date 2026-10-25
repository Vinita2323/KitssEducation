import { useEffect, useRef } from 'react';

const dialogs = [];
export function useDialogFocus(open, onClose) {
  const ref = useRef(null), close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const node = ref.current;
    if (!open || !node) return;
    const previous = document.activeElement;
    dialogs.push(node);
    const controls = () => [...node.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
    (controls()[0] || node).focus();
    const key = event => {
      if (dialogs.at(-1) !== node) return;
      if (event.key === 'Escape') { event.preventDefault(); close.current?.(); }
      if (event.key !== 'Tab') return;
      const items = controls(), first = items[0], last = items.at(-1);
      if (!first) { event.preventDefault(); node.focus(); }
      else if (event.shiftKey && (document.activeElement === first || !node.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !node.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); const index = dialogs.lastIndexOf(node); if(index >= 0) dialogs.splice(index,1); if (previous?.isConnected) previous.focus(); };
  }, [open]);
  return ref;
}
