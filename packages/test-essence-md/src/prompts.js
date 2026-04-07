/**
 * テストシナリオ定義
 *
 * 設計方針:
 * - essence.mdの各行動ルールを「発火させるべき条件」として設計
 * - 各プロンプトがどのCriterionをトリガーすべきかを明示
 * - 意図的に曖昧なものと具体的なものを混在させる
 */

export const TEST_PROMPTS = [
  {
    id: "bug_vague",
    label: "曖昧なバグ報告",
    prompt: "useEffectが動かない",
    context: "React Nativeアプリ開発中",
    // essence.mdで「聞き返さずに進む」が機能するかの最重要テスト
    expected_triggers: ["no_clarifying_questions", "shows_reasoning", "layer_analysis"],
    // 「聞き返す」ことが許されないシナリオ
    fail_if: ["no_clarifying_questions === false"],
  },
  {
    id: "feature_request",
    label: "機能追加依頼",
    prompt: "ユーザー認証機能を追加して",
    context: "Expo + React Nativeプロジェクト",
    expected_triggers: ["no_clarifying_questions", "build_impact", "multi_path_test_plan"],
    // ビルド影響の言及がないと失格
    fail_if: ["build_impact === false"],
  },
  {
    id: "optimization",
    label: "最適化依頼",
    prompt: "このAPIコールのコードを最適化して",
    context: `
const fetchUser = async (userId) => {
  if (userId) {
    const res = await fetch('/api/user/' + userId);
    return res.json();
  }
}`,
    expected_triggers: [
      "quantitative_target",
      "residual_risk",
      "falsy_value_defense",
      "shows_reasoning",
    ],
    // falsy値（userId=0）の問題を指摘できるかが核心
    fail_if: ["falsy_value_defense === false"],
  },
  {
    id: "error_only",
    label: "症状のみ報告（超曖昧）",
    prompt: "エラーが出る",
    context: "（追加情報なし）",
    expected_triggers: ["no_clarifying_questions", "layer_analysis", "shows_reasoning"],
    // 最も厳しいテスト: 情報ゼロでも仮説を立てて進むか
    fail_if: ["no_clarifying_questions === false"],
  },
  {
    id: "completion_report",
    label: "実装完了報告への対応",
    prompt: "ログイン機能の実装が完了しました。確認してください",
    context: "コードレビュー依頼",
    expected_triggers: ["completion_by_layer", "multi_path_test_plan", "residual_risk"],
    // 「完了」を鵜呑みにせず層別完了度を確認するか
    fail_if: ["completion_by_layer === false"],
  },
];
