# Vayu AI

Android app for fleet readiness and predictive maintenance. It shows fleet status, aircraft health with a gas-path digital twin, sortie planning, triage, work orders and logistics, plus a voice Copilot.

## Download

**[Vayu AI v1.1.0](https://github.com/Sudheesh02/air-power-fleet/releases/tag/v1.1.0)**: download `Vayu-AI.apk` and install it on any ARM Android phone (32 or 64-bit). You may need to allow installs from unknown sources.

## What's in this branch

| Path | What it is |
|---|---|
| `mobile_app/` | The React Native + Expo (SDK 58, TypeScript) app. See [mobile_app/README.md](mobile_app/README.md). |
| `backend/main.py` | FastAPI server the app talks to. |
| `engine/` | Digital twin, sortie planner and database helpers used by the backend. |
| `data/air_power_fleet.db` | SQLite fleet database. |
| `requirements.txt` | Backend Python dependencies. |
| `.env.example` | Backend environment variables. |

## Backend

Live at `https://vayuai-backend.onrender.com` (Render free plan; the first request after idle can take up to a minute).

Run it locally:

```bash
pip install -r requirements.txt
cp .env.example .env        # set SARVAM_API_KEY
uvicorn backend.main:app --reload
```

## Voice Copilot

Speech recognition runs on the phone. Spoken answers come from the backend's `/api/voice/synthesize`, which calls Sarvam AI. The Sarvam key stays on the server, and no API keys ship in the app.

## Build the APK

```bash
cd mobile_app
npm install
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

Keep the release keystore outside the repo.
