async function testTable() {
  const coords = '102.2491,2.1944;102.2503,2.1920;102.2497,2.1928;102.2467,2.1963';
  const url = `https://router.project-osrm.org/table/v1/driving/${coords}?annotations=distance,duration`;
  console.log('Testing OSRM table:', url);
  const res = await fetch(url);
  const data = await res.json();
  console.log('Response code:', data.code);
  console.log('Durations matrix (seconds):', data.durations);
  console.log('Distances matrix (meters):', data.distances);
}
testTable();
