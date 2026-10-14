# Malaysia Heritage Explorer — Data Sources & Verification Methodology

> **FUSION 2026 Student Design Challenge**
> **Theme:** Responsible AI Design: People, Technology and Digital Innovation
> **SDC Theme:** Heritage in the Loop: Designing AI That Remembers and Cares
> **Track:** Track B — Heritage Reimagined

---

## 1. Data Integrity & Verification Standards

To prevent algorithmic hallucination and preserve cultural dignity, every historical claim and geographical coordinate in this platform adheres to the following hierarchy:

1. **Jabatan Warisan Negara (National Heritage Department Malaysia)** — National Heritage Register under National Heritage Act 2005 (Act 645).
2. **UNESCO World Heritage Centre** — Official dossiers for *Melaka and George Town, Historic Cities of the Straits of Malacca* (Ref: 1223) and *Archaeological Heritage of the Lenggong Valley* (Ref: 1396).
3. **Perbadanan Muzium Melaka (PERZIM)** — Curatorial monographs and museum archive registers.
4. **George Town World Heritage Incorporated (GTWHI)** — Conservation and architectural survey records.
5. **Arkib Negara Malaysia (National Archives of Malaysia)** — Decolonization, independence, and colonial civic public records.

---

## 2. Melaka Primary Showcase Inventory

| ID | Place Name | Primary Authority / Source | Coordinates | Verification Status |
|---|---|---|---|---|
| `mlk-stadthuys` | The Stadthuys & Dutch Square | Perbadanan Muzium Melaka (PERZIM) / UNESCO Dossier 1223 | `2.1944, 102.2492` | Verified |
| `mlk-afamosa` | A Famosa (Porta de Santiago) | Jabatan Warisan Negara Registry / National Monument Act | `2.1918, 102.2501` | Verified |
| `mlk-baba-nyonya` | Baba & Nyonya Heritage Museum | Baba & Nyonya Heritage Museum Archives / Chan Family Trust | `2.1956, 102.2464` | Verified |
| `mlk-cheng-hoon-teng` | Cheng Hoon Teng Temple | UNESCO Asia-Pacific Heritage Conservation Award 2003 | `2.1973, 102.2472` | Verified |
| `mlk-kampung-kling` | Kampung Kling Mosque | Jabatan Warisan Negara Historic Vernacular Mosques Register | `2.1969, 102.2478` | Verified |
| `mlk-st-pauls` | St. Paul's Church (Bukit San Pedro) | Malaysian Historical Society Monographs / Arkib Negara | `2.1927, 102.2494` | Verified |
| `mlk-sultanate-palace` | Melaka Sultanate Palace Museum | Sejarah Melayu (Malay Annals) / Dewan Bahasa dan Pustaka | `2.1923, 102.2508` | Verified |
| `mlk-jonker` | Jonker Walk (Jalan Hang Jebat) | Majlis Bandaraya Melaka Bersejarah (MBMB) Heritage Guidelines | `2.1962, 102.2476` | Verified |
| `mlk-bukit-cina` | Bukit Cina & King's Well | Malaysian Branch of the Royal Asiatic Society (MBRAS) | `2.1979, 102.2575` | Verified |

---

## 3. Nationwide State & Territory Baseline Sources

- **Johor:** Yayasan Warisan Johor (Johor Heritage Foundation) — Royal Johor Heritage Archives (`https://ywj.gov.my`)
- **Kedah:** Lembah Bujang Archaeological Research Centre, Universiti Sains Malaysia (`https://arkeologi.usm.my`)
- **Kelantan:** Perbadanan Muzium Negeri Kelantan & UNESCO Intangible Cultural Heritage Register (Mak Yong Theatre) (`https://ich.unesco.org/en/RL/mak-yong-theatre-00167`)
- **Negeri Sembilan:** Lembaga Muzium Negeri Sembilan — Adat Perpatih Customary Archives (`https://lmns.ns.gov.my`)
- **Pahang:** Perbadanan Muzium Negeri Pahang — Royal Pekan Cultural Profiles (`https://muzium.pahang.gov.my`)
- **Penang:** George Town World Heritage Incorporated (`https://gtwhi.com.my`)
- **Perak:** UNESCO World Heritage Centre (Lenggong Valley) & Perak Heritage Society
- **Perlis:** Perlis State Economic Planning Unit Heritage Profile (`https://www.perlis.gov.my`)
- **Sabah:** Sabah Museum and Heritage Services & Sabah Cultural Board (`https://museum.sabah.gov.my`)
- **Sarawak:** Sarawak Museum Department & UNESCO Niah National Park Caves (`https://museum.sarawak.gov.my`)
- **Selangor:** Tourism Selangor Cultural Heritage Division & Department of Museums Malaysia
- **Terengganu:** Lembaga Muzium Negeri Terengganu & UNESCO Memory of the World Register (Batu Bersurat Terengganu)
- **Kuala Lumpur:** Arkib Negara Malaysia (`http://www.arkib.gov.my`)
- **Putrajaya:** Perbadanan Putrajaya Heritage & Architecture Guide (`https://www.ppj.gov.my`)
- **Labuan:** Department of Museums Malaysia (Labuan Branch)

---

## 4. Media & Photography Licensing

All images in this coded prototype are strictly curated from:
- Open-access public archives (Wikimedia Commons under CC-BY / CC-BY-SA)
- Official institutional tourism documentation
- Unsplash open educational media licence

Attribution metadata is embedded in each record in `src/data/places.json`.
