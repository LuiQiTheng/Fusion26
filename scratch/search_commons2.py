import urllib.request
import urllib.parse
import json
import ssl

ctx = ssl._create_unverified_context()

def search_commons(query, limit=8):
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
                    'width': ii.get('width', 0),
                    'height': ii.get('height', 0),
                    'mime': ii.get('mime', '')
                })
            return sorted(results, key=lambda x: x['width']*x['height'], reverse=True)
    except Exception as e:
        return str(e)

categories = {
    'Johor Kuda Kepang': 'Kuda Kepang',
    'Sabah Lepa Semporna': 'Perahu Lepa OR Regatta Lepa',
    'Sarawak Dayak Shield': 'Dayak shield OR Iban shield OR Terabai',
    'Negeri Sembilan Minangkabau': 'Rumah Gadang Minangkabau OR Rumah Negeri Sembilan',
    'Perlis Heritage': 'Tarian Terinai OR Terinai OR Perlis museum',
    'KL Railway Station': 'Kuala Lumpur railway station Hubback',
    'Putrajaya Perdana Putra': 'Perdana Putra Putrajaya',
    'Labuan War Memorial': 'Labuan War Cemetery OR Labuan Peace Park'
}

for name, q in categories.items():
    print(f"\n=================== {name} ({q}) ===================")
    res = search_commons(q, 6)
    if isinstance(res, list):
        for r in res:
            if r['mime'].startswith('image/'):
                print(f"  {r['title']} ({r['width']}x{r['height']}): {r['url']}")
    else:
        print("  Error:", res)
