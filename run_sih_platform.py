"""
SIH 2026 (SIH26249) - Air Power Fleet Availability Platform
One-Click Server Launcher
"""

import sys
import os
import webbrowser
import uvicorn
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

DB_PATH = str(BASE_DIR / "data" / "air_power_fleet.db")

if __name__ == "__main__":
    print("\n" + "="*70)
    print("  MINISTRY OF DEFENCE (SIH 2026 // PS SIH26249)")
    print("  AIR POWER FLEET READINESS & DIGITAL TWIN PLATFORM")
    print("="*70)
    print(f"  * Multi-Silo Defense DB: {DB_PATH}")
    print("  * REST API Docs:         http://127.0.0.1:8000/docs")
    print("  * Interactive Cockpit:   http://127.0.0.1:8000/dashboard")
    print("="*70 + "\n")
    
    try:
        from backend.main import app
    except ImportError:
        from sih_air_power_platform.backend.main import app
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
