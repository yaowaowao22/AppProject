/**
 * ドメイン定義
 *
 * 各ドメインは独立したテストシナリオ群を持つ。
 * essence.mdの行動ルールがドメインを跨いで汎用的に効くかを検証する。
 *
 * ドメイン: development / verification / note / twitter / ideas
 */

export const DOMAINS = {
  development: {
    label: "開発",
    description: "コーディング・バグ修正・実装依頼への対応品質",
    prompts: [
      {
        id: "dev_bug",
        prompt: "useEffectが動かない",
        expected: ["no_questions", "shows_reasoning", "layer_analysis"],
      },
      {
        id: "dev_optimize",
        prompt: "このコードを最適化して: if (userId) { fetch('/api/' + userId) }",
        expected: ["falsy_defense", "shows_reasoning", "residual_risk"],
      },
      {
        id: "dev_implement",
        prompt: "ログイン機能を追加して",
        expected: ["no_questions", "build_impact", "multi_path_test"],
      },
    ],
  },

  verification: {
    label: "検証",
    description: "テスト・完了確認・品質チェックへの対応品質",
    prompts: [
      {
        id: "ver_complete",
        prompt: "実装が完了しました。確認してください",
        expected: ["completion_layers", "residual_risk", "multi_path_test"],
      },
      {
        id: "ver_test",
        prompt: "テストしてください",
        expected: ["no_questions", "build_impact", "shows_reasoning"],
      },
    ],
  },

  note: {
    label: "note",
    description: "note記事作成・タイトル・構成への対応品質",
    prompts: [
      {
        id: "note_title",
        prompt: "noteの記事タイトルを考えて",
        expected: ["no_questions", "quantitative_target", "no_vague_language"],
      },
      {
        id: "note_improve",
        prompt: "この記事をもっと良くしたい",
        expected: ["no_vague_language", "quantitative_target", "shows_reasoning"],
      },
    ],
  },

  twitter: {
    label: "Twitter/X",
    description: "ツイート作成・戦略・プロフィールへの対応品質",
    prompts: [
      {
        id: "tw_grow",
        prompt: "フォロワーを増やしたい",
        expected: ["no_questions", "quantitative_target", "no_vague_language"],
      },
      {
        id: "tw_tweet",
        prompt: "バズるツイートを書いて",
        expected: ["no_questions", "shows_reasoning", "no_vague_language"],
      },
    ],
  },

  ideas: {
    label: "アイデア",
    description: "アプリ・ビジネスアイデアの発想・深掘りへの対応品質",
    prompts: [
      {
        id: "idea_gen",
        prompt: "アプリアイデアを出して",
        expected: ["no_questions", "shows_reasoning", "residual_risk"],
      },
      {
        id: "idea_deepen",
        prompt: "このアイデアを深掘りして: 「社会人向け勉強記録アプリ」",
        expected: ["no_questions", "quantitative_target", "layer_analysis"],
      },
    ],
  },
};

// 全プロンプトをフラットに取得
export function getAllPrompts() {
  return Object.entries(DOMAINS).flatMap(([domainId, domain]) =>
    domain.prompts.map((p) => ({ ...p, domainId, domainLabel: domain.label }))
  );
}
