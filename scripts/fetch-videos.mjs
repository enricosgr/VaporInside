// Scarica gli ultimi video del canale YouTube (feed RSS) e li salva in data/videos.json.
// Eseguito dalla GitHub Action prima di ogni pubblicazione.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const HANDLE = 'VaporInside';
const OUT = 'data/videos.json';
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; VaporInsideSite/1.0)', 'Accept-Language': 'it-IT,it;q=0.9' };

async function channelId() {
  return process.env.YT_CHANNEL_ID || 'UCox3leNQsPqJbHWtqmWoWAw';
  const html = await (await fetch(`https://www.youtube.com/@${HANDLE}`, { headers: UA })).text();
  const m = html.match(/"externalId":"(UC[\w-]{22})"/) || html.match(/channel_id=(UC[\w-]{22})/) || html.match(/"channelId":"(UC[\w-]{22})"/);
  if (!m) throw new Error('Channel ID non trovato');
  return m[1];
}

const decode = (s = '') => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const tag = (xml, name) => (xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)) || [])[1];

async function fromRss(id) {
  const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`, { headers: UA });
  const xml = await r.text();
  const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    id: tag(e, 'yt:videoId'),
    title: decode(tag(e, 'title')),
    published: tag(e, 'published'),
    description: decode(tag(e, 'media:description') || '').slice(0, 600),
  })).filter((v) => v.id);
  if (!videos.length) console.warn(`RSS vuoto (HTTP ${r.status}): ${xml.slice(0, 150).replace(/\s+/g, ' ')}`);
  return videos;
}

// Alternativa affidabile: YouTube Data API v3 (stessa chiave Google, API "YouTube Data API v3" abilitata)
async function fromApi(id) {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) return [];
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=15&playlistId=UU${id.slice(2)}&key=${key}`;
  const j = await (await fetch(url, { headers: { Referer: process.env.SITE_URL || '' } })).json();
  if (j.error) { console.warn('YouTube Data API:', j.error.message); return []; }
  return (j.items || []).map(({ snippet: s }) => ({
    id: s.resourceId?.videoId,
    title: s.title,
    published: s.publishedAt,
    description: (s.description || '').slice(0, 600),
  })).filter((v) => v.id && v.title !== 'Private video' && v.title !== 'Deleted video');
}

try {
  const id = await channelId();
  let videos = await fromRss(id);
  if (!videos.length) videos = await fromApi(id);
  if (!videos.length) throw new Error('Nessun video ottenuto');
  writeFileSync(OUT, JSON.stringify({ channelId: id, updated: new Date().toISOString(), videos }, null, 2));
  console.log(`Salvati ${videos.length} video (canale ${id})`);
} catch (err) {
  // Non bloccare la pubblicazione: si mantiene il file esistente.
  console.warn('Aggiornamento video fallito:', err.message);
  if (!existsSync(OUT)) writeFileSync(OUT, JSON.stringify({ videos: [] }));
  else readFileSync(OUT);
}
