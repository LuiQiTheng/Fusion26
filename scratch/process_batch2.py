import os
from PIL import Image
from rembg import remove

batch2 = [
    (
        r"C:\Users\ASUS\.gemini\antigravity\brain\3cf9b5e1-fda6-420b-91f3-d6b04c961e50\kl_heritage_railway_station_scan_1792328910089.jpg",
        r"public\images\cultural\showcase-stesen-keretapi-kl.png"
    ),
    (
        r"C:\Users\ASUS\.gemini\antigravity\brain\3cf9b5e1-fda6-420b-91f3-d6b04c961e50\putrajaya_perdana_putra_scan_1792328909966.jpg",
        r"public\images\cultural\showcase-perdana-putra-putrajaya.png"
    ),
    (
        r"C:\Users\ASUS\.gemini\antigravity\brain\3cf9b5e1-fda6-420b-91f3-d6b04c961e50\labuan_kuraman_lighthouse_scan_1792328911045.jpg",
        r"public\images\cultural\showcase-rumah-api-kuraman-labuan.png"
    )
]

for src, dest in batch2:
    print(f"Processing {os.path.basename(src)} -> {dest}...")
    im = Image.open(src)
    res = remove(im)
    res.save(dest, "PNG", optimize=True)
    alpha = res.split()[-1]
    trans = sum(1 for p in alpha.get_flattened_data() if p == 0) / (res.width * res.height) * 100
    print(f"  Done: size={res.size}, transparency={trans:.1f}%")
