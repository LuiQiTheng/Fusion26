import https from 'https';

const url = 'https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=800&titles=Laksa';

https.get(url, {
  headers: {
    'User-Agent': 'MalaysiaHeritageExplorerBot/1.0 (contact: student_challenge@fusion2026.edu.my)'
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data.slice(0, 300));
  });
}).on('error', err => console.error(err));
