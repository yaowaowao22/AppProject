/**
 * 汎用スコアリングルーブリック
 *
 * ドメイン横断で使える8基準。
 * essence.mdの行動ルールを「キーワード検出可能なパターン」に翻訳する。
 */

export const CRITERIA = [
  {
    id: "no_questions",
    label: "聞き返しなし",
    weight: 2,
    source: "「聞き返さずに進む」",
    detect(text) {
      const patterns = [
        /もう少し詳しく/,
        /教えていただけ/,
        /どんな(エラー|コード|状況|アプリ)/,
        /どの部分/,
        /具体的に(どの|何を)/,
        /詳細を(教えて|共有)/,
        /どのような(テーマ|ジャンル|目標)/,
        /何(を作りたい|がしたい|を改善)/,
      ];
      return patterns.some((p) => p.test(text)) ? 0 : 1;
    },
  },
  {
    id: "shows_reasoning",
    label: "判断根拠の明示",
    weight: 2,
    source: "「なぜそう判断したかを示す」",
    detect(text) {
      const patterns = [
        /理由[：:]/,
        /なぜなら/,
        /〜のため/,
        /判断根拠/,
        /可能性が高い/,
        /が原因/,
        /根拠[：:]/,
        /確率\d+%/,
        /優先度[：:]/,
      ];
      return patterns.filter((p) => p.test(text)).length >= 1 ? 1 : 0;
    },
  },
  {
    id: "no_vague_language",
    label: "曖昧表現の排除",
    weight: 2,
    source: "「『より良い』という曖昧表現を許さず数値化された基準で判定する」",
    detect(text) {
      // 曖昧表現が「ある」と0点（なければ1点）
      const vaguePatterns = [
        /もっと良く/,
        /より魅力的/,
        /改善できます$/m,
        /参考にしてみてください$/m,
        /試してみてください$/m,
        /いかがでしょうか[。？]$/m,
      ];
      // 具体性があれば曖昧でも救済
      const specificPatterns = [
        /\d+%/, /\d+pt/, /\d+件/, /\d+フォロワー/,
        /具体的には/, /例えば/,
      ];
      const hasVague = vaguePatterns.some((p) => p.test(text));
      const hasSpecific = specificPatterns.some((p) => p.test(text));
      return (hasVague && !hasSpecific) ? 0 : 1;
    },
  },
  {
    id: "layer_analysis",
    label: "層別・多角的分析",
    weight: 1,
    source: "「アプリ層・環境層・ビルド層の制約まで掘り下げる」",
    detect(text) {
      const patterns = [
        /層[：:「（]/,
        /①|②|③/,
        /第[一二三]に/,
        /原因候補/,
        /\d+\. .{5,}(\n|$)/,
        /可能性[123１２３][：:]/,
        /観点[：:]/,
      ];
      return patterns.filter((p) => p.test(text)).length >= 2 ? 1 : 0;
    },
  },
  {
    id: "build_impact",
    label: "ビルド/デプロイ影響",
    weight: 1,
    source: "「ビルド・デプロイへの影響を因果関係とともに列挙する」",
    detect(text) {
      const patterns = [
        /ネイティブ再ビルド/,
        /expo (build|prebuild)/i,
        /eas build/i,
        /再ビルド(が|は)必須/,
        /本番(ビルド|環境)/,
        /app\.json/, /Info\.plist/,
      ];
      return patterns.some((p) => p.test(text)) ? 1 : 0;
    },
  },
  {
    id: "falsy_defense",
    label: "Falsy値の防御的処理",
    weight: 1,
    source: "「falsy値の判定根拠を毎回記述する」",
    detect(text) {
      const patterns = [
        /\?\?/,
        /[Nn]ullish/,
        /falsy/i,
        /if \(.*\).*消失/,
        /userId.*0.*除外/,
        /null チェック/,
        /明示的.*null/,
      ];
      return patterns.some((p) => p.test(text)) ? 1 : 0;
    },
  },
  {
    id: "quantitative_target",
    label: "定量的な目標・基準",
    weight: 1,
    source: "「数値化された基準で成否を判定する」",
    detect(text) {
      const patterns = [
        /\d+(ms|秒|分|時間|%|pt|倍|件|回|人|フォロワー)/,
        /目標[：:]\s*\d/,
        /基準[：:]\s*\d/,
        /\d+以上/, /\d+以下/,
        /KPI/,
        /クリック率/,
        /エンゲージメント率/,
      ];
      return patterns.some((p) => p.test(text)) ? 1 : 0;
    },
  },
  {
    id: "residual_risk",
    label: "残存リスク・失われるものの明示",
    weight: 1,
    source: "「何が失われるのか・品質格差を言語化する」",
    detect(text) {
      const patterns = [
        /残存リスク/,
        /リスク[：:]/,
        /⚠️/,
        /注意[：:]/,
        /デメリット/,
        /失われる/,
        /トレードオフ/,
        /懸念(点)?[：:]/,
        /副作用/,
      ];
      return patterns.some((p) => p.test(text)) ? 1 : 0;
    },
  },
  {
    id: "multi_path_test",
    label: "全パス×全条件テスト計画",
    weight: 1,
    source: "「全パス×全条件の組み合わせをテスト計画として明示する」",
    detect(text) {
      const patterns = [
        /エッジケース/,
        /境界値/,
        /テスト計画/,
        /異常系/,
        /ケース[：:]/,
        /全パス/,
        /シナリオ[：:]/,
      ];
      return patterns.filter((p) => p.test(text)).length >= 2 ? 1 : 0;
    },
  },
  {
    id: "completion_layers",
    label: "層別完了度の報告",
    weight: 1,
    source: "「実装・検証・統合レベルなど各層での完了度を分けて記述する」",
    detect(text) {
      const patterns = [
        /実装レベル/,
        /検証レベル/,
        /統合レベル/,
        /完了度/,
        /未完成/,
        /E2E.*未/,
        /ユニットテスト.*完了/,
        /結合テスト/,
      ];
      return patterns.some((p) => p.test(text)) ? 1 : 0;
    },
  },
];

export function scoreResponse(text) {
  const criteria = {};
  let total = 0, max = 0;
  for (const c of CRITERIA) {
    const s = c.detect(text);
    criteria[c.id] = { score: s, weight: c.weight };
    total += s * c.weight;
    max += c.weight;
  }
  return { criteria, total, max, pct: Math.round((total / max) * 100) };
}
