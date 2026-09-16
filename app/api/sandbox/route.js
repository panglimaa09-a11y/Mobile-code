import {Sandbox} from "@vercel/sandbox";
const NAME="mobile-code-cloud-main";
async function getSandbox(){
 return Sandbox.getOrCreate({
  name:NAME,
  persistent:true,
  ports:[7681],
  timeout:45*60*1000,
  onCreate:async sbx=>{
   await sbx.runCommand({cmd:"bash",args:["-lc","command -v ttyd >/dev/null 2>&1 || (apt-get update -y && apt-get install -y ttyd)"]});
   await sbx.runCommand({cmd:"bash",args:["-lc","mkdir -p /vercel/sandbox/workspace && cd /vercel/sandbox/workspace && test -f README.md || printf '# Mobile Code Cloud\\n' > README.md"]});
   await sbx.runCommand({cmd:"ttyd",args:["-W","-p","7681","bash"],cwd:"/vercel/sandbox/workspace",detached:true});
  },
  onResume:async sbx=>{
   const r=await sbx.runCommand({cmd:"bash",args:["-lc","pgrep -f 'ttyd.*7681' >/dev/null || ttyd -W -p 7681 bash"],cwd:"/vercel/sandbox/workspace",detached:true});
  }
 });
}
export async function GET(){
 try{const sbx=await getSandbox();return Response.json({ok:true,name:sbx.name,terminalUrl:sbx.domain(7681)});}
 catch(e){return Response.json({error:e.message||"Sandbox unavailable"},{status:500});}
}
export async function POST(){return GET();}
