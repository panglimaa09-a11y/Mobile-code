import { Sandbox } from "@vercel/sandbox";

export const NAME = "mobile-code-cloud-main";
export const ROOT = "/vercel/sandbox/workspace";
export const PORT = 7681;

export async function ensureSandbox(sbx) {
  const script = [
    "set -e",
    "mkdir -p " + ROOT,
    "if ! command -v ttyd >/dev/null 2>&1; then sudo apt-get update -y >/tmp/mce-apt.log 2>&1 && sudo apt-get install -y ttyd >>/tmp/mce-apt.log 2>&1; fi",
    "test -f " + ROOT + "/README.md || printf '# Mobile Code Cloud\\n\\nWorkspace online.\\n' > " + ROOT + "/README.md",
    "test -f " + ROOT + "/index.html || printf '<!doctype html><html><head><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Mobile Code</title></head><body><h1>Mobile Code</h1><p>Edit index.html lalu tekan Run.</p></body></html>' > " + ROOT + "/index.html",
    "if ! curl -fsS http://127.0.0.1:" + PORT + "/ >/dev/null 2>&1; then nohup ttyd -W -i 0.0.0.0 -p " + PORT + " -w " + ROOT + " bash >/tmp/mce-ttyd.log 2>&1 & fi",
    "for i in $(seq 1 30); do curl -fsS http://127.0.0.1:" + PORT + "/ >/dev/null 2>&1 && exit 0; sleep 1; done",
    "cat /tmp/mce-apt.log 2>/dev/null || true",
    "cat /tmp/mce-ttyd.log 2>/dev/null || true",
    "exit 1"
  ].join("; ");
  const r = await sbx.runCommand({cmd:"bash",args:["-lc",script],cwd:"/vercel/sandbox"});
  if (r.exitCode !== 0) throw new Error((await r.stderr()) || (await r.stdout()) || "Sandbox terminal setup failed");
}

export async function getSandbox() {
  return Sandbox.getOrCreate({
    name: NAME,
    runtime: "node24",
    ports: [PORT],
    timeout: 45 * 60 * 1000,
    onCreate: ensureSandbox,
    onResume: ensureSandbox
  });
}

export function safePath(p) {
  p = String(p || "").trim().replaceAll("\\\\","/");
  if (!p || p.startsWith("/") || p.split("/").includes("..") || p.includes("\\0")) throw new Error("Invalid workspace path");
  return p.replace(/^\.\//,"");
}

export function safeCwd(p) {
  if (!p) return "";
  return safePath(p).replace(/\/$/,"");
}
