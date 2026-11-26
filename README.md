# Medi-Caps Campus Nav | Indore (`AENA09/Campus_Nav`)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AENA09/Campus_Nav)
![Live Demo](https://img.shields.io/badge/Live%20Demo-Campus%20Nav%20Indore-991B1B?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-React-0F172A?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38BDF8?style=flat-square)

An interactive, strictly client-side campus navigation system for **Medi-Caps University, Indore** (Pigdamber, Rau, AB Road). Built for fast wayfinding across academic blocks, labs, hostels, dining, sports facilities, and campus utilities—pre-configured for zero-config static deployment on **Vercel**.

## Key Features

- **Interactive SVG Campus Map (`1000 × 700`):** Custom vector map modeled after Medi-Caps University's actual campus layout along AB Road, complete with pan, mouse-wheel/pinch zoom, clickable building footprints, and animated shortest-path overlays.
- **Dijkstra Shortest-Path Engine:** Computes optimal walking routes across 15 landmarks and connected walkway junctions with distance (meters), walking duration (`distance / 80 m/min`), and turn-by-turn directions.
- **Wheelchair Accessible Mode:** Toggle step-free routing to automatically exclude stairs and stepped shortcuts, highlighting accessible paved ramps and detours.
- **Live Department & Building Search:** Search by block name, department, or facility (e.g., `CSE`, `Pharmacy`, `Registrar`, `Nescafé`, `Cricket`) and filter landmarks by category (`All`, `Academics`, `Food`, `Hostels`, `Sports`, `Utilities`).
- **Location Info Drawer:** Inspect floor directories, departments, operating hours, and accessibility details, then trigger one-tap navigation.
- **Light & Dark Themes + Mobile Bottom Sheet:** Crisp university palette (Crimson `#991B1B`, Deep Slate `#0F172A`, White) with responsive mobile bottom sheet directions.

## Tech Stack

- **Framework:** React + Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Routing Algorithm:** Client-side Dijkstra shortest-path engine (zero backend dependencies, zero external API keys)

## Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/AENA09/Campus_Nav.git
cd Campus_Nav

# 2. Install dependencies
npm install

# 3. Start the local development server
npm run dev

# 4. Build for production
npm run build
```

## Deploy on Vercel (One-Click)

This repository includes `vercel.json` configured with SPA fallback rewrites (`/(.*) -> /index.html`) and requires no environment variables or backend server.

1. Push the project to your GitHub repository (`AENA09/Campus_Nav`).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Keep the default **Vite** preset (`Build Command: npm run build`, `Output Directory: dist`).
4. Click **Deploy** — your live campus navigator will be ready in seconds.

## Project Structure

```text
├── index.html
├── package.json
├── vercel.json
├── vite.config.ts
├── README.md
└── src/
    ├── main.tsx
    ├── index.css
    ├── App.tsx
    ├── data/
    │   └── campusData.ts        # Campus buildings, walkway junctions & graph edges
    ├── utils/
    │   └── pathfinding.ts       # Dijkstra algorithm, walk time & turn-by-turn engine
    └── components/
        ├── CampusMap.tsx        # Interactive pan/zoom SVG map & animated route path
        ├── NavigationPanel.tsx  # Route planner, accessible toggle & step-by-step guide
        └── LocationDrawer.tsx   # Slide-over building details & floor directory
```
