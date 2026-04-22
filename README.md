# AppForIAC

A small vehicle-and-driver log for the IAC team. Anyone on the team can add
cars, fill in license plate and VIN details later, and submit trip entries
that everyone else sees on the same page in real time.

## Stack

- **React + Vite** — the web app
- **Firebase Firestore** — shared storage, free Spark plan
- **Firebase Hosting** — serves the site, free Spark plan

Total cost: $0 for a small team.

## Setup (one-time, local machine)

You need [Node.js](https://nodejs.org) 18+ installed.

```
npm install
```

## Local development

```
npm run dev
```

Opens a local preview at `http://localhost:5173`. Edits hot-reload.

## Deploying the site

The Firebase project (`traveltracker-80e9c`) is already configured in
`.firebaserc`. To publish:

```
npx firebase login          # one time, opens browser
npm run deploy              # builds and deploys
```

After the deploy finishes, Firebase prints the live URL, typically:

```
https://traveltracker-80e9c.web.app
```

Share that URL with your team.

## Firestore rules

The security rules in `firestore.rules` allow read/write to the `cars` and
`submissions` collections only. Paste them into
Firebase console → Firestore → Rules → Publish. Good enough for an internal
team; add Firebase Authentication if the site ever goes public.

## Data model

- `cars` collection: `{ title, licensePlate, vin, createdAt }`
- `submissions` collection: `{ carId, driverName, notes, timestamp }`

All edits stream to every open browser via Firestore `onSnapshot`, so the
list stays in sync without any extra backend.
