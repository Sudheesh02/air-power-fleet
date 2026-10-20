# Vayu AI — Android app

Standalone React Native (Expo SDK 58, TypeScript) app for the VayuAI fleet readiness platform. Android first; the code also runs on iOS.

## Run
```bash
npm install
npx expo run:android      # dev build (needs Android SDK) — Expo Go lacks speech recognition
npx expo start --web      # quick UI preview in a browser
```

## Data
- **Settings → Server**: URL of the FastAPI backend (`backend/main.py`).
- Defaults to the live backend at `https://vayuai-backend.onrender.com`. The free server sleeps when idle, so the first request can take up to a minute; the app shows a "Waking server" banner meanwhile.
- **Offline demo mode** (off by default): uses the bundled mock fleet in `src/data/mockFleetData.js`. The app also falls back to it if the server is unreachable.

## Voice
Speech-to-text runs on the phone (`expo-speech-recognition`). Spoken answers come from the backend's `/api/voice/synthesize` (Sarvam key stays on the server); if the server is unavailable the phone's own TTS is used. **No API keys are stored in the app.**

## Release APK (local, no EAS)
```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease   # signing config: see android/app/build.gradle
```
The release keystore must live outside the repo.
