import { getSandbox, ROOT } from "../../../../lib/sandbox";
export const dynamic="force-dynamic";
const STORE=ROOT+"/.mce/mcp.json";
async function run(s,c){return s.runCommand({cmd:"bash",args:["-lc",c],cwd:ROOT})}
async function list(s){const r=await run(s,"mkdir -p "+JSON.stringify(ROOT+"/.mce")+"; test -f "+JSON.stringify(STORE)+" && cat "+JSON.stringify(STORE)+" || printf '[]'");try{return JSON.parse(await r.stdout())}catch{return[]}}
async function save(s,a){const b64=Buffer.from(JSON.stringify(a,null,2)).toString("base64");await run(s,"printf %s "+JSON.stringify(b64)+" | base64 -d > "+JSON.stringify(STORE))}
function valid(u){try{const x=new URL(u);if(!/^https?:$/.test(x.protocol))return false;const h=x.hostname.toLowerCase();if(h==="localhost"||h==="127.0.0.1"||h==="0.0.0.0"||/^10\./.test(h)||/^192\.168\./.test(h)||/^172\.(1[6-9]|2\d|3[0-1])\./.test(h))return false;return true}catch{return false}}
export async function GET(){try{const s=await getSandbox();return Response.json({items:(await list(s)).map(({token,...x})=>x)})}catch(e){return Response.json({error:e.message},{status:500})}}
export async function POST(req){try{const b=await req.json(),s=await getSandbox(),items=await list(s);
 if(b.action==="save"){if(!valid(b.url))throw new Error("MCP URL tidak valid atau alamat lokal/private");const x={id:b.id||crypto.randomUUID(),name:String(b.name||"MCP"),url:String(b.url),token:String(b.token||"")};await save(s,[...items.filter(i=>i.id!==x.id),x]);return Response.json({ok:true})}
 if(b.action==="delete"){await save(s,items.filter(i=>i.id!==b.id));return Response.json({ok:true})}
 if(b.action==="probe"){const x=items.find(i=>i.id===b.id);if(!x)throw new Error("MCP tidak ditemukan");const h={};if(x.token)h.authorization="Bearer "+x.token;const r=await fetch(x.url.replace(/\/$/,"")+"/tools",{headers:h});return Response.json({ok:r.ok,status:r.status,text:(await r.text()).slice(0,10000)})}
 throw new Error("Unknown MCP action");
}catch(e){return Response.json({error:e.message||"MCP error"},{status:400})}}
