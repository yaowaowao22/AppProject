"""
App Store Connect - Screenshot upload for TANREN
Downloads from largest available set, resizes to target sizes, and uploads.
Supports 6.7", 6.5", 5.5" screenshot sets.
"""
import jwt, time, requests, sys, os, io
from PIL import Image

KEY_ID = "WBL22JQ6B3"
ISSUER_ID = "0bc13228-682d-418b-a53e-d74894424555"
P8_PATH = "C:/Users/ytata/Downloads/AuthKey_WBL22JQ6B3.p8"
BUNDLE_ID = "com.massapp.fitness"
BASE = "https://api.appstoreconnect.apple.com/v1"

# Target screenshot sizes
TARGETS = {
    "APP_IPHONE_67": (1290, 2796),  # 6.7 inch (15 Pro Max)
    "APP_IPHONE_65": (1242, 2688),  # 6.5 inch (11 Pro Max)
    "APP_IPHONE_55": (1242, 2208),  # 5.5 inch (8 Plus)
}

def token():
    with open(P8_PATH) as f:
        key = f.read()
    now = int(time.time())
    return jwt.encode({"iss": ISSUER_ID, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
                      key, algorithm="ES256", headers={"kid": KEY_ID})

def h():
    return {"Authorization": f"Bearer {token()}", "Content-Type": "application/json"}

def upload_screenshots(set_id, image_paths):
    """Upload screenshot images to an ASC screenshot set."""
    # Delete existing screenshots
    r = requests.get(f"{BASE}/appScreenshotSets/{set_id}/appScreenshots", headers=h())
    old_ss = r.json().get("data", [])
    for old in old_ss:
        requests.delete(f"{BASE}/appScreenshots/{old['id']}", headers=h())
        print(f"    Deleted old screenshot {old['id']}")

    for path in image_paths:
        file_size = os.path.getsize(path)
        file_name = os.path.basename(path)

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
            print(f"    [NG] Reserve failed for {file_name}: {r.status_code}")
            for e in r.json().get("errors", []):
                print(f"      {e.get('code','')}: {e.get('detail','')[:200]}")
            continue

        ss_data = r.json()["data"]
        ss_id = ss_data["id"]
        upload_ops = ss_data["attributes"].get("uploadOperations", [])

        # Upload binary
        with open(path, "rb") as f:
            file_bytes = f.read()

        all_ok = True
        for op in upload_ops:
            op_headers = {rh["name"]: rh["value"] for rh in op.get("requestHeaders", [])}
            chunk = file_bytes[op["offset"]:op["offset"] + op["length"]]
            resp = requests.request(op["method"], op["url"], headers=op_headers, data=chunk)
            if resp.status_code not in (200, 201):
                print(f"    [NG] Upload chunk failed: {resp.status_code}")
                all_ok = False
                break

        if not all_ok:
            continue

        # Commit
        r = requests.patch(f"{BASE}/appScreenshots/{ss_id}", headers=h(), json={
            "data": {
                "type": "appScreenshots",
                "id": ss_id,
                "attributes": {
                    "uploaded": True,
                    "sourceFileChecksum": (ss_data["attributes"].get("sourceFileChecksum") or {}).get("value", "")
                }
            }
        })
        status = "OK" if r.status_code in (200, 201) else "NG"
        print(f"    [{status}] {file_name}")

def resize_image(img, target_w, target_h):
    """Resize image to target dimensions, padding if needed."""
    src_ratio = img.width / img.height
    tgt_ratio = target_w / target_h

    if abs(src_ratio - tgt_ratio) < 0.01:
        return img.resize((target_w, target_h), Image.LANCZOS)

    if src_ratio > tgt_ratio:
        new_w = target_w
        new_h = int(target_w / src_ratio)
    else:
        new_h = target_h
        new_w = int(target_h * src_ratio)

    resized_inner = img.resize((new_w, new_h), Image.LANCZOS)
    bg_color = resized_inner.getpixel((0, 0))
    result = Image.new("RGB", (target_w, target_h), bg_color)
    x_offset = (target_w - new_w) // 2
    y_offset = (target_h - new_h) // 2
    result.paste(resized_inner, (x_offset, y_offset))
    return result

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "local"

    print("=" * 50)
    print("TANREN Screenshot Manager")
    print(f"Mode: {mode}")
    print("=" * 50)

    # Get app
    r = requests.get(f"{BASE}/apps", params={"filter[bundleId]": BUNDLE_ID}, headers=h())
    data = r.json().get("data", [])
    if not data:
        print("[NG] App not found")
        sys.exit(1)
    app_id = data[0]["id"]
    print(f"[OK] App: {app_id}")

    # Get latest version
    r = requests.get(f"{BASE}/apps/{app_id}/appStoreVersions", headers=h(),
                     params={"filter[platform]": "IOS", "limit": 1})
    vers = r.json().get("data", [])
    if not vers:
        print("[NG] No version found")
        sys.exit(1)
    vid = vers[0]["id"]
    print(f"[OK] Version: {vid}")

    # Get localization
    r = requests.get(f"{BASE}/appStoreVersions/{vid}/appStoreVersionLocalizations", headers=h())
    locs = r.json().get("data", [])
    loc = next((l for l in locs if l["attributes"]["locale"] in ("en-US", "ja")), locs[0] if locs else None)
    if not loc:
        print("[NG] No localization found")
        sys.exit(1)
    print(f"[OK] Locale: {loc['attributes']['locale']}")
    loc_id = loc["id"]

    if mode == "local":
        # Upload from local screenshots/ directory
        screenshots_dir = "screenshots"
        if not os.path.exists(screenshots_dir):
            print(f"\n[INFO] Place screenshot PNG files in '{screenshots_dir}/' directory.")
            print("  Expected: screenshot_1.png, screenshot_2.png, ... (up to 10)")
            print(f"  Resolution: any of {list(TARGETS.values())}")
            os.makedirs(screenshots_dir, exist_ok=True)
            sys.exit(0)

        files = sorted([f for f in os.listdir(screenshots_dir) if f.endswith(".png")])
        if not files:
            print(f"[NG] No PNG files in {screenshots_dir}/")
            sys.exit(1)

        print(f"\n[OK] Found {len(files)} screenshots")

        # Load source images
        source_images = []
        for f in files:
            path = os.path.join(screenshots_dir, f)
            img = Image.open(path)
            source_images.append((f, img))
            print(f"  {f}: {img.size}")

        # Get existing screenshot sets
        r = requests.get(f"{BASE}/appStoreVersionLocalizations/{loc_id}/appScreenshotSets", headers=h())
        existing_sets = {s["attributes"]["screenshotDisplayType"]: s["id"] for s in r.json().get("data", [])}

        # For each target size, resize and upload
        for display_type, (tw, th) in TARGETS.items():
            print(f"\n--- {display_type} ({tw}x{th}) ---")

            # Resize
            out_dir = f"screenshots_{display_type}"
            os.makedirs(out_dir, exist_ok=True)
            resized_paths = []
            for fname, img in source_images:
                resized = resize_image(img, tw, th)
                out_path = os.path.join(out_dir, fname)
                resized.save(out_path, "PNG")
                resized_paths.append(out_path)
                print(f"  Resized: {fname} -> {tw}x{th}")

            # Get or create screenshot set
            if display_type in existing_sets:
                set_id = existing_sets[display_type]
                print(f"  Using existing set: {set_id}")
            else:
                r = requests.post(f"{BASE}/appScreenshotSets", headers=h(), json={
                    "data": {
                        "type": "appScreenshotSets",
                        "attributes": {"screenshotDisplayType": display_type},
                        "relationships": {
                            "appStoreVersionLocalization": {
                                "data": {"type": "appStoreVersionLocalizations", "id": loc_id}
                            }
                        }
                    }
                })
                if r.status_code not in (200, 201):
                    print(f"  [NG] Failed to create set: {r.status_code}")
                    continue
                set_id = r.json()["data"]["id"]
                print(f"  Created set: {set_id}")

            upload_screenshots(set_id, resized_paths)

    elif mode == "resize":
        # Download from largest set and resize to smaller sets
        r = requests.get(f"{BASE}/appStoreVersionLocalizations/{loc_id}/appScreenshotSets", headers=h())
        sets = r.json().get("data", [])
        existing = {s["attributes"]["screenshotDisplayType"]: s["id"] for s in sets}

        # Find source (largest available)
        source_type = None
        for dt in ["APP_IPHONE_67", "APP_IPHONE_65", "APP_IPHONE_61"]:
            if dt in existing:
                source_type = dt
                break

        if not source_type:
            print("[NG] No source screenshots found")
            sys.exit(1)

        print(f"\nSource: {source_type}")
        r = requests.get(f"{BASE}/appScreenshotSets/{existing[source_type]}/appScreenshots", headers=h())
        screenshots = r.json().get("data", [])

        # Download
        source_images = []
        for i, ss in enumerate(screenshots):
            url = ss["attributes"].get("imageAsset", {}).get("templateUrl", "")
            if not url: continue
            w = ss["attributes"]["imageAsset"]["width"]
            hv = ss["attributes"]["imageAsset"]["height"]
            url = url.replace("{w}", str(w)).replace("{h}", str(hv)).replace("{f}", "png")
            img_r = requests.get(url)
            if img_r.status_code == 200:
                img = Image.open(io.BytesIO(img_r.content))
                source_images.append((f"screenshot_{i+1}.png", img))

        # Resize and upload to missing sets
        for display_type, (tw, th) in TARGETS.items():
            if display_type == source_type:
                continue
            print(f"\n--- {display_type} ({tw}x{th}) ---")
            out_dir = f"screenshots_{display_type}"
            os.makedirs(out_dir, exist_ok=True)
            resized_paths = []
            for fname, img in source_images:
                resized = resize_image(img, tw, th)
                out_path = os.path.join(out_dir, fname)
                resized.save(out_path, "PNG")
                resized_paths.append(out_path)

            if display_type in existing:
                set_id = existing[display_type]
            else:
                r = requests.post(f"{BASE}/appScreenshotSets", headers=h(), json={
                    "data": {
                        "type": "appScreenshotSets",
                        "attributes": {"screenshotDisplayType": display_type},
                        "relationships": {
                            "appStoreVersionLocalization": {
                                "data": {"type": "appStoreVersionLocalizations", "id": loc_id}
                            }
                        }
                    }
                })
                if r.status_code not in (200, 201): continue
                set_id = r.json()["data"]["id"]

            upload_screenshots(set_id, resized_paths)

    print(f"\n{'=' * 50}")
    print("Done!")
    print("=" * 50)

if __name__ == "__main__":
    main()
