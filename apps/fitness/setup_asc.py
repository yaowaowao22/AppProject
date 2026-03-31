"""
App Store Connect - Full setup for FORGE (no submission)
- App info, categories, localization
- Version description, keywords
- Review info
- Age rating
"""
import jwt, time, requests, json, sys

KEY_ID = "WBL22JQ6B3"
ISSUER_ID = "0bc13228-682d-418b-a53e-d74894424555"
P8_PATH = "C:/Users/ytata/Downloads/AuthKey_WBL22JQ6B3.p8"
BUNDLE_ID = "com.massapp.fitness"
APP_NAME = "FORGE"
BASE = "https://api.appstoreconnect.apple.com/v1"
PRIVACY_URL = "https://fitness-api.selectinfo-yaowao.workers.dev/privacy"
SUPPORT_URL = "https://fitness-api.selectinfo-yaowao.workers.dev/support"

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
            "primaryCategory": {"data": {"type": "appCategories", "id": "HEALTH_AND_FITNESS"}},
            "secondaryCategory": {"data": {"type": "appCategories", "id": "LIFESTYLE"}},
        }}
    })
    print(f"  [{'OK' if ok(r) else 'NG'}] Health & Fitness + Lifestyle")
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
        "subtitle": "Workout Tracker & Strength Log",
        "privacyPolicyUrl": PRIVACY_URL,
    }
    if ja:
        r = requests.patch(f"{BASE}/appInfoLocalizations/{ja['id']}", headers=h(),
                           json={"data": {"type": "appInfoLocalizations", "id": ja["id"], "attributes": attrs}})
    else:
        r = requests.post(f"{BASE}/appInfoLocalizations", headers=h(), json={
            "data": {"type": "appInfoLocalizations", "attributes": {**attrs, "locale": "ja"},
                     "relationships": {"appInfo": {"data": {"type": "appInfos", "id": ai_id}}}}})
    print(f"  [{'OK' if ok(r) else 'NG'}] ja: {APP_NAME} / Workout Tracker & Strength Log")
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

    desc = """FORGE is a simple, powerful workout tracker built for lifters who want to focus on training — not tapping through menus.

■ Features
· Body-part exercise selection (Chest, Back, Legs, Shoulders, Arms, Core)
· 45 exercises built-in
· Log sets with weight × reps
· Automatic PR (personal record) tracking
· Monthly reports & streak display
· 1RM calculator
· Quick-start templates
· 25+ theme options

■ Why FORGE
· Fully offline — all data stays on your device. No account needed.
· Zero ads — pure focus on your training.
· 3-step logging — muscle group → exercise → weight/reps. That's it.
· Instant PR feedback — know when you've broken a record.

■ Exercises by muscle group
Chest: Bench Press, Dumbbell Fly, and more
Back: Deadlift, Lat Pulldown, and more
Legs: Squat, Leg Press, and more
Shoulders: Shoulder Press, Lateral Raise, and more
Arms: Bicep Curl, Tricep Extension, and more
Core: Plank, Ab Wheel, and more

Track every rep. Forge your best.
"""

    attrs = {
        "description": desc,
        "keywords": "workout,gym,lifting,tracker,strength,fitness,log,PR,weight training,bodybuilding",
        "promotionalText": "45 exercises. Offline. No ads. Track PRs, streaks & monthly volume. Forge your best.",
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
        "notes": "No login required. This is a fully offline workout tracking app. All data is stored locally on the device. Launch the app and tap the orange button to start recording a workout. Select a body part, choose exercises, and log sets with weight and reps.",
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
