import { getSandbox, PORT } from "../../../lib/sandbox";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

export async function POST() {
  try {
    const sbx = await getSandbox();
    return Response.json({ok:true, terminalUrl:sbx.domain(PORT), name:sbx.name});
  } catch (e) {
    return Response.json({ok:false,error:e?.message || "Sandbox failed"},{status:500});
  }
}
