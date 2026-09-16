import { getSandbox, PORT } from "@/lib/sandbox";
export const dynamic="force-dynamic";
export async function POST(){try{const sbx=await getSandbox();return Response.json({ok:true,terminalUrl:sbx.domain(PORT),name:sbx.name})}catch(e){return Response.json({error:e?.message||"Sandbox failed"},{status:500})}}