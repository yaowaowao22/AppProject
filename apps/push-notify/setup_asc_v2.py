"""
App Store Connect - Update listing for かんたんプッシュ (marketing optimized)
"""
import jwt, time, requests, sys

KEY_ID = "WBL22JQ6B3"
ISSUER_ID = "0bc13228-682d-418b-a53e-d74894424555"
P8_PATH = "C:/Users/ytata/Downloads/AuthKey_WBL22JQ6B3.p8"
BUNDLE_ID = "com.massapp.pushnotify"
BASE = "https://api.appstoreconnect.apple.com/v1"

def token():
    with open(P8_PATH) as f:
        key = f.read()
    now = int(time.time())
    return jwt.encode({"iss": ISSUER_ID, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
                      key, algorithm="ES256", headers={"kid": KEY_ID})

def h():
    return {"Authorization": f"Bearer {token()}", "Content-Type": "application/json"}

def sj(r):
    try: return r.json()
    except: return {}

def ok(r):
    return r.status_code in (200, 201, 204)

def show_err(r):
    for e in sj(r).get("errors", []):
        msg = f"    {e.get('code','')}: {e.get('detail','')[:200]}"
        print(msg.encode('utf-8', errors='replace').decode('utf-8', errors='replace'))

def main():
    print("=" * 50)

    # Get app
    r = requests.get(f"{BASE}/apps", params={"filter[bundleId]": BUNDLE_ID}, headers=h())
    app_id = r.json()["data"][0]["id"]
    print(f"[OK] App: {app_id}")

    # ---- App Info Localization (subtitle, privacy URL) ----
    print("\n--- App Info Localization ---")
    r = requests.get(f"{BASE}/apps/{app_id}/appInfos", headers=h())
    ai_id = r.json()["data"][0]["id"]
    r = requests.get(f"{BASE}/appInfos/{ai_id}/appInfoLocalizations", headers=h())
    locs = r.json().get("data", [])
    ja = next((l for l in locs if l["attributes"]["locale"] == "ja"), None)

    subtitle = "API\u3092\u53e9\u3051\u3070\u3001\u30b9\u30de\u30db\u306b\u901a\u77e5\u304c\u5c4a\u304f"  # APIを叩けば、スマホに通知が届く

    if ja:
        r = requests.patch(f"{BASE}/appInfoLocalizations/{ja['id']}", headers=h(),
            json={"data": {"type": "appInfoLocalizations", "id": ja["id"], "attributes": {
                "subtitle": subtitle,
            }}})
    print(f"  [{'OK' if ok(r) else 'NG'}] Subtitle: {subtitle}")
    if not ok(r): show_err(r)

    # ---- Version Localization (description, keywords, promo) ----
    print("\n--- Version Localization ---")
    r = requests.get(f"{BASE}/apps/{app_id}/appStoreVersions", headers=h(),
                     params={"filter[platform]": "IOS", "limit": 1})
    vid = r.json()["data"][0]["id"]
    print(f"  Version: {vid}")

    r = requests.get(f"{BASE}/appStoreVersions/{vid}/appStoreVersionLocalizations", headers=h())
    locs = r.json().get("data", [])
    ja = next((l for l in locs if l["attributes"]["locale"] == "ja"), None)

    # ---- Crafted description ----
    desc = """\u300c\u304b\u3093\u305f\u3093\u30d7\u30c3\u30b7\u30e5\u300d\u306f\u3001\u305f\u3063\u305f1\u884c\u306eAPI\u3067\u30b9\u30de\u30db\u306b\u30d7\u30c3\u30b7\u30e5\u901a\u77e5\u3092\u9001\u308c\u308b\u30a2\u30d7\u30ea\u3067\u3059\u3002

\u30b5\u30fc\u30d0\u30fc\u304c\u843d\u3061\u305f\u3002\u30d3\u30eb\u30c9\u304c\u5931\u6557\u3057\u305f\u3002\u30bb\u30f3\u30b5\u30fc\u304c\u7570\u5e38\u5024\u3092\u691c\u77e5\u3057\u305f\u2015\u2015
\u305d\u3093\u306a\u3068\u304d\u3001\u3042\u306a\u305f\u306e\u30b9\u30de\u30db\u306b\u77ac\u6642\u306b\u901a\u77e5\u304c\u5c4a\u304d\u307e\u3059\u3002

\u25bc \u305f\u3063\u305f3\u30b9\u30c6\u30c3\u30d7\u3067\u59cb\u3081\u3089\u308c\u308b
(1) \u30a2\u30d7\u30ea\u3092\u958b\u3044\u3066API\u30ad\u30fc\u3092\u53d6\u5f97
(2) \u30b5\u30f3\u30d7\u30eb\u306ecurl\u30b3\u30de\u30f3\u30c9\u3092\u30b3\u30d4\u30fc
(3) \u30bf\u30fc\u30df\u30ca\u30eb\u3067\u5b9f\u884c\u2015\u2015\u3059\u3050\u306b\u901a\u77e5\u304c\u5c4a\u304f\uff01

\u25bc \u3053\u3093\u306a\u3068\u304d\u306b\u4fbf\u5229
\u30fb\u30b5\u30fc\u30d0\u30fc\u30c0\u30a6\u30f3\u3084\u30a8\u30e9\u30fc\u306e\u5373\u6642\u30a2\u30e9\u30fc\u30c8
\u30fb CI/CD\u306e\u30d3\u30eb\u30c9\u30fb\u30c7\u30d7\u30ed\u30a4\u7d50\u679c\u901a\u77e5
\u30fb IoT\u30bb\u30f3\u30b5\u30fc\u306e\u7570\u5e38\u691c\u77e5
\u30fb\u5b9a\u671f\u30b9\u30af\u30ea\u30d7\u30c8\u306e\u5b8c\u4e86\u901a\u77e5
\u30fb Web\u30b5\u30fc\u30d3\u30b9\u306e\u30a4\u30d9\u30f3\u30c8\u30c8\u30ea\u30ac\u30fc
\u30fb\u30b9\u30de\u30fc\u30c8\u30db\u30fc\u30e0\u306e\u81ea\u52d5\u5316\u901a\u77e5

\u25bc \u4e3b\u306a\u6a5f\u80fd
\u25a0 1\u884c\u306eHTTP\u30ea\u30af\u30a8\u30b9\u30c8\u3067\u901a\u77e5\u9001\u4fe1
\u25a0 4\u6bb5\u968e\u306e\u512a\u5148\u5ea6\uff08\u4f4e\u30fb\u901a\u5e38\u30fb\u9ad8\u30fb\u7dca\u6025\uff09
\u25a0 \u901a\u77e5\u306bURL\u3092\u542b\u3081\u3066\u30ef\u30f3\u30bf\u30c3\u30d7\u3067\u958b\u3051\u308b
\u25a0 \u53d7\u4fe1\u5c65\u6b74\u306e\u4e00\u89a7\u30fb\u691c\u7d22\u30fb\u30b9\u30ef\u30a4\u30d7\u524a\u9664
\u25a0 \u30c0\u30fc\u30af\u30e2\u30fc\u30c9\u5bfe\u5fdc
\u25a0 \u30a2\u30ab\u30a6\u30f3\u30c8\u767b\u9332\u4e0d\u8981\u2015\u2015\u30a4\u30f3\u30b9\u30c8\u30fc\u30eb\u3057\u3066\u3059\u3050\u4f7f\u3048\u308b

\u25bc \u30d7\u30e9\u30f3
\u25cb \u7121\u6599: \u6708\u306b10\u901a\u307e\u3067\u9001\u4fe1\u53ef\u80fd
\u25cb \u30d7\u30ec\u30df\u30a2\u30e0: \u00a5300\u306e\u8cb7\u3044\u5207\u308a\u3067\u9001\u4fe1\u7121\u5236\u9650

\u958b\u767a\u8005\u306e\u65b9\u3001\u30a4\u30f3\u30d5\u30e9\u62c5\u5f53\u306e\u65b9\u3001IoT\u611b\u597d\u5bb6\u306e\u65b9\u2015\u2015
\u3042\u306a\u305f\u306e\u300c\u77e5\u308a\u305f\u3044\u300d\u3092\u30b9\u30de\u30db\u306b\u5c4a\u3051\u307e\u3059\u3002"""

    # Max 100 chars for keywords, comma-separated
    keywords = "\u30d7\u30c3\u30b7\u30e5\u901a\u77e5,\u901a\u77e5\u30a2\u30d7\u30ea,API,\u30b5\u30fc\u30d0\u30fc\u76e3\u8996,\u30a2\u30e9\u30fc\u30c8,IoT,webhook,\u6b7b\u6d3b\u76e3\u8996,\u81ea\u52d5\u5316,CI CD,\u30a8\u30f3\u30b8\u30cb\u30a2,\u30ea\u30e2\u30fc\u30c8\u901a\u77e5"

    promo = "\u30b5\u30fc\u30d0\u30fc\u76e3\u8996\u3082IoT\u3082CI/CD\u3082\u2014\u2014API\u30921\u884c\u53e9\u304f\u3060\u3051\u3067\u30b9\u30de\u30db\u306b\u901a\u77e5\u304c\u5c4a\u304f\uff01"

    attrs = {
        "description": desc,
        "keywords": keywords,
        "promotionalText": promo,
    }

    if ja:
        r = requests.patch(f"{BASE}/appStoreVersionLocalizations/{ja['id']}", headers=h(),
                           json={"data": {"type": "appStoreVersionLocalizations", "id": ja["id"], "attributes": attrs}})
    print(f"  [{'OK' if ok(r) else 'NG'}] Description + keywords + promo")
    if not ok(r): show_err(r)

    print("\n" + "=" * 50)
    print("Done! Listing optimized.")
    print("=" * 50)

if __name__ == "__main__":
    main()
