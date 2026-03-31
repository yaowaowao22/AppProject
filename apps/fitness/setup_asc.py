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
        "subtitle": "筋トレ記録・重量管理アプリ",
        "privacyPolicyUrl": PRIVACY_URL,
    }
    if ja:
        r = requests.patch(f"{BASE}/appInfoLocalizations/{ja['id']}", headers=h(),
                           json={"data": {"type": "appInfoLocalizations", "id": ja["id"], "attributes": attrs}})
    else:
        r = requests.post(f"{BASE}/appInfoLocalizations", headers=h(), json={
            "data": {"type": "appInfoLocalizations", "attributes": {**attrs, "locale": "ja"},
                     "relationships": {"appInfo": {"data": {"type": "appInfos", "id": ai_id}}}}})
    print(f"  [{'OK' if ok(r) else 'NG'}] ja: {APP_NAME} / 筋トレ記録・重量管理アプリ")
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

    desc = """FORGEは、メニュー操作より「トレーニング」に集中したいリフターのための、シンプルで本格的なワークアウト記録アプリです。

■ 主な機能
・部位別エクササイズ選択（胸・背中・脚・肩・腕・体幹）
・45種類のエクササイズ内蔵
・重量×回数でセットを記録
・自動PR（自己記録）検知・通知
・月別レポートと連続記録（ストリーク）表示
・1RM計算機（Epley / Brzycki / Lander 対応）
・クイックスタートテンプレート管理
・25種類以上のカラーテーマ

■ FORGEが選ばれる理由
・完全オフライン — データはすべてデバイス内に保存。アカウント登録不要。
・広告ゼロ — 余計なものを一切排除。トレーニングだけに集中できます。
・3タップで記録 — 部位 → 種目 → 重量・回数。シンプルな操作で素早く記録。
・即時PRフィードバック — 自己記録を更新したその瞬間に通知。

■ 部位別エクササイズ例
胸：ベンチプレス、ダンベルフライ、ケーブルクロスオーバー など
背中：デッドリフト、ラットプルダウン、ベントオーバーロウ など
脚：スクワット、レッグプレス、レッグカール など
肩：ショルダープレス、サイドレイズ、フロントレイズ など
腕：バイセップカール、トライセップエクステンション など
体幹：プランク、アブローラー、クランチ など

記録が、力になる。
"""

    attrs = {
        "description": desc,
        "keywords": "筋トレ,ワークアウト,トレーニング,記録,重量管理,フィットネス,ジム,PR,1RM,筋力",
        "promotionalText": "45種目・完全オフライン・広告なし。PR・連続記録・月別ボリュームを管理。毎日の積み重ねを可視化。",
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
        "notes": "No login required. Fully offline workout tracking app. All data stored locally on device.\n\nHow to test:\n1. Launch the app\n2. Tap the black button at the bottom to start a workout\n3. Select a muscle group (e.g. Chest)\n4. Choose exercises and log sets with weight and reps\n5. Finish workout to see the summary screen\n\nRM Calculator: Open drawer menu (top-left) → RM計算機 → adjust weight and reps\nSettings/Themes: Open drawer menu → 設定",
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
