import { object, invalid } from '../publishing/validation.js';

// The business reports in Indian Standard Time. Asia/Kolkata has no daylight
// saving, so a fixed UTC+05:30 offset is exact for every calendar day.
export const DASHBOARD_TIME_ZONE = 'Asia/Kolkata';
const IST_OFFSET_MS = 330 * 60000, DAY_MS = 86400000;

export function dashboardFilters(query = {}) {
  object(query, ['from', 'to']);
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
  // Start of the IST "from" day up to (not including) the start of the IST day after "to".
  const range = { ...(from ? { $gte: new Date(from.getTime() - IST_OFFSET_MS) } : {}), ...(to ? { $lt: new Date(to.getTime() + DAY_MS - IST_OFFSET_MS) } : {}) };
  return { range, active: Boolean(from || to), public: { from: query.from || '', to: query.to || '', timeZone: DASHBOARD_TIME_ZONE } };
}
