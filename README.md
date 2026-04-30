# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Quick Time Tracker Desktop App
The "Quick Time Tracker" is integrated with this system and available as a downloadable desktop application.

### Features
- Native Windows Desktop application.
- Real-time sync with the central Task & Project management system.
- Persistent timer that runs in the background.

### Download & Installation
1. Click the **"Download Desktop App"** button in the sidebar or the header of the Quick Tracker page.
2. Download the `QuickTracker-Windows.zip` file.
3. Extract the ZIP file to your preferred location.
4. Run `QuickTracker.exe` to start tracking your time.

### Development & Building
To build a new version of the tracker:
1. Navigate to the `quick-time-tracker` directory.
2. Run `npm run build`.
3. Package the version using `electron-builder` or zip the `dist_electron/win-unpacked` folder.
