import fs from 'fs';

const places = JSON.parse(fs.readFileSync('src/data/places.json', 'utf8'));

for (const p of places) {
  // Foods & Kuih
  if (p.type === 'food') {
    p.categories = ['Food'];
  }
  // Performances
  else if (p.type === 'performance') {
    p.categories = ['Cultural Performance'];
  }
  // Festivals
  else if (p.type === 'festival') {
    if (p.id === 'fest-thaipusam' || p.id === 'fest-johor-chingay') {
      p.categories = ['Cultural Festival', 'Religious'];
    } else {
      p.categories = ['Cultural Festival'];
    }
  }
  // Monuments & Heritage Sites
  else {
    switch (p.id) {
      case 'mlk-stadthuys':
        p.categories = ['Colonial', 'Museum'];
        break;
      case 'mlk-afamosa':
        p.categories = ['Colonial'];
        break;
      case 'mlk-baba-nyonya':
        p.categories = ['Museum'];
        break;
      case 'mlk-cheng-hoon-teng':
        p.categories = ['Religious'];
        break;
      case 'mlk-kampung-kling':
        p.categories = ['Religious'];
        break;
      case 'mlk-jonker':
        p.categories = ['Colonial'];
        break;
      case 'mlk-sultanate-palace':
        p.categories = ['Museum'];
        break;
      case 'mlk-st-pauls':
        p.categories = ['Colonial', 'Religious'];
        break;
      case 'mlk-bukit-cina':
        p.categories = ['Colonial', 'Religious'];
        break;
      case 'png-khoo-kongsi':
        p.categories = ['Colonial', 'Religious'];
        break;
      case 'kul-sultan-abdul-samad':
        p.categories = ['Colonial'];
        break;
      case 'jhr-sultan-abu-bakar-mosque':
        p.categories = ['Religious', 'Colonial'];
        break;
      case 'kdh-bujang-valley':
        p.categories = ['Museum'];
        break;
      case 'ktn-istana-jahar':
        p.categories = ['Museum'];
        break;
      case 'nsn-istana-seri-menanti':
        p.categories = ['Museum'];
        break;
      case 'phg-masjid-sultan-abdullah':
        p.categories = ['Museum', 'Religious'];
        break;
      case 'prk-ubudiah-mosque':
        p.categories = ['Religious'];
        break;
      case 'pls-kota-kayang':
        p.categories = ['Museum'];
        break;
      case 'sbh-monsopiad-village':
        p.categories = ['Museum', 'Cultural Performance'];
        break;
      case 'swk-cultural-village':
        p.categories = ['Museum', 'Cultural Performance'];
        break;
      case 'sgr-batu-caves':
        p.categories = ['Religious', 'Cultural Festival'];
        break;
      case 'trg-state-museum':
        p.categories = ['Museum'];
        break;
      case 'lbn-chimney':
        p.categories = ['Colonial', 'Museum'];
        break;
      case 'pjy-putra-mosque':
        p.categories = ['Religious'];
        break;
      default:
        p.categories = ['Museum'];
    }
  }
}

fs.writeFileSync('src/data/places.json', JSON.stringify(places, null, 2));
console.log('Successfully standardized all categories in places.json!');
