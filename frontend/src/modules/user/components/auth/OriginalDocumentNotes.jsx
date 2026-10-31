import React from 'react';
export function OriginalDocumentNotes({ workflow, formData }) {
  const documents = workflow.policy?.documents || [];
  return <div className="space-y-2 text-[11px] text-slate-500">
    {!workflow.enabled && !documents.length && <p>Document requirements will be shown when applications open. You can continue entering your details.</p>}
    {workflow.enabled && !documents.length && <p>No documents are required for this application.</p>}
    {documents.length > 0 && <p>Files are uploaded after you verify your account and save your application. Only the documents listed below are needed.</p>}
    {documents.map(d => <div key={d.key}><p>{d.label}{d.required === false ? ' (optional)' : ' (required)'}{workflow.application?.documents?.some(v => v.key === d.key) ? ' - uploaded' : formData[d.key + 'File'] ? ' - selected: ' + formData[d.key + 'File'].name : ''}</p></div>)}
  </div>;
}
