// ---------------------------------------------------------------------------
// FIREシミュレーター
// ---------------------------------------------------------------------------
export interface FireInput {
  currentAge: number;
  currentAssets: number;       // 万円
  monthlyInvestment: number;   // 万円/月
  annualReturnRate: number;    // %
  annualExpenses: number;      // 万円/年（FIRE後の生活費）
}

export interface FireResult {
  fireAge: number;
  yearsToFire: number;
  targetAssets: number;        // 万円（annualExpenses × 25）
  finalAssets: number;         // 万円
}

export type ScenarioType = '楽観' | '中立' | '悲観';

export interface FireScenario {
  type: ScenarioType;
  returnRateDelta: number;     // 基準利回りへの加算値（楽観+2, 中立0, 悲観-2）
  result: FireResult | null;
}

// ---------------------------------------------------------------------------
// 新NISAシミュレーター
// ---------------------------------------------------------------------------
export interface NisaInput {
  monthlyAmount: number;       // 万円/月（積立投資枠）
  lumpSumAmount: number;       // 万円/年（成長投資枠、0〜360万）
  annualReturnRate: number;    // %
  years: number;               // 投資期間（年）
}

export interface NisaResult {
  totalInvestment: number;     // 万円
  taxableResult: number;       // 万円（通常課税時の最終資産）
  nonTaxableResult: number;    // 万円（非課税時の最終資産）
  taxSaving: number;           // 万円（節税効果）
}

// 積立投資枠：年120万（月10万）上限
export const NISA_TSUMITATE_ANNUAL_LIMIT = 120;
// 成長投資枠：年360万上限
export const NISA_SEICHOU_ANNUAL_LIMIT = 360;
// 通常の税率（配当・譲渡所得）
export const CAPITAL_GAINS_TAX_RATE = 0.20315;

// ---------------------------------------------------------------------------
// iDeCo計算機
// ---------------------------------------------------------------------------
export type Occupation =
  | '会社員（企業年金なし）'
  | '会社員（企業年金あり）'
  | '公務員'
  | '自営業・フリーランス'
  | '専業主婦(夫)';

export interface IdecoInput {
  occupation: Occupation;
  monthlyContribution: number; // 円
  annualIncome: number;        // 万円
  years: number;
}

export interface IdecoResult {
  annualTaxSaving: number;     // 円/年
  totalTaxSaving: number;      // 円（期間累計）
  totalContribution: number;   // 円
}

// 職業別掛け金上限（月額・円）
export const IDECO_LIMITS: Record<Occupation, number> = {
  '会社員（企業年金なし）': 23000,
  '会社員（企業年金あり）': 12000,
  '公務員': 12000,
  '自営業・フリーランス': 68000,
  '専業主婦(夫)': 23000,
};

export const OCCUPATIONS: Occupation[] = [
  '会社員（企業年金なし）',
  '会社員（企業年金あり）',
  '公務員',
  '自営業・フリーランス',
  '専業主婦(夫)',
];

// ---------------------------------------------------------------------------
// 計算ユーティリティ
// ---------------------------------------------------------------------------
export function calcFireResult(input: FireInput): FireResult | null {
  const { currentAge, currentAssets, monthlyInvestment, annualReturnRate, annualExpenses } = input;
  if (annualReturnRate <= 0 || annualExpenses <= 0) return null;

  const targetAssets = annualExpenses * 25; // 4%ルール
  const monthlyRate = annualReturnRate / 100 / 12;
  let assets = currentAssets;

  for (let year = 0; year <= 60; year++) {
    if (assets >= targetAssets) {
      return {
        fireAge: currentAge + year,
        yearsToFire: year,
        targetAssets,
        finalAssets: Math.round(assets),
      };
    }
    for (let m = 0; m < 12; m++) {
      assets = assets * (1 + monthlyRate) + monthlyInvestment;
    }
  }
  return null;
}

export function calcNisaResult(input: NisaInput): NisaResult {
  const { monthlyAmount, lumpSumAmount, annualReturnRate, years } = input;
  const r = annualReturnRate / 100;
  let taxableAssets = 0;
  let nonTaxableAssets = 0;
  const monthlyRate = r / 12;

  // 積立分（複利）
  for (let m = 0; m < years * 12; m++) {
    taxableAssets = (taxableAssets + monthlyAmount) * (1 + monthlyRate);
    nonTaxableAssets = (nonTaxableAssets + monthlyAmount) * (1 + monthlyRate);
  }

  // 一括投資分（年次）
  let lumpTaxable = 0;
  let lumpNonTaxable = 0;
  const annualLump = Math.min(lumpSumAmount, NISA_SEICHOU_ANNUAL_LIMIT);
  for (let y = 0; y < years; y++) {
    lumpTaxable = (lumpTaxable + annualLump) * (1 + r);
    lumpNonTaxable = (lumpNonTaxable + annualLump) * (1 + r);
  }

  const totalInvestment = monthlyAmount * 12 * years + annualLump * years;
  const totalTaxable = taxableAssets + lumpTaxable;
  const totalNonTaxable = nonTaxableAssets + lumpNonTaxable;

  // 課税時：利益に税率適用
  const profit = totalTaxable - totalInvestment;
  const taxableResult = totalInvestment + profit * (1 - CAPITAL_GAINS_TAX_RATE);

  return {
    totalInvestment: Math.round(totalInvestment),
    taxableResult: Math.round(taxableResult),
    nonTaxableResult: Math.round(totalNonTaxable),
    taxSaving: Math.round(totalNonTaxable - taxableResult),
  };
}

export function calcIdecoResult(input: IdecoInput): IdecoResult {
  const { monthlyContribution, annualIncome, years } = input;
  // 所得税率（簡易推定）
  const incomeTaxRate = annualIncome < 195 ? 0.05
    : annualIncome < 330 ? 0.10
    : annualIncome < 695 ? 0.20
    : annualIncome < 900 ? 0.23
    : annualIncome < 1800 ? 0.33
    : annualIncome < 4000 ? 0.40
    : 0.45;
  // 住民税率（一律10%）
  const localTaxRate = 0.10;
  const totalRate = incomeTaxRate + localTaxRate;

  const annualContribution = monthlyContribution * 12;
  const annualTaxSaving = Math.round(annualContribution * totalRate);
  const totalTaxSaving = annualTaxSaving * years;
  const totalContribution = annualContribution * years;

  return { annualTaxSaving, totalTaxSaving, totalContribution };
}
