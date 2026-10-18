import urllib.request
import urllib.parse
import json
import ssl

ctx = ssl._create_unverified_context()

def search_commons(query, limit=5):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(query)}&gsrnamespace=6&gsrlimit={limit}&prop=imageinfo&iiprop=url|size|mime&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Fusion26Explorer/1.0 (heritage@fusion26.my)'})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get('query', {}).get('pages', {})
            results = []
            for pid, p in pages.items():
                title = p.get('title', '')
                ii = p.get('imageinfo', [{}])[0]
                results.append({
                    'title': title,
                    'url': ii.get('url'),
                    'width': ii.get('width'),
                    'height': ii.get('height'),
                    'mime': ii.get('mime')
                })
            return results
    except Exception as e:
        return str(e)

queries = [
    'Kuda kepang',
    'Perahu lepa semporna',
    'Terabai shield',
    'Minangkabau roof model',
    'Terinai Perlis',
    'Kuala Lumpur railway station',
    'Perdana Putra',
    'Labuan war memorial'
]

for q in queries:
    print(f"=== {q} ===")
    res = search_commons(q, 3)
    if isinstance(res, list):
        for r in res:
            print(f"  {r['title']} -> {r['width']}x{r['height']} ({r['mime']}): {r['url']}")
    else:
        print("  Error:", res)
