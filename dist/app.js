// Earlier previews were static-only. Keep their old links on the working guestbook server.
if (['127.0.0.1','localhost'].includes(location.hostname) && ['4173','4174','4175'].includes(location.port)) {
  const current = new URL(location.href); current.port = '4176'; location.replace(current.href);
}
const $ = (s) => document.querySelector(s);
const guest = new URLSearchParams(location.search).get('to')?.trim().slice(0,100);
$('#guest').textContent = guest || 'Nama Tamu Undangan';
if (guest) $('#name').value = guest;
const observer = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);} }),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
// The opening is the couple section itself: it appears once, before the invitation is opened.
const cover = $('#cover');
const hero = $('#home');
const openButton = $('#open');
const recipient = cover.querySelector('.recipient');
recipient.querySelector('span').textContent = 'Kepada:';
recipient.style.flexDirection = 'column';
recipient.style.alignItems = 'center';
recipient.style.gap = '0';
recipient.style.textAlign = 'center';
hero.querySelector('.scroll-note')?.remove();
hero.querySelector('.music-card')?.before(recipient);
hero.querySelector('.music-card')?.after(openButton);
cover.append(hero);
// User-supplied soundtrack. Start at 00:49 after opening the invitation.
const MUSIC_URL = 'assets/romansa-from-49.mp3';
const audio = $('#audio');
audio.src = MUSIC_URL; // File is already trimmed to the original 00:49. No seeking needed.
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3000);}
async function playMusic(){try{await audio.play();}catch{autoplayBlocked=true;}}
let autoplayBlocked = false;
const curtain = $('#curtain');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function finishCurtain(){curtain.hidden=true;document.body.classList.remove('opening');}
function introCurtain(){
  if(reducedMotion){finishCurtain();return;}
  document.body.classList.add('opening');
  curtain.hidden=false;
  const panels=curtain.querySelectorAll('.curtain-panel');
  let ended=0;
  panels.forEach(panel=>panel.addEventListener('transitionend',event=>{
    if(event.target===panel && event.propertyName==='transform' && ++ended===panels.length)finishCurtain();
  },{once:true}));
  // Let the monogram settle, then reveal the guest cover slowly.
  requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(()=>curtain.classList.add('parting'),650)));
  // Fallback only after the full transition for browsers that suppress transitionend.
  setTimeout(finishCurtain,6500);
}
introCurtain();
$('#open').addEventListener('click',()=>{
  $('#invitation').inert=false;
  document.body.classList.remove('sealed');
  $('#intro').tabIndex=-1;$('#intro').focus({preventScroll:true});
  window.scrollTo({top:$('#intro').getBoundingClientRect().top+window.scrollY,behavior:reducedMotion?'instant':'smooth'});
});
function syncPlayer(){document.querySelector('.music-card').classList.toggle('is-playing',!audio.paused);}
audio.addEventListener('play',syncPlayer);audio.addEventListener('pause',syncPlayer);
document.querySelector('#music').addEventListener('click',()=>{if(audio.paused){autoplayBlocked=false;audio.play().catch(()=>{autoplayBlocked=true;syncPlayer();});}else{audio.pause();}});
// Respect browser autoplay policy; retry only on a real first user gesture.
audio.play().then(()=>{autoplayBlocked=false;}).catch(()=>{autoplayBlocked=true;syncPlayer();});
function startOnGesture(event){
  if(!autoplayBlocked)return;
  autoplayBlocked=false;
  audio.play().catch(()=>{autoplayBlocked=true;syncPlayer();});
}
document.addEventListener('pointerdown',startOnGesture,{capture:true});
document.addEventListener('keydown',startOnGesture,{capture:true});
audio.addEventListener('timeupdate',()=>{const t=49+Math.floor(audio.currentTime);$('#elapsed').textContent=String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');$('#music-progress').style.width=(audio.duration?audio.currentTime/audio.duration*100:0)+'%';});
audio.addEventListener('error',()=>{toast('Musik belum dapat dimuat. Coba muat ulang halaman.');syncPlayer();});
$('#name').addEventListener('input',()=>$('#name').setCustomValidity(''));
$('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText('0621849743');toast('Nomor rekening berhasil disalin');}catch{const input=document.createElement('textarea');input.value='0621849743';document.body.append(input);input.select();const copied=document.execCommand('copy');input.remove();toast(copied?'Nomor rekening berhasil disalin':'Nomor rekening: 0621849743');}});
const dates=[new Date('2026-11-30T13:00:00+07:00'),new Date('2026-12-05T13:00:00+07:00')];
function updateCountdown(){const now=Date.now();const index=now<dates[0]?0:1;const remaining=Math.max(0,dates[index]-now);$('#count-label').textContent=remaining?(index?'MENUJU HARI RESEPSI':'MENUJU HARI AKAD'):'TERIMA KASIH ATAS DOA & RESTUNYA';const seconds=Math.floor(remaining/1000);const values=[Math.floor(seconds/86400),Math.floor(seconds/3600)%24,Math.floor(seconds/60)%60,seconds%60];$('#countdown').innerHTML=values.map((n,i)=>`<div><strong>${String(n).padStart(2,'0')}</strong><span>${['HARI','JAM','MENIT','DETIK'][i]}</span></div>`).join('');}
updateCountdown();setInterval(updateCountdown,1000);
document.querySelectorAll('.calendar').forEach(button=>button.addEventListener('click',()=>{const akad=button.dataset.event==='akad';const start=akad?'20261130T060000Z':'20261205T060000Z';const locationText=akad?'Wonogiri, Jawa Tengah':'Kantor DPW PPP DIY, Jl. Tentara Rakyat Mataram No. 43, Yogyakarta';const escape=s=>s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Mei Najih//Undangan//ID','BEGIN:VEVENT',`UID:${button.dataset.event}-2026@mei-najih.invitation`,'DTSTAMP:20261108T000000Z',`DTSTART:${start}`,`SUMMARY:${akad?'Akad Nikah':'Resepsi'} Mei & Najih`,`LOCATION:${escape(locationText)}`,`DESCRIPTION:${escape(akad?'Akad nikah di Wonogiri, Jawa Tengah. Pukul 13.00 WIB.':'Pukul 13.00 WIB sampai selesai. https://maps.app.goo.gl/XwUMPT7N4JD2Y9FT8')}`,'END:VEVENT','END:VCALENDAR'];const url=URL.createObjectURL(new Blob([lines.join('\r\n')+'\r\n'],{type:'text/calendar;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`${button.dataset.event}-mei-najih.ics`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}));




