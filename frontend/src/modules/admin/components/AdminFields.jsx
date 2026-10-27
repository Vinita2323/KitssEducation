import React, { createContext, forwardRef, useContext, useId } from 'react';
import { adminFieldHelp } from './adminFieldHelp';

const FieldContext = createContext(null);
const textOf = children => React.Children.toArray(children).map(child => {
  if (typeof child === 'string' || typeof child === 'number') return child;
  if (!React.isValidElement(child) || [AdminInput, AdminSelect, AdminTextarea, 'input', 'select', 'textarea'].includes(child.type)) return '';
  return textOf(child.props.children);
}).join(' ').replace(/\s+/g, ' ').trim();
const firstControl = children => {
  for (const child of React.Children.toArray(children)) {
    if (!React.isValidElement(child)) continue;
    if ([AdminInput, AdminSelect, AdminTextarea, 'input', 'select', 'textarea'].includes(child.type)) return child;
    const nested = firstControl(child.props.children);
    if (nested) return nested;
  }
};
const descriptions = (...ids) => [...new Set(ids.flatMap(id => String(id ?? '').split(' ')).filter(Boolean))].join(' ') || undefined;

// Keep help outside the native label so existing accessible names and exact
// getByLabel queries remain stable. Only descriptive presentation is added.
export function AdminField({ children, help, className, ...props }) {
  const id = useId();
  const control = firstControl(children);
  if (!control) return <label {...props} className={className}>{children}</label>;
  const label = control.props['aria-label'] || textOf(children);
  const description = help ?? adminFieldHelp(label, control.props);
  return <div className="admin-field">
    <FieldContext.Provider value={{ descriptionId: description ? `${id}-help` : undefined }}>
      <label {...props} className={className}>{children}</label>
    </FieldContext.Provider>
    {description && <p id={`${id}-help`} className="admin-field-help">{description}</p>}
  </div>;
}

const control = Tag => forwardRef(function AdminControl({ help, helpLabel, ...props }, ref) {
  const field = useContext(FieldContext);
  const generatedId = useId();
  if (props.type === 'hidden') return <Tag {...props} ref={ref} />;
  if (field) return <Tag {...props} ref={ref} aria-describedby={descriptions(props['aria-describedby'], field.descriptionId)} />;
  const id = props.id || generatedId;
  const label = helpLabel || props['aria-label'] || props.name || props.placeholder || 'Value';
  const helpId = `${generatedId}-help`;
  const description = help ?? adminFieldHelp(label, props);
  return <div className="admin-control-field">
    {!props.id && props['aria-label'] && <label className="admin-control-label" htmlFor={id}>{props['aria-label']}</label>}
    <Tag {...props} id={id} ref={ref} aria-describedby={descriptions(props['aria-describedby'], description ? helpId : undefined)} />
    {description && <p id={helpId} className="admin-field-help">{description}</p>}
  </div>;
});

export const AdminInput = control('input');
export const AdminSelect = control('select');
export const AdminTextarea = control('textarea');
