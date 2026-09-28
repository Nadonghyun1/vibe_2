const address='충북 청주시 상당구 사직대로361번길 174';
const query=encodeURIComponent(address+' 노가정');
document.querySelector('#naver-map').href='https://map.naver.com/p/search/'+query;
document.querySelector('#kakao-map').href='https://map.kakao.com/?q='+query;
document.querySelector('#map-frame').src='https://maps.google.com/maps?q='+encodeURIComponent(address)+'&output=embed&hl=ko';
document.querySelector('#year').textContent=new Date().getFullYear();
let menus=[];
function renderMenu(category='전체'){
 const grid=document.querySelector('#menu-grid');grid.replaceChildren();
 const visible=menus.filter(m=>category==='전체'||m.category===category);
 if(!visible.length){const notice=document.createElement('p');notice.textContent=menus.length?'해당 종류에 등록된 메뉴가 없습니다. 다른 메뉴를 선택해 주세요.':'등록된 메뉴가 없습니다. 043-225-9595로 문의해 주세요.';grid.append(notice);return;}
 for(const item of visible){
  const card=document.createElement('article');card.className='menu-card';card.id='menu-'+item.slug;
  const wrap=document.createElement('div');wrap.className='menu-image';
  const img=document.createElement('img');img.src=item.image;img.alt='청주 노가정 '+item.name;img.loading='lazy';img.width=700;img.height=525;wrap.append(img);
  const top=document.createElement('div');top.className='card-top';const title=document.createElement('h3');title.textContent=item.name;const price=document.createElement('span');price.className='price';price.textContent=item.price.toLocaleString('ko-KR')+'원';top.append(title,price);
  const desc=document.createElement('p');desc.textContent=item.description;
  const tags=document.createElement('p');tags.className='tags';tags.textContent=[item.note,item.minimum===2?'2인분 이상':'1인분 주문 가능'].filter(Boolean).join(' · ');
  const keywords=document.createElement('p');keywords.className='menu-keywords';keywords.textContent=(item.tags||[]).map(t=>'#'+t).join(' ');card.append(wrap,top,desc,tags,keywords);grid.append(card);
 }
}
fetch('/menu.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{menus=data;renderMenu()}).catch(()=>{document.querySelector('#menu-grid').textContent='메뉴를 불러오지 못했습니다. 새로고침하거나 043-225-9595로 문의해 주세요.'});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));renderMenu(button.dataset.filter)}));
const form=document.querySelector('#reservation-form'), status=document.querySelector('#form-status');
function localDate(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date())}
form.elements.date.min=localDate();
form.elements.date.max=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date(Date.now()+90*86400000));
for(let h=10;h<=20;h++)for(const m of ['00','30']){const option=document.createElement('option');option.value=option.textContent=String(h).padStart(2,'0')+':'+m;form.elements.time.append(option)}
document.querySelector('#copy-address').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(address);document.querySelector('#address-status').textContent='주소를 복사했습니다.'}catch{document.querySelector('#address-status').textContent=address}});
const video=document.querySelector('#fire'),toggle=document.querySelector('#video-toggle');
toggle.addEventListener('click',async()=>{if(video.paused){try{await video.play()}catch{toggle.textContent='영상 재생 다시 시도 ▷'}}else video.pause()});
video.addEventListener('play',()=>toggle.textContent='영상 일시정지 Ⅱ');video.addEventListener('pause',()=>toggle.textContent='조리 영상 재생 ▷');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)video.pause();else if(!reduced.matches&&video.readyState===0)video.play().catch(()=>{})}},{threshold:.35}).observe(video);
