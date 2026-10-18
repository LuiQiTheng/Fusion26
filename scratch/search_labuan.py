import urllib.request, urllib.parse, json, ssl

ctx = ssl._create_unverified_context()
def search(q):
    url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(q)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|size|mime&format=json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Fusion26/1.0'})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=10) as r:
            d = json.loads(r.read().decode('utf-8'))
            pages = d.get('query', {}).get('pages', {})
            for pid, p in pages.items():
                t = p.get('title', '')
                ii = p.get('imageinfo', [{}])[0]
                print(f"  {t} ({ii.get('width')}x{ii.get('height')}): {ii.get('url')}")
    except Exception as e:
        print("  Error:", e)

for term in ['Labuan Peace Park', 'Labuan War Memorial', 'Surrender point Labuan']:
    print(f"=== {term} ===")
    search(term)
