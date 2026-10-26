import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardFilters } from '../src/modules/commerce/dashboard-filters.js';
test('dashboard UTC inclusive-day calendar and payment-environment validation',()=>{
  const f=dashboardFilters({from:'2024-02-29',to:'2024-02-29',paymentMode:'test'});
  assert.equal(f.range.$gte.toISOString(),'2024-02-29T00:00:00.000Z');assert.equal(f.range.$lt.toISOString(),'2024-03-01T00:00:00.000Z');
  for(const q of [{from:'2025-02-29'},{to:'2026-13-01'},{from:'2026-01-02',to:'2026-01-01'},{from:['2026-01-01']},{from:{$gt:''}},{paymentMode:'UPI'},{paymentMode:'live'},{currency:'USD'}])assert.throws(()=>dashboardFilters(q));
  assert.deepEqual(dashboardFilters().mode,{});assert.equal(dashboardFilters().active,false);
});
