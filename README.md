# Malaysia Heritage Explorer
### FUSION 2026 Student Design Challenge — Track B: Heritage Reimagined

> **Theme:** Responsible AI Design: People, Technology and Digital Innovation  
> **SDC Theme:** Heritage in the Loop: Designing AI That Remembers and Cares  
> **SDG Alignment:** Goal 11.4 (Safeguard World Cultural Heritage) & Goal 12.b (Sustainable Tourism)

---

## 🏛 Project Overview

**Malaysia Heritage Explorer** is a coded web prototype that connects cultural discovery, interactive geographic exploration, explainable trip planning, and educational missions into a single unified interface.

Rather than presenting disjointed tourist lists or relying on black-box generative guessing, the system grounds every cultural narrative in verified national archives (Jabatan Warisan Negara & UNESCO), enforces transparent physical travel constraints, and embeds human-in-the-loop ethical safeguards.

---

## 🌟 Key Features

1. **Nationwide Cultural Baseline (All 16 States & Federal Territories):**
   - High-level historical summaries, regional crafts, and sourced cultural themes for Johor, Kedah, Kelantan, Melaka, Negeri Sembilan, Pahang, Penang, Perak, Perlis, Sabah, Sarawak, Selangor, Terengganu, Kuala Lumpur, Labuan, and Putrajaya.

2. **Deep Melaka UNESCO Heritage Showcase:**
   - 9 meticulously researched monuments and living heritage streets (The Stadthuys, A Famosa, Baba & Nyonya Heritage Museum, Kampung Kling Mosque, Cheng Hoon Teng Temple, Jonker Walk, Melaka Sultanate Palace Museum, St. Paul's Church, Bukit Cina).
   - Real GPS coordinates, verified opening hours, and honest admission pricing.

3. **Interactive Leaflet Map with Synchronized Selection:**
   - Custom heritage pin markers, map-to-list auto-panning, and route polyline visualizers.
   - Built-in graceful fallback when offline or when tiles fail to load.

4. **Deterministic Smart Itinerary Planning Engine:**
   - **Quick Mode:** Instant 3.5-hour starter walking trail through Melaka's historic core.
   - **Custom Mode:** Dynamic constraint satisfaction accounting for user time budgets (1.5h to 8h), transport modes (Walking, Car, Transit, Mixed), and multi-faith diversity bonuses.
   - Transparent time calculation: `totalPlannedMinutes = sum(visitDurations) + sum(travelMinutes)`.
   - Modifiable stops with real-time route and schedule recalculation.

5. **Heritage-in-the-Loop Responsible AI Layer (30% Evaluation Weight):**
   - **"Inspect AI Reasoning" Drawer:** An interactive audit modal exposing the exact prompt, grounding citations, and negative constraints applied to prevent AI speculation.
   - **Cultural Care Guardrails:** Automatic surfacing of sacred precinct rules (dress codes, footwear removal, photography consent at places of worship).
   - **Transparent Route Data Labelling:** Explicit distinction between *Source Verified*, *Estimated Urban Walk*, and *Simulated Transit Model*.

6. **Educational Cultural Missions:**
   - Four interactive challenges (Notice, Learn, Reflect, Connect) testing architectural observation and preservation awareness with celebratory feedback.

7. **Local-First Privacy & Zero Account Lock-in:**
   - Favourites, customized itineraries, and mission badges persist automatically in `localStorage` without collecting personal data.

---

## 🛠 Technology Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 + Plus Jakarta Sans & Playfair Display typography
- **Mapping:** Leaflet + OpenStreetMap (direct DOM integration, zero peer-dependency bugs)
- **Icons & Assets:** Lucide React + Canvas Confetti
- **Persistence:** LocalStorage with schema versioning & safe fallback

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Installation
```bash
# Clone the repository
git clone https://github.com/LuiQiTheng/Fusion26.git

# Navigate to project folder
cd Fusion26

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
# Compile TypeScript and bundle assets
npm run build

# Preview production build locally
npm run preview
```

---

## 📋 Competition Deliverables Index

- **Deliverable 1 (Concept Poster):** Architectural diagrams, personas, user journeys, and key screens documented in `docs/POSTER_ASSETS.md`.
- **Deliverable 2 (Concept Video):** 2–3 minute video storyboard and recording script in `docs/DEMO_SCRIPT.md`.
- **Deliverable 3 (Responsible Design Canvas):** Ethical AI canvas, harm prevention analysis, and AI tool disclosure in `src/pages/AboutDataPage.tsx` and `docs/DATA_SOURCES.md`.

---

## 📄 License & Attribution

All historical references are credited to **Jabatan Warisan Negara**, **UNESCO World Heritage Centre**, and **Perbadanan Muzium Melaka (PERZIM)**. Images are used for non-commercial educational purposes under Creative Commons and open institutional licenses.
