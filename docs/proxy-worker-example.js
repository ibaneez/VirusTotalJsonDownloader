// Example Cloudflare Worker to proxy VirusTotal API v3
// ---------------------------------------------------
// This is needed because VirusTotal blocks direct calls from GitHub Pages (CORS).
// Replace YOURNAME with your GitHub username and adjust repo name if needed.
// Requires a free Cloudflare account
// Steps to use:
// 1. Create a new Worker in Cloudflare Dashboard (Workers & Pages).
// 2. Paste this code into your Worker editor.
// 3. In Settings → Variables → Secret (Dropdown), add:
//    - ALLOWED_ORIGIN = https://YOURNAME.github.io   (replace YOURNAME with your GitHub username)
// 4. Deploy the Worker. Copy the Worker URL (e.g. https://xxx.workers.dev).
// 5. In app.js, update PROXY_BASE with your Worker URL.
//
// Note: This Worker only checks the Origin header against ALLOWED_ORIGIN.
//       That way, forks/clones cannot use your Worker.

export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || "<your github page link if you want to hardcode>";

    const origin = request.headers.get("Origin") || "";

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin === allowedOrigin ? allowedOrigin : "null",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "x-apikey, content-type",
          "Access-Control-Max-Age": "3600",
        },
      });
    }

    // Only allow requests from your GitHub Pages origin
    if (origin !== allowedOrigin) {
      return new Response(JSON.stringify({ error: "Origin not allowed" }), {
        status: 403,
        headers: {
          "content-type": "application/json;charset=utf-8",
          "Access-Control-Allow-Origin": "null",
        },
      });
    }

    // Expect path: /files/<hash>
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length !== 2 || parts[0] !== "files") {
      return new Response(JSON.stringify({ error: "Use /files/{hash}" }), {
        status: 400,
        headers: {
          "content-type": "application/json;charset=utf-8",
          "Access-Control-Allow-Origin": allowedOrigin,
        },
      });
    }

    const hash = parts[1];
    const apiKey = request.headers.get("x-apikey");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing x-apikey header" }), {
        status: 400,
        headers: {
          "content-type": "application/json;charset=utf-8",
          "Access-Control-Allow-Origin": allowedOrigin,
        },
      });
    }

    // Forward request to VirusTotal
    const vtResp = await fetch(
      `https://www.virustotal.com/api/v3/files/${encodeURIComponent(hash)}`,
      { headers: { "x-apikey": apiKey } }
    );

    const body = await vtResp.arrayBuffer();
    const outHeaders = new Headers();
    outHeaders.set("Access-Control-Allow-Origin", allowedOrigin);

    // Pass through useful headers
    ["content-type", "x-apikey-ratelimit-limit", "x-apikey-ratelimit-remaining", "x-apikey-ratelimit-reset"].forEach(h => {
      const v = vtResp.headers.get(h);
      if (v) outHeaders.set(h, v);
    });

    return new Response(body, { status: vtResp.status, headers: outHeaders });
  },
};