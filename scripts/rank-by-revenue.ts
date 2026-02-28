import * as fs from 'node:fs';
import * as path from 'node:path';

// ============================================================
// 現実的な広告収益モデル
// ============================================================
// 前提条件:
//   - 個人開発、広告予算ゼロ
//   - オーガニック流入のみ（ASO最適化はする）
//   - 日本App Store / Google Play
//   - 6ヶ月後の安定期
//   - 500本のアプリ間で相互送客あり(小さなブースト)
//
// 現実の数値感（個人開発の小規模アプリ）:
//   - 月間DL数: 大半のアプリは 30-200 DL/月
//   - DAU/MAU比: ゲーム5-15%, ユーティリティ10-20%, トラッカー15-30%
//   - 6ヶ月後の累計DL: 200-2,000
//   - DAU: 大半のアプリは 5-100
//   - 当たりアプリ（上位5%）: DAU 200-1,000
//   - 大当たり（上位1%）: DAU 1,000+
//
// 日本のAdMob eCPM（小規模アプリの現実値）:
//   Banner:       ¥30-100/1000imp（小規模は低い）
//   Interstitial: ¥500-1,500/1000imp
//   Rewarded:     ¥1,000-3,000/1000imp
// ============================================================

const apps = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', 'apps-master-list.json'), 'utf-8')
);

interface ScoreFactors {
  sessionFrequency: number;  // 日に何回開くか (0.3=月1-2, 1=日1, 3=日3回)
  avgSessionMin: number;     // 平均セッション時間(分)
  interstitialPerSession: number; // セッション当たりインタースティシャル表示回数
  rewardedPerDay: number;    // 日当たりリワード動画視聴回数
  retentionD30: number;      // 30日後の継続率 (0-1)
  organicDLPerMonth: number; // 月間オーガニックDL数
}

// subTemplate別の現実的なパラメータ
const baseParams: Record<string, ScoreFactors> = {
  // ゲーム系: DL数は取れるが継続率は中程度
  quiz:      { sessionFrequency: 1.2, avgSessionMin: 4,   interstitialPerSession: 0.8, rewardedPerDay: 0.3, retentionD30: 0.08, organicDLPerMonth: 120 },
  puzzle:    { sessionFrequency: 1.5, avgSessionMin: 6,   interstitialPerSession: 1.0, rewardedPerDay: 0.4, retentionD30: 0.10, organicDLPerMonth: 100 },
  memory:    { sessionFrequency: 0.8, avgSessionMin: 3,   interstitialPerSession: 0.7, rewardedPerDay: 0.2, retentionD30: 0.06, organicDLPerMonth: 60 },
  fortune:   { sessionFrequency: 1.0, avgSessionMin: 1.5, interstitialPerSession: 0.5, rewardedPerDay: 0.1, retentionD30: 0.12, organicDLPerMonth: 80 },

  // 日常トラッカー系: DLは少ないが継続率が高い
  tracker:   { sessionFrequency: 1.5, avgSessionMin: 1.5, interstitialPerSession: 0.3, rewardedPerDay: 0.0, retentionD30: 0.20, organicDLPerMonth: 50 },
  log:       { sessionFrequency: 0.8, avgSessionMin: 2,   interstitialPerSession: 0.2, rewardedPerDay: 0.0, retentionD30: 0.15, organicDLPerMonth: 40 },
  budget:    { sessionFrequency: 1.2, avgSessionMin: 2,   interstitialPerSession: 0.3, rewardedPerDay: 0.0, retentionD30: 0.18, organicDLPerMonth: 60 },

  // サウンド系: セッション長いがDL少ない
  sound:     { sessionFrequency: 0.8, avgSessionMin: 20,  interstitialPerSession: 0.1, rewardedPerDay: 0.0, retentionD30: 0.15, organicDLPerMonth: 40 },

  // タイマー系
  timer:     { sessionFrequency: 1.0, avgSessionMin: 2,   interstitialPerSession: 0.3, rewardedPerDay: 0.0, retentionD30: 0.12, organicDLPerMonth: 50 },
  counter:   { sessionFrequency: 0.5, avgSessionMin: 1,   interstitialPerSession: 0.2, rewardedPerDay: 0.0, retentionD30: 0.08, organicDLPerMonth: 30 },

  // ツール系: 使ったらすぐ閉じる、継続率低い
  calculator:{ sessionFrequency: 0.3, avgSessionMin: 0.5, interstitialPerSession: 0.2, rewardedPerDay: 0.0, retentionD30: 0.05, organicDLPerMonth: 40 },
  converter: { sessionFrequency: 0.2, avgSessionMin: 0.3, interstitialPerSession: 0.1, rewardedPerDay: 0.0, retentionD30: 0.03, organicDLPerMonth: 30 },
  reference: { sessionFrequency: 0.3, avgSessionMin: 1.5, interstitialPerSession: 0.1, rewardedPerDay: 0.0, retentionD30: 0.04, organicDLPerMonth: 30 },
  generator: { sessionFrequency: 0.3, avgSessionMin: 0.5, interstitialPerSession: 0.2, rewardedPerDay: 0.0, retentionD30: 0.04, organicDLPerMonth: 30 },
};

// カテゴリ別DLブースト（検索需要の大きさ）
const categoryDLBoost: Record<string, number> = {
  'Health': 1.3,
  'Education': 1.4,
  'Finance': 1.2,
  'Games': 1.2,
  'Productivity': 1.1,
  'Entertainment': 1.1,
  'Food & Drink': 0.9,
  'Lifestyle': 0.8,
  'Utility': 0.8,
  'Music': 0.7,
  'Sports': 0.7,
  'Beauty': 0.9,
  'Fashion': 0.7,
  'Travel': 0.7,
  'Shopping': 0.9,
};

// 特定アプリの需要ブースト（検索ボリュームが大きいキーワード）
const appDLBoost: Record<string, number> = {
  // 超高需要キーワード
  'sudoku': 3.0,
  'solitaire': 2.5,
  'kanji-quiz': 2.5,
  'driving-test-quiz': 2.5,
  'toeic-quiz': 2.0,
  'horoscope-daily': 2.5,
  'white-noise': 2.0,
  'pomodoro-timer': 2.0,
  'kakeibo': 2.0,

  // 高需要キーワード
  'bmi-calculator': 1.8,
  'spi-quiz': 1.8,
  'todofuken-quiz': 1.8,
  'nonogram': 1.8,
  'reversi': 1.8,
  'minesweeper': 1.8,
  'number-puzzle-2048': 1.8,
  'habit-tracker': 1.8,
  'personality-test': 1.8,
  'weight-tracker': 1.7,
  'sleep-tracker': 1.7,
  'period-tracker': 1.7,
  'baby-tracker': 1.7,
  'rain-sounds': 1.7,
  'flag-quiz': 1.6,
  'water-tracker': 1.6,
  'simple-diary': 1.6,
  'seimei-handan': 1.6,
  'omikuji': 1.5,
  'tarot-reading': 1.5,
  'meditation-timer': 1.5,
  'english-vocab-quiz': 1.5,
  'fasting-timer': 1.5,
  'tax-calculator': 1.5,
  'todo-list': 1.5,
  'food-log': 1.4,
  'diet-log': 1.5,
  'calorie-calculator': 1.5,
  'loan-calculator': 1.4,
  'kanji-kentei-quiz': 1.5,
  'nandoku-kanji': 1.4,
  'furusato-nozei-calc': 1.4,
  'study-timer': 1.4,
  'emoji-quiz': 1.4,
  'logo-quiz': 1.4,
  'rokuyo-calendar': 1.3,
  'memory-match': 1.3,
  'baby-sleep-sounds': 1.5,
  'sound-mixer': 1.3,
  'cigarette-tracker': 1.3,
  'mood-tracker': 1.3,
  'warikan-calculator': 1.3,
  'qr-generator': 1.4,
  'password-generator': 1.3,
  'speed-math': 1.3,
  'cooking-timer': 1.3,
  'shopping-list': 1.3,
  'eiken-quiz': 1.4,
  'salary-calculator': 1.4,
  'food-expiry': 1.3,
  'color-analysis': 1.5,
  'love-compatibility': 1.4,
  'roulette-app': 1.3,
  'meal-decider': 1.3,
};

// 500本のアプリ間相互送客ブースト（控えめ）
const CROSS_PROMO_BOOST = 1.15; // +15%

// ============================================================
// 収益計算
// ============================================================

interface Result {
  rank: number;
  name: string;
  displayName: string;
  displayNameEn: string;
  template: string;
  subTemplate: string;
  category: string;
  tier: string;
  monthlyDL: number;
  cumulativeDL6mo: number;
  estimatedDAU: number;
  bannerMonthly: number;
  interstitialMonthly: number;
  rewardedMonthly: number;
  totalMonthly: number;
  totalYearly: number;
  description: string;
}

const results: Result[] = apps.map((app: any) => {
  const params = baseParams[app.subTemplate] || baseParams['reference'];
  const catBoost = categoryDLBoost[app.category] || 1.0;
  const appBoost = appDLBoost[app.name] || 1.0;

  // 月間DL数（6ヶ月目の安定値）
  const monthlyDL = Math.round(params.organicDLPerMonth * catBoost * appBoost * CROSS_PROMO_BOOST);

  // 6ヶ月の累計DL（初月は少なく、徐々に増加）
  const cumulativeDL6mo = Math.round(monthlyDL * 4.5); // 6ヶ月分を初期成長込みで4.5ヶ月分

  // DAU計算
  // DAU = 累計DL × D30継続率 × セッション頻度調整
  // ただし最低DAU = 3（自分+家族がテストユーザー）
  const activeUsers = Math.round(cumulativeDL6mo * params.retentionD30);
  const dau = Math.max(3, Math.round(activeUsers * Math.min(1, params.sessionFrequency)));

  // eCPM（小規模アプリの現実値、円）
  const bannerECPM = 50;          // ¥50/1000imp（小規模は低い）
  const interstitialECPM = 800;   // ¥800/1000imp
  const rewardedECPM = 1500;      // ¥1,500/1000imp

  // バナー: DAU × sessions/day × session分 × 30日
  // 1分あたり約1インプレッション
  const bannerImpressions = dau * params.sessionFrequency * params.avgSessionMin * 30;
  const bannerMonthly = Math.round(bannerImpressions / 1000 * bannerECPM);

  // インタースティシャル
  const interstitialImpressions = dau * params.sessionFrequency * params.interstitialPerSession * 30;
  const interstitialMonthly = Math.round(interstitialImpressions / 1000 * interstitialECPM);

  // リワード動画
  const rewardedImpressions = dau * params.rewardedPerDay * 30;
  const rewardedMonthly = Math.round(rewardedImpressions / 1000 * rewardedECPM);

  const totalMonthly = bannerMonthly + interstitialMonthly + rewardedMonthly;
  const totalYearly = totalMonthly * 12;

  // ティア分け
  let tier: string;
  if (totalMonthly >= 10000) tier = 'S';
  else if (totalMonthly >= 3000) tier = 'A';
  else if (totalMonthly >= 1000) tier = 'B';
  else if (totalMonthly >= 300) tier = 'C';
  else tier = 'D';

  return {
    rank: 0,
    name: app.name,
    displayName: app.displayName,
    displayNameEn: app.displayNameEn,
    template: app.template,
    subTemplate: app.subTemplate,
    category: app.category,
    tier,
    monthlyDL,
    cumulativeDL6mo,
    estimatedDAU: dau,
    bannerMonthly,
    interstitialMonthly,
    rewardedMonthly,
    totalMonthly,
    totalYearly,
    description: app.description,
  };
});

results.sort((a: Result, b: Result) => b.totalMonthly - a.totalMonthly);
results.forEach((r: Result, i: number) => { r.rank = i + 1; });

// CSV出力
const header = 'rank,tier,name,displayName,category,subTemplate,monthlyDL,cumulDL_6mo,DAU,banner_yen,interstitial_yen,rewarded_yen,total_monthly_yen,total_yearly_yen,description';
const rows = results.map((a: Result) => {
  const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
  return [
    a.rank, esc(a.tier), esc(a.name), esc(a.displayName),
    esc(a.category), esc(a.subTemplate),
    a.monthlyDL, a.cumulativeDL6mo, a.estimatedDAU,
    a.bannerMonthly, a.interstitialMonthly, a.rewardedMonthly,
    a.totalMonthly, a.totalYearly, esc(a.description),
  ].join(',');
});

const csvPath = path.resolve(__dirname, '..', 'apps-revenue-ranking.csv');
fs.writeFileSync(csvPath, '\uFEFF' + [header, ...rows].join('\n') + '\n', 'utf-8');

// ============================================================
// サマリー出力
// ============================================================
console.log(`\n=== 現実的な広告収益予測（個人開発・広告費ゼロ・6ヶ月後） ===\n`);
console.log('前提: オーガニック流入のみ / AdMob小規模eCPM / 日本市場');
console.log('');

console.log('--- TOP 30 ---');
console.log(`${'#'.padStart(3)} | Tier | ${'DL/月'.padStart(5)} | ${'DAU'.padStart(4)} | ${'月収'.padStart(8)} | ${'年収'.padStart(10)} | アプリ名`);
console.log('-'.repeat(90));
for (const a of results.slice(0, 30)) {
  console.log(
    `${String(a.rank).padStart(3)} | ${a.tier.padEnd(4)} | ${String(a.monthlyDL).padStart(5)} | ${String(a.estimatedDAU).padStart(4)} | ¥${String(a.totalMonthly.toLocaleString()).padStart(7)} | ¥${String(a.totalYearly.toLocaleString()).padStart(9)} | ${a.displayName}`
  );
}

console.log(`\n--- ティア分布 ---`);
for (const t of ['S', 'A', 'B', 'C', 'D']) {
  const tier = results.filter((a: Result) => a.tier === t);
  if (tier.length === 0) continue;
  const total = tier.reduce((s: number, a: Result) => s + a.totalMonthly, 0);
  const avg = Math.round(total / tier.length);
  console.log(
    `Tier ${t}: ${String(tier.length).padStart(3)}本 | 月間合計 ¥${total.toLocaleString().padStart(10)} | 平均 ¥${avg.toLocaleString().padStart(6)}/本`
  );
}

const grandMonthly = results.reduce((s: number, a: Result) => s + a.totalMonthly, 0);
console.log(`\n--- 全500本合計 ---`);
console.log(`月間収益: ¥${grandMonthly.toLocaleString()}`);
console.log(`年間収益: ¥${(grandMonthly * 12).toLocaleString()}`);

// 成長シナリオ
console.log(`\n--- 成長シナリオ別年間収益 ---`);
console.log(`悲観（×0.5）: ¥${(grandMonthly * 12 * 0.5).toLocaleString()}`);
console.log(`現実的:       ¥${(grandMonthly * 12).toLocaleString()}`);
console.log(`楽観（×2.0）: ¥${(grandMonthly * 12 * 2.0).toLocaleString()}`);
console.log(`大当たり（1本バズ+他普通）: 上記 + ¥300万-1,000万/年`);

console.log(`\nCSV: ${csvPath}`);
