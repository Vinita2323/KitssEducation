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
        // Wrapped tables stack into cards on phones; keep table semantics and give each cell its column name.
        if(table.parentElement?.classList.contains('admin-table')){
          const headings=[...table.querySelectorAll(':scope > thead > tr > th')].map(th=>th.textContent.trim());
          if(table.getAttribute('role')!=='table')table.setAttribute('role','table');
          for(const section of table.querySelectorAll(':scope > thead, :scope > tbody'))if(section.getAttribute('role')!=='rowgroup')section.setAttribute('role','rowgroup');
          for(const row of table.querySelectorAll(':scope > thead > tr, :scope > tbody > tr')){
            if(row.getAttribute('role')!=='row')row.setAttribute('role','row');
            let column=0;
            for(const cell of row.children){
              const header=cell.tagName==='TH';
              const role=header?'columnheader':'cell';
              if(cell.getAttribute('role')!==role)cell.setAttribute('role',role);
              const span=Math.max(1,cell.colSpan||1);
              if(!header){const label=span===1?(headings[column]||''):'';if(cell.getAttribute('data-label')!==label)cell.setAttribute('data-label',label);}
              column+=span;
            }
          }
        }
        const region=table.parentElement;
        if(region?.classList.contains('admin-table')&&region.classList.contains('admin-scroll-region')&&region.scrollWidth<=region.clientWidth){region.classList.remove('admin-scroll-region');region.removeAttribute('role');region.removeAttribute('aria-label');region.removeAttribute('tabindex');}
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
