/**
 * スコアリングルーブリック
 *
 * essence.mdの各行動ルールを「検出可能なパターン」に翻訳する。
 * キーワードマッチング + パターン検出で自動採点。
 *
 * 各Criterionは:
 * - id: 識別子
 * - label: 表示名
 * - source: essence.mdの対応行動ルール
 * - detect(text): テキストから0/1を返す関数
 * - weight: 重要度（1=通常, 2=重要）
 */

export const CRITERIA = [
  {
    id: "no_clarifying_questions",
    label: "聞き返しなし",
    source: "「聞き返さずに進む」",
    weight: 2,
    detect(text) {
      // 聞き返しパターンを検出（あれば0点）
      const askPatterns = [
        /どの部分[をが]/,
        /教えていただけ/,
        /もう少し詳しく/,
        /どんな(エラー|コード|環境)/,
        /詳細を(教えて|共有して)/,
        /具体的に(どの|何を)/,
        /どのような(状況|エラー)/,
        /追加情報(を|が)(ください|必要)/,
      ];
      return askPatterns.some((p) => p.test(text)) ? 0 : 1;
    },
  },
  {
    id: "shows_reasoning",
    label: "判断根拠の明示",
    source: "「なぜそう判断したかを示す」",
    weight: 2,
    detect(text) {
      const reasonPatterns = [
        /理由[：:]/,
        /判断根拠/,
        /なぜなら/,
        /〜のため/,
        /〜だから/,
        /可能性が高い/,
        /〜が原因/,
        /〜に起因/,
        /根拠[：:]/,
      ];
      return reasonPatterns.filter((p) => p.test(text)).length >= 1 ? 1 : 0;
    },
  },
  {
    id: "layer_analysis",
    label: "層別分析",
    source: "「アプリ層・環境層・ビルド層の制約まで掘り下げる」",
    weight: 2,
    detect(text) {
      // 2つ以上の異なる「層」や「レベル」の言及を検出
      const layerPatterns = [
        /React(層| Native層)/,
        /非同期層/,
        /ネットワーク層/,
        /ビルド層/,
        /環境層/,
        /データ層/,
        /アプリ層/,
        /OS層/,
        /ネイティブ層/,
        /型[：:]/, // 表形式での層別分析
        /原因候補/,
        /可能性[12３]: /,
        /①|②|③/, // 番号付き層別
        /層[：:「]/,
        /レベル[：:]/,
      ];
      const matches = layerPatterns.filter((p) => p.test(text)).length;
      return matches >= 2 ? 1 : 0;
    },
  },
  {
    id: "build_impact",
    label: "ビルド/デプロイ影響の言及",
    source: "「実装着手前にビルド・デプロイへの影響を因果関係とともに列挙する」",
    weight: 1,
    detect(text) {
      const buildPatterns = [
        /ネイティブ再ビルド/,
        /expo (build|prebuild)/i,
        /eas build/i,
        /再ビルド(が|は)必須/,
        /app\.json/,
        /Info\.plist/,
        /AndroidManifest/,
        /ビルド設定/,
        /デプロイ(が|に)/,
        /本番(ビルド|環境)/,
      ];
      return buildPatterns.some((p) => p.test(text)) ? 1 : 0;
    },
  },
  {
    id: "falsy_value_defense",
    label: "Falsy値の防御的処理",
    source: "「null/undefined/空文字列/0/falseなどのfalsy値の判定根拠を毎回記述する」",
    weight: 2,
    detect(text) {
      const falsyPatterns = [
        /\?\?/,                    // nullish coalescing演算子自体
        /Nullish coalescing/i,
        /nullish/i,
        /if \(userId\)/,           // 問題のある実装を指摘
        /falsy/i,
        /null チェック/,
        /undefined チェック/,
        /userId === (null|undefined)/,
        /typeof.*!== ['"]undefined['"]/,
        /0.*falsy/,
        /空文字.*除外/,
        /明示的.*null/,
        /\|\|.*デフォルト/,
      ];
      return falsyPatterns.some((p) => p.test(text)) ? 1 : 0;
    },
  },
  {
    id: "multi_path_test_plan",
    label: "全パス×全条件テスト計画",
    source: "「全パス×全条件の組み合わせをテスト計画として明示する」",
    weight: 1,
    detect(text) {
      const testPatterns = [
        /エッジケース/,
        /境界値/,
        /null.*テスト/,
        /テスト計画/,
        /全パス/,
        /異常系/,
        /ケース[：:]/,
        /シナリオ[：:]/,
        /パターン[：:]/,
        /検証(項目|ポイント)/,
      ];
      return testPatterns.filter((p) => p.test(text)).length >= 2 ? 1 : 0;
    },
  },
  {
    id: "quantitative_target",
    label: "定量的成功基準の設定",
    source: "「『より良い』という曖昧表現を許さず、数値化された基準で成否を判定する」（検証中）",
    weight: 1,
    detect(text) {
      const quantPatterns = [
        /\d+(%|ms|秒|件|回|倍)/,
        /\d+以下/,
        /\d+以上/,
        /目標[：:]\s*\d/,
        /基準[：:]\s*\d/,
        /成功条件[：:]/,
        /測定可能/,
        /定量/,
        /KPI/,
      ];
      return quantPatterns.some((p) => p.test(text)) ? 1 : 0;
    },
  },
  {
    id: "residual_risk",
    label: "残存リスクの明示",
    source: "「何が失われるのか・どのセグメントで品質格差が生じるかを言語化する」（検証中）",
    weight: 1,
    detect(text) {
      const riskPatterns = [
        /残存リスク/,
        /リスク[：:]/,
        /失われる/,
        /デメリット/,
        /注意点[：:]/,
        /副作用/,
        /トレードオフ/,
        /懸念(点|事項)/,
        /⚠️/,
        /注意[：:]/,
      ];
      return riskPatterns.filter((p) => p.test(text)).length >= 1 ? 1 : 0;
    },
  },
  {
    id: "completion_by_layer",
    label: "層別完了度の報告",
    source: "「実装レベル・検証レベル・統合レベルなど各層での完了度を分けて記述する」（検証中）",
    weight: 1,
    detect(text) {
      const completionPatterns = [
        /実装(レベル|層)[：:]/,
        /検証(レベル|層)[：:]/,
        /統合(レベル|層)[：:]/,
        /完了度/,
        /未完成/,
        /(層|レベル)別/,
        /E2E.*未/,
        /ユニットテスト.*完了/,
        /結合テスト/,
      ];
      return completionPatterns.filter((p) => p.test(text)).length >= 1 ? 1 : 0;
    },
  },
];

export function scoreResponse(text) {
  const results = {};
  let totalScore = 0;
  let maxScore = 0;

  for (const criterion of CRITERIA) {
    const score = criterion.detect(text);
    results[criterion.id] = {
      score,
      weight: criterion.weight,
      weighted: score * criterion.weight,
    };
    totalScore += score * criterion.weight;
    maxScore += criterion.weight;
  }

  return {
    criteria: results,
    totalScore,
    maxScore,
    percentage: Math.round((totalScore / maxScore) * 100),
  };
}
