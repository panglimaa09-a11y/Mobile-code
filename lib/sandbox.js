import { Sandbox } from "@vercel/sandbox";

export const NAME = "mobile-code-cloud-main";
export const ROOT = "/vercel/sandbox/workspace";
export const PORT = 8080;

export async function ensureSandbox(sbx) {
  await sbx.runCommand({
    cmd: "bash",
    args: ["-lc", "set -e; mkdir -p " + ROOT + "; test -f " + ROOT + "/README.md || printf '# Mobile Code Cloud\\n' > " + ROOT + "/README.md; if ! curl -fsS http://127.0.0.1:" + PORT + "/ >/dev/null 2>&1; then if [ ! -x /tmp/ttyd ]; then curl -L --fail --silent --show-error https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.x86_64 -o /tmp/ttyd; chmod +x /tmp/ttyd; fi; /tmp/ttyd -W -i 0.0.0.0 -p " + PORT + " -w " + ROOT + " bash >/tmp/ttyd.log 2>&1 & fi; for i in $(seq 1 20); do curl -fsS http://127.0.0.1:" + PORT + "/ >/dev/null 2>&1 && exit 0; sleep .25; done; cat /tmp/ttyd.log 2>/dev/null || true; exit 1"],
    cwd: "/vercel/sandbox"
  });
}

export async function getSandbox() {
  return Sandbox.getOrCreate({
    name: NAME,
    runtime: "node24",
    ports: [PORT],
    timeout: 45 * 60 * 1000,
    onCreate: async (sbx) => { await ensureSandbox(sbx); },
    onResume: async (sbx) => { await ensureSandbox(sbx); }
  });
}

export function safePath(p) {
  p = String(p || "").trim();
  if (!p || p.includes("..") || p.startsWith("/") || p.includes("\\0")) throw new Error("Invalid workspace path");
  return p;
}
