import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardFilters } from '../src/modules/commerce/dashboard-filters.js';
test('dashboard IST inclusive-day calendar and filter validation',()=>{
  const f=dashboardFilters({from:'2024-02-29',to:'2024-02-29'});
  assert.equal(f.range.$gte.toISOString(),'2024-02-28T18:30:00.000Z');assert.equal(f.range.$lt.toISOString(),'2024-02-29T18:30:00.000Z');
  assert.equal(f.public.timeZone,'Asia/Kolkata');
  for(const q of [{from:'2025-02-29'},{to:'2026-13-01'},{from:'2026-01-02',to:'2026-01-01'},{from:['2026-01-01']},{from:{$gt:''}},{paymentMode:'test'},{currency:'USD'}])assert.throws(()=>dashboardFilters(q));
  assert.deepEqual(dashboardFilters().range,{});assert.equal(dashboardFilters().active,false);
});
