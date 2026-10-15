import fs from 'fs';

const states = JSON.parse(fs.readFileSync('src/data/states.json', 'utf8'));
const places = JSON.parse(fs.readFileSync('src/data/places.json', 'utf8'));

for (const state of states) {
  const matchingPlaceIds = places
    .filter(p => p.stateId === state.id)
    .map(p => p.id);
  // dedupe
  state.placeIds = Array.from(new Set([...state.placeIds, ...matchingPlaceIds]));
}

fs.writeFileSync('src/data/states.json', JSON.stringify(states, null, 2));
console.log('Successfully updated states.json with all cultural item associations!');
