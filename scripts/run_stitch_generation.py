import json
import requests
import sys
import time
import os
import shutil
from pathlib import Path

API_KEY = os.environ.get("STITCH_API_KEY", "")
ENDPOINT = "https://stitch.googleapis.com/mcp"
PROJECT_ID = os.environ.get("STITCH_PROJECT_ID", "6364091777009717579")
BASE_DIR = Path(__file__).resolve().parent.parent
LOCAL_OUT_DIR = str(BASE_DIR / "stitch_screens")
ARTIFACT_DIR = os.environ.get("ARTIFACT_DIR", str(BASE_DIR / "stitch_screens" / "artifacts"))

os.makedirs(LOCAL_OUT_DIR, exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def call_stitch_tool(tool_name: str, arguments: dict = None, timeout: int = 180):
    if arguments is None:
        arguments = {}
    
    payload = {
        "jsonrpc": "2.0",
        "id": int(time.time()),
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "User-Agent": "AntigravityAntiSlopClient/2.0"
    }
    
    res = requests.post(ENDPOINT, json=payload, headers=headers, timeout=timeout)
    res_data = res.text
    lines = res_data.strip().split("\n")
    json_text = ""
    for line in lines:
        if line.startswith("data: "):
            json_text = line[6:]
        elif line.startswith("{"):
            json_text = line
    
    if not json_text:
        json_text = res_data
        
    return json.loads(json_text)

def generate_and_save(target: str):
    if target == "desktop":
        prompt = (
            "Indian Air Force AeroShield Fleet Operations & Predictive Maintenance Command Center. "
            "Aesthetic standard: Elite, calm, human-designed enterprise defense dashboard (Anduril Lattice / Palantir Foundry / Apple macOS Human Interface Guidelines). "
            "STRICT ZERO-AI-SLOP RULES: "
            "- Absolutely NO glowing neon cyan borders, NO glowing wireframe boxes, NO video-game 'DEFCON' or 'quantum-resistant' gimmick tags, NO rainbow cards. "
            "- Palette: Deep muted slate canvas (#0B0F17). Clean charcoal card surfaces (#151E32) with razor-thin 1px neutral borders (#2D3748 or #334155). Zero glow halos. "
            "- 10% Semantic Rule: Color reserved exclusively for real status badges — Muted Emerald (#10B981) for Ready, Warm Amber (#F59E0B) for Scheduled Advisory, Subdued Crimson (#EF4444) for Grounded AOG. Primary actions in solid Royal Blue (#2563EB). "
            "- Typography: Clean Inter / SF Pro sans-serif. Generous 24px card padding and calm whitespace. Tabular JetBrains Mono numbers strictly for sensor telemetry. "
            "Structure: "
            "1. Header: Subtle IAF roundel, title 'Bharatiya Vayu Sena — Fleet Readiness & Predictive Maintenance C2', authenticated officer 'Air Chief Marshal A. P. Singh, PVSM, AVSM (CAS)', UTC/IST mission clocks, squadron filter. "
            "2. Fleet KPI Row (4 clean Bento cards): Fleet Availability 66.7% (Target 75.0%), Combat Airframes Online 12 / 18, Conformal Critical RUL 3 Airframes (Su-30MKI SB-024, Tejas KH-204, Rafale RB-004), Active Depot Logistics Requisitions 4. "
            "3. Central Two-Column Layout: "
            "   - Left 60%: Su-30MKI SB-024 Digital Twin Turbofan Gas-Path (Fan, LPC, HPC Stage 3 [Wear Flagged: T30 755°C, Vibration 0.94], Combustor, LPT, in-flight RLS drift compensation status, Conformal RUL curve). "
            "   - Right 40%: Proactive Spares & Work Orders (Work Order #WO-7049 for HPC rotor blisk replacement, Forward Base LRU stocks at AFS Thanjavur / Sulur / Ambala, Live sortie debrief feed for Garuda-1 CAP)."
        )
        device_type = "DESKTOP"
        prefix = "anti_slop_desktop"
    else:
        prompt = (
            "Indian Air Force AeroShield Field Operations — Mobile Flight-Line Companion App. "
            "Aesthetic standard: Apple iOS / iPadOS Human Interface Guidelines meets Boeing ForeFlight Military aviation app. Designed by an elite Apple-grade design director for IAF flight-line crew chiefs. "
            "STRICT ZERO-AI-SLOP RULES: "
            "- Absolutely NO glowing neon borders, NO cyber HUD wireframes, NO video-game overlays. "
            "- Tone: Serious, calm, authoritative, daylight-readable, glare-resistant field tool. "
            "- Palette: Deep navy-slate canvas (#0A0F1D). Clean solid card surfaces (#141C2E) with hairline neutral borders (rgba(255,255,255,0.08)). No glowing outlines. "
            "- Touch Targets: Large 48px+ touch targets with high tarmac outdoor contrast and large legible typography. "
            "Structure: "
            "1. Header: Clean top bar with IAF insignia, title 'IAF AeroShield Field Ops', station indicator 'AFS Thanjavur (No. 222 Tigersharks)', and authenticated officer 'Air Chief Marshal A. P. Singh (CAS)'. "
            "2. Tail Selector: Sleek horizontal segmented chips for rapid airframe inspection (Selected: 'Su-30MKI SB-024' with maintenance notice, 'Tejas KH-204', 'Rafale RB-001') plus an optical barcode/NFC scan airframe trigger. "
            "3. Selected Aircraft Health Card (Su-30MKI SB-024): Remaining Useful Life 14.5 hrs (Conformal 80% CI: 10.4h - 18.6h), Subsystem Health 21.2% (Notice: High-Pressure Compressor Stage 3 Wear), and 4 clean telemetry tiles (EGT 755°C, Oil Pressure 32.4 PSI, Core Vibration 0.94, Fuel Pressure Nominal). "
            "4. Operational Controls: Tactile primary button 'Authorize Sortie Clearance' (Locked State: Requires Sqn Ldr Signature), and secondary snag reporting pills (Voice Memo PTT, Borescope Photo, Notes). "
            "5. Logistics Alert Card: AOG Emergency Supply Requisition REQ-2026-091 en route from Chandigarh Depot via IAF C-130J (ETA: 14 hours). "
            "6. Recent Sortie: Flight log for Garuda-1 Combat Air Patrol (3.8h duration). "
            "Bottom navigation bar: Fleet, Digital Twin, Orders, Logistics."
        )
        device_type = "MOBILE"
        prefix = "anti_slop_mobile"

    print(f"Generating Anti-Slop {device_type} screen with GEMINI_3_5_FLASH_LITE...")
    result = call_stitch_tool("generate_screen_from_text", {
        "projectId": PROJECT_ID,
        "prompt": prompt,
        "deviceType": device_type,
        "modelId": "GEMINI_3_5_FLASH_LITE"
    })
    
    # Save raw json response
    with open(os.path.join(LOCAL_OUT_DIR, f"{prefix}_response.json"), "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
        
    # Extract screen details
    screens = []
    # Search in structuredContent or result['content']
    content_list = result.get("result", {}).get("content", [])
    for item in content_list:
        text = item.get("text", "")
        if text.startswith("{"):
            try:
                parsed_text = json.loads(text)
                for comp in parsed_text.get("outputComponents", []):
                    design = comp.get("design", {})
                    for s in design.get("screens", []):
                        screens.append(s)
            except Exception as e:
                print("Error parsing text JSON:", e)
                
    if not screens:
        # Check structuredContent
        struct = result.get("result", {}).get("structuredContent", {})
        for comp in struct.get("outputComponents", []):
            design = comp.get("design", {})
            for s in design.get("screens", []):
                screens.append(s)

    print(f"Found {len(screens)} screens in response.")
    for idx, screen in enumerate(screens):
        screen_id = screen.get("id", f"screen_{idx}")
        title = screen.get("title", prefix)
        html_url = screen.get("htmlCode", {}).get("downloadUrl")
        img_url = screen.get("screenshot", {}).get("downloadUrl")
        
        print(f"Screen: {title} (ID: {screen_id})")
        if html_url:
            local_html = os.path.join(LOCAL_OUT_DIR, f"{prefix}.html")
            r = requests.get(html_url, timeout=60)
            with open(local_html, "wb") as f:
                f.write(r.content)
            print(f"Saved HTML to {local_html} ({len(r.content)} bytes)")
            
        if img_url:
            local_img = os.path.join(LOCAL_OUT_DIR, f"{prefix}.png")
            r = requests.get(img_url, timeout=60)
            with open(local_img, "wb") as f:
                f.write(r.content)
            print(f"Saved Image to {local_img} ({len(r.content)} bytes)")
            
            # Copy to artifact dir
            artifact_img = os.path.join(ARTIFACT_DIR, f"{prefix}.png")
            shutil.copy2(local_img, artifact_img)
            print(f"Copied Image to Artifacts: {artifact_img}")
            
    print("Done!")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "mobile"
    generate_and_save(target)
