# MileTrack — Real Estate Mileage Tracker

A dead-simple, mobile-first web app for logging business drives and generating
a year-end IRS-ready mileage report. Built for real estate agents who drive
all day and just want to tap a button.

## What it does

- **One-tap logging.** Open the app, enter a From and To address, calculate the
  driving distance, pick what the drive was for, save.
- **No typing required** for the common case — purpose is picked from big tiles
  (Client Showing, Listing Appointment, Open House, Office Meeting, Property
  Inspection, Closing, Marketing, Other).
- **Auto-distance.** Addresses are geocoded with OpenStreetMap Nominatim and
  routed with OSRM for real driving miles. Falls back to straight-line distance
  if routing is unavailable.
- **Use my current location** button fills the "From" field from your phone's
  GPS.
- **Year-end CSV export** with every field your accountant needs: date, from,
  to, miles, purpose, notes, odometer, per-drive deduction, plus totals,
  annual odometer readings, and business-use percentage.
- **Annual odometer tracking** — the IRS asks for Jan 1 and Dec 31 readings.
- **Works offline** after first load (PWA). Add to your home screen on
  iPhone / Android and it opens like a native app.
- **All data stays on your device** — no account, no server, no tracking.

## Running it

It's three static files. Serve the repository root with any static web server:

```bash
# Python (built into macOS / most Linux)
python3 -m http.server 8000

# or Node
npx serve .
```

Then open `http://localhost:8000` on your phone (on the same Wi-Fi) or on your
desktop.

To host it for real, push to GitHub Pages, Netlify, Vercel, or any static host.
No build step — just deploy the files.

## Adding to your home screen

- **iPhone (Safari):** tap the Share button → "Add to Home Screen."
- **Android (Chrome):** tap the three-dot menu → "Install app" / "Add to Home
  Screen."

After that, opening it looks and feels like a native app.

## Tax settings

Open **Settings** (gear icon, top right) to set:

- **IRS standard mileage rate** — defaults to $0.70/mile (2025 business rate).
  Update each year when the IRS publishes the new rate.
- **Default "From" address** — prefills the From field (e.g. your home office).
- **Annual odometer** — record Jan 1 and Dec 31 readings per year. The export
  includes these plus a business-use percentage.

## Files

| File            | Purpose                                    |
|-----------------|--------------------------------------------|
| `index.html`    | App markup (all five views in one file).   |
| `styles.css`    | Mobile-first design, dark mode, animations.|
| `app.js`        | All logic: storage, geocoding, CSV export. |
| `manifest.json` | PWA manifest (home screen install).        |
| `sw.js`         | Service worker for offline support.        |
| `icon.svg`      | App icon.                                  |

## Data & privacy

Every drive is stored in your browser's `localStorage` on your own device.
Nothing is sent to any server except the two address lookups per drive:

- `nominatim.openstreetmap.org` — converts addresses to coordinates.
- `router.project-osrm.org` — calculates the driving route.

Both are public free services. No account, no tracking. If you clear your
browser data, export first.
