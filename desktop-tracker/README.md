# DigiTracker Desktop Tracker

This desktop app is used to track work time and sync it to the website API.

## Run locally

1. Open terminal in `desktop-tracker`
2. Install dependencies:

```bash
npm install
```

3. Start app:

```bash
npm start
```

## Build Windows installer (`.exe`)

```bash
npm run build:win
```

The installer will be generated in `desktop-tracker/dist`.

## Make website download button serve this installer

1. Copy generated installer `.exe`
2. Rename it to `tracker-setup.exe`
3. Place it in:

`server/downloads/tracker-setup.exe`

Now website button **Download Tracker App** will download this file via:

`/api/tracker/download`
