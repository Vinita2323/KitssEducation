import { useEffect, useRef } from 'react';
import { restoreFocus } from '../../../shared/ui/restoreFocus';

// Inline editors are not modals. Move to their heading and restore the invoker
// without trapping the tab sequence or hiding the rest of the page.
export function useEditorFocus(open) {
  const ref=useRef(null);
  useEffect(()=>{
    if(!open||!ref.current)return;
    const previous=document.activeElement, target=ref.current.querySelector('h2,h3,legend')||ref.current;
    target.tabIndex=-1;target.focus();
    const editor=ref.current;
    return()=>restoreFocus(previous,editor);
  },[open]);
  return ref;
}

export function useAdminAccessibility(root, route) {
  useEffect(()=>{
    const node=root.current;if(!node)return;
    const review=()=>{
      for(const table of node.querySelectorAll('table')) {
        for(const th of table.querySelectorAll('thead th')) if(!th.hasAttribute('scope'))th.setAttribute('scope','col');
        const region=table.parentElement;
        if(region&&region.scrollWidth>region.clientWidth){region.classList.add('admin-scroll-region');region.setAttribute('role','region');region.setAttribute('aria-label',(table.getAttribute('aria-label')||node.querySelector('main h1')?.textContent||'Records')+' scrollable table');region.tabIndex=0;}
      }
      for(const alert of node.querySelectorAll('[role=alert]')) {alert.tabIndex=-1;}
    };
    const observer=new MutationObserver(review);review();observer.observe(node,{childList:true,subtree:true});
    window.addEventListener('resize',review);
    const invalid=event=>{
      const field=event.target;if(!field.matches('input,select,textarea'))return;
      field.setAttribute('aria-invalid','true');
      const id=field.id||(field.id='admin-invalid-'+crypto.randomUUID()), errorId=id+'-validation';
      let message=document.getElementById(errorId);
      if(!message){message=document.createElement('p');message.id=errorId;message.className='text-red-800 text-sm';message.setAttribute('role','status');field.insertAdjacentElement('afterend',message);}
      message.textContent=field.validationMessage;
      field.setAttribute('aria-describedby',[...new Set([...(field.getAttribute('aria-describedby')||'').split(' ').filter(Boolean),errorId])].join(' '));
    };
    const input=event=>{const field=event.target,errorId=field.id+'-validation';if(field.validity?.valid&&document.getElementById(errorId)){field.removeAttribute('aria-invalid');document.getElementById(errorId)?.remove();const remaining=(field.getAttribute('aria-describedby')||'').split(' ').filter(id=>id&&id!==errorId);if(remaining.length)field.setAttribute('aria-describedby',remaining.join(' '));else field.removeAttribute('aria-describedby');}};
    node.addEventListener('invalid',invalid,true);node.addEventListener('input',input);
    return()=>{observer.disconnect();window.removeEventListener('resize',review);node.removeEventListener('invalid',invalid,true);node.removeEventListener('input',input);};
  },[root,route]);
}
