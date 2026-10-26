import { useEffect, useRef } from 'react';
import { restoreFocus } from './restoreFocus';

const dialogs = [];
export function useDialogFocus(open, onClose) {
  const ref = useRef(null), close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const node = ref.current;
    if (!open || !node) return;
    const previous = document.activeElement;
    const isolated=[];
    if(node.closest('.kitss-admin')) {
      let branch=node;
      while(branch.parentElement) {
        for(const sibling of branch.parentElement.children)if(sibling!==branch&&!sibling.inert){sibling.inert=true;isolated.push(sibling);}
        if(branch.parentElement.classList.contains('kitss-admin'))break;
        branch=branch.parentElement;
      }
    }
    dialogs.push(node);
    const controls = () => [...node.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter(el => !el.matches(':disabled') && el.tabIndex >= 0 && el.getClientRects().length && !el.closest('[inert]'));
    (controls()[0] || node).focus();
    const key = event => {
      if (dialogs.at(-1) !== node || event.defaultPrevented) return;
      if (event.key === 'Escape') { event.preventDefault(); close.current?.(); }
      if (event.key !== 'Tab') return;
      const items = controls(), first = items[0], last = items.at(-1);
      if (!first) { event.preventDefault(); node.focus(); }
      else if (event.shiftKey && (document.activeElement === first || !node.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !node.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', key);
    const contain=event=>{if(dialogs.at(-1)===node&&!node.contains(event.target))(controls()[0]||node).focus();};
    document.addEventListener('focusin',contain);
    const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    return () => { document.removeEventListener('keydown', key);document.removeEventListener('focusin',contain);for(const sibling of isolated)sibling.inert=false;document.body.style.overflow=oldOverflow; const index = dialogs.lastIndexOf(node); if(index >= 0) dialogs.splice(index,1); restoreFocus(previous,node); };
  }, [open]);
  return ref;
}
