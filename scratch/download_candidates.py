import os
import urllib.request
import ssl

ctx = ssl._create_unverified_context()
headers = {'User-Agent': 'Fusion26Explorer/1.0 (contact: info@fusion26.my)'}

candidates = {
    'johor_kuda_kepang.jpg': 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Kuda_Kepang_Semanjung_Johor_with_Buluh_Ponorogo_style.jpg',
    'johor_kuda_lumping.png': 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Kuda_Lumping_3_101.png',
    'sabah_perahu_lepa.jpg': 'https://upload.wikimedia.org/wikipedia/commons/1/17/Perahu_Lepa.jpg',
    'sabah_regatta_lepa.jpg': 'https://upload.wikimedia.org/wikipedia/commons/b/b0/Semporna_Sabah_Regatta-Lepa-2015-02.jpg',
    'sarawak_terabai_met1.jpg': 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Shield_MET_LC-36_25_643-001.jpg',
    'sarawak_terabai_met2.jpg': 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Shield_MET_LC-36_25_645-001.jpg',
    'nsn_rumah_tradisional.jpg': 'https://upload.wikimedia.org/wikipedia/commons/4/43/Rumah_tradisional_minangkabau_negeri_sembilan_malaysia.jpg',
    'perlis_tengkolok.jpg': 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Tengkolok_Dendam_Tak_Sudah_%28Perlis%29_%28DSCF0950%29.jpg',
    'perlis_masjid_alwi.jpg': 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Masjid_Syed_Alwi.JPG',
    'kl_railway_station.jpg': 'https://upload.wikimedia.org/wikipedia/commons/8/8c/2016_Kuala_Lumpur%2C_Stacja_kolejowa_Kuala_Lumpur_%2801%29.jpg',
    'putrajaya_perdana_putra.jpg': 'https://upload.wikimedia.org/wikipedia/commons/1/19/Putrajaya_Malaysia_Perdana-Putra-01.jpg',
    'labuan_surrender_memorial.jpg': 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Labuan_Malaysia_Surrender-Point-Memorial-01.jpg',
    'labuan_war_memorial.jpg': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Labuan_Malaysia_War-Cemetery-01.jpg'
}

out_dir = r'c:\Users\ASUS\Documents\GitHub\Fusion26\scratch\candidates'
os.makedirs(out_dir, exist_ok=True)

for fname, url in candidates.items():
    dest = os.path.join(out_dir, fname)
    if os.path.exists(dest) and os.path.getsize(dest) > 1000:
        print(f"Already exists: {fname} ({os.path.getsize(dest)} bytes)")
        continue
    print(f"Downloading {fname}...")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            data = resp.read()
            with open(dest, 'wb') as f:
                f.write(data)
        print(f"  Saved {fname} ({len(data)} bytes)")
    except Exception as e:
        print(f"  Failed {fname}: {e}")
