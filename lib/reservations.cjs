const crypto = require('node:crypto');
const {get,put}=require('@vercel/blob');
const Lunar=require('korean-lunar-calendar');
const PATH='reservations/state-v1.json';
const DAY=86400000;
function fail(message,status=400){return Object.assign(new Error(message),{status});}
function hash(value){return crypto.createHash('sha256').update(String(value)).digest('hex');}
function equal(a,b){return crypto.timingSafeEqual(Buffer.from(hash(a)),Buffer.from(hash(b)));}
function today(now=Date.now()){return new Date(now+9*3600000).toISOString().slice(0,10);}
function holiday(date){const [y,m,d]=date.split('-').map(Number);const lunar=new Lunar();lunar.setSolarDate(y,m,d);const x=lunar.getLunarCalendar();return !x.intercalation&&((x.month===1&&x.day===1)||(x.month===8&&x.day===15));}
function validate(b,now=Date.now()){
 if(typeof b.name!=='string'||!b.name.trim()||b.name.trim().length>30)throw fail('예약자 이름을 30자 이내로 입력해 주세요.');
 const phone=String(b.phone||'').replace(/[ -]/g,'');if(!/^01[016789]\d{7,8}$/.test(phone))throw fail('연락 가능한 휴대폰 번호를 입력해 주세요.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(b.date||''))throw fail('방문 날짜를 확인해 주세요.');
 const dayTime=Date.parse(b.date+'T00:00:00+09:00');if(!Number.isFinite(dayTime)||today(dayTime)!==b.date)throw fail('올바른 날짜를 선택해 주세요.');
 if(b.date<today(now)||b.date>today(now+90*DAY))throw fail('예약은 오늘부터 90일 이내로 신청해 주세요.');
 if(holiday(b.date))throw fail('설날과 추석 당일은 휴무입니다.');
 if(!/^(1\d|20):(00|30)$/.test(b.time||''))throw fail('방문 시간은 10:00부터 20:30까지 선택해 주세요.');
 if(Date.parse(`${b.date}T${b.time}:00+09:00`)<=now)throw fail('현재 이후의 방문 시간을 선택해 주세요.');
 const guests=Number(b.guests);if(!Number.isInteger(guests)||guests<1||guests>100)throw fail('인원은 1~100명으로 입력해 주세요.');
 if(typeof b.note!=='string'||b.note.length>300)throw fail('요청사항은 300자 이내로 입력해 주세요.');
 if(b.consent!==true)throw fail('예약을 위한 개인정보 수집·이용에 동의해 주세요.');
 if(b.website)throw fail('신청을 처리할 수 없습니다.');
 return {name:b.name.trim(),phone,date:b.date,time:b.time,guests,note:b.note.trim(),consentedAt:new Date(now).toISOString()};
}
async function read(){const r=await get(PATH,{access:'private',useCache:false});if(!r)return {state:{bookings:[],rates:{}},etag:null};return {state:JSON.parse(await new Response(r.stream).text()),etag:r.blob.etag.replace(/^W\//,'')};}
async function transaction(fn){for(let i=0;i<7;i++){const {state,etag}=await read();const now=Date.now();state.bookings=state.bookings.filter(b=>Date.parse(b.date+'T21:00:00+09:00')+30*DAY>now);for(const [key,r]of Object.entries(state.rates))if(r.until<now)delete state.rates[key];const result=fn(state);try{await put(PATH,JSON.stringify(state),{access:'private',addRandomSuffix:false,contentType:'application/json',allowOverwrite:!!etag,...(etag?{ifMatch:etag}:{})});return result;}catch(e){if(!['BlobPreconditionFailedError','BlobAlreadyExistsError'].includes(e.constructor.name)||i===6)throw e;await new Promise(r=>setTimeout(r,50+Math.random()*100));}}}
function rate(state,key,limit,minutes){const now=Date.now();let r=state.rates[key];if(!r||r.until<now)r=state.rates[key]={n:0,until:now+minutes*60000};if(r.n>=limit)throw fail('요청이 많습니다. 잠시 후 다시 시도해 주세요.',429);r.n++;}
function publicBooking(b){const {id,name,date,time,guests,note,status,createdAt,updatedAt}=b;return {id,name,date,time,guests,note,status,createdAt,updatedAt};}
function sessionCookie(){const expiry=Date.now()+8*3600000;const sig=crypto.createHmac('sha256',process.env.SESSION_SECRET).update(String(expiry)).digest('hex');return `${expiry}.${sig}`;}
function admin(req){const cookie=String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('ng_admin='))?.slice(9)||'';const [expires,sig]=cookie.split('.');if(!/^\d+$/.test(expires||'')||Number(expires)<Date.now()||Number(expires)>Date.now()+8*3600000||!sig)return false;return equal(sig,crypto.createHmac('sha256',process.env.SESSION_SECRET).update(expires).digest('hex'));}
module.exports={fail,hash,equal,today,holiday,validate,transaction,read,rate,publicBooking,sessionCookie,admin};
