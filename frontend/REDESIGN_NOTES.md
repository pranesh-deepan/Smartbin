# SmartBin-W frontend redesign - notes

Setup after unzipping:  `npm install`  then  `npm run dev`  (or `npm run build`).
(node_modules is not included. One new dependency: `@fontsource-variable/archivo`,
the bundled Archivo font, so the design works offline and never depends on Google Fonts.)

## What changed
- `index.html`        title, meta, theme-color (fonts now bundled, no external font request)
- `src/index.css`     design tokens (light theme only), focus ring, reduced-motion rules
- `src/theme.css`     NEW - restyles Admin/Worker dashboards (cosmetic only, imported last in main.jsx)
- `src/landing.css`   NEW - landing page + login page styles
- `src/App.jsx`       landing + login markup rebuilt; ALL state, handlers, API calls,
                      localStorage keys and role redirects are unchanged
- `src/components/ui/` NEW - CountUp.jsx, Reveal.jsx, Icons.jsx
- `AdminDashboard.jsx` / `WorkerDashboard.jsx`  stat numbers wrapped in <CountUp/> (values unchanged)
- `WorkerDashboard.jsx` ADDED the missing mobile menu (hamburger + drawer + overlay), mirroring AdminDashboard.
  In the original the worker sidebar slid off-screen on phones with no way to open it.
- `public/images/README.txt`  how to add an optional hero photo

## Not touched
api/api.js, every fetch/endpoint, thresholds (<70 normal, 70-89 warning, >=90 critical),
maps, polling intervals, notification logic, all other component logic and CSS files.
