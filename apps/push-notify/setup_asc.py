"""
App Store Connect - Full setup for かんたんプッシュ (no submission)
- App info, categories, localization
- Version description, keywords
- Review info
- Age rating
"""
import jwt, time, requests, json, sys

KEY_ID = "WBL22JQ6B3"
ISSUER_ID = "0bc13228-682d-418b-a53e-d74894424555"
P8_PATH = "C:/Users/ytata/Downloads/AuthKey_WBL22JQ6B3.p8"
BUNDLE_ID = "com.massapp.pushnotify"
APP_NAME = "\u304b\u3093\u305f\u3093\u30d7\u30c3\u30b7\u30e5"
BASE = "https://api.appstoreconnect.apple.com/v1"
PRIVACY_URL = "https://push-api.selectinfo-yaowao.workers.dev/privacy"
SUPPORT_URL = "https://push-api.selectinfo-yaowao.workers.dev/privacy"

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

def ok(r, expect=200):
    return r.status_code == expect or r.status_code in (200, 201, 204)

def show_err(r):
    for e in sj(r).get("errors", []):
        print(f"    {e.get('code','')}: {e.get('detail','')[:150]}")

# ==================== App ====================
def get_app():
    r = requests.get(f"{BASE}/apps", params={"filter[bundleId]": BUNDLE_ID}, headers=h())
    data = r.json().get("data", [])
    if data:
        print(f"[OK] App: id={data[0]['id']}")
        return data[0]["id"]
    print("[NG] App not found"); return None

# ==================== Categories ====================
def set_categories(app_id):
    print("\n--- Categories ---")
    r = requests.get(f"{BASE}/apps/{app_id}/appInfos", headers=h())
    infos = r.json().get("data", [])
    if not infos: print("  No appInfos"); return None
    ai_id = infos[0]["id"]
    r = requests.patch(f"{BASE}/appInfos/{ai_id}", headers=h(), json={
        "data": {"type": "appInfos", "id": ai_id, "relationships": {
            "primaryCategory": {"data": {"type": "appCategories", "id": "UTILITIES"}},
            "secondaryCategory": {"data": {"type": "appCategories", "id": "DEVELOPER_TOOLS"}},
        }}
    })
    print(f"  [{'OK' if ok(r) else 'NG'}] Utilities + Developer Tools")
    if not ok(r): show_err(r)
    return ai_id

# ==================== App Info Localization ====================
def set_app_info_loc(ai_id):
    print("\n--- App Info Localization ---")
    r = requests.get(f"{BASE}/appInfos/{ai_id}/appInfoLocalizations", headers=h())
    locs = r.json().get("data", [])
    ja = next((l for l in locs if l["attributes"]["locale"] == "ja"), None)
    attrs = {
        "name": APP_NAME,
        "subtitle": "API\u3067\u30b9\u30de\u30db\u306b\u30d7\u30c3\u30b7\u30e5\u901a\u77e5",
        "privacyPolicyUrl": PRIVACY_URL,
    }
    if ja:
        r = requests.patch(f"{BASE}/appInfoLocalizations/{ja['id']}", headers=h(),
                           json={"data": {"type": "appInfoLocalizations", "id": ja["id"], "attributes": attrs}})
    else:
        r = requests.post(f"{BASE}/appInfoLocalizations", headers=h(), json={
            "data": {"type": "appInfoLocalizations", "attributes": {**attrs, "locale": "ja"},
                     "relationships": {"appInfo": {"data": {"type": "appInfos", "id": ai_id}}}}})
    print(f"  [{'OK' if ok(r) else 'NG'}] ja: {APP_NAME} / API\u3067\u30b9\u30de\u30db\u306b\u30d7\u30c3\u30b7\u30e5\u901a\u77e5")
    if not ok(r): show_err(r)

# ==================== Version Localization ====================
def set_version_loc(app_id):
    print("\n--- Version Localization ---")
    r = requests.get(f"{BASE}/apps/{app_id}/appStoreVersions", headers=h(),
                     params={"filter[platform]": "IOS", "limit": 1})
    vers = r.json().get("data", [])
    if not vers: print("  No version yet"); return None
    vid = vers[0]["id"]
    state = vers[0]["attributes"].get("appStoreState", "?")
    print(f"  Version: {vid} (state={state})")

    r = requests.get(f"{BASE}/appStoreVersions/{vid}/appStoreVersionLocalizations", headers=h())
    locs = r.json().get("data", [])
    ja = next((l for l in locs if l["attributes"]["locale"] == "ja"), None)

    desc = """\u304b\u3093\u305f\u3093\u30d7\u30c3\u30b7\u30e5\u306f\u3001\u5916\u90e8\u30b5\u30fc\u30d3\u30b9\u3084\u30b9\u30af\u30ea\u30d7\u30c8\u304b\u3089\u30b9\u30de\u30db\u306b\u30d7\u30c3\u30b7\u30e5\u901a\u77e5\u3092\u9001\u308c\u308b\u30a2\u30d7\u30ea\u3067\u3059\u3002

\u3010\u4f7f\u3044\u65b9\u3011
1. \u30a2\u30d7\u30ea\u3067API\u30ad\u30fc\u3092\u53d6\u5f97
2. \u5916\u90e8\u30b5\u30fc\u30d3\u30b9\u304b\u3089HTTP API\u3067\u901a\u77e5\u3092\u9001\u4fe1
3. \u30b9\u30de\u30db\u306b\u30d7\u30c3\u30b7\u30e5\u901a\u77e5\u304c\u5c4a\u304f

\u3010\u4e3b\u306a\u6a5f\u80fd\u3011
\u25a0 \u30b7\u30f3\u30d7\u30eb\u306aREST API
curl\u30b3\u30de\u30f3\u30c9\u30841\u884c\u3067\u901a\u77e5\u3092\u9001\u4fe1\u3002\u30b5\u30f3\u30d7\u30eb\u30b3\u30fc\u30c9\u3092\u30b3\u30d4\u30fc\u3059\u308b\u3060\u3051\u3067\u3059\u3050\u306b\u59cb\u3081\u3089\u308c\u307e\u3059\u3002

\u25a0 \u512a\u5148\u5ea6\u8a2d\u5b9a
\u901a\u77e5\u306b4\u6bb5\u968e\u306e\u512a\u5148\u5ea6\uff08\u4f4e\u30fb\u901a\u5e38\u30fb\u9ad8\u30fb\u7dca\u6025\uff09\u3092\u8a2d\u5b9a\u53ef\u80fd\u3002\u91cd\u8981\u306a\u30a2\u30e9\u30fc\u30c8\u3092\u898b\u9003\u3057\u307e\u305b\u3093\u3002

\u25a0 \u901a\u77e5\u5c65\u6b74\u30fb\u691c\u7d22
\u53d7\u4fe1\u3057\u305f\u901a\u77e5\u3092\u4e00\u89a7\u3067\u78ba\u8a8d\u3002\u30ad\u30fc\u30ef\u30fc\u30c9\u691c\u7d22\u3067\u7d20\u65e9\u304f\u898b\u3064\u3051\u3089\u308c\u307e\u3059\u3002

\u25a0 URL\u30ea\u30f3\u30af\u5bfe\u5fdc
\u901a\u77e5\u306bURL\u3092\u542b\u3081\u308b\u3068\u3001\u30bf\u30c3\u30d7\u3067\u30d6\u30e9\u30a6\u30b6\u3092\u958b\u3051\u307e\u3059\u3002

\u3010\u6d3b\u7528\u4f8b\u3011
\u30fb\u30b5\u30fc\u30d0\u30fc\u76e3\u8996\u30a2\u30e9\u30fc\u30c8
\u30fbCI/CD\u30d3\u30eb\u30c9\u7d50\u679c\u901a\u77e5
\u30fbIoT\u30c7\u30d0\u30a4\u30b9\u306e\u30a2\u30e9\u30fc\u30c8
\u30fb\u5b9a\u671f\u5b9f\u884c\u30b9\u30af\u30ea\u30d7\u30c8\u306e\u5b8c\u4e86\u901a\u77e5
\u30fbWeb\u30b5\u30fc\u30d3\u30b9\u306e\u30a8\u30e9\u30fc\u691c\u77e5

\u3010\u30d7\u30e9\u30f3\u3011
\u25a0 \u7121\u6599: \u6708{free_limit}\u901a\u307e\u3067
\u25a0 \u30d7\u30ec\u30df\u30a2\u30e0: \u00a5300\u306e\u8cb7\u3044\u5207\u308a\u3067\u7121\u5236\u9650""".format(free_limit=10)

    attrs = {
        "description": desc,
        "keywords": "\u30d7\u30c3\u30b7\u30e5\u901a\u77e5,\u901a\u77e5,API,\u76e3\u8996,\u30a2\u30e9\u30fc\u30c8,IoT,webhook,\u30b5\u30fc\u30d0\u30fc,\u81ea\u52d5\u5316,CI/CD",
        "promotionalText": "\u30b5\u30fc\u30d0\u30fc\u76e3\u8996\u30fbIoT\u30fbCI/CD\u306e\u901a\u77e5\u3092\u30b9\u30de\u30db\u3067\u53d7\u3051\u53d6\u308d\u3046\uff01API\u30921\u884c\u53e9\u304f\u3060\u3051\u3002",
        "supportUrl": SUPPORT_URL,
    }

    if ja:
        r = requests.patch(f"{BASE}/appStoreVersionLocalizations/{ja['id']}", headers=h(),
                           json={"data": {"type": "appStoreVersionLocalizations", "id": ja["id"], "attributes": attrs}})
    else:
        r = requests.post(f"{BASE}/appStoreVersionLocalizations", headers=h(), json={
            "data": {"type": "appStoreVersionLocalizations", "attributes": {**attrs, "locale": "ja"},
                     "relationships": {"appStoreVersion": {"data": {"type": "appStoreVersions", "id": vid}}}}})
    print(f"  [{'OK' if ok(r) else 'NG'}] Description + keywords")
    if not ok(r): show_err(r)
    return vid

# ==================== Review Info ====================
def set_review_info(vid):
    if not vid: return
    print("\n--- Review Info ---")
    r = requests.get(f"{BASE}/appStoreVersions/{vid}/appStoreReviewDetail", headers=h())
    attrs = {
        "contactFirstName": "Takato",
        "contactLastName": "Yamaguchi",
        "contactPhone": "+81 80 1234 5678",
        "contactEmail": "y.tata02020202@icloud.com",
        "demoAccountRequired": False,
        "notes": "\u30ed\u30b0\u30a4\u30f3\u4e0d\u8981\u3067\u3059\u3002\u30a2\u30d7\u30ea\u8d77\u52d5\u5f8c\u3001\u300cAPI\u8a2d\u5b9a\u300d\u30bf\u30d6\u3067API\u30ad\u30fc\u304c\u81ea\u52d5\u767a\u884c\u3055\u308c\u307e\u3059\u3002\u300c\u30c6\u30b9\u30c8\u901a\u77e5\u3092\u9001\u4fe1\u300d\u30dc\u30bf\u30f3\u3067\u30d7\u30c3\u30b7\u30e5\u901a\u77e5\u306e\u52d5\u4f5c\u3092\u78ba\u8a8d\u3067\u304d\u307e\u3059\u3002\u901a\u77e5\u306f\u300c\u53d7\u4fe1\u7bb1\u300d\u30bf\u30d6\u3067\u4e00\u89a7\u8868\u793a\u3055\u308c\u307e\u3059\u3002",
    }
    rd = sj(r).get("data")
    if rd:
        r2 = requests.patch(f"{BASE}/appStoreReviewDetails/{rd['id']}", headers=h(),
                            json={"data": {"type": "appStoreReviewDetails", "id": rd["id"], "attributes": attrs}})
    else:
        r2 = requests.post(f"{BASE}/appStoreReviewDetails", headers=h(), json={
            "data": {"type": "appStoreReviewDetails", "attributes": attrs,
                     "relationships": {"appStoreVersion": {"data": {"type": "appStoreVersions", "id": vid}}}}})
    print(f"  [{'OK' if ok(r2) else 'NG'}] Contact + review notes")
    if not ok(r2): show_err(r2)

# ==================== Age Rating ====================
def set_age_rating(app_id):
    print("\n--- Age Rating ---")
    r = requests.get(f"{BASE}/apps/{app_id}/appInfos", headers=h(), params={"include": "ageRatingDeclaration"})
    included = r.json().get("included", [])
    age = next((i for i in included if i["type"] == "ageRatingDeclarations"), None)
    if not age: print("  Not found"); return
    r = requests.patch(f"{BASE}/ageRatingDeclarations/{age['id']}", headers=h(), json={
        "data": {"type": "ageRatingDeclarations", "id": age["id"], "attributes": {
            "alcoholTobaccoOrDrugUseOrReferences": "NONE",
            "contests": "NONE",
            "gamblingSimulated": "NONE",
            "gambling": False,
            "horrorOrFearThemes": "NONE",
            "matureOrSuggestiveThemes": "NONE",
            "medicalOrTreatmentInformation": "NONE",
            "profanityOrCrudeHumor": "NONE",
            "sexualContentGraphicAndNudity": "NONE",
            "sexualContentOrNudity": "NONE",
            "violenceCartoonOrFantasy": "NONE",
            "violenceRealistic": "NONE",
            "violenceRealisticProlongedGraphicOrSadistic": "NONE",
            "unrestrictedWebAccess": False,
            "healthOrWellnessTopics": False,
            "messagingAndChat": False,
            "advertising": False,
            "parentalControls": False,
            "lootBox": False,
            "userGeneratedContent": False,
            "gunsOrOtherWeapons": "NONE",
            "ageAssurance": False,
        }}
    })
    print(f"  [{'OK' if ok(r) else 'NG'}] 4+ rating")
    if not ok(r): show_err(r)

# ==================== Main ====================
def main():
    print("=" * 50)
    print(f"App Store Connect Full Setup: {APP_NAME}")
    print("=" * 50)

    app_id = get_app()
    if not app_id: sys.exit(1)

    ai_id = set_categories(app_id)
    if ai_id: set_app_info_loc(ai_id)
    vid = set_version_loc(app_id)
    set_review_info(vid)
    set_age_rating(app_id)

    print("\n" + "=" * 50)
    print("All done!")
    print(f"  App Store Connect: https://appstoreconnect.apple.com/apps/{app_id}")
    print("  * Screenshots: manual upload required")
    print("  * Build: eas build --profile production --platform ios")
    print("  * Submit: eas submit --platform ios")
    print("=" * 50)

if __name__ == "__main__":
    main()
