const {chromium}=require('@playwright/test');const assert=require('node:assert/strict');const fs=require('node:fs');const crypto=require('node:crypto');
(async()=>{
 const base='https://nogajeng.vercel.app';const browser=await chromium.launch({channel:'msedge',headless:true});
 const guest=await browser.newContext({viewport:{width:390,height:844}}),page=await guest.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const manager=await browser.newContext({viewport:{width:1280,height:900}});const adminPage=await manager.newPage();
 const api=async(ctx,data,origin=base)=>{const r=await ctx.request.post(base+'/api/reservations',{headers:{Origin:origin},data});return {status:r.status(),data:await r.json()}};
 const records=[];let testBlockedDate=null;
 try{
 await page.goto(base,{waitUntil:'networkidle'});await page.locator('#reservation-form [name=phone]').waitFor();
 assert.equal((await api(guest,{action:'admin-list'})).status,401);
 for(const origin of ['https://nogajeng-luo13.vercel.app','https://nogajeng-git-main-luo13.vercel.app'])assert.equal((await api(guest,{action:'admin-list'},origin)).status,401);
 assert.equal((await api(guest,{action:'admin-list'},'https://untrusted.vercel.app')).status,403);
 assert.equal((await api(guest,{action:'lookup'},'https://example.com')).status,403);
 const date=new Date(Date.now()+3*86400000).toISOString().slice(0,10);
 await page.locator('[name=date]').fill(date);await page.locator('[name=time]').selectOption('12:00');await page.locator('[name=guests]').fill('4');await page.locator('[name=name]').fill('자동검증 예약');await page.locator('[name=phone]').fill('01000000000');await page.locator('[name=note]').fill('배포 검증용 - 테스트 후 삭제');await page.locator('[name=consent]').check();
 const pending=page.waitForResponse(r=>r.url().endsWith('/api/reservations')&&r.request().postDataJSON()?.action==='create');await page.locator('#reservation-form [type=submit]').click();const createdResponse=await pending;const created=await createdResponse.json();assert.equal(createdResponse.status(),201,JSON.stringify(created));records.push(created.booking.id);
 await page.locator('#booking-result').waitFor({state:'visible'});assert.equal(created.booking.status,'pending');
 await page.screenshot({path:'../video-review/booking-mobile.png',fullPage:false});
 const bad=await api(guest,{action:'lookup',id:created.booking.id,code:'wrong'});assert.equal(bad.status,404);
 await adminPage.goto(base+'/admin.html',{waitUntil:'networkidle'});await adminPage.locator('[name=password]').fill(JSON.parse(fs.readFileSync('.private/admin.json')).password);await adminPage.getByRole('button',{name:'로그인',exact:true}).click();await adminPage.locator('#dashboard').waitFor({state:'visible'});
 const listed=await api(manager,{action:'admin-list'});const booking=listed.data.bookings.find(b=>b.id===created.booking.id);assert(booking);
 assert.equal((await api(manager,{action:'admin-update',id:booking.id,status:'confirmed',version:booking.updatedAt})).status,200);
 assert.equal((await api(guest,{action:'lookup',id:booking.id,code:created.code})).data.booking.status,'confirmed');
 assert.equal((await api(manager,{action:'admin-update',id:booking.id,status:'cancelled',version:booking.updatedAt})).status,409);
 const cancel=await api(guest,{action:'cancel',id:booking.id,code:created.code});assert.equal(cancel.data.booking.status,'cancelled');
 const requestKey=crypto.randomBytes(16).toString('hex');const body={action:'create',name:'중복검증',phone:'01000000000',date,time:'13:00',guests:2,note:'테스트 후 삭제',consent:true,requestKey};
 const one=await api(guest,body);assert.equal(one.status,201,JSON.stringify(one));records.push(one.data.booking.id);const two=await api(guest,body);assert.equal(two.data.booking.id,one.data.booking.id);
 const prior=await api(manager,{action:'admin-list'});assert(!prior.data.blockedDates.includes(date),'Choose a date not already blocked');
 assert.equal((await api(manager,{action:'admin-block',date,blocked:true})).status,200);testBlockedDate=date;
 const blocked=await api(guest,{...body,requestKey:crypto.randomBytes(16).toString('hex')});assert.equal(blocked.status,400);
 assert.equal((await api(manager,{action:'admin-block',date,blocked:false})).status,200);
 await adminPage.locator('#refresh').click();await adminPage.waitForTimeout(1000);await adminPage.screenshot({path:'../video-review/booking-admin.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);
 console.log('PASS: live guest submission/persistence, admin login, auth isolation, confirmation, guest lookup/cancellation, stale-write conflict, idempotent retry, date closure and mobile layout.');
 }finally{
 const auth=await api(manager,{action:'login',password:JSON.parse(fs.readFileSync('.private/admin.json')).password});
 if(auth.status===200){if(testBlockedDate)await api(manager,{action:'admin-block',date:testBlockedDate,blocked:false});const listing=await api(manager,{action:'admin-list'});for(const id of records){const b=listing.data.bookings.find(x=>x.id===id);if(b&&!['cancelled','completed'].includes(b.status))await api(manager,{action:'admin-update',id,status:'cancelled',version:b.updatedAt});const removed=await api(manager,{action:'admin-delete',id});console.log('Test record removed:',removed.status===200);}}
 await browser.close();
 }
})().catch(e=>{console.error(e);process.exit(1)});
