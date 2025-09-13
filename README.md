# VirusTotal JSON Downloader (aka VT Necromancer) 🧿
Static GUI to fetch VirusTotal file reports (JSON) by hash. Copy, download (.json/.js), or print summaries. GitHub Pages ready. BYO API key.

[![Deploy on GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-ready-1f6feb)](#-deploy)
[![License](https://img.shields.io/badge/license-MIT-informational)](#-license)
[![Stars](https://img.shields.io/github/stars/Deb-Deep-Dutta/VirusTotalJsonDownloader?style=social)](https://github.com/Deb-Deep-Dutta/VirusTotalJsonDownloader/stargazers)
[![Live Demo](https://img.shields.io/badge/Github%20Pages-Live-1f6feb)](https://deb-deep-dutta.github.io/VirusTotalJsonDownloader/)

> ⚡ If this repo saved you from clicking a suspicious `DefinitelyNotMalware.exe`,  
> **please ⭐ star the repo** — it keeps the demons at bay.

---

## ✨ Features
- Fetch file analysis reports from **VirusTotal API v3**  
- **GUI input** for API key + hash (SHA-256 / SHA-1 / MD5)  
- **Copy full JSON** to clipboard  
- **Download** reports as `.json` or `.js`  
- **Gzip download** (when supported) with fallback  
- **Printable summary** (meta + KPIs + flagged engines)  
- **Open in VirusTotal GUI** directly from the app  
- **Static, secure**: no backend, no secrets stored  
- Works out-of-the-box with **GitHub Pages**

---

## 🖼️ Screenshots

**Main input view (API key + hash)**  
![VirusTotal JSON Downloader input GUI screenshot](./screenshots/hero.png)

**Results with KPIs + JSON viewer**  
![VirusTotal JSON Downloader results JSON output screenshot](./screenshots/results.png)

---

## 🚀 Quick Start

1. Clone the repo:
```bash
   git clone https://github.com/Deb-Deep-Dutta/VirusTotalJsonDownloader.git
   cd VirusTotalJsonDownloader
```
2. Open index.html in your browser (or serve locally).


3. Paste your VirusTotal API key and a file hash.


4. Click Fetch JSON:

Copy JSON to clipboard

Download as .json or .js

Print a tidy summary





---

🌐 Deploy on GitHub Pages

1. Push this repo to GitHub:
Suggested repo name: VirusTotalJsonDownloader


2. Go to Settings → Pages:

Source: Deploy from a branch

Branch: main (and /root)



3. Wait for Pages to publish.


4. Open your live URL:
👉 https://deb-deep-dutta.github.io/VirusTotalJsonDownloader/



> 🔐 Security note: API key is entered at runtime, used only in your browser.
No localStorage, no cookies, no backend.
Cloners must use their own key — your secrets remain yours.




---

🔐 Cloudflare Worker Proxy (required for GitHub Pages)

VirusTotal’s API blocks direct browser calls from GitHub Pages (CORS).
This repo works live because it uses my own Cloudflare Worker, locked to my domain:

👉 https://deb-deep-dutta.github.io/VirusTotalJsonDownloader/

If you clone or fork this repo, you must set up your own Worker and update app.js.

How to set up your Worker

1. Log in to Cloudflare Dashboard → Workers & Pages → Create Worker → Deploy → then Edit code.


2. Replace the default code with the example in docs/proxy-worker-example.js.


3. Under Settings → Variables, add:

ALLOWED_ORIGIN = https://YOURNAME.github.io

ALLOWED_REFERER_PREFIX = https://YOURNAME.github.io/VirusTotalJsonDownloader/
(replace YOURNAME with your GitHub username).



4. Save and Deploy. Copy your Worker URL (e.g. https://something.workers.dev).


5. In app.js, set:

const PROXY_BASE = "https://something.workers.dev";
const url = `${PROXY_BASE}/files/${encodeURIComponent(id)}`;



Why this is needed

My Worker is locked to https://deb-deep-dutta.github.io/VirusTotalJsonDownloader/.

Forks/clones will get 403 Origin not allowed.

Everyone must run their own Worker (and their own VirusTotal API key).



---

🧰 VirusTotal API Reference

Endpoint:

GET https://www.virustotal.com/api/v3/files/{id}

where {id} can be SHA-256, SHA-1, or MD5.

Header:

x-apikey: <YOUR_API_KEY>


Official VirusTotal API Docs


---

⚠️ Notes

CORS: This project relies on a Cloudflare Worker proxy for GitHub Pages.

Rate limits: Free API keys are limited. The UI shows quota info if headers are present.



---

🧭 Roadmap

[ ] Parse sandbox/behavior reports

[ ] Add search by URL or filename

[ ] Provide proxy recipe (with auth) for stricter CORS

[ ] Darker “Midnight Morgue” theme because why not



---

🤝 Contributing

PRs welcome! Keep it static (no server secrets), tidy, and preferably spooky.


---

🪙 License

MIT. Do crimes only in fiction.


---

⭐ Support

If this helped you fetch JSON without crying into curl,
star the repo ⭐ — validation is the only thing keeping this project alive.


---

🙅 Disclaimer

Not affiliated with VirusTotal. This is a third-party GUI client for their public API.
Use responsibly; don’t abuse the API or I’ll haunt your printer.

---