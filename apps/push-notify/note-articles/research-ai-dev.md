# 記事3 リサーチ: AI活用・開発プロセスの実態

調査日: 2026-03-25
対象: 「かんたんプッシュ」アプリ (push-notify)

---

## 1. プロジェクト概要

- **アプリ名**: かんたんプッシュ
- **技術スタック**: Expo (React Native) + TypeScript + Cloudflare Workers バックエンド
- **総コード行数**: 約2,214行（アプリ本体のみ、node_modules等除く）
- **ファイル構成**: 15ファイル（App.tsx + src配下14ファイル）
- **総コミット数**: 63コミット

### ファイル構成と行数一覧

| ファイル | 行数 | 役割 |
|---------|------|------|
| App.tsx | 349行 | アプリ初期化・通知受信ロジック・WhatsNewモーダル |
| InboxScreen.tsx | 528行 | 受信箱画面（SwipeableRow含む） |
| SettingsScreen.tsx | 487行 | 設定画面（テーマ・フォント・課金） |
| SetupScreen.tsx | 412行 | API設定画面（キー表示・コード例） |
| pushService.ts | 143行 | プッシュ通知ユーティリティ |
| purchases.ts | 62行 | RevenueCat課金処理 |
| secureStore.ts | 44行 | APIキーのセキュア保存 |
| apiKey.ts | 29行 | APIキー生成・日時ユーティリティ |
| types.ts | 28行 | 型定義・定数 |
| ads.config.ts | 24行 | 広告設定 |
| UsageContext.tsx | 19行 | 使用量コンテキスト |
| config.ts | 16行 | API設定 |
| theme.ts | 7行 | テーマ設定 |
| RootNavigator.tsx | 64行 | タブナビゲーション |
| GameScreen.tsx | 2行 | re-export（互換用） |

---

## 2. AIとの協業の痕跡（Co-Authored-By分析）

### 統計サマリー

| 指標 | 数値 |
|------|------|
| 全コミット数 | 63 |
| Claude共著コミット数 | **32（全体の50.8%）** |
| Claude Opus 4.6 共著 | 14コミット |
| Claude Sonnet 4.6 共著 | 18コミット |
| 人間単独コミット | 31 |

**→ コミットの半数以上がAIとの共同作業**

### 使い分けパターン

- **Claude Opus 4.6**: 初期開発フェーズ（2/28）で主に使用。バグ修正・UI改善・機能追加など「対話的に問題を特定→即修正」するタスク
- **Claude Sonnet 4.6**: 後期の大規模機能追加（3/23）で主に使用。ダークモード・カテゴリ機能・課金機能など「設計→一括実装」するタスク

---

## 3. 開発タイムライン

### Day 1: 2026-02-28（初期開発 — 約10時間）

| 時刻 | コミット | 内容 | AI |
|------|---------|------|-----|
| 18:09 | 2e4786b | Initial commit | — |
| 18:57 | 81d6e72 | EAS Project ID設定 | — |
| 19:05 | be40b94 | static app.json切替 | — |
| 19:49 | a9be86f | iOS credentials設定 | — |
| 19:55 | 677da47 | チャンネル設定修正 | — |
| 20:20 | 74ac43d | プラグイン削除（ビルド対策） | — |
| 20:32 | 01257d4 | 破損アセットPNG修正 | — |
| 20:41 | 8dac3ad | Firebase modular headers追加 | — |
| 20:46 | 2ea570c | use_modular_headers! 追加 | — |
| 20:54 | 9e9d257 | expo-build-properties設定 | — |
| 21:07 | d10f4f9 | push APIバックエンドデプロイ | — |
| 21:24 | 2a636f9 | UI修正 + EAS Update設定 | — |
| 21:28 | 17f46ab | アイコン・スプラッシュ更新 | — |
| **21:34** | **b0d41fc** | **通知詳細ビュー追加 + 下部切れ修正** | **Opus** |
| **21:36** | **6270147** | **APIキー毎回再生成バグ修正** | **Opus** |
| **21:50** | **aa6c7b7** | **タブバー・受信箱・通知アイコン修正** | **Opus** |
| **21:53** | **2d1abc6** | **タブバー高さ + SafeArea対応** | **Opus** |
| **21:54** | **a74cbc3** | **検索ボックス追加** | **Opus** |
| **21:57** | **108f948** | **検索ボックスの間隔調整** | **Opus** |

**Day 1の特徴**:
- 18:09〜21:28（約3時間20分）: 人間がプロジェクトセットアップ・ビルド問題解決
- 21:34〜21:57（約23分間）: **Claude Opusと6連続コミット** — バグ修正からUI改善まで怒涛の対話型開発
- 1日で「ゼロからApp Store提出可能な状態」まで到達

### Day 2: 2026-03-23（大規模機能追加 — 約5時間）

| 時刻 | コミット | 内容 | AI |
|------|---------|------|-----|
| **17:13** | **a00b69b** | **ダークモード・カテゴリ・課金・フィルターを一括追加（+3,390行）** | **Sonnet** |
| 17:22〜20:15 | 多数 | SubRadar関連（別アプリ） | Sonnet |
| **21:34** | **8fa5344** | **FAB zIndex + 空状態CTA** | **Sonnet** |
| **22:00** | **b3c5134** | **保存ボタンWeb互換性修正** | **Opus** |

**Day 2の特徴**:
- a00b69bコミット1つで**39ファイル変更、+3,390行追加** — これが最大のAI協業コミット
- ダークモード、フォントカスタマイズ、カテゴリ機能、未読/既読フィルター、RevenueCat課金、セキュアストレージなど**6つの主要機能を同時に実装**

---

## 4. 具体的なコード例: AIが書いた複雑なUI

### SwipeableRow — スワイプ削除アニメーション（InboxScreen.tsx:27-95）

```typescript
function SwipeableRow({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const offsetRef = useRef(0);
  const { colors } = useTheme();

  const snap = (to: number) => {
    offsetRef.current = to;
    Animated.timing(translateX, {
      toValue: to,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 4 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => {
        const next = offsetRef.current + g.dx;
        translateX.setValue(Math.max(Math.min(next, 0), -SCREEN_W));
      },
      onPanResponderRelease: (_, g) => {
        const next = offsetRef.current + g.dx;
        if (g.vx < -0.5 || next < -BUTTON_W * 0.4) {
          snap(-BUTTON_W);
        } else {
          snap(0);
        }
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;
  // ... レンダリング部分
}
```

**注目ポイント**:
- PanResponder + Animated APIを使った**ネイティブドライバー対応のスワイプジェスチャー**
- 速度検知（`g.vx < -0.5`）による「素早いスワイプ」判定
- 水平/垂直ジェスチャーの競合解決（`Math.abs(g.dx) > Math.abs(g.dy) * 1.2`）
- スナップアニメーション（削除ボタン表示位置にパチッと止まる）

### WhatsNewModal — 新機能お知らせUI（App.tsx:47-159）

```typescript
const WHATS_NEW_ITEMS = [
  { icon: 'moon-outline', title: 'ダークモード',
    desc: '設定タブからライト/ダーク/自動を切り替えられます', type: 'new' },
  { icon: 'text-outline', title: 'フォントカスタマイズ',
    desc: 'フォントサイズとカラーを自由に調整できます', type: 'new' },
  { icon: 'folder-outline', title: 'カテゴリ機能',
    desc: '通知にカテゴリを設定してグループ分けできます', type: 'new' },
  // ... 計8項目（新機能5 + 修正3）
];
```

**注目ポイント**: バージョン管理 + AsyncStorageによる「一度だけ表示」ロジック

### App.tsx — 通知同期ロジック（App.tsx:247-288）

```typescript
const syncPendingNotifications = useCallback(async () => {
  const newNotifs: PushNotification[] = [];

  // 1. タップで起動した通知を取得（リスナー未登録なので確実に取れる）
  const lastResponse = await getLastNotificationResponse();
  if (lastResponse) {
    const responseId = lastResponse.notification?.request?.identifier;
    if (responseId && responseId !== processedResponseIdRef.current) {
      processedResponseIdRef.current = responseId;
      const notif = extractNotification(lastResponse);
      if (notif) {
        newNotifs.push({ ...notif, read: true });
        // URLがあれば開く
        const url = lastResponse.notification?.request?.content?.data?.url;
        if (url) Linking.openURL(url).catch(() => {});
      }
    }
  }

  // 2. 通知センターに残っている通知を取得
  const pending = await getPendingNotifications();
  // ... 重複排除して受信箱に追加

  // 4. 通知センターをクリア（次回起動時の重複防止）
  dismissAllNotifications();
}, [setNotifications]);
```

**注目ポイント**:
- タップ通知 + 通知センター残留通知の**二重取り込み戦略**
- `processedResponseIdRef`による**重複処理防止**
- AppStateリスナーで**バックグラウンド復帰時も同期**

---

## 5. 機能一覧（AIが実装に関与したもの）

### Claude Opus が修正・追加した機能（Day 1）

1. **通知詳細ビュー**: タップで展開/折りたたみ、優先度バッジ・受信時刻・URL表示
2. **APIキー永続化修正**: AsyncStorage読み込み完了前の上書きバグを修正
3. **タブバー修正**: SafeAreaInsets対応、高さ調整
4. **受信箱リアルタイム更新**: フォアグラウンド・バックグラウンド両方の通知受信対応
5. **検索ボックス**: 通知のタイトル・本文・URL・カテゴリを横断検索

### Claude Sonnet が実装した機能（Day 2）

1. **ダークモード**: ライト/ダーク/自動の3モード切替
2. **フォントカスタマイズ**: サイズ（11-22pt）・カラー（7色）調整 + プレビュー
3. **カテゴリ機能**: 通知のグループ分け、カテゴリビューレイアウト
4. **未読/既読フィルター**: 3状態切替（全て/未読/既読）
5. **未読マーク**: ドットインジケーター + 太字スタイル
6. **RevenueCat課金**: プレミアムプラン購入・復元
7. **セキュアストレージ**: expo-secure-storeによるAPIキー保護
8. **WhatsNewモーダル**: バージョン毎の新機能お知らせ

---

## 6. AI開発の特徴的なパターン

### パターン1: 「問題報告 → 即修正」サイクル（Opus）
- Day 1の21:34〜21:57の23分間で**6つのコミット**
- 「タブバーが切れる」→修正→「受信箱が更新されない」→修正→「検索がほしい」→追加
- 人間が問題を発見・報告し、AIが即座にコードを修正するリアルタイム協業

### パターン2: 「一括設計 → 大量実装」（Sonnet）
- a00b69bコミット1つで**+3,390行、39ファイル変更**
- 6つの主要機能を同時に実装（ダークモード、カテゴリ、課金、フィルター等）
- 設計をまとめて伝え、AIが全体を一貫性をもって実装

### パターン3: CLAUDE.mdは未使用
- プロジェクトルートにCLAUDE.mdファイルは存在しない
- → 対話ベースで指示を出す開発スタイル（ルールファイルに頼らない）

### パターン4: モデル使い分け
- **Opus**: 対話的なデバッグ・小粒な改善（1コミット=1修正）
- **Sonnet**: 大規模な機能追加・一括実装（1コミット=複数機能）

---

## 7. 開発速度の推定

### Day 1（2/28）: 約4時間で「ゼロ → App Store提出可能」
- 18:09 Initial commit
- 21:57 検索機能まで完成
- 含まれる作業: プロジェクト作成、Cloudflare Workersバックエンド、EAS設定、iOS credentials、ビルド問題解決、UI修正、機能追加

### Day 2（3/23）: 約1時間で「6つの主要機能追加」
- 17:13 ダークモード・課金・カテゴリ等を一括コミット
- +3,390行の差分

### 合計推定
- **実稼働時間**: 約5〜6時間
- **成果物**: 2,214行のアプリコード + バックエンドAPI + 課金機能 + ダークモード等
- **従来の見積もり**: 同等機能を手動開発した場合、1〜2週間（40〜80時間）程度

→ **開発速度は従来比 約8〜15倍**

---

## 8. 記事で使えるキーメッセージ案

1. **「23分間で6つのバグ修正」** — Claude Opusとの対話型デバッグの威力
2. **「1コミットで+3,390行」** — Claude Sonnetによる大規模一括実装
3. **「コミットの半数がAI共著」** — 人間とAIの対等なペアプログラミング
4. **「5時間でApp Store提出可能なアプリ」** — 従来比8〜15倍の開発速度
5. **「SwipeableRowのジェスチャー実装」** — AIが書く複雑なアニメーションコードの品質
6. **「OpusとSonnetの使い分け」** — デバッグ vs 大規模実装でモデルを選択

---

## 9. 付録: 主要コミットの詳細メッセージ

### b0d41fc (Opus) — 通知詳細ビュー追加
```
Add notification detail view and fix bottom cutoff
- Tap notification to expand/collapse detail view
- Show priority badge, full timestamp, URL button, delete option
- Fix bottom cutoff: disable ad banner, add bottom padding
- Chevron indicator for expand/collapse state
```

### aa6c7b7 (Opus) — 複合バグ修正
```
Fix tab bar cutoff, inbox not updating, notification icon
- Remove ScreenWrapper, use useSafeAreaInsets for top padding only
- Fix notifications not showing in inbox (handle both foreground and background)
- Add expandable notification detail view
- Fix API key regeneration on every open
```

### 6270147 (Opus) — AsyncStorage競合修正
```
Fix API key regenerating on every app open
Wait for AsyncStorage to load before checking if key is null.
Previously the key was overwritten before the stored value loaded.
```

### a00b69b (Sonnet) — 大規模機能追加
```
push-notifyアプリの機能改善
- ダークモード・フォントカスタマイズ・カテゴリ機能を追加
- 未読/既読フィルター・未読マーク機能を追加
- 受信時刻の不具合修正・既読文字色の改善
- タブバーと受信箱の表示不具合を修正
→ 39ファイル変更、+3,390行
```
