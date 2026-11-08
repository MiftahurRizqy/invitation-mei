const form = document.querySelector('#rsvp-form');
const list = document.querySelector('#comments');
const status = document.querySelector('#comment-status');
const retry = document.querySelector('#comments-retry');
const attendance = document.querySelector('#attendance');
const attendancePicker = document.querySelector('#attendance-picker');
const attendanceText = document.querySelector('#attendance-text');
let pendingId = null;
let renderedComments = '';
let currentComments = [];
const scrollHint = document.querySelector('#comments-hint');
attendancePicker.addEventListener('change', event => {
  const choice = event.target.closest('input[name="attendance-choice"]');
  if (!choice) return;
  attendance.value = choice.value;
  attendanceText.textContent = choice.value === 'Aku hadir' ? 'Aku hadir ♡' : choice.value;
  attendancePicker.open = false;
});
function updateScrollHint(){scrollHint.hidden=list.scrollHeight<=list.clientHeight+2;}
new ResizeObserver(updateScrollHint).observe(list);
async function guestbookRequest(options = {}) {
  let response;
  try { response = await fetch('/api/comments',{cache:'no-store',...options}); }
  catch {throw new Error('Koneksi terputus. Coba kirim lagi; tulisanmu tetap tersimpan di formulir.');}
  const raw=await response.text();
  let data;
  try {data=JSON.parse(raw);} catch {throw new Error('Layanan buku tamu belum tersedia di alamat ini. Buka versi terbaru undangan, lalu coba lagi.');}
  if(!response.ok)throw new Error(data.error||'Ucapan belum tersimpan. Silakan coba lagi.');
  return data;
}
function renderComments(comments){
  const signature=JSON.stringify(comments);
  if(signature===renderedComments)return;
  renderedComments=signature;
  currentComments=comments;
  const previousScroll=list.scrollTop;
  list.replaceChildren();
  document.querySelector('#comment-count').textContent = `${comments.length} ucapan`;
  if(!comments.length){const p=document.createElement('p');p.className='empty-comments';p.textContent='Belum ada ucapan. Jadilah yang pertama menitipkan doa baik ♡';list.append(p);updateScrollHint();return;}
  for(const c of comments){
    const article=document.createElement('article');article.className='comment';
    const header=document.createElement('div');header.className='comment-header';
    const avatar=document.createElement('span');avatar.className='comment-avatar';avatar.textContent=Array.from(c.name)[0]?.toUpperCase()||'♡';avatar.setAttribute('aria-hidden','true');
    const details=document.createElement('div');
    const name=document.createElement('strong');name.textContent=c.name;
    const time=document.createElement('time');time.dateTime=c.createdAt;time.textContent=new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'}).format(new Date(c.createdAt));
    const badge=document.createElement('span');badge.className='comment-badge';badge.textContent=c.attendance;
    const message=document.createElement('p');message.textContent=c.message;
    details.append(name,time,badge,message);header.append(avatar,details);article.append(header);list.append(article);
  }
  list.scrollTop=previousScroll;
  requestAnimationFrame(updateScrollHint);
}
async function loadComments(){
  try{const data=await guestbookRequest();if(!Array.isArray(data.comments))throw Error('Data ucapan belum dapat dimuat.');renderComments(data.comments);retry.hidden=true;}
  catch(error){if(!list.querySelector('.comment'))list.textContent=error.message;retry.hidden=false;}
}
retry.addEventListener('click',loadComments);
form.addEventListener('input',()=>{pendingId=null;});
form.addEventListener('submit',async e=>{
  e.preventDefault();
  const name=document.querySelector('#name').value.trim(), message=document.querySelector('#message').value.trim();
  if(!name||!message){status.textContent='Isi nama dan ucapan terlebih dahulu, ya.';return;}
  const button=document.querySelector('#comment-submit');button.disabled=true;status.textContent='Menyimpan ucapan…';
  try{
    pendingId ||= crypto.randomUUID();
    const data=await guestbookRequest({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,message,attendance:document.querySelector('#attendance').value,requestId:pendingId})});
    if(!data.comment?.id)throw Error('Penyimpanan belum terkonfirmasi. Silakan kirim lagi.');
    document.querySelector('#message').value='';pendingId=null;status.textContent='Terima kasih! Ucapanmu sudah tersimpan ♡';
    renderComments([data.comment,...currentComments.filter(comment=>comment.id!==data.comment.id)]);
    loadComments();
    list.scrollTop=0;
  }catch(error){status.textContent=error.message==='Failed to fetch'?'Koneksi terputus. Ucapan belum terkonfirmasi tersimpan; coba lagi.':error.message;}
  finally{button.disabled=false;}
});
loadComments();
setInterval(()=>{if(!document.hidden)loadComments();},30000);
