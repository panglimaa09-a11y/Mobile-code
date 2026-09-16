import { Sandbox } from "@vercel/sandbox";

export const NAME = "mobile-code-cloud-main";
export const ROOT = "/vercel/sandbox/workspace";
export const PORT = 7681;

export function workspacePath(cwd = "") {
  const c = safeCwd(cwd);
  return c ? ROOT + "/" + c : ROOT;
}

async function run(sbx, args, options = {}) {
  return sbx.runCommand({
    cmd: "bash",
    args: ["-lc", args],
    cwd: options.cwd || "/vercel/sandbox",
    ...(options.detached ? { detached: true } : {}),
  });
}

async function portIsUp() {
  try {
    const r = await fetch("http://127.0.0.1:" + PORT + "/", {
      signal: AbortSignal.timeout(1500),
    });
    return r.ok || r.status < 500;
  } catch {
    return false;
  }
}

export async function ensureSandbox(sbx) {
  const setup = [
    "set -eu",
    "mkdir -p " + JSON.stringify(ROOT),
    "if ! command -v ttyd >/dev/null 2>&1; then sudo apt-get update -y >/tmp/mce-apt.log 2>&1 && sudo apt-get install -y ttyd curl >>/tmp/mce-apt.log 2>&1; fi",
    "command -v curl >/dev/null 2>&1 || sudo apt-get install -y curl >/tmp/mce-curl.log 2>&1",
    "test -f " + JSON.stringify(ROOT + "/README.md") + " || printf '%s\\n' '# Mobile Code Cloud' ' ' 'Workspace online.' > " + JSON.stringify(ROOT + "/README.md"),
    "test -f " + JSON.stringify(ROOT + "/index.html") + " || printf '%s\\n' '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mobile Code</title></head><body><h1>Mobile Code</h1><p>Edit index.html lalu tekan Run.</p></body></html>' > " + JSON.stringify(ROOT + "/index.html"),
  ].join("; ");

  const setupResult = await run(sbx, setup);
  if (setupResult.exitCode !== 0) {
    throw new Error(
      (await setupResult.stderr()) ||
      (await setupResult.stdout()) ||
      "Sandbox setup failed"
    );
  }

  if (!(await portIsUp())) {
    const terminal = await sbx.runCommand({
      cmd: "ttyd",
      args: ["-W", "-i", "0.0.0.0", "-p", String(PORT), "-w", ROOT, "bash"],
      cwd: ROOT,
      detached: true,
    });

    if (terminal.exitCode && terminal.exitCode !== 0) {
      throw new Error(
        (await terminal.stderr()) ||
        (await terminal.stdout()) ||
        "Failed to start ttyd"
      );
    }
  }

  for (let i = 0; i < 25; i++) {
    if (await portIsUp()) return;
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  const diag = await run(
    sbx,
    "printf '%s\\n' '--- ttyd ---'; command -v ttyd || true; printf '%s\\n' '--- process ---'; ps -ef | grep '[t]tyd' || true; printf '%s\\n' '--- apt ---'; cat /tmp/mce-apt.log 2>/dev/null || true",
    { cwd: ROOT }
  );

  throw new Error(
    (await diag.stdout()) ||
    "Terminal server did not start on port " + PORT
  );
}

export async function getSandbox() {
  return Sandbox.getOrCreate({
    name: NAME,
    runtime: "node24",
    ports: [PORT],
    timeout: 45 * 60 * 1000,
    onCreate: ensureSandbox,
    onResume: ensureSandbox,
  });
}

export function safePath(p) {
  p = String(p || "").trim().replaceAll("\\\\", "/");
  if (!p || p.startsWith("/") || p.split("/").includes("..") || p.includes("\\0")) {
    throw new Error("Invalid workspace path");
  }
  return p.replace(/^\.\//, "");
}

export function safeCwd(p) {
  if (!p) return "";
  return safePath(p).replace(/\/$/, "");
}
