const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../dist');
function start(port=8877){
 const server=http.createServer((req,res)=>{
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end('Prévia local: envios reais indisponíveis.');}
  let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.stat(file,(error,stat)=>{
   if(error||!stat.isFile()){res.writeHead(404);return res.end();}
   const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.mp3':'audio/mpeg','.mp4':'video/mp4'};
   const headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
   const range=/bytes=(\d+)-(\d*)/.exec(req.headers.range||'');
   let start=0,end=stat.size-1,status=200;
   if(range){start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),end):end;status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;}
   headers['Content-Length']=end-start+1;res.writeHead(status,headers);
   if(req.method==='HEAD')return res.end();fs.createReadStream(file,{start,end}).pipe(res);
  });
 });
 return new Promise(resolve=>server.listen(port,'127.0.0.1',()=>resolve(server)));
}
module.exports={start};
if(require.main===module)start().then(()=>console.log('Prévia: http://127.0.0.1:8877/'));
