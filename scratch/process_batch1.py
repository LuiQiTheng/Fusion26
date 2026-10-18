import os
from PIL import Image
from rembg import remove

batch1 = [
    (
        r"C:\Users\ASUS\.gemini\antigravity\brain\3cf9b5e1-fda6-420b-91f3-d6b04c961e50\lepa_boat_museum_scan_1792328246118.jpg",
        r"public\images\cultural\showcase-perahu-lepa-sabah.png"
    ),
    (
        r"C:\Users\ASUS\.gemini\antigravity\brain\3cf9b5e1-fda6-420b-91f3-d6b04c961e50\iban_terabai_shield_scan_1792328247653.jpg",
        r"public\images\cultural\showcase-terabai-iban-sarawak.png"
    ),
    (
        r"C:\Users\ASUS\.gemini\antigravity\brain\3cf9b5e1-fda6-420b-91f3-d6b04c961e50\negeri_sembilan_minangkabau_house_scan_1792328247994.jpg",
        r"public\images\cultural\showcase-rumah-lentik-nsn.png"
    ),
    (
        r"C:\Users\ASUS\.gemini\antigravity\brain\3cf9b5e1-fda6-420b-91f3-d6b04c961e50\perlis_terinai_regalia_scan_1792328246913.jpg",
        r"public\images\cultural\showcase-terinai-kuku-emas-perlis.png"
    )
]

for src, dest in batch1:
    print(f"Processing {os.path.basename(src)} -> {dest}...")
    im = Image.open(src)
    res = remove(im)
    res.save(dest, "PNG", optimize=True)
    alpha = res.split()[-1]
    trans = sum(1 for p in alpha.get_flattened_data() if p == 0) / (res.width * res.height) * 100
    print(f"  Done: size={res.size}, transparency={trans:.1f}%")
