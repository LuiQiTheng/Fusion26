import https from 'https';
import fs from 'fs';
import path from 'path';

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

async function downloadWikiFile(fileTitle, targetFileName) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`;
  const data = await fetchJson(url);
  const pages = Object.values(data.query.pages);
  if (pages[0]?.imageinfo?.[0]) {
    const imgUrl = pages[0].imageinfo[0].thumburl || pages[0].imageinfo[0].url;
    console.log(`Downloading ${fileTitle} from ${imgUrl}`);
    const dest = path.resolve(`public/images/cultural/${targetFileName}`);
    await downloadFile(imgUrl, dest);
    console.log(`Saved ${targetFileName}!`);
    return true;
  }
  console.log(`Could not find imageinfo for ${fileTitle}`);
  return false;
}

async function main() {
  await downloadWikiFile('Chingay_Johor_2018.jpg', 'fest-johor-chingay.jpg');
}

main();
