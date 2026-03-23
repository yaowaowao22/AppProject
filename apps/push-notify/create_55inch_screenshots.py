"""
Download existing screenshots from App Store Connect,
resize to 5.5-inch (1242x2208), and upload them.
"""
import jwt, time, requests, sys, os, io
from PIL import Image

KEY_ID = "WBL22JQ6B3"
ISSUER_ID = "0bc13228-682d-418b-a53e-d74894424555"
P8_PATH = "C:/Users/ytata/Downloads/AuthKey_WBL22JQ6B3.p8"
BUNDLE_ID = "com.massapp.pushnotify"
BASE = "https://api.appstoreconnect.apple.com/v1"

TARGET_W, TARGET_H = 1242, 2208  # 5.5 inch

def token():
    with open(P8_PATH) as f:
        key = f.read()
    now = int(time.time())
    return jwt.encode({"iss": ISSUER_ID, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
                      key, algorithm="ES256", headers={"kid": KEY_ID})

def h():
    return {"Authorization": f"Bearer {token()}", "Content-Type": "application/json"}

def h_no_ct():
    return {"Authorization": f"Bearer {token()}"}

def main():
    print("=" * 50)
    print("5.5-inch Screenshot Creator")
    print("=" * 50)

    # Get app
    r = requests.get(f"{BASE}/apps", params={"filter[bundleId]": BUNDLE_ID}, headers=h())
    app_id = r.json()["data"][0]["id"]
    print(f"[OK] App: {app_id}")

    # Get latest version
    r = requests.get(f"{BASE}/apps/{app_id}/appStoreVersions", headers=h(),
                     params={"filter[platform]": "IOS", "limit": 1})
    vers = r.json().get("data", [])
    if not vers:
        print("[NG] No version found")
        sys.exit(1)
    vid = vers[0]["id"]
    state = vers[0]["attributes"].get("appStoreState", "?")
    print(f"[OK] Version: {vid} (state={state})")

    # Get version localizations
    r = requests.get(f"{BASE}/appStoreVersions/{vid}/appStoreVersionLocalizations", headers=h())
    locs = r.json().get("data", [])
    ja = next((l for l in locs if l["attributes"]["locale"] == "ja"), None)
    if not ja:
        print("[NG] No ja localization")
        sys.exit(1)
    loc_id = ja["id"]
    print(f"[OK] Localization: {loc_id}")

    # Get screenshot sets
    r = requests.get(f"{BASE}/appStoreVersionLocalizations/{loc_id}/appScreenshotSets", headers=h())
    sets = r.json().get("data", [])
    print(f"\n--- Existing screenshot sets ---")
    for s in sets:
        dtype = s["attributes"]["screenshotDisplayType"]
        print(f"  {dtype} (id={s['id']})")

    # Find source screenshots (prefer 6.7 inch, fallback to 6.5, then 6.1)
    source_types = [
        "APP_IPHONE_67",
        "APP_IPHONE_65",
        "APP_IPHONE_61",
    ]
    source_set = None
    for stype in source_types:
        source_set = next((s for s in sets if s["attributes"]["screenshotDisplayType"] == stype), None)
        if source_set:
            print(f"\n[OK] Source: {stype}")
            break

    if not source_set:
        print("\n[NG] No source screenshot set found (tried 6.7, 6.5, 6.1 inch)")
        sys.exit(1)

    # Get screenshots from source set
    r = requests.get(f"{BASE}/appScreenshotSets/{source_set['id']}/appScreenshots", headers=h())
    screenshots = r.json().get("data", [])
    if not screenshots:
        print("[NG] No screenshots in source set")
        sys.exit(1)
    print(f"[OK] Found {len(screenshots)} source screenshots")

    # Download source screenshots
    os.makedirs("screenshots_55", exist_ok=True)
    source_images = []
    for i, ss in enumerate(screenshots):
        url = ss["attributes"].get("imageAsset", {}).get("templateUrl", "")
        if not url:
            print(f"  [SKIP] Screenshot {i}: no image URL")
            continue
        # Template URL has {w}x{h} placeholders
        w = ss["attributes"]["imageAsset"]["width"]
        h_val = ss["attributes"]["imageAsset"]["height"]
        url = url.replace("{w}", str(w)).replace("{h}", str(h_val)).replace("{f}", "png")
        print(f"  Downloading {i+1}/{len(screenshots)} ({w}x{h_val})...")
        img_r = requests.get(url)
        if img_r.status_code == 200:
            img = Image.open(io.BytesIO(img_r.content))
            source_images.append((i, img))
            print(f"    [OK] {img.size}")
        else:
            print(f"    [NG] HTTP {img_r.status_code}")

    if not source_images:
        print("[NG] Failed to download any screenshots")
        sys.exit(1)

    # Resize to 5.5 inch
    print(f"\n--- Resizing to {TARGET_W}x{TARGET_H} ---")
    resized_paths = []
    for i, img in source_images:
        # Resize maintaining aspect ratio, then pad/crop
        src_ratio = img.width / img.height
        tgt_ratio = TARGET_W / TARGET_H

        if abs(src_ratio - tgt_ratio) < 0.01:
            # Same aspect ratio - just resize
            resized = img.resize((TARGET_W, TARGET_H), Image.LANCZOS)
        else:
            # Different aspect ratio - resize to fit, then pad
            if src_ratio > tgt_ratio:
                new_w = TARGET_W
                new_h = int(TARGET_W / src_ratio)
            else:
                new_h = TARGET_H
                new_w = int(TARGET_H * src_ratio)
            resized_inner = img.resize((new_w, new_h), Image.LANCZOS)
            # Create background (sample from top-left pixel or white)
            bg_color = resized_inner.getpixel((0, 0))
            resized = Image.new("RGB", (TARGET_W, TARGET_H), bg_color)
            x_offset = (TARGET_W - new_w) // 2
            y_offset = (TARGET_H - new_h) // 2
            resized.paste(resized_inner, (x_offset, y_offset))

        path = f"screenshots_55/screenshot_{i+1}.png"
        resized.save(path, "PNG")
        resized_paths.append(path)
        print(f"  [OK] {path} ({resized.size})")

    # Create or find 5.5 inch screenshot set
    TARGET_TYPE = "APP_IPHONE_55"
    existing_55 = next((s for s in sets if s["attributes"]["screenshotDisplayType"] == TARGET_TYPE), None)

    if existing_55:
        set_id = existing_55["id"]
        print(f"\n[OK] Using existing 5.5-inch set: {set_id}")
        # Delete existing screenshots in the set
        r = requests.get(f"{BASE}/appScreenshotSets/{set_id}/appScreenshots", headers=h())
        old_ss = r.json().get("data", [])
        for old in old_ss:
            requests.delete(f"{BASE}/appScreenshots/{old['id']}", headers=h())
            print(f"  Deleted old screenshot {old['id']}")
    else:
        print(f"\n--- Creating 5.5-inch screenshot set ---")
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
            print(f"[NG] Failed to create set: {r.status_code}")
            for e in r.json().get("errors", []):
                print(f"  {e.get('code','')}: {e.get('detail','')[:200]}")
            sys.exit(1)
        set_id = r.json()["data"]["id"]
        print(f"[OK] Created set: {set_id}")

    # Upload screenshots
    print(f"\n--- Uploading {len(resized_paths)} screenshots ---")
    for idx, path in enumerate(resized_paths):
        file_size = os.path.getsize(path)
        file_name = os.path.basename(path)

        # Step 1: Reserve upload
        r = requests.post(f"{BASE}/appScreenshots", headers=h(), json={
            "data": {
                "type": "appScreenshots",
                "attributes": {
                    "fileName": file_name,
                    "fileSize": file_size,
                },
                "relationships": {
                    "appScreenshotSet": {
                        "data": {"type": "appScreenshotSets", "id": set_id}
                    }
                }
            }
        })
        if r.status_code not in (200, 201):
            print(f"  [NG] Reserve failed for {file_name}: {r.status_code}")
            for e in r.json().get("errors", []):
                print(f"    {e.get('code','')}: {e.get('detail','')[:200]}")
            continue

        ss_data = r.json()["data"]
        ss_id = ss_data["id"]
        upload_ops = ss_data["attributes"].get("uploadOperations", [])
        print(f"  [OK] Reserved {file_name} (id={ss_id}, {len(upload_ops)} upload ops)")

        # Step 2: Upload binary parts
        with open(path, "rb") as f:
            file_bytes = f.read()

        all_ok = True
        for op in upload_ops:
            method = op["method"]
            url = op["url"]
            op_headers = {rh["name"]: rh["value"] for rh in op.get("requestHeaders", [])}
            offset = op["offset"]
            length = op["length"]
            chunk = file_bytes[offset:offset + length]

            resp = requests.request(method, url, headers=op_headers, data=chunk)
            if resp.status_code not in (200, 201):
                print(f"    [NG] Upload chunk failed: {resp.status_code}")
                all_ok = False
                break

        if not all_ok:
            continue

        # Step 3: Commit upload
        r = requests.patch(f"{BASE}/appScreenshots/{ss_id}", headers=h(), json={
            "data": {
                "type": "appScreenshots",
                "id": ss_id,
                "attributes": {
                    "uploaded": True,
                    "sourceFileChecksum": ss_data["attributes"].get("sourceFileChecksum", {}).get("value", "")
                }
            }
        })
        if r.status_code in (200, 201):
            print(f"  [OK] Uploaded {file_name}")
        else:
            print(f"  [NG] Commit failed: {r.status_code}")
            for e in r.json().get("errors", []):
                print(f"    {e.get('code','')}: {e.get('detail','')[:200]}")

    print(f"\n{'=' * 50}")
    print("Done! 5.5-inch screenshots uploaded.")
    print("No re-review needed - metadata updates are instant.")
    print("It may take up to 24-48 hours to appear in search results.")
    print("=" * 50)

if __name__ == "__main__":
    main()
