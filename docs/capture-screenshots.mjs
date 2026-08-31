import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const appUrl = "http://127.0.0.1:5173/";
const outDir = new URL("./screenshots/", import.meta.url);
const userDataDir = new URL("./.chrome-profile/", import.meta.url);

const pages = [
  ["home", "#home", "community"],
  ["campaign", "#campaign", "community"],
  ["support", "#support", "community"],
  ["awareness", "#awareness", "government"],
  ["vault-official", "#vault", "government"],
  ["admin-panel", "#admin", "admin"],
];

const users = {
  community: {
    id: "doc-community",
    privateName: "Community User",
    role: "community",
    createdAt: "documentation",
  },
  government: {
    id: "doc-government",
    privateName: "MINPROFF Official",
    officialEmail: "official@agency.gov.cm",
    role: "government",
    createdAt: "documentation",
  },
  admin: {
    id: "super-admin",
    privateName: "Super Admin",
    officialEmail: "admin@harbor.cm",
    role: "admin",
    createdAt: "system",
  },
};

let nextId = 1;

function cdp(ws) {
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
  });

  return (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} failed: ${response.status}`);
  return response.json();
}

async function waitForChrome(port) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      return await getJson(`http://127.0.0.1:${port}/json/list`);
    } catch {
      await delay(250);
    }
  }
  throw new Error("Chrome did not start in time.");
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const port = 9223;
  const chrome = spawn(chromePath, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${decodeURIComponent(userDataDir.pathname).replace(/^\/([A-Za-z]:)/, "$1")}`,
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--window-size=1440,1100",
    appUrl,
  ], { stdio: "ignore" });

  try {
    await waitForChrome(port);

    for (const [name, hash, role] of pages) {
      const targets = await getJson(`http://127.0.0.1:${port}/json/list`);
      const pageTarget = targets.find((target) => target.type === "page");
      const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
      await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
      const send = cdp(ws);

      await send("Page.enable");
      await send("Runtime.enable");
      await send("Emulation.setDeviceMetricsOverride", {
        width: 1440,
        height: 1100,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await send("Page.navigate", { url: appUrl });
      await delay(700);
      await send("Runtime.evaluate", {
        expression: `localStorage.setItem("harbor.currentUser", ${JSON.stringify(JSON.stringify(users[role]))}); localStorage.setItem("harbor.language", "ENG"); location.hash = ${JSON.stringify(hash)};`,
      });
      await delay(1400);
      const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      await writeFile(new URL(`${name}.png`, outDir), Buffer.from(screenshot.data, "base64"));
      ws.close();
    }
  } finally {
    chrome.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
