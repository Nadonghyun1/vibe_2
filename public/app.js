const address='충북 청주시 상당구 사직대로361번길 174';
const query=encodeURIComponent(address+' 노가정');
document.querySelector('#naver-map').href='https://map.naver.com/p/search/'+query;
document.querySelector('#kakao-map').href='https://map.kakao.com/?q='+query;
document.querySelector('#map-frame').src='https://maps.google.com/maps?q='+encodeURIComponent(address)+'&output=embed&hl=ko';
document.querySelector('#year').textContent=new Date().getFullYear();
let menus=[];
function renderMenu(category='전체'){
 const grid=document.querySelector('#menu-grid');grid.replaceChildren();
 for(const item of menus.filter(m=>category==='전체'||m.category===category)){
  const card=document.createElement('article');card.className='menu-card';
  const wrap=document.createElement('div');wrap.className='menu-image';
  const img=document.createElement('img');img.src=item.image;img.alt=item.name;img.loading='lazy';img.width=700;img.height=525;wrap.append(img);
  const top=document.createElement('div');top.className='card-top';const title=document.createElement('h3');title.textContent=item.name;const price=document.createElement('span');price.className='price';price.textContent=item.price.toLocaleString('ko-KR')+'원';top.append(title,price);
  const desc=document.createElement('p');desc.textContent=item.description;
  const tags=document.createElement('p');tags.className='tags';tags.textContent=[item.note,item.minimum===2?'2인분 이상':'1인분 주문 가능'].filter(Boolean).join(' · ');
  card.append(wrap,top,desc,tags);grid.append(card);
 }
}
fetch('/menu.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{menus=data;renderMenu()}).catch(()=>{document.querySelector('#menu-grid').textContent='메뉴를 불러오지 못했습니다. 새로고침하거나 043-225-9595로 문의해 주세요.'});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderMenu(button.dataset.filter)}));
const form=document.querySelector('#reservation-form'), status=document.querySelector('#form-status');
function localDate(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date())}
form.elements.date.min=localDate();
for(let h=10;h<=20;h++)for(const m of ['00','30']){const option=document.createElement('option');option.value=option.textContent=String(h).padStart(2,'0')+':'+m;form.elements.time.append(option)}
function message(){form.elements.date.min=localDate();if(!form.reportValidity())return null;const f=new FormData(form);if(!f.get('name').trim()){status.textContent='예약자 이름을 입력해 주세요.';return null}const time=new Date(f.get('date')+'T'+f.get('time')+':00+09:00');if(time<=new Date()){status.textContent='현재 이후의 방문 시간을 선택해 주세요.';return null}return `[노가정 예약 문의]\n성함: ${f.get('name').trim()}\n방문: ${f.get('date')} ${f.get('time')}\n인원: ${f.get('guests')}명\n요청: ${f.get('note').trim()||'없음'}\n예약 가능 여부와 확정 안내 부탁드립니다.`}
form.addEventListener('submit',e=>{e.preventDefault();const text=message();if(!text)return;const separator=/iPhone|iPad|iPod/.test(navigator.userAgent)?'&':'?';window.location.href='sms:01020658878'+separator+'body='+encodeURIComponent(text);status.textContent='문자 앱에서 전송을 눌러주세요. 식당의 확정 안내 전에는 예약이 완료되지 않습니다.'});
document.querySelector('#copy-reservation').addEventListener('click',async()=>{const text=message();if(!text)return;try{await navigator.clipboard.writeText(text);status.textContent='예약 내용을 복사했습니다. 010-2065-8878로 문자를 보내주세요.'}catch{status.textContent='복사 기능을 사용할 수 없습니다. 전화 또는 휴대폰 문자로 문의해 주세요.'}});
document.querySelector('#copy-address').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(address);document.querySelector('#address-status').textContent='주소를 복사했습니다.'}catch{document.querySelector('#address-status').textContent=address}});
const video=document.querySelector('#fire'),toggle=document.querySelector('#video-toggle');
toggle.addEventListener('click',async()=>{if(video.paused){try{await video.play()}catch{toggle.textContent='영상 재생 다시 시도 ▷'}}else video.pause()});
video.addEventListener('play',()=>toggle.textContent='영상 일시정지 Ⅱ');video.addEventListener('pause',()=>toggle.textContent='조리 영상 재생 ▷');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)video.pause();else if(!reduced.matches&&video.readyState===0)video.play().catch(()=>{})}},{threshold:.35}).observe(video);
