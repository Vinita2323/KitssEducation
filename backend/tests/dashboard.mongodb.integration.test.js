import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { stage8Fixture } from './stage8-fixture.js';
import { serve } from './helpers.js';
test('B01 actual HTTP/MongoDB IST day boundaries, paid-only totals, review queue and authority',{skip:!process.env.KITSS_DASHBOARD_TEST_DB,timeout:180000},async t=>{
  const f=await stage8Fixture(process.env.KITSS_DASHBOARD_TEST_DB);t.after(()=>f.close());
  const admin=await f.fixtureUser(),student=await f.fixtureUser(['student']);
  // Last instant of 31 Dec IST, first and last instants of 1 Jan IST, first instant of 2 Jan IST.
  const dates=['2025-12-31T18:29:59.999Z','2025-12-31T18:30:00.000Z','2026-01-01T18:29:59.999Z','2026-01-01T18:30:00.000Z'];
  for(let i=0;i<4;i++)await f.models.Order.create({reference:randomUUID(),userId:student.user._id,product:{kind:'book',id:new mongoose.Types.ObjectId(),title:'SYNTHETIC B01'},amountMinor:(i+1)*100,currency:'INR',paymentMode:'test',provider:i%2?'fake':'razorpay',simulated:Boolean(i%2),idempotencyKey:randomUUID(),requestHash:randomUUID(),status:'captured',capturedAt:new Date(dates[i]),createdAt:new Date('2025-12-01'),attempts:[{paymentId:'pay_'+i,status:'captured',observedAt:new Date(dates[i]),source:'synthetic'},{paymentId:'pay_'+i,status:'captured',observedAt:new Date(dates[i]),source:'synthetic_duplicate_observation'}]});
  await f.models.Order.create({reference:randomUUID(),userId:student.user._id,product:{kind:'book',id:new mongoose.Types.ObjectId(),title:'SYNTHETIC PENDING'},amountMinor:999999,currency:'INR',paymentMode:'test',provider:'fake',simulated:true,idempotencyKey:randomUUID(),requestHash:randomUUID(),status:'pending',createdAt:new Date(dates[2]),attempts:[{status:'failed',observedAt:new Date(dates[0])},{status:'failed',observedAt:new Date(dates[2])}]});
  const base=await serve(t,f.app());
  const get=async(q='',actor=admin)=>{const r=await fetch(base+'/api/v1/admin/dashboard'+q,{headers:actor?{Cookie:(actor===admin?'kitss_staff_session=':'kitss_student_session=')+actor.token}:{}});return {status:r.status,body:await r.json()};};
  const collected=async q=>(await get(q)).body.data.payments.collected.amountMinor;
  const all=await get();assert.equal(all.status,200);const p=all.body.data.payments;
  assert.equal(p.collected.amountMinor,1000);assert.equal(p.collected.orders,4);assert.equal(p.collected.buyers,1);assert.deepEqual(p.byProduct,[{kind:'book',amountMinor:1000,orders:4}]);
  assert.equal(p.unpaidCheckouts,1);assert.equal(p.environment.mode,'test');
  assert.equal(p.recentOrders[0].title,'SYNTHETIC PENDING');assert.equal(p.recentOrders[0].status,'failed');assert.equal(p.recentOrders[0].studentName,student.user.name);assert.ok(p.recentOrders.length<=6);
  const o=all.body.data.overview;assert.ok(o.people.students>=1);assert.ok(o.people.newStudents>=1);for(const v of Object.values(o.awaitingReview))assert.equal(typeof v,'number');
  const day=await get('?from=2026-01-01&to=2026-01-01');assert.equal(day.status,200);const d=day.body.data;
  assert.equal(d.payments.collected.amountMinor,500);assert.equal(d.payments.collected.orders,2);assert.equal(d.payments.failedPayments,1);assert.equal(d.payments.unpaidCheckouts,1);
  assert.equal(d.overview.people.newStudents,0);assert.equal(d.period.timeZone,'Asia/Kolkata');
  assert.equal(await collected('?from=2026-01-02'),400);assert.equal(await collected('?to=2025-12-31'),100);assert.equal(await collected('?from=2030-01-01'),0);
  for(const q of ['?from=2026-02-30','?from=2026-01-02&to=2026-01-01','?paymentMode=test','?from[$gt]=2026-01-01'])assert.equal((await get(q)).status,422);
  assert.equal((await get('',null)).status,401);assert.equal((await get('',student)).status,403);
  assert.ok((await f.models.Order.collection.indexes()).some(i=>i.key.capturedAt===1&&i.key.paymentMode===1));
});
