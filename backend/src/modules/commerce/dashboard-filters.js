import { object, invalid } from '../publishing/validation.js';

export function dashboardFilters(query = {}) {
  object(query, ['from', 'to', 'paymentMode']);
  const date = key => {
    const value = query[key];
    if (value === undefined || value === '') return undefined;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw invalid('Dates must use YYYY-MM-DD');
    const parsed = new Date(value + 'T00:00:00.000Z');
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value || parsed.getUTCFullYear() < 1970 || parsed.getUTCFullYear() > 9998) throw invalid('Invalid calendar date');
    return parsed;
  };
  const from = date('from'), to = date('to');
  if (from && to && from > to) throw invalid('Start date must not follow end date');
  const paymentMode = query.paymentMode || '';
  if (!['', 'test'].includes(paymentMode)) throw invalid('Only the stored test payment environment is supported');
  const range = { ...(from ? {$gte: from} : {}), ...(to ? {$lt: new Date(to.getTime() + 86400000)} : {}) };
  return { range, mode: paymentMode ? {paymentMode} : {}, active: Boolean(from || to), public: {from: query.from || '', to: query.to || '', paymentMode, timeZone: 'UTC', endBoundary: 'exclusive start of following UTC day'} };
}
