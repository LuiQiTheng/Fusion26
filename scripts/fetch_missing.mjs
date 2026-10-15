import https from 'https';
import fs from 'fs';
import path from 'path';

const missing = [
  { id: 'food-terengganu-keropok-lekor', search: 'Keropok lekor' },
  { id: 'perf-mek-mulung', search: 'Mek Mulung' },
  { id: 'perf-dondang-sayang', search: 'Dondang Sayang' },
  { id: 'fest-johor-chingay', search: 'Johor Bahru Chingay' }
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'MalaysiaHeritageExplorer/1.0 (academic student challenge; contact: heritage@fusion2026.org)'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, {
      headers: {
        'User-Agent': 'MalaysiaHeritageExplorer/1.0 (academic student challenge; contact: heritage@fusion2026.org)'
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function searchCommons(q) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=5&format=json`;
  const res = await fetchJson(url);
  if (!res?.query?.search?.length) return null;
  for (const s of res.query.search) {
    if (s.title.startsWith('File:')) {
      // Get image url
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(s.title)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`;
      const infoRes = await fetchJson(infoUrl);
      const pages = Object.values(infoRes.query.pages);
      if (pages[0]?.imageinfo?.[0]) {
        return {
          title: s.title,
          url: pages[0].imageinfo[0].thumburl || pages[0].imageinfo[0].url
        };
      }
    }
  }
  return null;
}

async function run() {
  for (const m of missing) {
    console.log(`Searching for ${m.id} (${m.search})...`);
    const hit = await searchCommons(m.search);
    if (hit) {
      console.log(`Found: ${hit.title} -> ${hit.url}`);
      const dest = path.resolve(`public/images/cultural/${m.id}.jpg`);
      await downloadFile(hit.url, dest);
      console.log(`Downloaded ${m.id}.jpg successfully!`);
    } else {
      console.log(`Still no file found for ${m.id}`);
    }
  }
}

run();
