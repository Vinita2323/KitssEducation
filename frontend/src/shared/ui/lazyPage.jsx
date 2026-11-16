import React, { Suspense, lazy } from 'react';

// Route pages load on demand so the first visit only downloads what that page needs.
// lazyPage(() => import('./X'), 'X') turns a named export into a lazily loaded component.
export const lazyPage = (loader, name) => lazy(() => loader().then(module => ({ default: module[name] })));

// Wraps a layout's <Outlet /> so the header and navigation stay visible while a page loads.
export function PageSuspense({ children }) {
  return <Suspense fallback={<p role="status" className="p-6 text-sm text-[#667085]">Loading page…</p>}>{children}</Suspense>;
}
