// Leandro AI: lokale webserver en veilige brug naar Ollama.
// Vereist Node.js 18 of nieuwer en een lokaal draaiende Ollama-installatie.
const http = require('http');
const fs = require('fs');
const path = require('path');

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.OLLAMA_MODEL || 'qwen3:8b';
const OLLAMA = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const PUBLIC_DIR = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };

function sendJson(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}
async function readBody(req) {
  let data = '';
  for await (const chunk of req) {
    data += chunk;
    if (data.length > 1_000_000) throw new Error('Je bericht is te groot.');
  }
  try { return JSON.parse(data || '{}'); }
  catch { throw new Error('Ongeldige JSON-invoer.'); }
}
async function getHealth() {
  try {
    const response = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) return { ok: false, ollama: false, model: MODEL };
    const data = await response.json();
    const names = (data.models || []).map(item => item.name);
    return { ok: names.some(name => name === MODEL || name.startsWith(MODEL + ':')), ollama: true, model: MODEL, installed: names };
  } catch { return { ok: false, ollama: false, model: MODEL }; }
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  if (req.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(res, 200, await getHealth());
  }
  if (req.method === 'POST' && url.pathname === '/api/chat') {
    try {
      const body = await readBody(req);
      if (!Array.isArray(body.messages) || body.messages.length === 0) return sendJson(res, 400, { error: 'Geen chatberichten ontvangen.' });
      const messages = body.messages.slice(-30).map(m => {
        if (!m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string') throw new Error('Ongeldig bericht.');
        return { role: m.role, content: m.content.slice(0, 15000) };
      });
      const response = await fetch(`${OLLAMA}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          stream: false,
          messages: [{ role: 'system', content: 'Je bent Leandro AI, een behulpzame AI-assistent. Antwoord standaard in helder Nederlands. Wees eerlijk over onzekerheid en verzin geen feiten.' }, ...messages]
        }),
        signal: AbortSignal.timeout(180000)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return sendJson(res, 502, { error: result.error || `Ollama gaf HTTP ${response.status}.` });
      const content = result.message && result.message.content;
      if (typeof content !== 'string') return sendJson(res, 502, { error: 'Ollama stuurde geen antwoordtekst terug.' });
      return sendJson(res, 200, { content, model: MODEL });
    } catch (err) {
      const message = err.name === 'TimeoutError' ? 'Het model reageert te traag. Probeer een kortere vraag.' : (err.message === 'fetch failed' ? 'Kan Ollama niet bereiken. Start de Ollama-app of voer `ollama serve` uit in een tweede terminal.' : err.message);
      return sendJson(res, 502, { error: message || 'De verbinding met Ollama is mislukt.' });
    }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: 'Methode niet toegestaan.' });
  let pathname;
  try { pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname); }
  catch { return sendJson(res, 400, { error: 'Ongeldig pad.' }); }
  const file = path.resolve(PUBLIC_DIR, '.' + pathname);
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return sendJson(res, 403, { error: 'Geen toegang.' });
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Bestand niet gevonden'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
});
server.listen(PORT, HOST, () => {
  console.log(`Leandro AI draait op http://localhost:${PORT}`);
  console.log(`Model: ${MODEL}`);
  console.log('Alleen bereikbaar op deze computer. Stoppen met Ctrl+C.');
});
