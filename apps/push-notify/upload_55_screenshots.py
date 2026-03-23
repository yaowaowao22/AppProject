"""
Generate 5.5-inch screenshots from HTML using Playwright,
then upload to App Store Connect.
"""
import subprocess, sys, os, jwt, time, requests, json, hashlib

KEY_ID = "WBL22JQ6B3"
ISSUER_ID = "0bc13228-682d-418b-a53e-d74894424555"
P8_PATH = "C:/Users/ytata/Downloads/AuthKey_WBL22JQ6B3.p8"
BUNDLE_ID = "com.massapp.pushnotify"
BASE = "https://api.appstoreconnect.apple.com/v1"
HTML_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generate_screenshots.html")
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "screenshots_55")
TARGET_TYPE = "APP_IPHONE_55"
NUM_SCREENSHOTS = 4

def token():
    with open(P8_PATH) as f:
        key = f.read()
    now = int(time.time())
    return jwt.encode({"iss": ISSUER_ID, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
                      key, algorithm="ES256", headers={"kid": KEY_ID})

def h():
    return {"Authorization": f"Bearer {token()}", "Content-Type": "application/json"}

def show_err(r):
    for e in r.json().get("errors", []):
        print(f"    {e.get('code','')}: {e.get('detail','')[:200]}")

# ── Step 1: Generate screenshots with Playwright ──

def generate_screenshots():
    print("\n=== Step 1: Generating 5.5-inch screenshots ===")
    os.makedirs(OUT_DIR, exist_ok=True)

    from playwright.sync_api import sync_playwright

    html_url = "file:///" + HTML_PATH.replace("\\", "/")
    print(f"  Loading {html_url}")

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1242, "height": 2208})
        page.goto(html_url, wait_until="networkidle")

        # Switch to 5.5 inch
        page.select_option("#sizeSelect", "55")
        page.wait_for_timeout(500)

        # Remove preview scale for full-size capture
        page.evaluate("""() => {
            const container = document.getElementById('screenshotContainer');
            container.classList.remove('preview-scale', 's55');
        }""")
        page.wait_for_timeout(500)

        for i in range(1, NUM_SCREENSHOTS + 1):
            el = page.query_selector(f"#ss{i}")
            if not el:
                print(f"  [NG] #ss{i} not found")
                continue
            out_path = os.path.join(OUT_DIR, f"screenshot_{i}_5.5inch.png")
            el.screenshot(path=out_path)
            print(f"  [OK] Saved {out_path}")

        browser.close()

    # Verify files
    files = []
    for i in range(1, NUM_SCREENSHOTS + 1):
        p = os.path.join(OUT_DIR, f"screenshot_{i}_5.5inch.png")
        if os.path.exists(p):
            print(f"  [OK] {p} ({os.path.getsize(p)} bytes)")
            files.append(p)
        else:
            print(f"  [NG] {p} not found")
    return files


# ── Step 2: Upload to ASC ──

def upload_to_asc(files):
    print(f"\n=== Step 2: Uploading {len(files)} screenshots to ASC ===")

    # Get app
    r = requests.get(f"{BASE}/apps", params={"filter[bundleId]": BUNDLE_ID}, headers=h())
    app_id = r.json()["data"][0]["id"]
    print(f"[OK] App: {app_id}")

    # Get all versions, find editable one or create new
    r = requests.get(f"{BASE}/apps/{app_id}/appStoreVersions", headers=h(),
                     params={"filter[platform]": "IOS", "limit": 5})
    versions = r.json().get("data", [])

    editable_states = ["PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED",
                       "METADATA_REJECTED", "WAITING_FOR_REVIEW", "IN_REVIEW"]
    vid = None
    for v in versions:
        state = v["attributes"].get("appStoreState", "")
        ver_str = v["attributes"].get("versionString", "")
        print(f"  Version {ver_str}: {state}")
        if state in editable_states:
            vid = v["id"]
            print(f"  -> Using editable version: {vid}")
            break

    if not vid:
        # Create new version for metadata update
        # Get current version string to increment
        current_ver = versions[0]["attributes"].get("versionString", "1.0.0")
        parts = current_ver.split(".")
        parts[-1] = str(int(parts[-1]) + 1)
        new_ver = ".".join(parts)
        print(f"\n  Creating new version {new_ver} for metadata update...")

        r = requests.post(f"{BASE}/appStoreVersions", headers=h(), json={
            "data": {
                "type": "appStoreVersions",
                "attributes": {"versionString": new_ver, "platform": "IOS"},
                "relationships": {
                    "app": {"data": {"type": "apps", "id": app_id}}
                }
            }
        })
        if r.status_code not in (200, 201):
            print(f"  [NG] Create version failed: {r.status_code}")
            show_err(r)
            return False, None, None
        vid = r.json()["data"]["id"]
        new_state = r.json()["data"]["attributes"].get("appStoreState", "?")
        print(f"  [OK] Created version {new_ver} (id={vid}, state={new_state})")

        # Attach the same build as current live version
        live_vid = versions[0]["id"]
        r = requests.get(f"{BASE}/appStoreVersions/{live_vid}/build", headers=h())
        if r.status_code == 200 and r.json().get("data"):
            build_id = r.json()["data"]["id"]
            print(f"  Attaching build {build_id} to new version...")
            r = requests.patch(f"{BASE}/appStoreVersions/{vid}/relationships/build", headers=h(), json={
                "data": {"type": "builds", "id": build_id}
            })
            if r.status_code in (200, 204):
                print(f"  [OK] Build attached")
            else:
                print(f"  [WARN] Build attach: {r.status_code}")
                show_err(r)

    # Get ja localization for the version
    r = requests.get(f"{BASE}/appStoreVersions/{vid}/appStoreVersionLocalizations", headers=h())
    locs = r.json().get("data", [])
    ja = next((l for l in locs if l["attributes"]["locale"] == "ja"), None)
    if not ja:
        print("[NG] No ja localization")
        return False, None, None
    loc_id = ja["id"]

    # Get existing screenshot sets
    r = requests.get(f"{BASE}/appStoreVersionLocalizations/{loc_id}/appScreenshotSets", headers=h())
    sets = r.json().get("data", [])
    existing = next((s for s in sets if s["attributes"]["screenshotDisplayType"] == TARGET_TYPE), None)

    if existing:
        set_id = existing["id"]
        print(f"[OK] Existing 5.5-inch set: {set_id}")
        # Delete old screenshots
        r = requests.get(f"{BASE}/appScreenshotSets/{set_id}/appScreenshots", headers=h())
        for old in r.json().get("data", []):
            dr = requests.delete(f"{BASE}/appScreenshots/{old['id']}", headers=h())
            print(f"  Deleted {old['id']} ({dr.status_code})")
    else:
        print("Creating 5.5-inch screenshot set...")
        r = requests.post(f"{BASE}/appScreenshotSets", headers=h(), json={
            "data": {
                "type": "appScreenshotSets",
                "attributes": {"screenshotDisplayType": TARGET_TYPE},
                "relationships": {
                    "appStoreVersionLocalization": {
                        "data": {"type": "appStoreVersionLocalizations", "id": loc_id}
                    }
                }
            }
        })
        if r.status_code not in (200, 201):
            print(f"[NG] Create set failed: {r.status_code}")
            show_err(r)
            return False, None, None, None
        set_id = r.json()["data"]["id"]
        print(f"[OK] Created set: {set_id}")

    # Upload each screenshot
    for idx, path in enumerate(files):
        file_size = os.path.getsize(path)
        file_name = os.path.basename(path)
        print(f"\n  Uploading {idx+1}/{len(files)}: {file_name} ({file_size} bytes)")

        # Reserve
        r = requests.post(f"{BASE}/appScreenshots", headers=h(), json={
            "data": {
                "type": "appScreenshots",
                "attributes": {"fileName": file_name, "fileSize": file_size},
                "relationships": {
                    "appScreenshotSet": {"data": {"type": "appScreenshotSets", "id": set_id}}
                }
            }
        })
        if r.status_code not in (200, 201):
            print(f"  [NG] Reserve failed: {r.status_code}")
            show_err(r)
            continue

        ss_data = r.json()["data"]
        ss_id = ss_data["id"]
        upload_ops = ss_data["attributes"].get("uploadOperations", [])
        cs = ss_data["attributes"].get("sourceFileChecksum")
        checksum = cs.get("value", "") if cs else ""
        print(f"  [OK] Reserved (id={ss_id}, {len(upload_ops)} ops, checksum={checksum[:16]}...)")

        # Upload binary
        with open(path, "rb") as f:
            file_bytes = f.read()

        all_ok = True
        for op in upload_ops:
            url = op["url"]
            op_headers = {rh["name"]: rh["value"] for rh in op.get("requestHeaders", [])}
            offset = op["offset"]
            length = op["length"]
            chunk = file_bytes[offset:offset + length]
            resp = requests.request(op["method"], url, headers=op_headers, data=chunk)
            if resp.status_code not in (200, 201):
                print(f"  [NG] Upload chunk failed: {resp.status_code}")
                all_ok = False
                break

        if not all_ok:
            continue

        # Commit
        r = requests.patch(f"{BASE}/appScreenshots/{ss_id}", headers=h(), json={
            "data": {
                "type": "appScreenshots",
                "id": ss_id,
                "attributes": {"uploaded": True, "sourceFileChecksum": checksum}
            }
        })
        if r.status_code in (200, 201):
            print(f"  [OK] Uploaded {file_name}")
        else:
            print(f"  [NG] Commit failed: {r.status_code}")
            show_err(r)

    return True, app_id, vid


# ── Step 3: Submit for review ──

def submit_for_review(app_id, vid):
    print(f"\n=== Step 3: Submitting for review ===")

    # Check for existing pending reviewSubmission
    r = requests.get(f"{BASE}/reviewSubmissions", headers=h(),
                     params={"filter[app]": app_id, "filter[state]": "READY_FOR_REVIEW,UNRESOLVED"})
    existing = r.json().get("data", [])

    if existing:
        sub_id = existing[0]["id"]
        state = existing[0]["attributes"].get("state", "?")
        print(f"  Found existing submission: {sub_id} (state={state})")
        # Delete it and recreate
        requests.delete(f"{BASE}/reviewSubmissions/{sub_id}", headers=h())
        print(f"  Deleted old submission")

    # 1. Create reviewSubmission
    r = requests.post(f"{BASE}/reviewSubmissions", headers=h(), json={
        "data": {
            "type": "reviewSubmissions",
            "attributes": {"platform": "IOS"},
            "relationships": {
                "app": {"data": {"type": "apps", "id": app_id}}
            }
        }
    })
    if r.status_code not in (200, 201):
        print(f"[NG] Create reviewSubmission failed: {r.status_code}")
        show_err(r)
        return False

    sub_id = r.json()["data"]["id"]
    print(f"[OK] Review submission: {sub_id}")

    # 2. Add the app store version as item
    r = requests.post(f"{BASE}/reviewSubmissionItems", headers=h(), json={
        "data": {
            "type": "reviewSubmissionItems",
            "relationships": {
                "reviewSubmission": {"data": {"type": "reviewSubmissions", "id": sub_id}},
                "appStoreVersion": {"data": {"type": "appStoreVersions", "id": vid}}
            }
        }
    })
    if r.status_code not in (200, 201):
        print(f"[NG] Add item failed: {r.status_code}")
        show_err(r)
        return False
    print(f"[OK] Added version {vid} to submission")

    # 3. Confirm submission
    r = requests.patch(f"{BASE}/reviewSubmissions/{sub_id}", headers=h(), json={
        "data": {
            "type": "reviewSubmissions",
            "id": sub_id,
            "attributes": {"submitted": True}
        }
    })
    if r.status_code in (200, 201):
        print("[OK] Submitted for review!")
        return True
    else:
        print(f"[NG] Confirm failed: {r.status_code}")
        show_err(r)
        return False


# ── Main ──

def main():
    print("=" * 50)
    print("5.5-inch Screenshot Upload Pipeline")
    print("=" * 50)

    files = generate_screenshots()
    if not files:
        print("\n[NG] No screenshots generated. Aborting.")
        sys.exit(1)

    success, app_id, vid = upload_to_asc(files)

    if success and app_id and vid:
        submit_for_review(app_id, vid)

    print(f"\n{'=' * 50}")
    if success:
        print("Done! 5.5-inch screenshots uploaded and submitted.")
    else:
        print("Upload had errors. Check output above.")
    print("=" * 50)

if __name__ == "__main__":
    main()
