# nivo – Nigeria elections

```
nivo/
├─ index.html              dev/prod entry: loads dist/nivo.js
├─ package.json            scripts: dev, build, typecheck, map-data
├─ tsconfig.json
├─ src/
│  ├─ main.ts              boots the app
│  ├─ app.ts               state, views (map, dashboard, compare, insights), interactive map
│  ├─ styles.css           design tokens + all styles (imported as text)
│  ├─ shell.html           header / nav / <main id="v"> markup (imported as text)
│  ├─ env.d.ts             lets TypeScript import .css/.html files
│  └─ data/map-data.ts     GENERATED: outline, state borders, state hit-mask, 774 LGA shapes
├─ scripts/build_map_data.py   regenerates src/data/map-data.ts from the GeoJSON
├─ data/nga_admin2.geojson     HDX/OCHA admin-2 boundaries (input to the script)
└─ dist/                   build output (git-ignored)
```

## Run
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-checks, then bundles dist/nivo.js
```

## Regenerate the map data
```bash
pip install shapely numpy pillow
npm run map-data
```

## Where to change things
- Real vote data: replace `votes()` / `lvt()` in `src/app.ts` (they are seeded placeholders).
- Colours, spacing, type: tokens at the top of `src/styles.css`.
- Map behaviour: `sync()`, `drawMap()`, `bindMap()` in `src/app.ts`.
