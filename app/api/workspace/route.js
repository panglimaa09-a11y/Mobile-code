import { getSandbox, ROOT, workspacePath, safePath, safeCwd } from "../../../lib/sandbox";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

function abs(cwd,p) {
  const c=safeCwd(cwd);
  const x=safePath(p);
  return c ? ROOT+"/"+c+"/"+x : ROOT+"/"+x;
}

async function run(sbx,args,cwd=ROOT) {
  const r=await sbx.runCommand({cmd:"bash",args:["-lc",args],cwd});
  if(r.exitCode!==0) throw new Error((await r.stderr()) || (await r.stdout()) || "Command failed");
  return r;
}

export async function GET(req) {
  try {
    const sbx=await getSandbox();
    const u=new URL(req.url);
    const cwd=safeCwd(u.searchParams.get("cwd")||"");
    const path=u.searchParams.get("path");

    if(u.searchParams.get("dirs")==="1") {
      const base=workspacePath(cwd);
      const r=await run(sbx,"find "+JSON.stringify(base)+" -mindepth 1 -maxdepth 1 -type d -not -path '*/node_modules' -not -path '*/.git' | sort");
      const prefix=cwd?cwd+"/":"";
      const dirs=(r.stdout||"").split("\n").filter(Boolean).map(x=>x.replace(/^\.\//,"").replace(prefix,""));
      return Response.json({cwd,dirs});
    }

    if(path) {
      const p=abs(cwd,path);
      const r=await run(sbx,"cat -- "+JSON.stringify(p));
      return Response.json({content:r.stdout||"",path});
    }

    const base=workspacePath(cwd);
    const r=await run(sbx,"find "+JSON.stringify(base)+" -maxdepth 3 -type f -not -path '*/node_modules/*' -not -path '*/.git/*' | sort");
    const prefix=cwd?cwd+"/":"./";
    const files=(r.stdout||"").split("\n").filter(Boolean).map(p=>({path:p.replace(/^\.\//,"").replace(ROOT+"//","").replace(ROOT+"/","").replace(prefix,""),type:"file"}));
    return Response.json({cwd,files});
  } catch(e) {
    return Response.json({error:e.message||"Workspace unavailable"},{status:500});
  }
}

export async function PUT(req) {
  try {
    const sbx=await getSandbox();
    const b=await req.json();
    const p=abs(b.cwd||"",b.path);
    const content=String(b.content??"");
    const b64=Buffer.from(content,"utf8").toString("base64");
    await run(sbx,"mkdir -p -- $(dirname -- "+JSON.stringify(p)+") && printf %s "+JSON.stringify(b64)+" | base64 -d > "+JSON.stringify(p));
    return Response.json({ok:true,path:b.path});
  } catch(e) {
    return Response.json({error:e.message||"Save failed"},{status:400});
  }
}

export async function POST(req) {
  try {
    const sbx=await getSandbox();
    const b=await req.json();
    const cwd=safeCwd(b.cwd||"");
    const action=String(b.action||"");

    if(action==="mkdir") {
      const p=abs(cwd,b.path||b.name);
      await run(sbx,"mkdir -p -- "+JSON.stringify(p));
      return Response.json({ok:true});
    }

    if(action==="delete") {
      await run(sbx,"rm -rf -- "+JSON.stringify(abs(cwd,b.path)));
      return Response.json({ok:true});
    }

    if(action==="rename" || action==="move" || action==="copy") {
      const from=abs(cwd,b.from), to=abs(cwd,b.to);
      const cmd=action==="copy" ? "cp -a -- " : "mv -- ";
      await run(sbx,cmd+JSON.stringify(from)+" "+JSON.stringify(to));
      return Response.json({ok:true});
    }

    throw new Error("Unknown filesystem action");
  } catch(e) {
    return Response.json({error:e.message||"Filesystem operation failed"},{status:400});
  }
}
