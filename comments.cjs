const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const attendanceValues = ['Aku hadir', 'Aku kabari lagi, ya', 'Maaf, aku belum bisa hadir'];

module.exports = function commentsApi(req, res, file) {
  const reply = (status, data) => {res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  const read = () => {try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch(e){if(e.code==='ENOENT')return [];throw e;}};
  if(req.method==='GET') {try{return reply(200,{comments:read().slice(-100).reverse()});}catch{return reply(500,{error:'Ucapan belum dapat dimuat.'});}}
  if(req.method!=='POST')return reply(405,{error:'Metode tidak didukung.'});
  if(req.headers.origin && req.headers.origin !== `http://${req.headers.host}` && req.headers.origin !== `https://${req.headers.host}`)return reply(403,{error:'Asal permintaan tidak sesuai.'});
  if(!req.headers['content-type']?.startsWith('application/json'))return reply(415,{error:'Format tidak didukung.'});
  let body='',size=0,rejected=false;
  req.on('data',chunk=>{size+=chunk.length;if(size>8192){if(!rejected){rejected=true;reply(413,{error:'Ucapan terlalu panjang.'});}return;}body+=chunk;});
  req.on('end',()=>{
    if(rejected)return;
    let value;try{value=JSON.parse(body);}catch{return reply(400,{error:'Data tidak valid.'});}
    if(!value || typeof value.name!=='string' || typeof value.message!=='string' || !attendanceValues.includes(value.attendance))return reply(400,{error:'Lengkapi nama, kehadiran, dan ucapan.'});
    const name=value.name.trim(),message=value.message.trim();
    if(!name || name.length>100 || !message || message.length>1000)return reply(400,{error:'Nama maksimal 100 karakter dan ucapan maksimal 1.000 karakter.'});
    if(typeof value.requestId!=='string' || !/^[a-zA-Z0-9-]{16,80}$/.test(value.requestId))return reply(400,{error:'ID pengiriman tidak valid.'});
    try{
      const all=read();
      const existing=all.find(c=>c.requestId===value.requestId);
      if(existing)return reply(200,{comment:existing});
      const comment={id:randomUUID(),requestId:value.requestId,name,message,attendance:value.attendance,createdAt:new Date().toISOString()};
      all.push(comment);
      fs.mkdirSync(path.dirname(file),{recursive:true});
      fs.writeFileSync(file+'.tmp',JSON.stringify(all,null,2),'utf8');
      fs.renameSync(file+'.tmp',file);
      reply(201,{comment});
    }catch{reply(500,{error:'Ucapan belum tersimpan. Silakan coba lagi.'});}
  });
};
