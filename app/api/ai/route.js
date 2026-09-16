import { getSandbox, ROOT, safeCwd } from "../../../../lib/sandbox";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

const STORE = ROOT + "/.mce/connections.json";

async function command(sbx, cmd) {
  return sbx.runCommand({ cmd:"bash", args:["-lc",cmd], cwd:ROOT });
}
async function readConnections(sbx) {
  const r=await command(sbx,"mkdir -p "+JSON.stringify(ROOT+"/.mce")+"; test -f "+JSON.stringify(STORE)+" && cat "+JSON.stringify(STORE)+" || printf '[]'");
  if(r.exitCode!==0)return [];
  try{return JSON.parse(await r.stdout())}catch{return []}
}
async function writeConnections(sbx,list) {
  const b64=Buffer.from(JSON.stringify(list,null,2),"utf8").toString("base64");
  const r=await command(sbx,"mkdir -p "+JSON.stringify(ROOT+"/.mce")+"; printf %s "+JSON.stringify(b64)+" | base64 -d > "+JSON.stringify(STORE));
  if(r.exitCode!==0)throw new Error((await r.stderr())||"Cannot save connections");
}
async function projectContext(sbx,cwd,path) {
  const base=safeCwd(cwd||"");
  const root=base?ROOT+"/"+base:ROOT;
  const r=await command(sbx,"find "+JSON.stringify(root)+" -maxdepth 3 -type f -not -path '*/node_modules/*' -not -path '*/.git/*' | sort | head -80");
  const paths=(await r.stdout()).split("\n").filter(Boolean);
  const chunks=[];
  for(const p of paths.slice(0,30)){
    const x=await command(sbx,"printf '\\n--- %s ---\\n' "+JSON.stringify(p.slice(root.length+1))+"; head -c 12000 "+JSON.stringify(p)+" 2>/dev/null");
    chunks.push(await x.stdout());
  }
  return chunks.join("").slice(0,120000);
}
async function callModel(conn,messages) {
  if(!conn?.baseUrl)throw new Error("Connection belum dipilih");
  const base=String(conn.baseUrl).replace(/\/$/,"");
  const url=base.endsWith("/chat/completions")?base:base+"/chat/completions";
  const headers={"content-type":"application/json"};
  if(conn.apiKey)headers.authorization="Bearer "+conn.apiKey;
  const r=await fetch(url,{method:"POST",headers,body:JSON.stringify({model:conn.model||"gpt-4o-mini",messages,temperature:0.2})});
  const text=await r.text();
  if(!r.ok)throw new Error("AI "+r.status+": "+text.slice(0,500));
  const d=JSON.parse(text);
  return d?.choices?.[0]?.message?.content||d?.choices?.[0]?.text||JSON.stringify(d);
}
export async function GET(){
  try{const s=await getSandbox();const list=await readConnections(s);return Response.json({connections:list.map(({apiKey,...x})=>x)})}
  catch(e){return Response.json({error:e.message},{status:500})}
}
export async function POST(req){
  try{
    const b=await req.json(),s=await getSandbox();
    if(b.action==="save"){
      const list=await readConnections(s);
      const item={id:b.id||crypto.randomUUID(),name:String(b.name||"Connection"),baseUrl:String(b.baseUrl||"").trim(),model:String(b.model||""),apiKey:String(b.apiKey||"")};
      if(!/^https?:\/\//i.test(item.baseUrl))throw new Error("Base URL harus http/https");
      const next=[...list.filter(x=>x.id!==item.id),item];await writeConnections(s,next);
      return Response.json({ok:true,connections:next.map(({apiKey,...x})=>x)});
    }
    if(b.action==="delete"){
      const list=(await readConnections(s)).filter(x=>x.id!==b.id);await writeConnections(s,list);return Response.json({ok:true});
    }
    if(b.action==="chat"){
      const list=await readConnections(s),conn=list.find(x=>x.id===b.connectionId);
      if(!conn)throw new Error("Connection tidak ditemukan");
      const context=await projectContext(s,b.cwd,b.path);
      const system=b.mode==="agent"
        ?"You are the Mobile Code Agent. Analyze the project context, explain concrete findings and propose exact file changes. Do not claim edits were made unless explicitly performed by a tool."
        :"You are the Mobile Code Copilot. Give concise, actionable coding help for the current file/project.";
      const messages=[{role:"system",content:system+"\nPROJECT CONTEXT:\n"+context},{role:"user",content:String(b.prompt||"")}];
      return Response.json({ok:true,content:await callModel(conn,messages)});
    }
    throw new Error("Unknown AI action");
  }catch(e){return Response.json({error:e.message||"AI error"},{status:400})}
}
