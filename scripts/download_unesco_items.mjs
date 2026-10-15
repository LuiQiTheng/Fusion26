import https from 'https';
import fs from 'fs';
import path from 'path';

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function main() {
  const items = [
    { id: 'perf-mek-mulung', url: 'https://img.youtube.com/vi/feuU9uD94HQ/hqdefault.jpg' },
    { id: 'perf-dondang-sayang', url: 'https://img.youtube.com/vi/NalYYxQQMkU/hqdefault.jpg' }
  ];

  for (const item of items) {
    const dest = path.resolve(`public/images/cultural/${item.id}.jpg`);
    console.log(`Downloading ${item.id} from ${item.url}...`);
    await downloadFile(item.url, dest);
    const stats = fs.statSync(dest);
    console.log(`Saved ${item.id}.jpg (${Math.round(stats.size / 1024)} KB)`);
  }
}

main();
