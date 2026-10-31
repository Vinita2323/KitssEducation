import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contentService } from '../../services/contentService';
const routes = { home:'/home', about:'/about', books:'/books', colleges:'/colleges', institutes:'/institutes', coaching:'/coaching', categories:'/categories', results:'/results' };
export function usePublishedContent(key) {
  const [data, setData] = useState({ sections: [], faculty: [] }), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  useEffect(() => {
    let controller;
    const refresh = () => {
      if (document.visibilityState === 'hidden') return;
      controller?.abort(); controller = new AbortController(); const signal = controller.signal;
      contentService.page(key, signal).then(value => { if (!signal.aborted) { setData(value); setError(''); } })
        .catch(e => { if (!signal.aborted) setError(e.message); })
        .finally(() => { if (!signal.aborted) setLoading(false); });
    };
    setData({ sections: [], faculty: [] }); setError(''); setLoading(true); refresh();
    const timer = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    return () => { controller?.abort(); clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [key]);
  return { data, error, loading };
}
export function PublishedSections({ sections = [], empty = 'More information will be available soon.' }) {
  return <div className="space-y-4">{!sections.length && <p className="p-4 rounded-xl border bg-white text-sm text-[#667085]">{empty}</p>}{sections.map(section => <section key={section.key} className="p-3.5 sm:p-5 bg-white border border-[#E6E8EC] rounded-2xl shadow-2xs space-y-3"><h2 className="text-base sm:text-xl font-extrabold text-[#0A1D3F]">{section.heading}</h2>{section.body && <p className="text-xs sm:text-sm text-[#667085] whitespace-pre-line leading-relaxed">{section.body}</p>}{section.mediaAssetIds?.map(id => <img key={id} src={'/api/v1/media/' + id + '/content'} alt={section.heading || 'Published content image'} className="max-h-72 w-full rounded-xl object-contain" />)}{section.items?.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{section.items.map((item, i) => <div key={i} className="bg-[#F8FAFC] border rounded-xl p-3 text-sm"><h3 className="font-bold text-[#0A1D3F]">{item.heading}</h3><p className="text-xs text-[#667085] mt-1 whitespace-pre-line">{item.body}</p>{routes[item.linkKey] && <Link className="text-xs text-[#FF8A00] font-bold" to={routes[item.linkKey]}>Explore</Link>}</div>)}</div>}</section>)}</div>;
}
