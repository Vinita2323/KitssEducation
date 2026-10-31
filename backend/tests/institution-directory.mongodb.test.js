import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { commerceFixture } from './commerce-fixture.js';
import { serve } from './helpers.js';

const db = process.env.KITSS_DIRECTORY_TEST_DB;
test('combined public institution directory: visibility, association, filters and admissions', { skip: !db, timeout: 180000 }, async t => {
  const f = await commerceFixture(db); t.after(async () => { await f.connection.dropDatabase(); await f.close(); });
  const admin = await f.fixtureUser(), owner = await f.fixtureUser(['student']);
  const domain = f.institutions, ctx = f.ctx;
  const state = await domain.create('taxonomy', { kind:'state',key:randomUUID(),label:'Directory State' },ctx);
  await domain.create('taxonomy',{kind:'district',key:randomUUID(),label:'Directory District',parentIds:[state.id]},ctx);
  const university = await domain.create('university',{name:'Directory University',shortName:'DIR',status:'active'},ctx);
  const college = await domain.create('college',{name:'Alpha College',code:'DIRECTORY-COLLEGE',category:'College',universityId:university.id,stateId:state.id,district:'Directory District',city:'Public City',address:'Published campus',status:'active',verification:{state:'verified',source:'Isolated test evidence'}},ctx);
  const program = await domain.create('program',{name:'Public Mathematics',degreeType:'Degree',duration:'3 years',eligibility:'Synthetic',feeMinor:100,status:'active',admissionStatus:'open'},ctx,college.id);
  const draft = await domain.create('college',{name:'Unpublished College',code:'DIRECTORY-DRAFT',category:'College',universityId:university.id,stateId:state.id,district:'Directory District',city:'Public City',address:'Unpublished campus',status:'draft'},ctx);
  const franchise = async overrides => f.models.FranchiseApplication.create({reference:randomUUID(),ownerKey:'test:'+randomUUID(),idempotencyKey:randomUUID(),requestHash:randomUUID(),applicantUserId:owner.user._id,workflowVersion:1,status:'approved',listingPublishedAt:new Date(),institution:{name:'Beta Institute',type:'Institute',website:'https://example.invalid'},location:{city:'Other City',address:'PRIVATE ADDRESS',stateId:state.id,pincode:'123456'},contact:{person:'PRIVATE PERSON',email:'PRIVATE EMAIL',mobile:'PRIVATE PHONE'},notes:[{text:'PRIVATE NOTE',actorId:'test'}],programsOffered:['Public Science'],...overrides});
  const standalone = await franchise();
  const linked = await franchise({institution:{name:'Affiliated training centre',type:'Institute'},collegeId:college.id});
  await franchise({status:'pending',institution:{name:'Pending secret',type:'Institute'}});
  await franchise({listingHidden:true,institution:{name:'Hidden secret',type:'Institute'}});
  await franchise({workflowVersion:undefined,institution:{name:'Legacy secret',type:'Institute'}});
  const base = await serve(t,f.app());
  const get = async query => { const response = await fetch(base+'/api/v1/public/institutions'+query);return {status:response.status,body:await response.json()}; };
  await t.test('safe public data and existing affiliation does not merge a different institute',async()=>{
    const response=await get('');assert.equal(response.status,200);assert.equal(response.body.meta.total,3);
    assert.equal(response.body.data.filter(row=>row.franchiseOnly).length,2);
    const encoded=JSON.stringify(response.body);for(const privateText of ['PRIVATE','Pending secret','Hidden secret','Legacy secret','applicantUserId','documents','policySnapshot','collegeListingId'])assert.ok(!encoded.includes(privateText),privateText);
    assert.equal(response.body.data.find(row=>row.id===college.id).admissionsAvailable,true);
    assert.equal(response.body.data.find(row=>row.id===String(standalone._id)).admissionsAvailable,false);
  });
  await t.test('explicit association yields one canonical college, keeps admissions and adds badge',async()=>{
    const row=await f.service.franchise.listing(String(linked._id),{expectedRevision:linked.revision,publish:true,reason:'Same institution confirmed',collegeListingId:college.id},ctx);
    const response=await get('?network=franchise');assert.equal(response.body.meta.total,2);
    const canonical=response.body.data.find(item=>item.id===college.id);assert.equal(canonical.kitssFranchise,true);assert.equal(canonical.franchiseOnly,false);assert.equal(canonical.name,'Alpha College');assert.equal(canonical.admissionsAvailable,true);
    await assert.rejects(f.service.franchise.listing(row.id,{expectedRevision:row.revision,publish:true,reason:'Invalid association',collegeListingId:draft.id},ctx),{status:404});
    await assert.rejects(f.service.franchise.listing(row.id,{expectedRevision:row.revision-1,publish:true,reason:'Stale update',collegeListingId:null},ctx),{status:409});
  });
  await t.test('server filters, facets and pagination use the combined deduplicated directory',async()=>{
    const first=await get('?pageSize=1');assert.equal(first.body.meta.total,2);assert.equal(first.body.meta.totalPages,2);assert.equal(first.body.data[0].name,'Alpha College');
    const second=await get('?page=2&pageSize=1');assert.equal(second.body.data[0].name,'Beta Institute');
    for(const [query,count] of [['?q=Directory%20State',2],['?q=Science',1],['?q=Mathematics',1],['?category=Institute',1],['?state=Directory%20State',2],['?district=Directory%20District',1],['?q=notfound',0]])assert.equal((await get(query)).body.meta.total,count,query);
    assert.deepEqual(first.body.facets.categories,['College','Institute']);assert.equal(first.body.facets.states[0].label,'Directory State');
    for(const query of ['?network=invalid','?page=0','?pageSize=101','?private=1'])assert.equal((await get(query)).status,422);
  });
  await t.test('hide franchise badge without hiding canonical college; closed programs disable admission',async()=>{
    const row=await f.models.FranchiseApplication.findById(linked._id);
    await f.service.franchise.listing(String(row._id),{expectedRevision:row.revision,publish:false,reason:'Hide franchise only'},ctx);
    await domain.edit('program',program.id,{expectedRevision:program.revision,admissionStatus:'closed'},ctx,college.id);
    const all=(await get('')).body;assert.equal(all.meta.total,2);const canonical=all.data.find(item=>item.id===college.id);assert.equal(canonical.kitssFranchise,false);assert.equal(canonical.admissionsAvailable,false);
    assert.equal((await get('?network=franchise')).body.meta.total,1);
  });
  await t.test('an unavailable associated college never exposes draft content or admissions',async()=>{
    await f.models.FranchiseApplication.updateOne({_id:standalone._id},{$set:{collegeListingId:draft.id}});
    const response=await get('?network=franchise');assert.equal(response.body.meta.total,1);assert.equal(response.body.data[0].name,'Beta Institute');assert.equal(response.body.data[0].franchiseOnly,true);assert.equal(response.body.data[0].admissionsAvailable,false);
    await f.service.franchise.listing(String(standalone._id),{expectedRevision:standalone.revision,publish:false,reason:'Hide while associated college is unavailable',collegeListingId:draft.id},ctx);assert.equal((await get('?network=franchise')).body.meta.total,0);
  });
});

