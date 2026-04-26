import { Hono } from "hono";
import type { AppEnv } from "../server";

function buildPage(port: number, mode: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Grapity Registry</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%236366f1'/%3E%3Cstop offset='100%25' stop-color='%2306b6d4'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='32' height='32' rx='6' fill='%230a0a0f'/%3E%3Cpath d='M7 24 L16 6 L25 24 L21 24 L16 14 L11 24 Z' fill='url(%23g)'/%3E%3Ccircle cx='16' cy='24' r='2.5' fill='url(%23g)'/%3E%3C/svg%3E">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root {
  --bg: #07070e;
  --surface: #0c0c15;
  --card: #0e0e18;
  --border: #181828;
  --indigo: #6366f1;
  --cyan: #06b6d4;
  --green: #22d3a5;
  --red: #f43f5e;
  --text: #ddddf5;
  --muted: #44445e;
  --mono: 'IBM Plex Mono', monospace;
  --sans: 'IBM Plex Sans', sans-serif;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--sans);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}

/* ── RGB CHROMATIC GLITCH ── */
@keyframes rgb-split {
  0%,100%   { transform: translate(0,0); opacity:1; }
  8%  { transform: translate(-3px, 0); opacity:0.85; }
  9%  { transform: translate(0,0); opacity:1; }
  22% { transform: translate(2px,-1px); opacity:0.9; }
  23% { transform: translate(0,0); }
  60% { transform: translate(-2px,1px); }
  61% { transform: translate(3px,0); opacity:0.8; }
  62% { transform: translate(0,0); opacity:1; }
  85% { transform: translate(1px,-1px); }
  86% { transform: translate(0,0); }
}
.layer-r { fill: #f43f5e; mix-blend-mode: screen; animation: rgb-split 2.5s ease-in-out infinite; }
.layer-g { fill: url(#lgr); mix-blend-mode: normal; }
.layer-b { fill: #06b6d4; mix-blend-mode: screen; animation: rgb-split 2.5s ease-in-out infinite reverse; animation-delay: 0.05s; }

/* ── LAYOUT ── */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  text-align: center;
  max-width: 640px;
  width: 100%;
}

.wordmark {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.wordmark h1 {
  font-family: var(--mono);
  font-size: 28px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  background: linear-gradient(135deg, #6366f1, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.wordmark .subtitle {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

/* ── STATUS BADGE ── */
.status-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 16px;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
}
@keyframes pulse-dot {
  0%,100% { opacity:1; }
  50% { opacity:0.3; }
}
.status-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--green);
  animation: pulse-dot 2s ease-in-out infinite;
  flex-shrink: 0;
}
.status-row span { color: var(--text); }
.status-row .sep { color: var(--border); }

/* ── ENDPOINTS GRID ── */
.section-label {
  font-family: var(--mono);
  font-size: 9.5px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
}
.section-label::after { content:''; flex:1; height:1px; background:var(--border); }

.endpoints {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.endpoint {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 7px;
  font-family: var(--mono);
  font-size: 11px;
  text-decoration: none;
  color: var(--text);
  transition: border-color 0.15s, background 0.15s;
}
.endpoint:hover { border-color: #6366f133; background: #0f0f1e; }

.method {
  font-size: 9.5px;
  font-weight: 500;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  border-radius: 4px;
  min-width: 36px;
  text-align: center;
}
.GET  { background: #06b6d418; color: #06b6d4; }
.POST { background: #6366f118; color: #8b8ff5; }

.path { flex: 1; color: var(--text); }
.desc { color: var(--muted); font-size: 10px; }

/* ── LINKS ── */
.links {
  display: flex;
  align-items: center;
  gap: 20px;
}
.link {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.15s;
}
.link:hover { color: var(--text); }
.link-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--border); }
</style>
</head>
<body>
<div class="hero">

  <!-- LOGO -->
  <svg viewBox="0 0 32 32" width="80" height="80" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lgr" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6366f1"/>
        <stop offset="100%" stop-color="#06b6d4"/>
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="6" fill="#07070e"/>
    <path class="layer-r" d="M7 24 L16 6 L25 24 L21 24 L16 14 L11 24 Z"/>
    <circle class="layer-r" cx="16" cy="24" r="2.5"/>
    <path class="layer-g" d="M7 24 L16 6 L25 24 L21 24 L16 14 L11 24 Z"/>
    <circle class="layer-g" cx="16" cy="24" r="2.5"/>
    <path class="layer-b" d="M7 24 L16 6 L25 24 L21 24 L16 14 L11 24 Z"/>
    <circle class="layer-b" cx="16" cy="24" r="2.5"/>
  </svg>

  <!-- WORDMARK -->
  <div class="wordmark">
    <h1>Grapity</h1>
    <span class="subtitle">L1 Registry &nbsp;·&nbsp; API contract server</span>
  </div>

  <!-- STATUS -->
  <div class="status-row">
    <span class="status-dot"></span>
    running on <span>localhost:${port}</span>
    <span class="sep">|</span>
    mode: <span>${mode}</span>
    <span class="sep">|</span>
    <a href="/v1/health" style="color:var(--cyan);text-decoration:none;">health ↗</a>
  </div>

  <!-- ENDPOINTS -->
  <span class="section-label">api endpoints</span>

  <div class="endpoints">
    <div class="endpoint">
      <span class="method POST">POST</span>
      <span class="path">/v1/specs</span>
      <span class="desc">push a spec version</span>
    </div>
    <div class="endpoint">
      <span class="method GET">GET</span>
      <span class="path">/v1/specs</span>
      <span class="desc">list all specs</span>
    </div>
    <div class="endpoint">
      <span class="method GET">GET</span>
      <span class="path">/v1/specs/:name</span>
      <span class="desc">get spec metadata</span>
    </div>
    <div class="endpoint">
      <span class="method POST">POST</span>
      <span class="path">/v1/specs/:name/validate</span>
      <span class="desc">validate against latest</span>
    </div>
    <div class="endpoint">
      <span class="method GET">GET</span>
      <span class="path">/v1/specs/:name/versions</span>
      <span class="desc">list versions</span>
    </div>
    <div class="endpoint">
      <span class="method GET">GET</span>
      <span class="path">/v1/specs/:name/spec.yaml</span>
      <span class="desc">fetch raw spec</span>
    </div>
    <div class="endpoint">
      <span class="method GET">GET</span>
      <span class="path">/v1/specs/:name/compat/:semver</span>
      <span class="desc">compatibility report</span>
    </div>
    <div class="endpoint">
      <span class="method GET">GET</span>
      <span class="path">/v1/health</span>
      <span class="desc">server health</span>
    </div>
  </div>

  <!-- LINKS -->
  <div class="links">
    <a class="link" href="https://github.com/grapitydev" target="_blank" rel="noopener">
      <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
      grapitydev
    </a>
    <span class="link-dot"></span>
    <a class="link" href="https://grapity.dev" target="_blank" rel="noopener">
      <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M8 0a8 8 0 100 16A8 8 0 008 0zm5.68 5.33h-2.3c-.25-1.1-.63-2.06-1.1-2.8a6.4 6.4 0 013.4 2.8zM8 1.37c.64.8 1.14 1.85 1.44 3.03h-2.88C6.86 3.22 7.36 2.17 8 1.37zm-3.28.16c-.47.74-.85 1.7-1.1 2.8h-2.3a6.4 6.4 0 013.4-2.8zM1.34 6.67h2.65c-.07.43-.1.87-.1 1.33 0 .46.03.9.1 1.33H1.34A6.43 6.43 0 011 8c0-.46.12-.91.34-1.33zm.98 4h2.3c.25 1.1.63 2.06 1.1 2.8a6.4 6.4 0 01-3.4-2.8zM8 14.63c-.64-.8-1.14-1.85-1.44-3.03h2.88c-.3 1.18-.8 2.23-1.44 3.03zm3.28-.16c.47-.74.85-1.7 1.1-2.8h2.3a6.4 6.4 0 01-3.4 2.8zm1.39-4.14c.07-.43.1-.87.1-1.33 0-.46-.03-.9-.1-1.33h2.65c.22.42.34.87.34 1.33a6.43 6.43 0 01-.34 1.33h-2.65zm-.66-4h-2.32A9.84 9.84 0 008 1.6c0-.09.01-.17.01-.26.87.38 1.65.95 2.28 1.67.34.42.64.9.88 1.46zm-3.65 0H6.04c.24-.56.54-1.04.88-1.46A6.38 6.38 0 019.15 9 9.84 9.84 0 009.08 6.33zM6.67 9H9.33A8.4 8.4 0 019.44 10.4H6.56C6.58 9.94 6.62 9.47 6.67 9z"/></svg>
      grapity.dev
    </a>
    <span class="link-dot"></span>
    <a class="link" href="https://github.com/grapitydev/registry" target="_blank" rel="noopener">
      docs ↗
    </a>
  </div>

</div>
</body>
</html>`;
}

export const welcomeRoute = new Hono<AppEnv>().get("/", (c) => {
  const config = c.get("config");
  const mode = config.database === "sqlite" ? "local" : "remote";
  return c.html(buildPage(config.port, mode));
});
