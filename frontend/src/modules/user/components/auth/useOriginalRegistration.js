import { useEffect, useState } from 'react';
import { httpClient } from '../../../../shared/api/httpClient';
import { readOptions } from '../../services/collegeService';
import { useAuth } from '../../context/AuthContext';

export function useOriginalRegistration(kind, formData, setFormData, setErrors) {
  const { user } = useAuth();
  const [config, setConfig] = useState(null), [taxonomy, setTaxonomy] = useState({}), [application, setApplication] = useState(null);
  useEffect(() => {
    const c = new AbortController();
    httpClient.request('/public/registration-config', { signal: c.signal }).then(r => { if (!c.signal.aborted) setConfig(r.data); }).catch(() => {});
    Promise.all(['state', 'class', 'board', 'program', 'language', 'experience'].map(async type => [type, await readOptions('/taxonomies', { kind: type }, c.signal)])).then(entries => { if (!c.signal.aborted) setTaxonomy(Object.fromEntries(entries)); }).catch(() => {});
    return () => c.abort();
  }, [kind]);
  useEffect(() => {
    if (user?.emailVerified) { const key = kind === 'tuition' ? 'emailId' : 'email'; setFormData(v => ({ ...v, [key]: v[key] || user.email })); }
  }, [user?.id, user?.emailVerified, kind]);
  const policy = config?.policies?.[kind], enabled = Boolean(config?.enabled?.[kind]);
  const canChooseDocument = key => enabled && Boolean(policy.documents?.some(d => d.key === key));
  const chooseDocument = (key, file) => {
    if (!file || !canChooseDocument(key)) return;
    if (!(policy.upload?.mime || ['application/pdf', 'image/png', 'image/jpeg']).includes(file.type) || file.size > (policy.upload?.maxBytes || 10485760)) { setErrors(v => ({ ...v, [key]: 'Choose a document of the allowed type and size.' })); return; }
    setErrors(v => ({ ...v, [key]: '' }));
    setFormData(v => ({ ...v, [key + 'File']: file, [key + 'Preview']: null }));
    if (file.type.startsWith('image/')) { const reader = new FileReader(); reader.onload = () => setFormData(v => v[key + 'File'] === file ? { ...v, [key + 'Preview']: reader.result } : v); reader.readAsDataURL(file); }
  };
  return { kind, enabled, user, config, policy, application, setApplication, canChooseDocument, chooseDocument, choices: (type, selected) => [...new Set([...(taxonomy[type] || []).map(v => v.label), ...(selected ? [selected] : [])])] };
}
