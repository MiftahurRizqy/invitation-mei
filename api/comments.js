const { randomUUID } = require('node:crypto');
const choices = ['Aku hadir', 'Aku kabari lagi, ya', 'Maaf, aku belum bisa hadir'];
const { neon } = require('@neondatabase/serverless');
async function database() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) throw Object.assign(new Error('Database not configured'), {code:'DATABASE_NOT_CONFIGURED'});
  const sql = neon(url);
  await sql`CREATE TABLE IF NOT EXISTS mei_najih_guestbook (
    id UUID PRIMARY KEY,
    request_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    attendance TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  return sql;
}
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET','POST'].includes(req.method)) { res.setHeader('Allow','GET, POST'); return res.status(405).json({error:'Metode tidak didukung.'}); }
  try {
    if (req.method === 'GET') {
      const sql = await database();
      const rows = await sql`SELECT id, name, message, attendance, created_at AS "createdAt" FROM mei_najih_guestbook ORDER BY created_at DESC, id DESC LIMIT 100`;
      return res.status(200).json({comments:rows});
    }
    if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return res.status(403).json({error:'Asal permintaan tidak sesuai.'});
    if (!req.headers['content-type']?.startsWith('application/json')) return res.status(415).json({error:'Format tidak didukung.'});
    let body; try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { return res.status(400).json({error:'Data tidak valid.'}); }
    if (!body || typeof body.name !== 'string' || typeof body.message !== 'string' || !choices.includes(body.attendance) || typeof body.requestId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(body.requestId)) return res.status(400).json({error:'Lengkapi nama, kehadiran, dan ucapan.'});
    const name=body.name.trim(), message=body.message.trim();
    if (!name || name.length>100 || !message || message.length>1000) return res.status(400).json({error:'Nama maksimal 100 karakter dan ucapan maksimal 1.000 karakter.'});
    const comment={id:randomUUID(),name,message,attendance:body.attendance,createdAt:new Date().toISOString()};
    const sql = await database();
    const [saved] = await sql`INSERT INTO mei_najih_guestbook (id, request_id, name, message, attendance)
      VALUES (${comment.id}, ${body.requestId}, ${name}, ${message}, ${body.attendance})
      ON CONFLICT (request_id) DO UPDATE SET request_id = EXCLUDED.request_id
      RETURNING id, name, message, attendance, created_at AS "createdAt"`;
    return res.status(201).json({comment:saved});
  } catch (error) {
    const code = error.code === 'DATABASE_NOT_CONFIGURED' ? error.code : 'DATABASE_UNAVAILABLE';
    console.error('Guestbook database status:', code);
    return res.status(503).json({code,error:code === 'DATABASE_NOT_CONFIGURED' ? 'Buku tamu belum diaktifkan oleh pemilik undangan. Ucapanmu belum terkirim.' : 'Buku tamu sedang tidak dapat terhubung. Ucapanmu belum terkirim; silakan coba lagi.'});
  }
};
