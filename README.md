# AppForIAC

A small vehicle-and-driver log for the IAC team. Anyone on the team can add
cars, fill in license plate and VIN details later, and submit trip entries
that everyone else sees on the same page in real time.

## Backend

Storage is **Firebase Firestore** on the free **Spark** plan — no credit card
required, no server to run. The free tier (50,000 reads/day, 20,000
writes/day, 1 GiB storage) is well beyond what a small team will use.

## One-time setup

1. Go to https://console.firebase.google.com and create a new project.
2. In the project, click **Build → Firestore Database → Create database**.
   Start in **production mode** and pick a region close to your team.
3. In the project, click **Project settings → General → Your apps → Web
   (`</>`)** and register a web app. Copy the config object it shows you.
4. Paste those values into `firebase.js`, replacing the `REPLACE_WITH_...`
   placeholders.
5. In **Firestore Database → Rules**, paste the contents of
   `firestore.rules` and click **Publish**. These rules allow read/write to
   the `cars` and `submissions` collections only — fine for a small internal
   team. If the app is ever made public, add Firebase Authentication and
   tighten the rules.
6. Install dependencies and run the app:
   ```
   npm install
   npx react-native run-ios      # or run-android
   ```

## Data model

- `cars` collection: `{ title, licensePlate, vin, createdAt }`
- `submissions` collection: `{ carId, driverName, notes, timestamp }`

All edits write directly to Firestore and stream back to every open client
via `onSnapshot`, so the list stays in sync across devices without any
backend code.
