#!/usr/bin/env python3
"""
ios-uiux SKILL.md パッチスクリプト

セクション G: Dynamic Typography HIG準拠パターン
  挿入位置: ### Dynamic Type の後、### コントラスト比 の前

セクション H: Drawer/サイドバーナビゲーション HIG準拠設計
  挿入位置: ## 3. ナビゲーションパターン の末尾（## 4. アニメーション設計 の直前）
"""

import sys

SKILL_PATH = 'C:/Users/ytata/.claude/skills/ios-uiux/SKILL.md'

# ==================== セクション G ====================
# アンカー: ### Dynamic Type コードブロック末尾 〜 ### コントラスト比 の直前
SECTION_G_ANCHOR = """\
  label.adjustsFontForContentSizeCategory = true
  ```

  ### コントラスト比（WCAG 2.2 AA）"""

SECTION_G_IDEMPOTENCY_CHECK = '  ### Dynamic Type + ユーザー設定可能フォント'

SECTION_G_REPLACEMENT = """\
  label.adjustsFontForContentSizeCategory = true
  ```

  ### Dynamic Type + ユーザー設定可能フォント

  **HIG原則**:
  - Apple は Dynamic Type（システムフォントサイズ）を最優先とする
  - ユーザーが設定したフォントサイズは「追加の拡大縮小」ではなく
    「ベースサイズのオフセット」として実装すること
  - フォントファミリー変更は読みやすさを損なわない範囲に限定
  - 推奨フォントファミリー: SF Pro（System）、SF Pro Rounded（Rounded）、
    SF Mono（Monospace） — いずれも Apple 提供のシステムフォントを使用

  **HIG Tier S（変更不可）**:
  - フォントサイズが小さすぎてアクセシビリティを損なう設定は提供不可
  - 最小フォントサイズ: Caption2（11pt）以上

  **推奨実装パターン**:
  - システムの Dynamic Type スケールをベースに、ユーザー設定を ±オフセットとして適用
  - フォント設定 UI は Settings（設定画面）内に配置（メインナビゲーションに露出させない）

  #### React Native 実装時の注意
  React Native 固有の実装詳細は expo-mobile-builder §7（テーマシステム）の
  DynamicTypography セクションを参照。

  iOS HIG 観点での注意点:
  - RN の `StyleSheet.create` に渡すフォントサイズは、
    `PixelRatio.getFontScale()` を考慮して計算すること
  - `allowFontScaling={true}`（デフォルト）を明示的に `false` にしない
    （Apple のアクセシビリティ審査指摘対象）
  - カスタムフォントファミリーを使う場合、Apple フォントライセンス規約を確認

  ### コントラスト比（WCAG 2.2 AA）"""

# ==================== セクション H ====================
# アンカー: iOS標準ジェスチャーセクション末尾 〜 ## 4. アニメーション設計 の直前
SECTION_H_ANCHOR = """\
  - 下スワイプでモーダルを閉じる（iOS 13+）

  ---

  ## 4. アニメーション設計"""

SECTION_H_IDEMPOTENCY_CHECK = '  ### Drawer / サイドバーナビゲーション'

SECTION_H_REPLACEMENT = """\
  - 下スワイプでモーダルを閉じる（iOS 13+）

  ### Drawer / サイドバーナビゲーション

  **HIG原則**:
  - iOS 標準のナビゲーションパターンはタブバー + NavigationStack
  - Drawer（サイドバー）は iPad の SplitView 用途が主であり、iPhone では
    「補助的なナビゲーション」または「フィルター・設定パネル」として使う
  - iPhone で Drawer をメインナビゲーションに使う場合の注意:
    1. Tab Bar と共存させる（ドロワーはタブの補完として機能させる）
    2. ジェスチャー（左エッジスワイプ）でのオープンは Back gesture と競合しない設計
    3. オーバーレイは systemBackground 上に `.thickMaterial` を使用
    4. 幅は画面幅の 75% 以下に制限

  **開閉アニメーション**:
  - 推奨: `spring(response: 0.3, dampingFraction: 0.85)`
  - オーバーレイ背景: opacity 0 → 0.4 のフェード
  - コンテンツが押し出されるパターン（push 型）は iPhone では非推奨

  **Smart Filters パネルとしての用途**:
  - フィルター条件の選択に使う場合、ActionSheet / BottomSheet の方が HIG 的に適切
  - ただしフィルター項目が 5 種以上の場合は Drawer も許容

  #### React Native 実装時の注意
  React Native 固有の実装詳細は expo-mobile-builder §5（ナビゲーション設計）を参照。

  iOS HIG 観点での注意点:
  - `@react-navigation/drawer` のデフォルト実装は左エッジスワイプで開く
    → Back gesture が有効な StackNavigator 内では競合する
    → `edgeWidth` を `0` に設定してジェスチャーを無効化し、ハンバーガーボタン専用にする
  - Drawer 内のリスト項目は 44pt 以上のタップ領域を確保すること
    （expo-mobile-builder §5 参照）

  ---

  ## 4. アニメーション設計"""


def apply_patch(
    content: str,
    anchor: str,
    replacement: str,
    idempotency_check: str,
    section_name: str,
) -> str:
    if idempotency_check in content:
        print(f'[SKIP] {section_name} は既に適用済みです')
        return content

    if anchor not in content:
        print(f'[WARNING] {section_name} のアンカーテキストが見つかりません。パッチをスキップします。')
        return content

    patched = content.replace(anchor, replacement, 1)
    print(f'[OK] {section_name} を適用しました')
    return patched


def main() -> None:
    with open(SKILL_PATH, encoding='utf-8') as f:
        original = f.read()

    original_len = len(original)

    content = original
    content = apply_patch(
        content,
        SECTION_G_ANCHOR,
        SECTION_G_REPLACEMENT,
        SECTION_G_IDEMPOTENCY_CHECK,
        'セクション G: Dynamic Typography HIG準拠パターン',
    )
    content = apply_patch(
        content,
        SECTION_H_ANCHOR,
        SECTION_H_REPLACEMENT,
        SECTION_H_IDEMPOTENCY_CHECK,
        'セクション H: Drawer/サイドバーナビゲーション HIG準拠設計',
    )

    with open(SKILL_PATH, 'w', encoding='utf-8') as f:
        f.write(content)

    new_len = len(content)
    print(f'\n変更前: {original_len} 文字 / 変更後: {new_len} 文字 / 差分: +{new_len - original_len} 文字')


if __name__ == '__main__':
    main()
