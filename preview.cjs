const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, 'dist');
const commentsApi = require('./comments.cjs');
function createServer(dataFile=path.join(__dirname,'data','comments.json')) { return http.createServer((req, res) => {
  if(new URL(req.url,'http://localhost').pathname==='/api/comments')return commentsApi(req,res,dataFile);
  let filename;
  try { filename = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); }
  catch { res.writeHead(400); return res.end(); }
  if (filename !== root && !filename.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
  if (filename === root) filename = path.join(root, 'index.html');
  fs.stat(filename, (error, stat) => {
    if (error) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', ({ '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.jpg':'image/jpeg', '.mp3':'audio/mpeg' })[path.extname(filename)] || 'application/octet-stream');
    res.setHeader('Accept-Ranges', 'bytes');
    const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if(range){
      const start=Number(range[1]), end=range[2]?Math.min(Number(range[2]),stat.size-1):stat.size-1;
      if(start>end || start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});return res.end();}
      res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Content-Length':end-start+1});
      fs.createReadStream(filename,{start,end}).pipe(res);
    } else {res.setHeader('Content-Length',stat.size);fs.createReadStream(filename).pipe(res);}
  });
}); }
module.exports={createServer};
if(require.main===module)createServer(process.env.DATA_FILE || path.join(__dirname,'data','comments.json')).listen(Number(process.env.PORT) || 4176, process.env.HOST || '127.0.0.1');
