const crypto=require('node:crypto');
const R=require('../lib/reservations.cjs');
module.exports=async(req,res)=>{
 res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const send=(s,b)=>res.status(s).json(b);
 try{
  if(!process.env.SESSION_SECRET||!process.env.ADMIN_PASSWORD_HASH)throw R.fail('예약 시스템을 준비 중입니다. 전화로 문의해 주세요.',503);
  if(req.method!=='POST'){res.setHeader('Allow','POST');return send(405,{error:'지원하지 않는 요청입니다.'});}
  const origin=req.headers.origin;const allowed=['https://nogajeng.vercel.app','https://nogajeng.helionlife.net','https://nogajeng-luo13.vercel.app','https://nogajeng-git-main-luo13.vercel.app'];for(const host of [process.env.VERCEL_URL,process.env.VERCEL_PROJECT_PRODUCTION_URL])if(host&&/^[a-z0-9-]+\.vercel\.app$/.test(host))allowed.push('https://'+host);if(!allowed.includes(origin))throw R.fail('이 홈페이지에서 다시 시도해 주세요.',403);
  if(!String(req.headers['content-type']).includes('application/json'))throw R.fail('올바른 요청 형식이 아닙니다.',415);
  if(Number(req.headers['content-length']||0)>8192)throw R.fail('요청이 너무 큽니다.',413);
  const b=typeof req.body==='string'?JSON.parse(req.body):req.body;if(!b||JSON.stringify(b).length>8192)throw R.fail('올바른 요청이 아닙니다.');
  const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0];
  const key=crypto.createHmac('sha256',process.env.SESSION_SECRET).update(ip).digest('hex');
  if(b.action==='login'){
   await R.transaction(s=>R.rate(s,'login:'+key,10,15));
   if(typeof b.password!=='string'||!R.equal(R.hash(b.password),process.env.ADMIN_PASSWORD_HASH.trim()))throw R.fail('비밀번호가 올바르지 않습니다.',401);
   res.setHeader('Set-Cookie',`ng_admin=${R.sessionCookie()}; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=28800`);return send(200,{ok:true});
  }
  if(b.action==='logout'){res.setHeader('Set-Cookie','ng_admin=; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=0');return send(200,{ok:true});}
  if(['admin-list','admin-update','admin-delete','admin-block'].includes(b.action)){
   if(!R.admin(req))throw R.fail('관리자 로그인이 필요합니다.',401);
   if(b.action==='admin-list'){const {state}=await R.read();return send(200,{bookings:state.bookings.filter(x=>Date.parse(x.date+'T21:00:00+09:00')+30*86400000>Date.now()),blockedDates:state.blockedDates||[]});}
   const result=await R.transaction(s=>{
    if(b.action==='admin-block'){if(!/^\d{4}-\d{2}-\d{2}$/.test(b.date||''))throw R.fail('날짜를 확인해 주세요.');s.blockedDates=(s.blockedDates||[]).filter(d=>d>=R.today());s.blockedDates=s.blockedDates.filter(d=>d!==b.date);if(b.blocked===true)s.blockedDates.push(b.date);return {ok:true};}
    const index=s.bookings.findIndex(x=>x.id===b.id);if(index<0)throw R.fail('예약을 찾을 수 없습니다.',404);const booking=s.bookings[index];
    if(b.action==='admin-delete'){if(!['cancelled','completed'].includes(booking.status))throw R.fail('취소 또는 이용 완료된 예약만 삭제할 수 있습니다.');s.bookings.splice(index,1);return {ok:true};}
    if(booking.updatedAt!==b.version)throw R.fail('다른 변경이 있습니다. 목록을 새로고침해 주세요.',409);
    const transitions={pending:['confirmed','cancelled'],confirmed:['cancelled','completed'],cancelled:[],completed:[]};
    if(!transitions[booking.status]?.includes(b.status))throw R.fail('변경할 수 없는 예약 상태입니다.');
    if(b.status==='confirmed'&&(s.blockedDates||[]).includes(booking.date))throw R.fail('예약을 막아둔 날짜입니다. 날짜 차단을 먼저 해제해 주세요.');
    booking.status=b.status;booking.updatedAt=new Date().toISOString();return {ok:true};
   });return send(200,result);
  }
  if(b.action==='create'){
   const clean=R.validate(b);if(!/^[a-f0-9]{32}$/.test(b.requestKey||''))throw R.fail('페이지를 새로고침한 후 다시 신청해 주세요.');
   const id=crypto.randomBytes(6).toString('hex').toUpperCase();
   const code=crypto.createHmac('sha256',process.env.SESSION_SECRET).update('guest:'+b.requestKey).digest('hex').slice(0,20).toUpperCase();
   const requestHash=R.hash(b.requestKey),payloadHash=R.hash(JSON.stringify({...clean,consentedAt:undefined}));
   const result=await R.transaction(s=>{
    const prev=s.bookings.find(x=>x.requestHash===requestHash);if(prev){if(prev.payloadHash!==payloadHash)throw R.fail('새 예약 신청 버튼을 누른 후 다시 작성해 주세요.',409);return {booking:R.publicBooking(prev),code};}
    R.rate(s,'create:'+key,5,60);R.rate(s,'phone:'+R.hash(clean.phone),5,60);
    if((s.blockedDates||[]).includes(clean.date))throw R.fail('해당 날짜는 온라인 예약이 마감되었습니다. 다른 날짜를 선택해 주세요.');
    if(s.bookings.length>=3000)throw R.fail('온라인 접수가 일시 중단되었습니다. 전화로 문의해 주세요.',503);
    const now=new Date().toISOString();const booking={...clean,id,codeHash:R.hash(code),requestHash,payloadHash,status:'pending',createdAt:now,updatedAt:now};s.bookings.push(booking);return {booking:R.publicBooking(booking),code};
   });return send(201,result);
  }
  if(['lookup','cancel'].includes(b.action)){
   const result=await R.transaction(s=>{
    R.rate(s,'lookup:'+key,30,15);const booking=s.bookings.find(x=>x.id===String(b.id||'').toUpperCase());
    if(!booking||!R.equal(booking.codeHash,R.hash(String(b.code||'').toUpperCase())))return {error:'접수번호와 조회코드를 확인해 주세요.'};
    if(b.action==='cancel'){if(!['pending','confirmed'].includes(booking.status))throw R.fail('이미 종료된 예약입니다.');booking.status='cancelled';booking.updatedAt=new Date().toISOString();}
    return {booking:R.publicBooking(booking)};
   });return send(result.error?404:200,result);
  }
  throw R.fail('지원하지 않는 요청입니다.');
 }catch(e){if(!e.status)console.error('Reservation service error:',e.name);return send(e.status||503,{error:e.status?e.message:'처리 결과를 확인할 수 없습니다. 같은 내용으로 다시 시도하거나 식당에 문의해 주세요.'});}
};
