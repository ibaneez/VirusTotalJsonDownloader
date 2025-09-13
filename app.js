// Tiny DOM helpers
const $ = (id) => document.getElementById(id);

// Elements
const apiKeyEl = $('apiKey');
const hashEl = $('hash');
const extEl = $('ext');
const fetchBtn = $('fetchBtn');
const openGuiBtn = $('openGuiBtn');
const clearBtn = $('clearBtn');
const statusEl = $('status');
const jsonOut = $('jsonOut');
const metaOut = $('metaOut');
const copyBtn = $('copyBtn');
const downloadBtn = $('downloadBtn');
const downloadGzipBtn = $('downloadGzipBtn');
const printSummaryBtn = $('printSummaryBtn');
const summaryEl = $('summary');

// Boot: hydrate ?hash= from URL if present
(function boot() {
  const url = new URL(location.href);
  const h = url.searchParams.get('hash');
  if (h) hashEl.value = h.trim();
})();

// Event wiring
openGuiBtn.addEventListener('click', () => {
  const h = (hashEl.value || '').trim();
  if (!h) return setStatus('Enter a hash first, detective.', 'warn');
  const url = `https://www.virustotal.com/gui/file/${encodeURIComponent(h)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
});

clearBtn.addEventListener('click', () => {
  jsonOut.textContent = '';
  metaOut.innerHTML = '';
  summaryEl.innerHTML = '';
  setStatus('Cleared. Like your conscience after emptying the Recycle Bin.', 'ok');
  setActionState(false);
});

fetchBtn.addEventListener('click', doFetch);
copyBtn.addEventListener('click', copyJson);
downloadBtn.addEventListener('click', () => downloadJson(false));
downloadGzipBtn.addEventListener('click', () => downloadJson(true));
printSummaryBtn.addEventListener('click', printSummary);

// Utils
function setBusy(b) {
  for (const el of [fetchBtn, openGuiBtn, clearBtn, apiKeyEl, hashEl, extEl]) {
    el.disabled = !!b;
  }
}
function setActionState(enabled) {
  copyBtn.disabled = !enabled;
  downloadBtn.disabled = !enabled;
  downloadGzipBtn.disabled = !enabled;
  printSummaryBtn.disabled = !enabled;
}
function setStatus(msg, tone='ok') {
  statusEl.textContent = msg;
  statusEl.className = `meta status ${tone}`;
}
function get(obj, pathArr) {
  return pathArr.reduce((o,k)=> (o && o[k] !== undefined ? o[k] : undefined), obj);
}
const fmt = (v)=> (v===undefined||v===null) ? 'n/a' : String(v);

// Core fetch
async function doFetch() {
  const key = (apiKeyEl.value || '').trim();
  const id = (hashEl.value || '').trim();
  if (!key) return setStatus('Enter your VirusTotal API key. I’m not your sugar daddy.', 'bad');
  if (!id) return setStatus('Enter a hash, necromancer.', 'bad');

  // Minimal hash sanity check
  const looksHex = /^[a-fA-F0-9]{32,64}$/.test(id);
  if (!looksHex) setStatus('Hash looks funky. VT might still accept it—let’s roll the bones.', 'warn');

  const url = `https://www.virustotal.com/api/v3/files/${encodeURIComponent(id)}`;
  setStatus('Summoning JSON from the abyss…', 'ok');
  setBusy(true);

  try {
    const resp = await fetch(url, { headers: { 'x-apikey': key } });

    const limit = resp.headers.get('x-apikey-ratelimit-limit');
    const remain = resp.headers.get('x-apikey-ratelimit-remaining');
    const reset = resp.headers.get('x-apikey-ratelimit-reset');

    const text = await resp.text();
    let body;
    try { body = text ? JSON.parse(text) : {}; } catch { body = { parse_error: true, raw: text }; }

    if (!resp.ok) {
      const msg = body?.error?.message || resp.statusText || 'Unknown error';
      throw new Error(`VT error ${resp.status}: ${msg}`);
    }

    // Pretty print
    const pretty = JSON.stringify(body, null, 2);
    jsonOut.textContent = pretty;
    setActionState(true);

    // Build meta + summary
    const harmless = get(body, ['data','attributes','last_analysis_stats','harmless']);
    const malicious = get(body, ['data','attributes','last_analysis_stats','malicious']);
    const suspicious = get(body, ['data','attributes','last_analysis_stats','suspicious']);
    const undetected = get(body, ['data','attributes','last_analysis_stats','undetected']);
    const typeDesc = get(body, ['data','attributes','type_description']);
    const size = get(body, ['data','attributes','size']);
    const mname = get(body, ['data','attributes','meaningful_name']);
    const firstSeen = get(body, ['data','attributes','first_submission_date']);
    const lastSeen  = get(body, ['data','attributes','last_submission_date']);
    const hashShort = id.length > 20 ? `${id.slice(0,12)}…${id.slice(-6)}` : id;

    const rate = (limit || remain) ? `Rate limit: limit ${limit ?? '?'}, remaining ${remain ?? '?'}, resets ${reset ?? '?'}` : 'Rate limit: (not provided)';
    metaOut.innerHTML = `
      <div>Hash: <code>${hashShort}</code></div>
      <div>Type: <code>${fmt(typeDesc)}</code> • Size: <code>${fmt(size)}</code> bytes • Name: <code>${fmt(mname)}</code></div>
      <div class="kpi">
        <span class="pill bad">malicious: <strong>${fmt(malicious)}</strong></span>
        <span class="pill warn">suspicious: <strong>${fmt(suspicious)}</strong></span>
        <span class="pill">harmless: <strong>${fmt(harmless)}</strong></span>
        <span class="pill">undetected: <strong>${fmt(undetected)}</strong></span>
      </div>
      <div class="mutey">${rate}</div>
    `;

    // Summary card
    const ts = (unix) => (unix ? new Date(unix * 1000).toLocaleString() : 'n/a');
    summaryEl.innerHTML = `
      <div><strong>Summary</strong></div>
      <div>First seen: <code>${ts(firstSeen)}</code> • Last seen: <code>${ts(lastSeen)}</code></div>
      <div>Notable engines flagging (top 8): ${listNotables(body).join(', ') || '<span class="mutey">n/a</span>'}</div>
    `;

    setStatus('Fetched successfully. The JSON is screaming below (in a structured way).', 'ok');
    window._lastBody = body;
    window._lastHash = id;

  } catch (err) {
    console.error(err);
    jsonOut.textContent = '';
    metaOut.innerHTML = '';
    summaryEl.innerHTML = '';
    setActionState(false);
    const hint = /Failed to fetch|CORS/i.test(err.message)
      ? 'CORS may be blocking browser calls. If VT tightens headers, use a tiny authenticated proxy you control.'
      : '';
    setStatus(`Fetch failed: ${err.message}. ${hint}`, 'bad');
  } finally {
    setBusy(false);
  }
}

function listNotables(body) {
  const results = get(body, ['data','attributes','last_analysis_results']) || {};
  // Sort engines by category severity (malicious > suspicious > others) and take up to 8 names
  const priority = { malicious: 2, suspicious: 1 };
  return Object.entries(results)
    .filter(([,v]) => v && (v.category === 'malicious' || v.category === 'suspicious'))
    .sort(([,a],[,b]) => (priority[b.category]||0) - (priority[a.category]||0))
    .slice(0, 8)
    .map(([engine, v]) => `${engine}${v.result ? `: ${v.result}` : ''}`);
}

function copyJson() {
  const text = jsonOut.textContent || '';
  if (!text) return setStatus('Nothing to copy. Much like my will to live.', 'warn');
  navigator.clipboard.writeText(text).then(
    () => setStatus('Full JSON copied to clipboard. Paste responsibly.', 'ok'),
    () => setStatus('Clipboard yeeted your request. Try again or right-click like a caveman.', 'warn')
  );
}

async function downloadJson(useGzip) {
  const text = jsonOut.textContent || '';
  if (!text) return setStatus('No JSON to download. Summon it first.', 'warn');
  const id = window._lastHash || 'unknown';
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const ext = (extEl.value || 'json').toLowerCase() === 'js' ? 'js' : 'json';
  const baseName = `vt-${id}-${ts}.${ext}`;

  let blob;
  if (useGzip && 'CompressionStream' in window) {
    try {
      const cs = new CompressionStream('gzip');
      const stream = new Blob([text], { type: 'application/json' }).stream().pipeThrough(cs);
      const gzBlob = await new Response(stream).blob();
      blob = new Blob([gzBlob], { type: 'application/gzip' });
      saveBlob(blob, `${baseName}.gz`);
      return setStatus(`Downloaded ${baseName}.gz (gzip). Freshly vacuum-sealed evil.`, 'ok');
    } catch (e) {
      // fall back silently
    }
  }
  const mime = ext === 'js' ? 'application/javascript;charset=utf-8' : 'application/json;charset=utf-8';
  blob = new Blob([text], { type: mime });
  saveBlob(blob, baseName);
  setStatus(`Downloaded ${baseName}. Evidence bag sealed.`, 'ok');
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function printSummary() {
  if (!window._lastBody) return setStatus('Nothing to print. Perform the ritual first.', 'warn');

  const id = window._lastHash || '';
  const meta = metaOut.innerHTML;
  const sum = summaryEl.innerHTML;

  const w = window.open('', '_blank', 'width=900,height=800');
  if (!w) return setStatus('Popup blocked. Your browser fears commitment.', 'warn');
  w.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>VT Necromancer — Summary for ${id}</title>
        <style>
          body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 24px; }
          h1 { margin: 0 0 6px; font-size: 20px; }
          .meta, .summary { font-size: 14px; margin-top: 8px; }
          code { background: rgba(128,128,128,.12); padding: 2px 6px; border-radius: 6px; }
          .pill { display:inline-block; padding: 4px 8px; border:1px solid #ddd; border-radius:999px; font-size:12px; margin-right:8px; }
          .kpi { display:flex; gap:10px; flex-wrap:wrap; margin: 8px 0 6px;}
        </style>
      </head>
      <body>
        <h1>VT Necromancer — Summary</h1>
        <div class="meta">${meta}</div>
        <hr />
        <div class="summary">${sum}</div>
        <hr />
        <p>Printed from VT Necromancer — <em>because sometimes you need a hardcopy for the inquest.</em></p>
        <script>window.onload = () => setTimeout(() => window.print(), 100);</script>
      </body>
    </html>
  `);
  w.document.close();
}