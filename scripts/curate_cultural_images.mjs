import fs from 'fs';
import path from 'path';
import https from 'https';

const culturalItems = [
  // 26 Foods
  { id: 'food-perlis-laksa-perlis', title: 'Laksa', lang: 'en', fallback: 'Laksa' },
  { id: 'food-perlis-ikan-bakar', title: 'Ikan bakar', lang: 'en', fallback: 'Ikan bakar' },
  { id: 'food-kedah-pekasam', title: 'Pekasam', lang: 'ms', fallback: 'Pekasam' },
  { id: 'food-kedah-laksa-kedah', title: 'Laksa Kedah', lang: 'ms', fallback: 'Laksa' },
  { id: 'food-penang-assam-laksa', title: 'Asam laksa', lang: 'en', fallback: 'Laksa' },
  { id: 'food-penang-char-kway-teow', title: 'Char kway teow', lang: 'en', fallback: 'Char kway teow' },
  { id: 'food-perak-rendang-tok', title: 'Rendang', lang: 'en', fallback: 'Rendang' },
  { id: 'food-perak-ipoh-hor-fun', title: 'Shahe fen', lang: 'en', fallback: 'Ipoh' },
  { id: 'food-selangor-sate-kajang', title: 'Satay', lang: 'en', fallback: 'Satay' },
  { id: 'food-selangor-nasi-ambeng', title: 'Nasi ambeng', lang: 'en', fallback: 'Nasi campur' },
  { id: 'food-n9-masak-lemak-cili-api', title: 'Gulai', lang: 'en', fallback: 'Curry' },
  { id: 'food-n9-daging-salai', title: 'Sei reek', lang: 'en', fallback: 'Smoked meat' },
  { id: 'food-melaka-kuih-keria', title: 'Keria', lang: 'ms', fallback: 'Doughnut' },
  { id: 'food-melaka-kari-debal', title: 'Curry Debal', lang: 'en', fallback: 'Curry' },
  { id: 'food-johor-laksa-johor', title: 'Laksa Johor', lang: 'ms', fallback: 'Laksa' },
  { id: 'food-johor-telur-pindang', title: 'Telur pindang', lang: 'en', fallback: 'Tea egg' },
  { id: 'food-pahang-gulai-tempoyak-ikan-patin', title: 'Tempoyak', lang: 'en', fallback: 'Tempoyak' },
  { id: 'food-pahang-puding-raja', title: 'Puding Diraja', lang: 'ms', fallback: 'Pudding' },
  { id: 'food-terengganu-nasi-dagang', title: 'Nasi dagang', lang: 'en', fallback: 'Nasi lemak' },
  { id: 'food-terengganu-keropok-lekor', title: 'Keropok lekor', lang: 'en', fallback: 'Keropok' },
  { id: 'food-kelantan-nasi-kerabu', title: 'Nasi kerabu', lang: 'en', fallback: 'Nasi ulam' },
  { id: 'food-kelantan-akok', title: 'Akok', lang: 'ms', fallback: 'Akok' },
  { id: 'food-sabah-hinava', title: 'Hinava', lang: 'en', fallback: 'Ceviche' },
  { id: 'food-sabah-kuih-cincin', title: 'Kuih cincin', lang: 'en', fallback: 'Biscuit' },
  { id: 'food-sarawak-manok-pansoh', title: 'Manok pansoh', lang: 'en', fallback: 'Bamboo chicken' },
  { id: 'food-sarawak-kek-lapis', title: 'Sarawak layer cake', lang: 'en', fallback: 'Spekkek' },

  // 14 Performances
  { id: 'perf-wayang-kulit-kelantan', title: 'Wayang kulit', lang: 'en', fallback: 'Wayang' },
  { id: 'perf-mak-yong', title: 'Mak yong', lang: 'en', fallback: 'Dance of Malaysia' },
  { id: 'perf-mek-mulung', title: 'Mek Mulung', lang: 'ms', fallback: 'Mek Mulung' },
  { id: 'perf-dondang-sayang', title: 'Dondang Sayang', lang: 'en', fallback: 'Malay music' },
  { id: 'perf-zapin', title: 'Zapin', lang: 'en', fallback: 'Malay dance' },
  { id: 'perf-joget-gamelan', title: 'Joget Gamelan', lang: 'ms', fallback: 'Joget' },
  { id: 'perf-ulek-mayang', title: 'Ulek mayang', lang: 'en', fallback: 'Malay dance' },
  { id: 'perf-dikir-barat', title: 'Dikir barat', lang: 'en', fallback: 'Dikir' },
  { id: 'perf-boria', title: 'Boria (theatre)', lang: 'en', fallback: 'Boria' },
  { id: 'perf-sumazau', title: 'Sumazau dance', lang: 'en', fallback: 'Kadazan-Dusun' },
  { id: 'perf-ngajat', title: 'Ngajat', lang: 'en', fallback: 'Iban people' },
  { id: 'perf-lion-dance', title: 'Lion dance', lang: 'en', fallback: 'Lion dance' },
  { id: 'perf-gamelan-melayu', title: 'Gamelan', lang: 'en', fallback: 'Gamelan' },
  { id: 'perf-bharatanatyam', title: 'Bharatanatyam', lang: 'en', fallback: 'Bharatanatyam' },

  // 4 Festivals
  { id: 'fest-kaamatan', title: 'Kaamatan', lang: 'en', fallback: 'Sabah' },
  { id: 'fest-gawai-dayak', title: 'Gawai Dayak', lang: 'en', fallback: 'Sarawak' },
  { id: 'fest-johor-chingay', title: 'Chingay parade', lang: 'en', fallback: 'Chingay' },
  { id: 'fest-thaipusam', title: 'Thaipusam', lang: 'en', fallback: 'Batu Caves' }
];

const targetDir = path.resolve('public/images/cultural');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'MalaysiaHeritageExplorer/1.0 (academic student challenge; contact: heritage@fusion2026.org)'
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
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
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function getWikiThumbnail(title, lang = 'en') {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=900&titles=${encodeURIComponent(title)}`;
  const data = await fetchJson(url);
  if (!data?.query?.pages) return null;
  const pages = Object.values(data.query.pages);
  for (const page of pages) {
    if (page?.thumbnail?.source) {
      return {
        url: page.thumbnail.source,
        title: page.title
      };
    }
  }
  return null;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const attributions = {};
  for (const item of culturalItems) {
    const dest = path.join(targetDir, `${item.id}.jpg`);
    process.stdout.write(`Fetching ${item.id} (${item.title})... `);
    try {
      let hit = await getWikiThumbnail(item.title, item.lang);
      if (!hit && item.lang !== 'en') {
        hit = await getWikiThumbnail(item.title, 'en');
      }
      if (!hit && item.fallback) {
        hit = await getWikiThumbnail(item.fallback, 'en');
      }

      if (hit?.url) {
        await downloadFile(hit.url, dest);
        const stats = fs.statSync(dest);
        if (stats.size > 2000) {
          attributions[item.id] = {
            verified: true,
            filePath: `/images/cultural/${item.id}.jpg`,
            sourceTitle: hit.title,
            sourceUrl: hit.url,
            credit: `Wikipedia / Wikimedia Commons (${hit.title})`
          };
          console.log(`✓ (${Math.round(stats.size / 1024)} KB)`);
        } else {
          console.log(`Downloaded file was too small`);
        }
      } else {
        console.log(`✗ No thumbnail found on Wikipedia`);
      }
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
    await sleep(250); // respect rate limits
  }

  fs.writeFileSync('src/data/culturalImageAttributions.json', JSON.stringify(attributions, null, 2));
  console.log(`\nCompleted: ${Object.keys(attributions).length} of ${culturalItems.length} images downloaded successfully.`);
}

main();
