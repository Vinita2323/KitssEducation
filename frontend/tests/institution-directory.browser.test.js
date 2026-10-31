import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

test('combined institution filters, legacy links and franchise profiles (mocked HTTP)', { timeout:180000 }, async t => {
  const vite=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),server:{host:'127.0.0.1',port:0,hmr:false,watch:null},logLevel:'error'});await vite.listen();
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});t.after(async()=>{await browser.close();await vite.close();});
  const base='http://127.0.0.1:'+vite.httpServer.address().port,page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[],queries=[];page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
  const rows=[{id:'a'.repeat(24),directoryKey:'college:a',name:'Alpha College',category:'College',city:'Public City',state:'Public State',district:'Public District',kitssFranchise:true,franchiseOnly:false,admissionsAvailable:true,popularCourses:['Mathematics']},
    {id:'b'.repeat(24),directoryKey:'franchise:b',name:'Beta Institute',category:'Institute',city:'Public City',state:'Public State',kitssFranchise:true,franchiseOnly:true,admissionsAvailable:false,popularCourses:['Science'],website:'https://example.invalid'},
    {id:'c'.repeat(24),directoryKey:'college:c',name:'Gamma College',category:'College',city:'Public City',state:'Public State',district:'Public District',kitssFranchise:false,franchiseOnly:false,admissionsAvailable:false}];
  await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.origin!==base)return route.abort();if(!url.pathname.startsWith('/api/'))return route.continue();const path=url.pathname.replace('/api/v1','');let data=[],meta={total:0,totalPages:1},facets;
    if(path==='/auth/me')data={user:null};else if(path==='/public/settings')data={};else if(path==='/public/institutions'){
      queries.push(url.search);data=rows.filter(row=>(url.searchParams.get('network')!=='franchise'||row.kitssFranchise)&&(!url.searchParams.get('q')||row.name.toLowerCase().includes(url.searchParams.get('q').toLowerCase()))&&(!url.searchParams.get('category')||row.category===url.searchParams.get('category')));
      meta={total:data.length,page:1,totalPages:1};facets={categories:['College','Institute'],states:[{id:'d'.repeat(24),label:'Public State'}],districts:['Public District']};
    }
    await route.fulfill({json:{data,meta,...(facets?{facets}:{})}});
  });
  await page.goto(base+'/franchises',{waitUntil:'domcontentloaded',timeout:120000});await page.getByRole('heading',{name:'Colleges & Institutes',exact:true}).waitFor();await page.getByRole('heading',{name:'Beta Institute',exact:true}).waitFor();
  assert.equal(new URL(page.url()).pathname,'/colleges');assert.equal(new URL(page.url()).searchParams.get('network'),'franchise');assert.equal(await page.getByRole('link',{name:'Franchises',exact:true}).count(),0);assert.equal(await page.getByRole('heading',{name:'Gamma College',exact:true}).count(),0);
  const beta=page.locator('.group').filter({has:page.getByRole('heading',{name:'Beta Institute',exact:true})});assert.equal(await beta.getByRole('button',{name:'Apply Now',exact:true}).count(),0);
  await beta.getByRole('button',{name:'View Details',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Beta Institute',exact:true});await dialog.getByRole('link',{name:'Institution website',exact:true}).waitFor();await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  await page.getByLabel('Institution network',{exact:true}).selectOption('all');await page.getByRole('heading',{name:'Gamma College',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Apply Now',exact:true}).count(),1);
  await page.getByLabel('Filter by Institution Type',{exact:true}).selectOption('Institute');await page.getByRole('heading',{name:'Alpha College',exact:true}).waitFor({state:'hidden'});await page.getByRole('heading',{name:'Beta Institute',exact:true}).waitFor();
  await page.getByLabel('Search colleges and institutes',{exact:true}).fill('missing');await page.getByRole('heading',{name:'No Institutions Found',exact:true}).waitFor();await page.getByRole('button',{name:'Reset All Filters',exact:true}).click();await page.getByRole('heading',{name:'Gamma College',exact:true}).waitFor();
  for(const width of [390,320]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
  await page.screenshot({path:fileURLToPath(new URL('../../.runtime/combined-institutions-mobile.png',import.meta.url)),fullPage:true});assert.ok(queries.some(q=>q.includes('network=franchise')));assert.deepEqual(errors,[]);
});
