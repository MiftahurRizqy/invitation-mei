const { randomUUID } = require('node:crypto');
const choices = ['Aku hadir', 'Aku kabari lagi, ya', 'Maaf, aku belum bisa hadir'];
const key = 'mei-najih:comments';
async function redis(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw Object.assign(new Error('Database not configured'), {code:'DATABASE_NOT_CONFIGURED'});
  const response = await fetch(url, {method:'POST', headers:{Authorization:`Bearer ${token}`, 'Content-Type':'application/json'}, body:JSON.stringify(command), signal:AbortSignal.timeout(8000)});
  const data = await response.json();
  if (!response.ok || data.error) throw new Error('Database request failed');
  return data.result;
}
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET','POST'].includes(req.method)) { res.setHeader('Allow','GET, POST'); return res.status(405).json({error:'Metode tidak didukung.'}); }
  try {
    if (req.method === 'GET') {
      const rows = await redis(['ZREVRANGE',key,0,99]);
      return res.status(200).json({comments:rows.map(row=>JSON.parse(row))});
    }
    if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return res.status(403).json({error:'Asal permintaan tidak sesuai.'});
    if (!req.headers['content-type']?.startsWith('application/json')) return res.status(415).json({error:'Format tidak didukung.'});
    let body; try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { return res.status(400).json({error:'Data tidak valid.'}); }
    if (!body || typeof body.name !== 'string' || typeof body.message !== 'string' || !choices.includes(body.attendance) || typeof body.requestId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(body.requestId)) return res.status(400).json({error:'Lengkapi nama, kehadiran, dan ucapan.'});
    const name=body.name.trim(), message=body.message.trim();
    if (!name || name.length>100 || !message || message.length>1000) return res.status(400).json({error:'Nama maksimal 100 karakter dan ucapan maksimal 1.000 karakter.'});
    const comment={id:randomUUID(),name,message,attendance:body.attendance,createdAt:new Date().toISOString()};
    // One atomic operation prevents duplicates when a submission is retried.
    const script="local old=redis.call('GET',KEYS[2]); if old then return old end; redis.call('ZADD',KEYS[1],ARGV[1],ARGV[2]); redis.call('SET',KEYS[2],ARGV[2],'EX',604800); return ARGV[2]";
    const saved=await redis(['EVAL',script,2,key,`${key}:request:${body.requestId}`,Date.now(),JSON.stringify(comment)]);
    return res.status(201).json({comment:JSON.parse(saved)});
  } catch (error) {
    const code = error.code === 'DATABASE_NOT_CONFIGURED' ? error.code : 'DATABASE_UNAVAILABLE';
    console.error('Guestbook database status:', code);
    return res.status(503).json({code,error:code === 'DATABASE_NOT_CONFIGURED' ? 'Buku tamu belum diaktifkan oleh pemilik undangan. Ucapanmu belum terkirim.' : 'Buku tamu sedang tidak dapat terhubung. Ucapanmu belum terkirim; silakan coba lagi.'});
  }
};
