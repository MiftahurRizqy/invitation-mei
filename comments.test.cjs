const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {createServer}=require('./preview.cjs');
test('guestbook validation, persistence, and duplicate submission',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mei-guestbook-test-'));
  const file=path.join(dir,'comments.json');
  const server=createServer(file);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const post=data=>fetch(base+'/api/comments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  try{
    assert.deepEqual(await (await fetch(base+'/api/comments')).json(),{comments:[]});
    assert.equal((await post({name:' ',message:' ',attendance:'Invalid'})).status,400);
    const payload={name:'Tamu Uji',message:'Doa baik <script>test</script>',attendance:'Aku hadir',requestId:'test-request-123456'};
    assert.equal((await post(payload)).status,201);
    assert.equal((await post(payload)).status,200);
    const data=await (await fetch(base+'/api/comments')).json();
    assert.equal(data.comments.length,1);
    assert.equal(data.comments[0].message,payload.message);
    assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).length,1);
    assert.equal((await post({...payload,requestId:'second-request-123456',message:'x'.repeat(1001)})).status,400);
    const ranged=await fetch(base+'/assets/romansa-from-49.mp3',{headers:{Range:'bytes=0-127'}});
    assert.equal(ranged.status,206);assert.equal((await ranged.arrayBuffer()).byteLength,128);
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));fs.rmSync(dir,{recursive:true});}
});
