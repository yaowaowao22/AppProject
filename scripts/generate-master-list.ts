import * as fs from 'node:fs';
import * as path from 'node:path';

const THEMES = [
  'warm-orange', 'monochrome', 'ocean-blue', 'forest-green',
  'sunset-purple', 'sakura-pink', 'midnight-navy', 'earth-brown',
  'neon-cyber', 'pastel-dream', 'mint-fresh', 'coral-reef',
] as const;

interface AppDef {
  name: string;
  displayName: string;
  displayNameEn: string;
  template: 'utility' | 'lifestyle' | 'game';
  subTemplate: string;
  category: string;
  targetApp: string;
  difficulty: number;
  description: string;
}

// ============================================================
// APP DEFINITIONS BY CATEGORY
// ============================================================

const converters: AppDef[] = [
  // Length
  { name: 'length-converter', displayName: '長さ変換', displayNameEn: 'Length Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Amount ($1.99)', difficulty: 1, description: 'メートル、フィート、インチ、マイル等の長さ単位を変換' },
  { name: 'weight-converter', displayName: '重さ変換', displayNameEn: 'Weight Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Convertible ($2.99)', difficulty: 1, description: 'キログラム、ポンド、オンス等の重さ単位を変換' },
  { name: 'temperature-converter', displayName: '温度変換', displayNameEn: 'Temperature Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Unit converters ($2-5)', difficulty: 1, description: '摂氏、華氏、ケルビンの温度を変換' },
  { name: 'area-converter', displayName: '面積変換', displayNameEn: 'Area Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Unit converters ($2-5)', difficulty: 1, description: '平方メートル、坪、エーカー等の面積を変換' },
  { name: 'volume-converter', displayName: '体積変換', displayNameEn: 'Volume Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Convertible ($2.99)', difficulty: 1, description: 'リットル、ガロン、cc等の体積を変換' },
  { name: 'speed-converter', displayName: '速度変換', displayNameEn: 'Speed Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Unit converters ($2-5)', difficulty: 1, description: 'km/h、mph、m/s、ノット等の速度を変換' },
  { name: 'data-converter', displayName: 'データ容量変換', displayNameEn: 'Data Size Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Unit converters ($2-5)', difficulty: 1, description: 'バイト、KB、MB、GB、TBのデータサイズを変換' },
  { name: 'time-converter', displayName: '時間変換', displayNameEn: 'Time Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Unit converters ($2-5)', difficulty: 1, description: '秒、分、時間、日、週、月、年を相互変換' },
  { name: 'pressure-converter', displayName: '気圧変換', displayNameEn: 'Pressure Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Unit converters ($2-5)', difficulty: 1, description: 'hPa、atm、psi、mmHg等の気圧を変換' },
  { name: 'energy-converter', displayName: 'エネルギー変換', displayNameEn: 'Energy Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Unit converters ($2-5)', difficulty: 1, description: 'カロリー、ジュール、kWh等のエネルギーを変換' },
  { name: 'power-converter', displayName: '電力変換', displayNameEn: 'Power Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Unit converters ($2-5)', difficulty: 1, description: 'ワット、馬力、kW等の電力単位を変換' },
  { name: 'fuel-converter', displayName: '燃費変換', displayNameEn: 'Fuel Economy Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Unit converters ($2-5)', difficulty: 1, description: 'km/L、MPG、L/100km等の燃費を変換' },
  { name: 'angle-converter', displayName: '角度変換', displayNameEn: 'Angle Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Unit converters ($2-5)', difficulty: 1, description: '度、ラジアン、グラジアンの角度を変換' },
  { name: 'cooking-converter', displayName: '料理単位変換', displayNameEn: 'Cooking Unit Converter', template: 'utility', subTemplate: 'converter', category: 'Food & Drink', targetApp: 'Paprika ($4.99)', difficulty: 1, description: 'カップ、大さじ、小さじ、ml、gの料理用単位を変換' },
  { name: 'shoe-size-converter', displayName: '靴サイズ変換', displayNameEn: 'Shoe Size Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Size converters ($1-3)', difficulty: 1, description: '日本、US、UK、EU等の靴サイズを変換' },
  { name: 'clothing-size-converter', displayName: '服サイズ変換', displayNameEn: 'Clothing Size Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Size converters ($1-3)', difficulty: 1, description: '日本、US、UK、EU等の服サイズを変換' },
  { name: 'number-base-converter', displayName: '進数変換', displayNameEn: 'Number Base Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Programmer calculators ($2-5)', difficulty: 1, description: '2進数、8進数、10進数、16進数を相互変換' },
  { name: 'color-code-converter', displayName: 'カラーコード変換', displayNameEn: 'Color Code Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Color tools ($1-3)', difficulty: 1, description: 'HEX、RGB、HSL、CMYKのカラーコードを変換' },
  { name: 'timezone-converter', displayName: '時差計算', displayNameEn: 'Time Zone Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'World clock apps ($1-3)', difficulty: 1, description: '世界各地のタイムゾーンを変換・比較' },
  { name: 'currency-converter', displayName: '通貨変換', displayNameEn: 'Currency Converter', template: 'utility', subTemplate: 'converter', category: 'Finance', targetApp: 'Currency ($19.99/yr)', difficulty: 2, description: '主要通貨のリアルタイムレート変換' },
  { name: 'tsubo-meter-converter', displayName: '坪・平米変換', displayNameEn: 'Tsubo Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Japanese area converters', difficulty: 1, description: '坪、平米、畳の不動産面積を変換' },
  { name: 'wareki-converter', displayName: '和暦西暦変換', displayNameEn: 'Japanese Era Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Japanese era apps (¥100-300)', difficulty: 1, description: '令和・平成・昭和・大正・明治と西暦を相互変換' },
  { name: 'frequency-converter', displayName: '周波数変換', displayNameEn: 'Frequency Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Unit converters ($2-5)', difficulty: 1, description: 'Hz、kHz、MHz、GHz等の周波数を変換' },
  { name: 'density-converter', displayName: '密度変換', displayNameEn: 'Density Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Unit converters ($2-5)', difficulty: 1, description: 'kg/m³、g/cm³、lb/ft³等の密度を変換' },
  { name: 'force-converter', displayName: '力の変換', displayNameEn: 'Force Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Unit converters ($2-5)', difficulty: 1, description: 'ニュートン、kgf、ポンドフォース等を変換' },
  { name: 'torque-converter', displayName: 'トルク変換', displayNameEn: 'Torque Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Convertible ($2.99)', difficulty: 1, description: 'N·m、kgf·m、ft·lbs等のトルクを変換' },
  { name: 'flow-rate-converter', displayName: '流量変換', displayNameEn: 'Flow Rate Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Unit converters ($2-5)', difficulty: 1, description: 'L/min、m³/h、GPM等の流量を変換' },
  { name: 'illuminance-converter', displayName: '照度変換', displayNameEn: 'Illuminance Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Unit converters ($2-5)', difficulty: 1, description: 'ルクス、フートカンデラ等の照度を変換' },
  { name: 'roman-numeral-converter', displayName: 'ローマ数字変換', displayNameEn: 'Roman Numeral Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Various converters ($1-2)', difficulty: 1, description: 'アラビア数字とローマ数字を相互変換' },
  { name: 'all-unit-converter', displayName: '万能単位変換', displayNameEn: 'All-in-One Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Convertible ($2.99)', difficulty: 2, description: '100種類以上の単位を一つのアプリで変換' },
];

const calculators: AppDef[] = [
  { name: 'bmi-calculator', displayName: 'BMI計算機', displayNameEn: 'BMI Calculator', template: 'utility', subTemplate: 'calculator', category: 'Health', targetApp: 'Health calculators ($1-3)', difficulty: 1, description: '身長と体重からBMIと適正体重を計算' },
  { name: 'loan-calculator', displayName: 'ローン計算機', displayNameEn: 'Loan Calculator', template: 'utility', subTemplate: 'calculator', category: 'Finance', targetApp: "Karl's Mortgage ($1.99)", difficulty: 1, description: '住宅ローン・自動車ローンの返済額を計算' },
  { name: 'tax-calculator', displayName: '消費税計算機', displayNameEn: 'Sales Tax Calculator', template: 'utility', subTemplate: 'calculator', category: 'Finance', targetApp: 'Tax calculators (¥100-300)', difficulty: 1, description: '税込・税抜価格を瞬時に計算（8%・10%対応）' },
  { name: 'tip-calculator', displayName: 'チップ計算機', displayNameEn: 'Tip Calculator', template: 'utility', subTemplate: 'calculator', category: 'Utility', targetApp: 'Tip Calculator Gold ($1.99)', difficulty: 1, description: 'チップ金額と割り勘を簡単計算' },
  { name: 'age-calculator', displayName: '年齢計算機', displayNameEn: 'Age Calculator', template: 'utility', subTemplate: 'calculator', category: 'Utility', targetApp: 'Age calculators ($1-2)', difficulty: 1, description: '生年月日から正確な年齢・日数を計算' },
  { name: 'date-calculator', displayName: '日数計算機', displayNameEn: 'Date Calculator', template: 'utility', subTemplate: 'calculator', category: 'Utility', targetApp: 'Date calculators ($1-3)', difficulty: 1, description: '2つの日付間の日数・営業日を計算' },
  { name: 'percentage-calculator', displayName: 'パーセント計算機', displayNameEn: 'Percentage Calculator', template: 'utility', subTemplate: 'calculator', category: 'Utility', targetApp: 'Various calculators ($1-3)', difficulty: 1, description: '割合・割引・増減のパーセント計算' },
  { name: 'discount-calculator', displayName: '割引計算機', displayNameEn: 'Discount Calculator', template: 'utility', subTemplate: 'calculator', category: 'Shopping', targetApp: 'Shopping calculators ($1-2)', difficulty: 1, description: '割引率から最終価格を瞬時に計算' },
  { name: 'warikan-calculator', displayName: '割り勘計算機', displayNameEn: 'Bill Splitter', template: 'utility', subTemplate: 'calculator', category: 'Utility', targetApp: 'Warikan apps (¥100-300)', difficulty: 1, description: '飲み会・食事の割り勘を人数別に計算' },
  { name: 'salary-calculator', displayName: '給料計算機', displayNameEn: 'Salary Calculator', template: 'utility', subTemplate: 'calculator', category: 'Finance', targetApp: 'Salary calculators (¥300-500)', difficulty: 2, description: '額面から手取り、社会保険料、税金を計算' },
  { name: 'pension-calculator', displayName: '年金計算機', displayNameEn: 'Pension Calculator', template: 'utility', subTemplate: 'calculator', category: 'Finance', targetApp: 'Pension calculators (¥300-500)', difficulty: 2, description: '将来の年金受給額を試算' },
  { name: 'mortgage-calculator', displayName: '住宅ローン計算機', displayNameEn: 'Mortgage Calculator', template: 'utility', subTemplate: 'calculator', category: 'Finance', targetApp: 'Mortgage Calc Plus ($4.99)', difficulty: 2, description: '住宅ローンの月々返済額と総支払額を計算' },
  { name: 'compound-interest-calc', displayName: '複利計算機', displayNameEn: 'Compound Interest Calculator', template: 'utility', subTemplate: 'calculator', category: 'Finance', targetApp: 'Financial calculators ($3-15)', difficulty: 1, description: '複利での資産増加をシミュレーション' },
  { name: 'calorie-calculator', displayName: 'カロリー計算機', displayNameEn: 'Calorie Calculator', template: 'utility', subTemplate: 'calculator', category: 'Health', targetApp: 'Health calculators ($1-5)', difficulty: 1, description: '基礎代謝量と1日の必要カロリーを計算' },
  { name: 'pregnancy-calculator', displayName: '出産予定日計算', displayNameEn: 'Due Date Calculator', template: 'utility', subTemplate: 'calculator', category: 'Health', targetApp: 'Pregnancy apps ($2-5)', difficulty: 1, description: '最終月経日から出産予定日を計算' },
  { name: 'gpa-calculator', displayName: 'GPA計算機', displayNameEn: 'GPA Calculator', template: 'utility', subTemplate: 'calculator', category: 'Education', targetApp: 'GPA calculators ($1-3)', difficulty: 1, description: '成績からGPAを計算' },
  { name: 'electricity-cost-calc', displayName: '電気代計算機', displayNameEn: 'Electricity Cost Calculator', template: 'utility', subTemplate: 'calculator', category: 'Utility', targetApp: 'Electricity calculators (¥100-300)', difficulty: 1, description: '家電の消費電力から月々の電気代を計算' },
  { name: 'scientific-calculator', displayName: '関数電卓', displayNameEn: 'Scientific Calculator', template: 'utility', subTemplate: 'calculator', category: 'Utility', targetApp: 'PCalc ($9.99)', difficulty: 2, description: '三角関数・対数・累乗等の関数計算' },
  { name: 'matrix-calculator', displayName: '行列計算機', displayNameEn: 'Matrix Calculator', template: 'utility', subTemplate: 'calculator', category: 'Education', targetApp: 'Math calculators ($3-10)', difficulty: 3, description: '行列の積・逆行列・行列式を計算' },
  { name: 'statistics-calculator', displayName: '統計計算機', displayNameEn: 'Statistics Calculator', template: 'utility', subTemplate: 'calculator', category: 'Education', targetApp: 'Soulver 3 ($14-20)', difficulty: 2, description: '平均・分散・標準偏差・中央値を計算' },
  { name: 'concrete-calculator', displayName: 'コンクリート計算', displayNameEn: 'Concrete Calculator', template: 'utility', subTemplate: 'calculator', category: 'Utility', targetApp: 'Construction calculators ($2-5)', difficulty: 1, description: 'コンクリートの必要量と材料配合を計算' },
  { name: 'paint-calculator', displayName: 'ペンキ量計算', displayNameEn: 'Paint Calculator', template: 'utility', subTemplate: 'calculator', category: 'Utility', targetApp: 'Home improvement apps ($1-3)', difficulty: 1, description: '部屋の壁面積から必要なペンキ量を計算' },
  { name: 'fabric-calculator', displayName: '生地量計算', displayNameEn: 'Fabric Calculator', template: 'utility', subTemplate: 'calculator', category: 'Utility', targetApp: 'Sewing calculators ($1-3)', difficulty: 1, description: '裁縫に必要な生地の量を計算' },
  { name: 'investment-return-calc', displayName: '投資利回り計算', displayNameEn: 'Investment Return Calculator', template: 'utility', subTemplate: 'calculator', category: 'Finance', targetApp: 'Financial calculators ($3-15)', difficulty: 2, description: '積立投資のリターンをシミュレーション' },
  { name: 'body-fat-calculator', displayName: '体脂肪率計算', displayNameEn: 'Body Fat Calculator', template: 'utility', subTemplate: 'calculator', category: 'Health', targetApp: 'Health calculators ($1-5)', difficulty: 1, description: '身体データから体脂肪率を推定' },
  { name: 'dog-age-calculator', displayName: '犬の年齢計算', displayNameEn: 'Dog Age Calculator', template: 'utility', subTemplate: 'calculator', category: 'Utility', targetApp: 'Pet apps ($1-3)', difficulty: 1, description: '犬の年齢を人間年齢に換算' },
  { name: 'cat-age-calculator', displayName: '猫の年齢計算', displayNameEn: 'Cat Age Calculator', template: 'utility', subTemplate: 'calculator', category: 'Utility', targetApp: 'Pet apps ($1-3)', difficulty: 1, description: '猫の年齢を人間年齢に換算' },
  { name: 'aspect-ratio-calc', displayName: 'アスペクト比計算', displayNameEn: 'Aspect Ratio Calculator', template: 'utility', subTemplate: 'calculator', category: 'Utility', targetApp: 'Design tools ($1-3)', difficulty: 1, description: '画像・動画のアスペクト比とリサイズ計算' },
  { name: 'subnet-calculator', displayName: 'サブネット計算機', displayNameEn: 'Subnet Calculator', template: 'utility', subTemplate: 'calculator', category: 'Utility', targetApp: 'Network tools ($2-5)', difficulty: 2, description: 'IPアドレスのサブネット計算' },
  { name: 'hex-calculator', displayName: '16進電卓', displayNameEn: 'Hex Calculator', template: 'utility', subTemplate: 'calculator', category: 'Utility', targetApp: 'Programmer calculators ($2-5)', difficulty: 2, description: '16進数の四則演算とビット演算' },
];

const timers: AppDef[] = [
  { name: 'pomodoro-timer', displayName: 'ポモドーロタイマー', displayNameEn: 'Pomodoro Timer', template: 'utility', subTemplate: 'timer', category: 'Productivity', targetApp: 'Forest ($3.99)', difficulty: 1, description: '25分集中+5分休憩のポモドーロテクニック' },
  { name: 'hiit-timer', displayName: 'HIITタイマー', displayNameEn: 'HIIT Timer', template: 'utility', subTemplate: 'timer', category: 'Health', targetApp: 'Interval Timer ($2-5)', difficulty: 1, description: '高強度インターバルトレーニング用タイマー' },
  { name: 'cooking-timer', displayName: 'クッキングタイマー', displayNameEn: 'Cooking Timer', template: 'utility', subTemplate: 'timer', category: 'Food & Drink', targetApp: 'Kitchen Timer ($1-3)', difficulty: 1, description: '複数の料理を同時にタイマー管理' },
  { name: 'meditation-timer', displayName: '瞑想タイマー', displayNameEn: 'Meditation Timer', template: 'utility', subTemplate: 'timer', category: 'Health', targetApp: 'Meditation apps ($5-15/mo)', difficulty: 1, description: 'ベル音付きの瞑想・マインドフルネスタイマー' },
  { name: 'study-timer', displayName: '勉強タイマー', displayNameEn: 'Study Timer', template: 'utility', subTemplate: 'timer', category: 'Education', targetApp: 'Forest ($3.99)', difficulty: 1, description: '集中時間を記録する勉強専用タイマー' },
  { name: 'tabata-timer', displayName: 'タバタタイマー', displayNameEn: 'Tabata Timer', template: 'utility', subTemplate: 'timer', category: 'Health', targetApp: 'Tabata Timer ($2-5)', difficulty: 1, description: '20秒運動+10秒休憩のタバタ式タイマー' },
  { name: 'chess-clock', displayName: 'チェスクロック', displayNameEn: 'Chess Clock', template: 'utility', subTemplate: 'timer', category: 'Games', targetApp: 'Chess Clock ($1-3)', difficulty: 1, description: '対戦ゲーム用の2人対局タイマー' },
  { name: 'presentation-timer', displayName: 'プレゼンタイマー', displayNameEn: 'Presentation Timer', template: 'utility', subTemplate: 'timer', category: 'Productivity', targetApp: 'Presentation Timer ($1-3)', difficulty: 1, description: 'プレゼン用の大画面カウントダウン' },
  { name: 'brushing-timer', displayName: '歯磨きタイマー', displayNameEn: 'Tooth Brushing Timer', template: 'utility', subTemplate: 'timer', category: 'Health', targetApp: 'Brushing timers ($1-2)', difficulty: 1, description: '子供も楽しめる歯磨き2分タイマー' },
  { name: 'egg-timer', displayName: 'ゆでたまごタイマー', displayNameEn: 'Egg Timer', template: 'utility', subTemplate: 'timer', category: 'Food & Drink', targetApp: 'Egg Timer ($0.99)', difficulty: 1, description: '半熟・固ゆでを選んでタイマー開始' },
  { name: 'plank-timer', displayName: 'プランクタイマー', displayNameEn: 'Plank Timer', template: 'utility', subTemplate: 'timer', category: 'Health', targetApp: 'Fitness timers ($1-3)', difficulty: 1, description: 'プランクチャレンジ用のタイマー' },
  { name: 'nap-timer', displayName: '昼寝タイマー', displayNameEn: 'Nap Timer', template: 'utility', subTemplate: 'timer', category: 'Health', targetApp: 'Sleep apps ($1-5)', difficulty: 1, description: '15/20/30分の昼寝用アラームタイマー' },
  { name: 'tea-timer', displayName: 'お茶タイマー', displayNameEn: 'Tea Timer', template: 'utility', subTemplate: 'timer', category: 'Food & Drink', targetApp: 'Tea Timer ($0.99-2)', difficulty: 1, description: '茶葉の種類に合わせた蒸らし時間タイマー' },
  { name: 'stopwatch-pro', displayName: 'ストップウォッチ', displayNameEn: 'Stopwatch Pro', template: 'utility', subTemplate: 'timer', category: 'Utility', targetApp: 'Stopwatch apps ($1-3)', difficulty: 1, description: 'ラップタイム付きの高精度ストップウォッチ' },
  { name: 'countdown-widget', displayName: 'カウントダウン', displayNameEn: 'Event Countdown', template: 'utility', subTemplate: 'timer', category: 'Utility', targetApp: 'TheDayBefore ($2.99-4.99)', difficulty: 1, description: 'イベントまでのカウントダウンを表示' },
  { name: 'interval-timer', displayName: 'インターバルタイマー', displayNameEn: 'Interval Timer', template: 'utility', subTemplate: 'timer', category: 'Health', targetApp: 'Interval timers ($2-5)', difficulty: 1, description: '運動と休憩の繰り返しタイマー' },
  { name: 'focus-timer', displayName: '集中タイマー', displayNameEn: 'Focus Timer', template: 'utility', subTemplate: 'timer', category: 'Productivity', targetApp: 'Forest ($3.99)', difficulty: 2, description: 'スマホを触らない時間を記録する集中タイマー' },
  { name: 'contraction-timer', displayName: '陣痛タイマー', displayNameEn: 'Contraction Timer', template: 'utility', subTemplate: 'timer', category: 'Health', targetApp: 'Contraction timers ($1-3)', difficulty: 1, description: '陣痛の間隔と持続時間を記録' },
  { name: 'fasting-timer', displayName: '断食タイマー', displayNameEn: 'Fasting Timer', template: 'utility', subTemplate: 'timer', category: 'Health', targetApp: 'Fasting apps ($5-10/mo)', difficulty: 1, description: '16:8等のインターミッテントファスティングタイマー' },
  { name: 'stretch-timer', displayName: 'ストレッチタイマー', displayNameEn: 'Stretch Timer', template: 'utility', subTemplate: 'timer', category: 'Health', targetApp: 'Yoga/stretch apps ($3-10)', difficulty: 1, description: '部位別ストレッチのインターバルタイマー' },
];

const counters: AppDef[] = [
  { name: 'tally-counter', displayName: 'タリーカウンター', displayNameEn: 'Tally Counter', template: 'utility', subTemplate: 'counter', category: 'Utility', targetApp: 'Tally Counter ($1-3)', difficulty: 1, description: 'タップで数を数えるシンプルカウンター' },
  { name: 'score-keeper', displayName: 'スコアキーパー', displayNameEn: 'Score Keeper', template: 'utility', subTemplate: 'counter', category: 'Games', targetApp: 'Score Counter ($1-3)', difficulty: 1, description: 'ボードゲーム・スポーツのスコアを記録' },
  { name: 'lap-counter', displayName: 'ラップカウンター', displayNameEn: 'Lap Counter', template: 'utility', subTemplate: 'counter', category: 'Health', targetApp: 'Lap counters ($1-2)', difficulty: 1, description: '周回数をカウント（プール、ランニング）' },
  { name: 'pitch-counter', displayName: '球数カウンター', displayNameEn: 'Pitch Counter', template: 'utility', subTemplate: 'counter', category: 'Sports', targetApp: 'Baseball counters ($1-3)', difficulty: 1, description: '野球の投球数・ストライク・ボールを記録' },
  { name: 'knitting-counter', displayName: '編み物カウンター', displayNameEn: 'Knitting Counter', template: 'utility', subTemplate: 'counter', category: 'Utility', targetApp: 'Knit counters ($1-2)', difficulty: 1, description: '編み目・段数をカウント' },
  { name: 'prayer-counter', displayName: '念仏カウンター', displayNameEn: 'Prayer Counter', template: 'utility', subTemplate: 'counter', category: 'Lifestyle', targetApp: 'Prayer counters ($1-3)', difficulty: 1, description: '念仏・お経の回数をカウント' },
  { name: 'blood-pressure-log', displayName: '血圧記録', displayNameEn: 'Blood Pressure Log', template: 'utility', subTemplate: 'counter', category: 'Health', targetApp: 'BP trackers ($2-5)', difficulty: 1, description: '血圧と脈拍を記録・グラフ表示' },
  { name: 'multi-counter', displayName: 'マルチカウンター', displayNameEn: 'Multi Counter', template: 'utility', subTemplate: 'counter', category: 'Utility', targetApp: 'Counter apps ($1-3)', difficulty: 1, description: '複数のカウンターを同時に管理' },
  { name: 'step-counter', displayName: '歩数カウンター', displayNameEn: 'Step Counter', template: 'utility', subTemplate: 'counter', category: 'Health', targetApp: 'Pedometers ($1-3)', difficulty: 1, description: '日々の歩数を記録・目標設定' },
  { name: 'dice-roller', displayName: 'サイコロ', displayNameEn: 'Dice Roller', template: 'utility', subTemplate: 'counter', category: 'Games', targetApp: 'Dice apps ($0.99-2)', difficulty: 1, description: '様々な面数のサイコロを振る' },
];

const sounds: AppDef[] = [
  { name: 'white-noise', displayName: 'ホワイトノイズ', displayNameEn: 'White Noise', template: 'utility', subTemplate: 'sound', category: 'Health', targetApp: 'White Noise ($1-5)', difficulty: 2, description: 'ホワイトノイズ・ピンクノイズで集中・睡眠' },
  { name: 'rain-sounds', displayName: '雨の音', displayNameEn: 'Rain Sounds', template: 'utility', subTemplate: 'sound', category: 'Health', targetApp: 'Sleep sounds ($2-5)', difficulty: 2, description: '雨・雷・嵐のリラックスサウンド' },
  { name: 'ocean-sounds', displayName: '海の音', displayNameEn: 'Ocean Sounds', template: 'utility', subTemplate: 'sound', category: 'Health', targetApp: 'Sleep sounds ($2-5)', difficulty: 2, description: '波の音・海辺の環境音' },
  { name: 'forest-sounds', displayName: '森の音', displayNameEn: 'Forest Sounds', template: 'utility', subTemplate: 'sound', category: 'Health', targetApp: 'Nature sounds ($2-5)', difficulty: 2, description: '小鳥のさえずり・森の環境音' },
  { name: 'cafe-sounds', displayName: 'カフェの音', displayNameEn: 'Cafe Sounds', template: 'utility', subTemplate: 'sound', category: 'Productivity', targetApp: 'Coffitivity ($1-3)', difficulty: 2, description: 'カフェの雑音で集中力アップ' },
  { name: 'fireplace-sounds', displayName: '暖炉の音', displayNameEn: 'Fireplace Sounds', template: 'utility', subTemplate: 'sound', category: 'Health', targetApp: 'Relaxation apps ($2-5)', difficulty: 2, description: 'パチパチ燃える暖炉のサウンド' },
  { name: 'wind-sounds', displayName: '風の音', displayNameEn: 'Wind Sounds', template: 'utility', subTemplate: 'sound', category: 'Health', targetApp: 'Nature sounds ($2-5)', difficulty: 2, description: 'そよ風・強風・風鈴の音' },
  { name: 'river-sounds', displayName: '川の音', displayNameEn: 'River Sounds', template: 'utility', subTemplate: 'sound', category: 'Health', targetApp: 'Nature sounds ($2-5)', difficulty: 2, description: 'せせらぎ・滝・渓流の音' },
  { name: 'night-sounds', displayName: '夜の音', displayNameEn: 'Night Sounds', template: 'utility', subTemplate: 'sound', category: 'Health', targetApp: 'Sleep sounds ($2-5)', difficulty: 2, description: '虫の声・コオロギ・夜の環境音' },
  { name: 'cat-purr-sounds', displayName: '猫のゴロゴロ', displayNameEn: 'Cat Purr Sounds', template: 'utility', subTemplate: 'sound', category: 'Health', targetApp: 'ASMR apps ($1-3)', difficulty: 2, description: '猫のゴロゴロ音でリラックス' },
  { name: 'train-sounds', displayName: '電車の音', displayNameEn: 'Train Sounds', template: 'utility', subTemplate: 'sound', category: 'Health', targetApp: 'ASMR apps ($1-3)', difficulty: 2, description: '電車の走行音・踏切の音' },
  { name: 'city-sounds', displayName: '都会の音', displayNameEn: 'City Ambience', template: 'utility', subTemplate: 'sound', category: 'Health', targetApp: 'Ambient sounds ($2-5)', difficulty: 2, description: '都会の喧騒・交通の環境音' },
  { name: 'baby-sleep-sounds', displayName: '赤ちゃん寝かしつけ音', displayNameEn: 'Baby Sleep Sounds', template: 'utility', subTemplate: 'sound', category: 'Health', targetApp: 'Baby sleep apps ($2-5)', difficulty: 2, description: '赤ちゃんが眠るホワイトノイズ・子守唄' },
  { name: 'sound-mixer', displayName: 'サウンドミキサー', displayNameEn: 'Sound Mixer', template: 'utility', subTemplate: 'sound', category: 'Health', targetApp: 'Noisli ($1-10)', difficulty: 3, description: '複数の環境音をミックスして自分だけのサウンドを作成' },
  { name: 'binaural-beats', displayName: 'バイノーラルビート', displayNameEn: 'Binaural Beats', template: 'utility', subTemplate: 'sound', category: 'Health', targetApp: 'Brain.fm ($6-7/mo)', difficulty: 2, description: '集中・リラックス・睡眠用のバイノーラルビート' },
];

const reference: AppDef[] = [
  { name: 'rokuyo-calendar', displayName: '六曜カレンダー', displayNameEn: 'Rokuyo Calendar', template: 'utility', subTemplate: 'reference', category: 'Utility', targetApp: 'CalCs (¥100)', difficulty: 1, description: '大安・仏滅・友引等の六曜を確認' },
  { name: 'nenrei-hayami', displayName: '年齢早見表', displayNameEn: 'Age Lookup Table', template: 'utility', subTemplate: 'reference', category: 'Utility', targetApp: 'Japanese age apps (¥100-300)', difficulty: 1, description: '生まれ年から年齢・干支・学年を一覧表示' },
  { name: 'eto-calculator', displayName: '干支計算', displayNameEn: 'Chinese Zodiac', template: 'utility', subTemplate: 'reference', category: 'Utility', targetApp: 'Zodiac apps (¥100-300)', difficulty: 1, description: '十二支・十干を確認する干支計算' },
  { name: 'keigo-guide', displayName: '敬語ガイド', displayNameEn: 'Keigo Guide', template: 'utility', subTemplate: 'reference', category: 'Education', targetApp: 'Keigo apps (¥300-500)', difficulty: 1, description: 'ビジネス敬語の正しい使い方辞典' },
  { name: 'kankon-sosai', displayName: '冠婚葬祭マナー', displayNameEn: 'Etiquette Guide', template: 'utility', subTemplate: 'reference', category: 'Lifestyle', targetApp: 'Manner apps (¥300-500)', difficulty: 1, description: '結婚式・葬儀・お祝いのマナー辞典' },
  { name: 'noshi-guide', displayName: 'のし袋の書き方', displayNameEn: 'Gift Envelope Guide', template: 'utility', subTemplate: 'reference', category: 'Lifestyle', targetApp: 'Noshi apps (¥100-300)', difficulty: 1, description: 'のし袋の表書き・金額の書き方ガイド' },
  { name: 'kanji-stroke-order', displayName: '漢字筆順辞典', displayNameEn: 'Kanji Stroke Order', template: 'utility', subTemplate: 'reference', category: 'Education', targetApp: '常用漢字筆順辞典 (¥600)', difficulty: 2, description: '漢字の正しい筆順をアニメーションで表示' },
  { name: 'yojijukugo-dict', displayName: '四字熟語辞典', displayNameEn: 'Yojijukugo Dictionary', template: 'utility', subTemplate: 'reference', category: 'Education', targetApp: 'Yojijukugo apps (¥300-500)', difficulty: 1, description: '四字熟語の意味・由来・使い方を検索' },
  { name: 'kotowaza-dict', displayName: 'ことわざ辞典', displayNameEn: 'Proverb Dictionary', template: 'utility', subTemplate: 'reference', category: 'Education', targetApp: 'Kotowaza apps (¥100-300)', difficulty: 1, description: '日本語のことわざ・慣用句を検索' },
  { name: 'hyakunin-isshu', displayName: '百人一首', displayNameEn: 'Hyakunin Isshu', template: 'utility', subTemplate: 'reference', category: 'Education', targetApp: 'Hyakunin Isshu apps (¥300-600)', difficulty: 1, description: '百人一首の全100首を鑑賞・暗記' },
  { name: 'color-palette', displayName: 'カラーパレット', displayNameEn: 'Color Palette', template: 'utility', subTemplate: 'reference', category: 'Utility', targetApp: 'Color tools ($1-5)', difficulty: 1, description: '和色・Webカラーのカラーパレット辞典' },
  { name: 'ascii-table', displayName: 'ASCII表', displayNameEn: 'ASCII Table', template: 'utility', subTemplate: 'reference', category: 'Utility', targetApp: 'Dev tools ($1-3)', difficulty: 1, description: 'ASCII/Unicodeコード表の参照ツール' },
  { name: 'periodic-table', displayName: '元素周期表', displayNameEn: 'Periodic Table', template: 'utility', subTemplate: 'reference', category: 'Education', targetApp: 'Periodic Table apps ($1-3)', difficulty: 1, description: '元素の詳細情報付き周期表' },
  { name: 'morse-code', displayName: 'モールス信号', displayNameEn: 'Morse Code', template: 'utility', subTemplate: 'reference', category: 'Education', targetApp: 'Morse code apps ($1-2)', difficulty: 1, description: 'モールス信号の変換と学習' },
  { name: 'world-holidays', displayName: '世界の祝日', displayNameEn: 'World Holidays', template: 'utility', subTemplate: 'reference', category: 'Utility', targetApp: 'Holiday apps ($1-3)', difficulty: 1, description: '各国の祝日・記念日カレンダー' },
  { name: 'blood-type-guide', displayName: '血液型ガイド', displayNameEn: 'Blood Type Guide', template: 'utility', subTemplate: 'reference', category: 'Lifestyle', targetApp: 'Blood type apps (¥100-300)', difficulty: 1, description: '血液型別の性格・相性診断' },
  { name: 'hanakotoba', displayName: '花言葉辞典', displayNameEn: 'Flower Language Dictionary', template: 'utility', subTemplate: 'reference', category: 'Lifestyle', targetApp: 'Flower language apps (¥100-300)', difficulty: 1, description: '花言葉・誕生花を検索' },
  { name: 'birthstone-guide', displayName: '誕生石ガイド', displayNameEn: 'Birthstone Guide', template: 'utility', subTemplate: 'reference', category: 'Lifestyle', targetApp: 'Birthstone apps (¥100-200)', difficulty: 1, description: '月ごとの誕生石とその意味' },
  { name: 'constellation-guide', displayName: '星座ガイド', displayNameEn: 'Constellation Guide', template: 'utility', subTemplate: 'reference', category: 'Education', targetApp: 'SkyView ($1.99)', difficulty: 1, description: '88星座の解説と見つけ方' },
  { name: 'first-aid-guide', displayName: '応急処置ガイド', displayNameEn: 'First Aid Guide', template: 'utility', subTemplate: 'reference', category: 'Health', targetApp: 'First aid apps ($1-5)', difficulty: 1, description: '緊急時の応急処置方法を解説' },
];

const trackers: AppDef[] = [
  { name: 'habit-tracker', displayName: '習慣トラッカー', displayNameEn: 'Habit Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Productivity', targetApp: 'Streaks ($4.99)', difficulty: 2, description: '毎日の習慣を記録・連続日数を表示' },
  { name: 'water-tracker', displayName: '水分記録', displayNameEn: 'Water Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Health', targetApp: 'Water trackers ($2-5)', difficulty: 1, description: '1日の水分摂取量を記録・目標管理' },
  { name: 'weight-tracker', displayName: '体重記録', displayNameEn: 'Weight Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Health', targetApp: 'Weight trackers ($2-5)', difficulty: 2, description: '体重の推移をグラフで可視化' },
  { name: 'mood-tracker', displayName: '気分記録', displayNameEn: 'Mood Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Health', targetApp: 'Mood apps ($2-5/mo)', difficulty: 2, description: '毎日の気分・感情を記録・分析' },
  { name: 'sleep-tracker', displayName: '睡眠記録', displayNameEn: 'Sleep Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Health', targetApp: 'AutoSleep (¥900)', difficulty: 2, description: '就寝・起床時間と睡眠の質を記録' },
  { name: 'medicine-tracker', displayName: 'お薬リマインダー', displayNameEn: 'Medicine Reminder', template: 'lifestyle', subTemplate: 'tracker', category: 'Health', targetApp: 'Medicine trackers ($2-5)', difficulty: 2, description: '薬の服用スケジュールを管理・リマインド' },
  { name: 'reading-tracker', displayName: '読書記録', displayNameEn: 'Reading Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Education', targetApp: 'Bookly ($5/mo)', difficulty: 2, description: '読んだ本・ページ数・感想を記録' },
  { name: 'pet-tracker', displayName: 'ペット記録', displayNameEn: 'Pet Care Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Lifestyle', targetApp: 'PetNote+ (¥450-750/mo)', difficulty: 2, description: 'ペットの食事・通院・体重を記録' },
  { name: 'plant-tracker', displayName: '植物記録', displayNameEn: 'Plant Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Lifestyle', targetApp: 'Planta ($35.99/yr)', difficulty: 2, description: '植物の水やり・肥料スケジュールを管理' },
  { name: 'baby-tracker', displayName: '育児記録', displayNameEn: 'Baby Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Health', targetApp: 'ぴよログ (¥400/mo)', difficulty: 2, description: '授乳・おむつ・睡眠を記録' },
  { name: 'period-tracker', displayName: '生理日記録', displayNameEn: 'Period Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Health', targetApp: 'Period trackers ($2-5/mo)', difficulty: 2, description: '生理日・排卵日・体調を予測・記録' },
  { name: 'workout-tracker', displayName: '筋トレ記録', displayNameEn: 'Workout Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Health', targetApp: 'Strong ($5-10/mo)', difficulty: 2, description: '筋トレの種目・重量・セット数を記録' },
  { name: 'running-log', displayName: 'ランニング記録', displayNameEn: 'Running Log', template: 'lifestyle', subTemplate: 'tracker', category: 'Health', targetApp: 'Running apps ($5-10/mo)', difficulty: 2, description: 'ランニングの距離・時間・ペースを記録' },
  { name: 'cigarette-tracker', displayName: '禁煙カウンター', displayNameEn: 'Quit Smoking Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Health', targetApp: 'Quit smoking apps ($2-5)', difficulty: 2, description: '禁煙日数・節約金額を記録' },
  { name: 'alcohol-tracker', displayName: 'お酒記録', displayNameEn: 'Alcohol Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Health', targetApp: 'Drink tracking apps ($2-5)', difficulty: 2, description: '飲酒量と休肝日を記録' },
  { name: 'caffeine-tracker', displayName: 'カフェイン記録', displayNameEn: 'Caffeine Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Health', targetApp: 'Caffeine apps ($1-3)', difficulty: 1, description: '1日のカフェイン摂取量を管理' },
  { name: 'cleaning-tracker', displayName: '掃除記録', displayNameEn: 'Cleaning Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Lifestyle', targetApp: 'Tody ($30/yr)', difficulty: 2, description: '部屋ごとの掃除スケジュールを管理' },
  { name: 'savings-tracker', displayName: '貯金トラッカー', displayNameEn: 'Savings Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Finance', targetApp: 'Loot ($2.99)', difficulty: 2, description: '貯金目標と進捗を可視化' },
  { name: 'subscription-tracker', displayName: 'サブスク管理', displayNameEn: 'Subscription Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Finance', targetApp: 'Subscription trackers ($2-5)', difficulty: 2, description: '月額サービスの支出を一括管理' },
  { name: 'birthday-tracker', displayName: '誕生日管理', displayNameEn: 'Birthday Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Lifestyle', targetApp: 'hip ($1.49/mo)', difficulty: 1, description: '家族・友人の誕生日をリマインド' },
];

const logs: AppDef[] = [
  { name: 'simple-diary', displayName: 'シンプル日記', displayNameEn: 'Simple Diary', template: 'lifestyle', subTemplate: 'log', category: 'Lifestyle', targetApp: 'Day One ($49.99/yr)', difficulty: 2, description: '一日一言のシンプルな日記帳' },
  { name: 'gratitude-journal', displayName: '感謝日記', displayNameEn: 'Gratitude Journal', template: 'lifestyle', subTemplate: 'log', category: 'Health', targetApp: 'Gratitude ($4.99/mo)', difficulty: 2, description: '毎日の感謝を3つ書き留める日記' },
  { name: 'dream-journal', displayName: '夢日記', displayNameEn: 'Dream Journal', template: 'lifestyle', subTemplate: 'log', category: 'Lifestyle', targetApp: 'Dream journals ($2-5)', difficulty: 2, description: '夢の内容を記録・カテゴリ分け' },
  { name: 'food-log', displayName: '食事記録', displayNameEn: 'Food Log', template: 'lifestyle', subTemplate: 'log', category: 'Health', targetApp: 'Food diary apps ($3-10/mo)', difficulty: 2, description: '毎食の内容を写真付きで記録' },
  { name: 'wine-log', displayName: 'ワイン記録', displayNameEn: 'Wine Log', template: 'lifestyle', subTemplate: 'log', category: 'Food & Drink', targetApp: 'Wine apps ($2-5)', difficulty: 2, description: '飲んだワインの銘柄・評価を記録' },
  { name: 'coffee-log', displayName: 'コーヒー記録', displayNameEn: 'Coffee Log', template: 'lifestyle', subTemplate: 'log', category: 'Food & Drink', targetApp: 'Coffee journals ($1-3)', difficulty: 2, description: 'コーヒー豆・淹れ方・味の記録' },
  { name: 'movie-log', displayName: '映画記録', displayNameEn: 'Movie Log', template: 'lifestyle', subTemplate: 'log', category: 'Entertainment', targetApp: 'Movie trackers ($2-5)', difficulty: 2, description: '観た映画の感想と評価を記録' },
  { name: 'travel-log', displayName: '旅行記録', displayNameEn: 'Travel Log', template: 'lifestyle', subTemplate: 'log', category: 'Lifestyle', targetApp: 'Wanderlog ($4.99/mo)', difficulty: 2, description: '旅行先・費用・思い出を記録' },
  { name: 'garden-log', displayName: '園芸日記', displayNameEn: 'Garden Log', template: 'lifestyle', subTemplate: 'log', category: 'Lifestyle', targetApp: 'Garden apps ($3-8/mo)', difficulty: 2, description: '植物の成長を記録する園芸日記' },
  { name: 'fishing-log', displayName: '釣り記録', displayNameEn: 'Fishing Log', template: 'lifestyle', subTemplate: 'log', category: 'Sports', targetApp: 'Fishing logs ($2-5)', difficulty: 2, description: '釣果・場所・天気を記録' },
  { name: 'guitar-practice-log', displayName: 'ギター練習記録', displayNameEn: 'Guitar Practice Log', template: 'lifestyle', subTemplate: 'log', category: 'Music', targetApp: 'Music practice apps ($2-5)', difficulty: 2, description: 'ギター練習の時間・曲目を記録' },
  { name: 'packing-list', displayName: '持ち物チェックリスト', displayNameEn: 'Packing Checklist', template: 'lifestyle', subTemplate: 'log', category: 'Utility', targetApp: 'PackPoint ($2.99)', difficulty: 1, description: '旅行・出張の持ち物リストを管理' },
  { name: 'recipe-note', displayName: 'レシピノート', displayNameEn: 'Recipe Notes', template: 'lifestyle', subTemplate: 'log', category: 'Food & Drink', targetApp: 'Paprika ($4.99)', difficulty: 2, description: 'オリジナルレシピを保存・管理' },
  { name: 'skincare-log', displayName: 'スキンケア記録', displayNameEn: 'Skincare Log', template: 'lifestyle', subTemplate: 'log', category: 'Health', targetApp: 'Skincare apps ($2-5)', difficulty: 2, description: 'スキンケア製品と肌の状態を記録' },
  { name: 'game-log', displayName: 'ゲームプレイ記録', displayNameEn: 'Game Log', template: 'lifestyle', subTemplate: 'log', category: 'Entertainment', targetApp: 'Game trackers ($1-3)', difficulty: 2, description: 'プレイしたゲームの感想・プレイ時間を記録' },
];

const budgets: AppDef[] = [
  { name: 'kakeibo', displayName: 'かんたん家計簿', displayNameEn: 'Simple Budget', template: 'lifestyle', subTemplate: 'budget', category: 'Finance', targetApp: 'Zaim (¥440/mo)', difficulty: 2, description: '支出をカテゴリ別に記録する家計簿' },
  { name: 'weekly-budget', displayName: '週間予算管理', displayNameEn: 'Weekly Budget', template: 'lifestyle', subTemplate: 'budget', category: 'Finance', targetApp: 'YNAB ($14.99/mo)', difficulty: 2, description: '週ごとの予算を設定して支出を管理' },
  { name: 'couple-budget', displayName: 'カップル家計簿', displayNameEn: 'Couple Budget', template: 'lifestyle', subTemplate: 'budget', category: 'Finance', targetApp: 'Monarch ($14.99/mo)', difficulty: 2, description: '二人の支出を合算して管理する家計簿' },
  { name: 'travel-budget', displayName: '旅行予算管理', displayNameEn: 'Travel Budget', template: 'lifestyle', subTemplate: 'budget', category: 'Finance', targetApp: 'TripIt Pro ($49/yr)', difficulty: 2, description: '旅行の予算と支出を管理' },
  { name: 'student-budget', displayName: '学生家計簿', displayNameEn: 'Student Budget', template: 'lifestyle', subTemplate: 'budget', category: 'Finance', targetApp: 'Budget apps ($2-5)', difficulty: 2, description: '仕送り・バイト代の収支を管理' },
  { name: 'envelope-budget', displayName: '封筒予算管理', displayNameEn: 'Envelope Budget', template: 'lifestyle', subTemplate: 'budget', category: 'Finance', targetApp: 'Goodbudget ($7/mo)', difficulty: 2, description: '封筒式の予算管理で使いすぎ防止' },
  { name: 'side-hustle-tracker', displayName: '副業収入管理', displayNameEn: 'Side Hustle Tracker', template: 'lifestyle', subTemplate: 'budget', category: 'Finance', targetApp: 'Freelance trackers ($3-10)', difficulty: 2, description: '副業の収入と経費を管理' },
  { name: 'wedding-budget', displayName: '結婚式予算管理', displayNameEn: 'Wedding Budget', template: 'lifestyle', subTemplate: 'budget', category: 'Finance', targetApp: 'WeddingHappy ($4.99)', difficulty: 2, description: '結婚式の費用を項目別に管理' },
  { name: 'car-expense-tracker', displayName: '車の維持費記録', displayNameEn: 'Car Expense Tracker', template: 'lifestyle', subTemplate: 'budget', category: 'Finance', targetApp: 'Car expense apps ($2-5)', difficulty: 2, description: 'ガソリン代・車検・保険等の車の費用を記録' },
  { name: 'gift-budget', displayName: 'プレゼント予算', displayNameEn: 'Gift Budget', template: 'lifestyle', subTemplate: 'budget', category: 'Finance', targetApp: 'WISHUPON ($1.99-14.99)', difficulty: 1, description: '誕生日・クリスマスのプレゼント予算を管理' },
];

const quizzes: AppDef[] = [
  { name: 'kanji-quiz', displayName: '漢字クイズ', displayNameEn: 'Kanji Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: '漢字検定アプリ (¥500-1000)', difficulty: 2, description: '読み書きの漢字力をテスト' },
  { name: 'yojijukugo-quiz', displayName: '四字熟語クイズ', displayNameEn: 'Yojijukugo Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Yojijukugo apps (¥300-500)', difficulty: 1, description: '四字熟語の意味を当てるクイズ' },
  { name: 'kotowaza-quiz', displayName: 'ことわざクイズ', displayNameEn: 'Proverb Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Kotowaza apps (¥100-300)', difficulty: 1, description: '日本語のことわざの意味を当てるクイズ' },
  { name: 'todofuken-quiz', displayName: '都道府県クイズ', displayNameEn: 'Prefecture Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Prefecture quiz (¥100-300)', difficulty: 1, description: '47都道府県の県庁所在地・特産品をクイズ' },
  { name: 'flag-quiz', displayName: '国旗クイズ', displayNameEn: 'Flag Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'StudyGe ($4.99/mo)', difficulty: 1, description: '世界の国旗を当てるクイズ' },
  { name: 'capital-quiz', displayName: '首都クイズ', displayNameEn: 'Capital City Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'StudyGe ($4.99/mo)', difficulty: 1, description: '世界の首都を当てるクイズ' },
  { name: 'history-quiz', displayName: '日本史クイズ', displayNameEn: 'Japanese History Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'History quiz (¥300-500)', difficulty: 2, description: '日本史の重要人物・出来事をクイズ' },
  { name: 'world-history-quiz', displayName: '世界史クイズ', displayNameEn: 'World History Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'History quiz apps ($2-5)', difficulty: 2, description: '世界史の重要な出来事をクイズ' },
  { name: 'science-quiz', displayName: '理科クイズ', displayNameEn: 'Science Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Science quiz ($1-3)', difficulty: 2, description: '物理・化学・生物の基礎知識クイズ' },
  { name: 'english-vocab-quiz', displayName: '英単語クイズ', displayNameEn: 'English Vocabulary Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'mikan (¥600/mo)', difficulty: 2, description: 'TOEIC/英検レベル別の英単語テスト' },
  { name: 'animal-quiz', displayName: '動物クイズ', displayNameEn: 'Animal Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Animal quiz ($1-2)', difficulty: 1, description: '動物の特徴から名前を当てるクイズ' },
  { name: 'music-quiz', displayName: '音楽クイズ', displayNameEn: 'Music Quiz', template: 'game', subTemplate: 'quiz', category: 'Entertainment', targetApp: 'Music trivia ($1-3)', difficulty: 2, description: '音楽の歴史・アーティストクイズ' },
  { name: 'food-quiz', displayName: '食べ物クイズ', displayNameEn: 'Food Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Food quiz ($1-2)', difficulty: 1, description: '料理・食材の知識クイズ' },
  { name: 'sports-quiz', displayName: 'スポーツクイズ', displayNameEn: 'Sports Quiz', template: 'game', subTemplate: 'quiz', category: 'Entertainment', targetApp: 'Sports trivia ($1-3)', difficulty: 1, description: 'スポーツの歴史・ルールクイズ' },
  { name: 'movie-quiz', displayName: '映画クイズ', displayNameEn: 'Movie Quiz', template: 'game', subTemplate: 'quiz', category: 'Entertainment', targetApp: 'Movie trivia ($1-3)', difficulty: 1, description: '名作映画の知識クイズ' },
  { name: 'station-name-quiz', displayName: '駅名クイズ', displayNameEn: 'Station Name Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Station quiz (¥100-300)', difficulty: 1, description: '難読駅名の読み方を当てるクイズ' },
  { name: 'kanji-kentei-quiz', displayName: '漢検対策クイズ', displayNameEn: 'Kanji Kentei Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: '漢検アプリ (¥500-1000)', difficulty: 2, description: '漢字検定の級別対策問題' },
  { name: 'math-quiz', displayName: '算数クイズ', displayNameEn: 'Math Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Math quiz ($1-3)', difficulty: 1, description: '四則演算のスピードクイズ' },
  { name: 'general-knowledge-quiz', displayName: '一般常識クイズ', displayNameEn: 'General Knowledge Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Trivia apps ($1-3)', difficulty: 1, description: '就活にも使える一般常識テスト' },
  { name: 'spi-quiz', displayName: 'SPI対策クイズ', displayNameEn: 'SPI Test Prep', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'SPI apps (¥500-1000)', difficulty: 2, description: '就職活動のSPIテスト対策' },
  { name: 'toeic-quiz', displayName: 'TOEIC対策クイズ', displayNameEn: 'TOEIC Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'スタディサプリ (¥3,278/mo)', difficulty: 2, description: 'TOEIC頻出問題のミニテスト' },
  { name: 'idiom-quiz', displayName: '慣用句クイズ', displayNameEn: 'Idiom Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Japanese language apps (¥300)', difficulty: 1, description: '日本語の慣用句の意味を当てるクイズ' },
  { name: 'geography-quiz', displayName: '地理クイズ', displayNameEn: 'Geography Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'StudyGe ($4.99/mo)', difficulty: 1, description: '世界の地形・気候・文化をクイズ' },
  { name: 'anatomy-quiz', displayName: '人体クイズ', displayNameEn: 'Anatomy Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Anatomy Atlas (¥3,000)', difficulty: 2, description: '人体の骨・筋肉・臓器の知識クイズ' },
  { name: 'driving-test-quiz', displayName: '運転免許クイズ', displayNameEn: 'Driving Test Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Driving test apps (¥300-500)', difficulty: 2, description: '運転免許学科試験の模擬問題' },
  { name: 'itsukei-quiz', displayName: '一般教養クイズ', displayNameEn: 'Liberal Arts Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Quiz apps (¥300)', difficulty: 1, description: '文学・芸術・哲学の教養クイズ' },
  { name: 'hyakunin-isshu-quiz', displayName: '百人一首クイズ', displayNameEn: 'Hyakunin Isshu Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Hyakunin Isshu (¥300-600)', difficulty: 1, description: '百人一首の上の句から下の句を当てる' },
  { name: 'emoji-quiz', displayName: '絵文字クイズ', displayNameEn: 'Emoji Quiz', template: 'game', subTemplate: 'quiz', category: 'Entertainment', targetApp: 'Emoji quiz ($0.99-2)', difficulty: 1, description: '絵文字の組み合わせから答えを推測' },
  { name: 'logo-quiz', displayName: 'ロゴクイズ', displayNameEn: 'Logo Quiz', template: 'game', subTemplate: 'quiz', category: 'Entertainment', targetApp: 'Logo Quiz ($1-3)', difficulty: 1, description: '企業ロゴの名前を当てるクイズ' },
  { name: 'true-false-quiz', displayName: 'マルバツクイズ', displayNameEn: 'True or False Quiz', template: 'game', subTemplate: 'quiz', category: 'Entertainment', targetApp: 'Trivia apps ($1-2)', difficulty: 1, description: '豆知識の○×クイズ' },
];

const puzzles: AppDef[] = [
  { name: 'sudoku', displayName: '数独', displayNameEn: 'Sudoku', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Sudoku apps ($1-5)', difficulty: 2, description: '9×9マスの数字パズル' },
  { name: 'kakuro', displayName: 'カックロ', displayNameEn: 'Kakuro', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Kakuro apps ($1-3)', difficulty: 2, description: '足し算のクロスワードパズル' },
  { name: 'nonogram', displayName: 'お絵かきロジック', displayNameEn: 'Nonogram', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Nonogram apps ($1-3)', difficulty: 2, description: '数字のヒントから絵を完成させるパズル' },
  { name: 'word-search', displayName: '単語探し', displayNameEn: 'Word Search', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Word search ($1-3)', difficulty: 1, description: 'マス目から隠された単語を見つける' },
  { name: 'crossword-jp', displayName: 'クロスワード', displayNameEn: 'Crossword Puzzle', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Crossword apps ($2-5)', difficulty: 2, description: '日本語のクロスワードパズル' },
  { name: 'number-puzzle-2048', displayName: '2048パズル', displayNameEn: '2048 Puzzle', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: '2048 original ($0.99)', difficulty: 2, description: '数字を合わせて2048を目指すパズル' },
  { name: 'slide-puzzle', displayName: 'スライドパズル', displayNameEn: 'Slide Puzzle', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Puzzle apps ($0.99-2)', difficulty: 1, description: 'タイルをスライドして正しい順番に並べる' },
  { name: 'math-puzzle', displayName: '数学パズル', displayNameEn: 'Math Puzzle', template: 'game', subTemplate: 'puzzle', category: 'Education', targetApp: 'Math puzzle ($1-3)', difficulty: 2, description: '四則演算で答えを導く数学パズル' },
  { name: 'logic-puzzle', displayName: 'ロジックパズル', displayNameEn: 'Logic Puzzle', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Logic puzzle ($2-5)', difficulty: 3, description: '論理的思考で解くパズル問題' },
  { name: 'color-puzzle', displayName: 'カラーパズル', displayNameEn: 'Color Puzzle', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Color puzzle ($0.99-2)', difficulty: 1, description: '同じ色をつなげて消すパズル' },
  { name: 'anagram', displayName: 'アナグラム', displayNameEn: 'Anagram', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Word games ($1-3)', difficulty: 1, description: '文字を並べ替えて単語を作る' },
  { name: 'connect-dots', displayName: '一筆書きパズル', displayNameEn: 'One Stroke Puzzle', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Line puzzle ($0.99-2)', difficulty: 2, description: '一筆で全てのドットをつなぐパズル' },
  { name: 'fill-puzzle', displayName: 'ブロック埋めパズル', displayNameEn: 'Block Fill Puzzle', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Block puzzle ($0.99-2)', difficulty: 2, description: 'ブロックをはめてマスを埋めるパズル' },
  { name: 'maze-puzzle', displayName: '迷路', displayNameEn: 'Maze Puzzle', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Maze apps ($0.99-2)', difficulty: 1, description: 'ゴールを目指す迷路パズル' },
  { name: 'tower-of-hanoi', displayName: 'ハノイの塔', displayNameEn: 'Tower of Hanoi', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Classic puzzle ($0.99)', difficulty: 1, description: '円盤を正しい順で移動するパズル' },
];

const memory: AppDef[] = [
  { name: 'memory-match', displayName: '神経衰弱', displayNameEn: 'Memory Match', template: 'game', subTemplate: 'memory', category: 'Games', targetApp: 'Memory games ($1-3)', difficulty: 1, description: 'カードをめくって同じ絵柄を探す神経衰弱' },
  { name: 'sequence-memory', displayName: '記憶力チャレンジ', displayNameEn: 'Sequence Memory', template: 'game', subTemplate: 'memory', category: 'Games', targetApp: 'Elevate ($4.99/mo)', difficulty: 2, description: '光る順番を覚えて再現する記憶ゲーム' },
  { name: 'speed-math', displayName: '暗算トレーニング', displayNameEn: 'Mental Math Training', template: 'game', subTemplate: 'memory', category: 'Education', targetApp: 'Brain training ($5/mo)', difficulty: 2, description: '制限時間内に暗算問題を解くトレーニング' },
  { name: 'soroban-training', displayName: 'そろばんトレーニング', displayNameEn: 'Soroban Training', template: 'game', subTemplate: 'memory', category: 'Education', targetApp: 'そろばん apps (¥300-500)', difficulty: 2, description: 'そろばん式暗算のトレーニング' },
  { name: 'reaction-time', displayName: '反射神経テスト', displayNameEn: 'Reaction Time Test', template: 'game', subTemplate: 'memory', category: 'Games', targetApp: 'Reaction games ($0.99-2)', difficulty: 1, description: '反応速度を測定するテスト' },
  { name: 'color-match', displayName: '色判別ゲーム', displayNameEn: 'Color Match Game', template: 'game', subTemplate: 'memory', category: 'Games', targetApp: 'Brain games ($1-3)', difficulty: 1, description: '文字の色と意味が一致するか判定するゲーム' },
  { name: 'number-memory', displayName: '数字記憶', displayNameEn: 'Number Memory', template: 'game', subTemplate: 'memory', category: 'Games', targetApp: 'Lumosity ($11.99/mo)', difficulty: 2, description: '表示された数字を記憶して入力するゲーム' },
  { name: 'word-memory', displayName: '単語記憶ゲーム', displayNameEn: 'Word Memory Game', template: 'game', subTemplate: 'memory', category: 'Education', targetApp: 'Peak ($4.99/mo)', difficulty: 2, description: '表示された単語を記憶して選ぶゲーム' },
  { name: 'pattern-recognition', displayName: 'パターン認識', displayNameEn: 'Pattern Recognition', template: 'game', subTemplate: 'memory', category: 'Games', targetApp: 'Brain training ($3-5/mo)', difficulty: 2, description: 'パターンの法則を見つけるトレーニング' },
  { name: 'typing-speed', displayName: 'タイピング速度', displayNameEn: 'Typing Speed Test', template: 'game', subTemplate: 'memory', category: 'Education', targetApp: 'TapTyping ($3.99)', difficulty: 1, description: 'タイピング速度を測定・トレーニング' },
  { name: 'visual-memory', displayName: '視覚記憶テスト', displayNameEn: 'Visual Memory Test', template: 'game', subTemplate: 'memory', category: 'Games', targetApp: 'Brain games ($3-5/mo)', difficulty: 2, description: '一瞬表示された画像の位置を記憶するテスト' },
  { name: 'attention-training', displayName: '集中力トレーニング', displayNameEn: 'Attention Training', template: 'game', subTemplate: 'memory', category: 'Games', targetApp: 'CogniFit ($19.99/mo)', difficulty: 2, description: '注意力と集中力を鍛えるミニゲーム集' },
];

const fortune: AppDef[] = [
  { name: 'omikuji', displayName: 'おみくじ', displayNameEn: 'Omikuji Fortune', template: 'game', subTemplate: 'fortune', category: 'Entertainment', targetApp: 'おみくじアプリ (¥100-300)', difficulty: 1, description: '毎日のおみくじで運勢をチェック' },
  { name: 'horoscope-daily', displayName: '今日の星座占い', displayNameEn: 'Daily Horoscope', template: 'game', subTemplate: 'fortune', category: 'Entertainment', targetApp: 'Co-Star ($9)', difficulty: 1, description: '12星座の毎日の運勢を占う' },
  { name: 'blood-type-fortune', displayName: '血液型占い', displayNameEn: 'Blood Type Fortune', template: 'game', subTemplate: 'fortune', category: 'Entertainment', targetApp: 'Blood type apps (¥100-300)', difficulty: 1, description: '血液型別の今日の運勢と相性' },
  { name: 'tarot-reading', displayName: 'タロット占い', displayNameEn: 'Tarot Reading', template: 'game', subTemplate: 'fortune', category: 'Entertainment', targetApp: 'Nebula ($8-10/week)', difficulty: 2, description: 'タロットカードで運勢を占う' },
  { name: 'seimei-handan', displayName: '姓名判断', displayNameEn: 'Name Fortune Telling', template: 'game', subTemplate: 'fortune', category: 'Entertainment', targetApp: '姓名判断アプリ (¥300-500)', difficulty: 2, description: '名前の画数から運勢を占う' },
  { name: 'kyusei-kigaku', displayName: '九星気学', displayNameEn: 'Nine Star Ki', template: 'game', subTemplate: 'fortune', category: 'Entertainment', targetApp: '九星気学アプリ (¥300-500)', difficulty: 2, description: '九星気学による方位・運勢占い' },
  { name: 'fusui-guide', displayName: '風水ガイド', displayNameEn: 'Feng Shui Guide', template: 'game', subTemplate: 'fortune', category: 'Lifestyle', targetApp: '風水アプリ (¥300-500)', difficulty: 1, description: '風水の基本と開運インテリア配置' },
  { name: 'dream-fortune', displayName: '夢占い', displayNameEn: 'Dream Fortune', template: 'game', subTemplate: 'fortune', category: 'Entertainment', targetApp: 'Dream interpretation ($1-3)', difficulty: 1, description: '夢の内容から運勢を占う' },
  { name: 'love-compatibility', displayName: '恋愛相性占い', displayNameEn: 'Love Compatibility', template: 'game', subTemplate: 'fortune', category: 'Entertainment', targetApp: 'Compatibility apps ($2-5)', difficulty: 1, description: '二人の名前・誕生日から相性を診断' },
  { name: 'today-lucky-color', displayName: '今日のラッキーカラー', displayNameEn: 'Lucky Color Today', template: 'game', subTemplate: 'fortune', category: 'Entertainment', targetApp: 'Fortune apps (¥100-300)', difficulty: 1, description: '誕生日から今日のラッキーカラーを診断' },
  { name: 'palm-reading', displayName: '手相占い', displayNameEn: 'Palm Reading', template: 'game', subTemplate: 'fortune', category: 'Entertainment', targetApp: 'Palm reading ($2-5)', difficulty: 1, description: '手相の見方と運勢を解説' },
  { name: 'numerology', displayName: '数秘術占い', displayNameEn: 'Numerology', template: 'game', subTemplate: 'fortune', category: 'Entertainment', targetApp: 'Numerology apps ($2-5)', difficulty: 1, description: '誕生日から運命数を計算して占う' },
  { name: 'animal-fortune', displayName: '動物占い', displayNameEn: 'Animal Fortune', template: 'game', subTemplate: 'fortune', category: 'Entertainment', targetApp: '動物占いアプリ (¥100-300)', difficulty: 1, description: '生年月日から動物タイプと性格を診断' },
  { name: 'fortune-cookie', displayName: 'フォーチュンクッキー', displayNameEn: 'Fortune Cookie', template: 'game', subTemplate: 'fortune', category: 'Entertainment', targetApp: 'Fortune cookie ($0.99)', difficulty: 1, description: 'フォーチュンクッキーを割って運勢を見る' },
  { name: 'personality-test', displayName: '性格診断', displayNameEn: 'Personality Test', template: 'game', subTemplate: 'fortune', category: 'Entertainment', targetApp: 'Personality apps ($2-5)', difficulty: 1, description: 'MBTI風の性格診断テスト' },
];

const generators: AppDef[] = [
  { name: 'password-generator', displayName: 'パスワード生成', displayNameEn: 'Password Generator', template: 'utility', subTemplate: 'generator', category: 'Utility', targetApp: '1Password ($35.88/yr)', difficulty: 1, description: '安全なパスワードをランダム生成' },
  { name: 'random-number', displayName: '乱数ジェネレーター', displayNameEn: 'Random Number Generator', template: 'utility', subTemplate: 'generator', category: 'Utility', targetApp: 'Random generators ($0.99-2)', difficulty: 1, description: '範囲を指定してランダムな数を生成' },
  { name: 'team-divider', displayName: 'チーム分け', displayNameEn: 'Team Divider', template: 'utility', subTemplate: 'generator', category: 'Utility', targetApp: 'Team picker apps ($1-2)', difficulty: 1, description: 'メンバーをランダムにチーム分け' },
  { name: 'lottery-picker', displayName: 'くじ引きアプリ', displayNameEn: 'Lottery Picker', template: 'utility', subTemplate: 'generator', category: 'Entertainment', targetApp: 'Lottery apps ($0.99-2)', difficulty: 1, description: '抽選・くじ引き・あみだくじ' },
  { name: 'baby-name-generator', displayName: '赤ちゃん名前候補', displayNameEn: 'Baby Name Generator', template: 'utility', subTemplate: 'generator', category: 'Lifestyle', targetApp: 'Baby name apps ($1-3)', difficulty: 1, description: '画数・読みから赤ちゃんの名前を提案' },
  { name: 'color-generator', displayName: 'カラー生成', displayNameEn: 'Color Generator', template: 'utility', subTemplate: 'generator', category: 'Utility', targetApp: 'Color tools ($1-5)', difficulty: 1, description: 'ランダムなカラーパレットを生成' },
  { name: 'meal-decider', displayName: '今日のごはん決め', displayNameEn: 'Meal Decider', template: 'utility', subTemplate: 'generator', category: 'Food & Drink', targetApp: 'Meal roulette ($0.99-2)', difficulty: 1, description: '今日のメニューをランダムに決定' },
  { name: 'roulette-app', displayName: 'ルーレット', displayNameEn: 'Roulette Wheel', template: 'utility', subTemplate: 'generator', category: 'Entertainment', targetApp: 'Roulette apps ($0.99-2)', difficulty: 1, description: '項目を入力してルーレットで決定' },
  { name: 'yes-no-decider', displayName: 'YES/NO決定機', displayNameEn: 'Yes or No Decider', template: 'utility', subTemplate: 'generator', category: 'Utility', targetApp: 'Decision apps ($0.99)', difficulty: 1, description: '迷った時のYES/NOランダム決定' },
  { name: 'qr-generator', displayName: 'QRコード生成', displayNameEn: 'QR Code Generator', template: 'utility', subTemplate: 'generator', category: 'Utility', targetApp: 'QR generators ($1-3)', difficulty: 1, description: 'テキスト・URL・連絡先のQRコード生成' },
  { name: 'nickname-generator', displayName: 'ニックネーム生成', displayNameEn: 'Nickname Generator', template: 'utility', subTemplate: 'generator', category: 'Entertainment', targetApp: 'Name generators ($0.99-2)', difficulty: 1, description: 'ゲーム・SNS用のニックネームを生成' },
  { name: 'excuse-generator', displayName: '言い訳ジェネレーター', displayNameEn: 'Excuse Generator', template: 'utility', subTemplate: 'generator', category: 'Entertainment', targetApp: 'Joke apps ($0.99)', difficulty: 1, description: 'ユーモアのある言い訳をランダム生成' },
  { name: 'truth-or-dare', displayName: 'トゥルースオアデア', displayNameEn: 'Truth or Dare', template: 'utility', subTemplate: 'generator', category: 'Entertainment', targetApp: 'Party game apps ($1-3)', difficulty: 1, description: 'パーティーゲーム「真実か挑戦か」' },
  { name: 'would-you-rather', displayName: '究極の選択', displayNameEn: 'Would You Rather', template: 'utility', subTemplate: 'generator', category: 'Entertainment', targetApp: 'WYR apps ($1-2)', difficulty: 1, description: '二択の究極の選択ゲーム' },
  { name: 'affirmation-generator', displayName: 'アファメーション', displayNameEn: 'Daily Affirmations', template: 'utility', subTemplate: 'generator', category: 'Health', targetApp: 'Believe ($2.99/mo)', difficulty: 1, description: '毎日のポジティブなアファメーションを表示' },
];

// ============================================================
// NEW CATEGORIES (to reach 500)
// ============================================================

const healthFitness: AppDef[] = [
  { name: 'yoga-poses', displayName: 'ヨガポーズ集', displayNameEn: 'Yoga Poses', template: 'utility', subTemplate: 'reference', category: 'Health', targetApp: 'Down Dog ($9.99/mo)', difficulty: 1, description: 'ヨガの基本ポーズを解説・図解' },
  { name: 'push-up-counter', displayName: '腕立て伏せカウンター', displayNameEn: 'Push-Up Counter', template: 'utility', subTemplate: 'counter', category: 'Health', targetApp: 'Push-up apps ($1-3)', difficulty: 1, description: '腕立て伏せの回数をカウント・記録' },
  { name: 'squat-counter', displayName: 'スクワットカウンター', displayNameEn: 'Squat Counter', template: 'utility', subTemplate: 'counter', category: 'Health', targetApp: 'Fitness counters ($1-3)', difficulty: 1, description: 'スクワットの回数をカウント・記録' },
  { name: 'sit-up-counter', displayName: '腹筋カウンター', displayNameEn: 'Sit-Up Counter', template: 'utility', subTemplate: 'counter', category: 'Health', targetApp: 'Fitness counters ($1-3)', difficulty: 1, description: '腹筋の回数をカウント・記録' },
  { name: 'body-measurement', displayName: 'ボディサイズ記録', displayNameEn: 'Body Measurement Log', template: 'lifestyle', subTemplate: 'tracker', category: 'Health', targetApp: 'Body tracker apps ($2-5)', difficulty: 2, description: 'ウエスト・ヒップ等のサイズを記録' },
  { name: 'headache-diary', displayName: '頭痛ダイアリー', displayNameEn: 'Headache Diary', template: 'lifestyle', subTemplate: 'log', category: 'Health', targetApp: 'Migraine apps ($3-5)', difficulty: 2, description: '頭痛の頻度・強度・トリガーを記録' },
  { name: 'allergy-log', displayName: 'アレルギー記録', displayNameEn: 'Allergy Log', template: 'lifestyle', subTemplate: 'log', category: 'Health', targetApp: 'Allergy trackers ($2-5)', difficulty: 2, description: 'アレルギー症状と原因食品を記録' },
  { name: 'eye-exercise', displayName: '目の体操', displayNameEn: 'Eye Exercise', template: 'utility', subTemplate: 'timer', category: 'Health', targetApp: 'Eye care apps ($1-3)', difficulty: 1, description: '20-20-20ルールの目の休憩リマインダー' },
  { name: 'posture-reminder', displayName: '姿勢リマインダー', displayNameEn: 'Posture Reminder', template: 'utility', subTemplate: 'timer', category: 'Health', targetApp: 'Posture apps ($2-5)', difficulty: 1, description: '定期的に姿勢チェックをリマインド' },
  { name: 'breathing-exercise', displayName: '呼吸エクササイズ', displayNameEn: 'Breathing Exercise', template: 'utility', subTemplate: 'timer', category: 'Health', targetApp: 'Breathe apps ($2-5)', difficulty: 1, description: '4-7-8呼吸法・ボックス呼吸のガイド' },
  { name: 'hydration-reminder', displayName: '水分補給リマインダー', displayNameEn: 'Hydration Reminder', template: 'utility', subTemplate: 'timer', category: 'Health', targetApp: 'Water reminder ($1-3)', difficulty: 1, description: '定期的に水分補給をリマインド' },
  { name: 'macro-calculator', displayName: 'マクロ計算機', displayNameEn: 'Macro Calculator', template: 'utility', subTemplate: 'calculator', category: 'Health', targetApp: 'MyFitnessPal ($19.99/mo)', difficulty: 2, description: 'たんぱく質・脂質・炭水化物のPFCバランスを計算' },
  { name: 'one-rep-max-calc', displayName: '1RM計算機', displayNameEn: '1RM Calculator', template: 'utility', subTemplate: 'calculator', category: 'Health', targetApp: 'Strength apps ($2-5)', difficulty: 1, description: '重量と回数から1RM（最大挙上重量）を計算' },
  { name: 'pace-calculator', displayName: 'ペース計算機', displayNameEn: 'Pace Calculator', template: 'utility', subTemplate: 'calculator', category: 'Health', targetApp: 'Running apps ($3-5)', difficulty: 1, description: 'ランニングのペース・タイム・距離を計算' },
  { name: 'ideal-weight-calc', displayName: '適正体重計算', displayNameEn: 'Ideal Weight Calculator', template: 'utility', subTemplate: 'calculator', category: 'Health', targetApp: 'Health calculators ($1-3)', difficulty: 1, description: '身長・年齢から適正体重を計算' },
  { name: 'waist-hip-ratio', displayName: 'WHR計算機', displayNameEn: 'Waist-Hip Ratio Calculator', template: 'utility', subTemplate: 'calculator', category: 'Health', targetApp: 'Health calculators ($1-3)', difficulty: 1, description: 'ウエスト・ヒップ比で健康リスクを判定' },
  { name: 'target-heart-rate', displayName: '目標心拍数計算', displayNameEn: 'Target Heart Rate', template: 'utility', subTemplate: 'calculator', category: 'Health', targetApp: 'Heart rate apps ($2-5)', difficulty: 1, description: '年齢から運動時の目標心拍数ゾーンを計算' },
  { name: 'vo2max-calculator', displayName: 'VO2max推定', displayNameEn: 'VO2max Estimator', template: 'utility', subTemplate: 'calculator', category: 'Health', targetApp: 'Fitness calculators ($2-5)', difficulty: 2, description: '心拍数データからVO2maxを推定' },
  { name: 'tdee-calculator', displayName: 'TDEE計算機', displayNameEn: 'TDEE Calculator', template: 'utility', subTemplate: 'calculator', category: 'Health', targetApp: 'Diet calculators ($2-5)', difficulty: 1, description: '1日の総消費カロリー(TDEE)を計算' },
  { name: 'sleep-debt-calc', displayName: '睡眠負債計算', displayNameEn: 'Sleep Debt Calculator', template: 'utility', subTemplate: 'calculator', category: 'Health', targetApp: 'Sleep apps ($3-5)', difficulty: 1, description: '理想と実際の睡眠時間の差を計算' },
];

const musicTools: AppDef[] = [
  { name: 'metronome', displayName: 'メトロノーム', displayNameEn: 'Metronome', template: 'utility', subTemplate: 'timer', category: 'Music', targetApp: 'Pro Metronome ($4.99)', difficulty: 1, description: 'BPM設定可能な正確なメトロノーム' },
  { name: 'guitar-tuner', displayName: 'ギターチューナー', displayNameEn: 'Guitar Tuner', template: 'utility', subTemplate: 'sound', category: 'Music', targetApp: 'Guitar Tuna ($7.99/mo)', difficulty: 2, description: 'ギターの音を合わせるチューナー' },
  { name: 'ukulele-tuner', displayName: 'ウクレレチューナー', displayNameEn: 'Ukulele Tuner', template: 'utility', subTemplate: 'sound', category: 'Music', targetApp: 'Tuner apps ($1-3)', difficulty: 2, description: 'ウクレレ専用チューナー' },
  { name: 'chord-finder', displayName: 'コード検索', displayNameEn: 'Chord Finder', template: 'utility', subTemplate: 'reference', category: 'Music', targetApp: 'Guitar chord apps ($3-5)', difficulty: 1, description: 'ギター・ピアノのコード表を検索' },
  { name: 'scale-reference', displayName: 'スケール辞典', displayNameEn: 'Scale Reference', template: 'utility', subTemplate: 'reference', category: 'Music', targetApp: 'Music theory ($3-5)', difficulty: 1, description: '音楽のスケール（音階）辞典' },
  { name: 'bpm-counter', displayName: 'BPMカウンター', displayNameEn: 'BPM Counter', template: 'utility', subTemplate: 'counter', category: 'Music', targetApp: 'BPM apps ($0.99-2)', difficulty: 1, description: 'タップしてBPM（テンポ）を計測' },
  { name: 'pitch-pipe', displayName: 'ピッチパイプ', displayNameEn: 'Pitch Pipe', template: 'utility', subTemplate: 'sound', category: 'Music', targetApp: 'Pitch pipe ($0.99-2)', difficulty: 1, description: '基準音を出すピッチパイプ' },
  { name: 'music-interval-trainer', displayName: '音程トレーニング', displayNameEn: 'Interval Trainer', template: 'game', subTemplate: 'quiz', category: 'Music', targetApp: 'EarMaster ($5-10/mo)', difficulty: 2, description: '音程を聞き分ける耳トレーニング' },
  { name: 'rhythm-trainer', displayName: 'リズムトレーニング', displayNameEn: 'Rhythm Trainer', template: 'game', subTemplate: 'quiz', category: 'Music', targetApp: 'Rhythm apps ($3-5)', difficulty: 2, description: 'リズムパターンを聞いて再現するトレーニング' },
  { name: 'sight-reading-trainer', displayName: '初見読譜トレーニング', displayNameEn: 'Sight Reading Trainer', template: 'game', subTemplate: 'quiz', category: 'Music', targetApp: 'Sight reading ($3-5)', difficulty: 2, description: '楽譜を読んで音符を当てるトレーニング' },
  { name: 'music-note-quiz', displayName: '音符クイズ', displayNameEn: 'Music Note Quiz', template: 'game', subTemplate: 'quiz', category: 'Music', targetApp: 'Music quiz ($1-3)', difficulty: 1, description: '音符・記号の名前を当てるクイズ' },
  { name: 'piano-practice-log', displayName: 'ピアノ練習記録', displayNameEn: 'Piano Practice Log', template: 'lifestyle', subTemplate: 'log', category: 'Music', targetApp: 'Practice journal ($2-5)', difficulty: 2, description: 'ピアノの練習時間と曲目を記録' },
  { name: 'practice-timer', displayName: '練習タイマー', displayNameEn: 'Practice Timer', template: 'utility', subTemplate: 'timer', category: 'Music', targetApp: 'Practice timer ($1-3)', difficulty: 1, description: '楽器練習用のインターバルタイマー' },
  { name: 'key-signature-ref', displayName: '調号辞典', displayNameEn: 'Key Signature Reference', template: 'utility', subTemplate: 'reference', category: 'Music', targetApp: 'Music theory ($2-5)', difficulty: 1, description: '調号と対応するスケール・コードの辞典' },
  { name: 'decibel-meter', displayName: '騒音計', displayNameEn: 'Decibel Meter', template: 'utility', subTemplate: 'counter', category: 'Utility', targetApp: 'dB Meter ($1-3)', difficulty: 2, description: '周囲の音量をデシベルで計測' },
];

const textTools: AppDef[] = [
  { name: 'character-counter', displayName: '文字数カウンター', displayNameEn: 'Character Counter', template: 'utility', subTemplate: 'counter', category: 'Utility', targetApp: 'Text tools ($0.99-2)', difficulty: 1, description: 'テキストの文字数・単語数をカウント' },
  { name: 'word-counter', displayName: '単語カウンター', displayNameEn: 'Word Counter', template: 'utility', subTemplate: 'counter', category: 'Utility', targetApp: 'Text tools ($0.99-2)', difficulty: 1, description: '英文の単語数と読了時間を計算' },
  { name: 'text-to-speech', displayName: 'テキスト読み上げ', displayNameEn: 'Text to Speech', template: 'utility', subTemplate: 'sound', category: 'Utility', targetApp: 'TTS apps ($2-5)', difficulty: 2, description: 'テキストを音声で読み上げ' },
  { name: 'simple-notepad', displayName: 'シンプルメモ帳', displayNameEn: 'Simple Notepad', template: 'lifestyle', subTemplate: 'log', category: 'Utility', targetApp: 'Notepad apps ($1-3)', difficulty: 1, description: 'すぐ書けるシンプルなメモ帳' },
  { name: 'markdown-preview', displayName: 'Markdownプレビュー', displayNameEn: 'Markdown Preview', template: 'utility', subTemplate: 'reference', category: 'Utility', targetApp: 'iA Writer ($29.99)', difficulty: 2, description: 'Markdownテキストをリアルタイムプレビュー' },
  { name: 'regex-tester', displayName: '正規表現テスター', displayNameEn: 'Regex Tester', template: 'utility', subTemplate: 'reference', category: 'Utility', targetApp: 'Dev tools ($2-5)', difficulty: 2, description: '正規表現をテスト・マッチ結果を表示' },
  { name: 'json-formatter', displayName: 'JSONフォーマッター', displayNameEn: 'JSON Formatter', template: 'utility', subTemplate: 'reference', category: 'Utility', targetApp: 'Dev tools ($1-3)', difficulty: 2, description: 'JSONデータを整形・バリデーション' },
  { name: 'base64-encoder', displayName: 'Base64エンコーダー', displayNameEn: 'Base64 Encoder', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Dev tools ($1-3)', difficulty: 1, description: 'テキスト・画像のBase64エンコード/デコード' },
  { name: 'url-encoder', displayName: 'URLエンコーダー', displayNameEn: 'URL Encoder', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Dev tools ($1-3)', difficulty: 1, description: 'URLのエンコード/デコード変換' },
  { name: 'hash-generator', displayName: 'ハッシュ生成', displayNameEn: 'Hash Generator', template: 'utility', subTemplate: 'generator', category: 'Utility', targetApp: 'Security tools ($1-3)', difficulty: 1, description: 'MD5/SHA-1/SHA-256等のハッシュを生成' },
  { name: 'lorem-ipsum', displayName: 'ダミーテキスト生成', displayNameEn: 'Lorem Ipsum Generator', template: 'utility', subTemplate: 'generator', category: 'Utility', targetApp: 'Dev tools ($0.99)', difficulty: 1, description: 'デザイン用のダミーテキストを生成' },
  { name: 'kanji-to-hiragana', displayName: '漢字→ひらがな変換', displayNameEn: 'Kanji to Hiragana', template: 'utility', subTemplate: 'converter', category: 'Education', targetApp: 'Japanese text tools (¥100-300)', difficulty: 2, description: '漢字テキストにふりがなを付ける' },
  { name: 'fullwidth-halfwidth', displayName: '全角半角変換', displayNameEn: 'Fullwidth Halfwidth Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Japanese text tools (¥100-200)', difficulty: 1, description: '全角⇔半角のテキスト変換' },
  { name: 'timestamp-converter', displayName: 'タイムスタンプ変換', displayNameEn: 'Timestamp Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Dev tools ($1-3)', difficulty: 1, description: 'UNIXタイムスタンプと日時を相互変換' },
  { name: 'ip-address-lookup', displayName: 'IPアドレス確認', displayNameEn: 'IP Address Lookup', template: 'utility', subTemplate: 'reference', category: 'Utility', targetApp: 'Network tools ($1-3)', difficulty: 1, description: '自分のIPアドレスと位置情報を確認' },
];

const studyApps: AppDef[] = [
  { name: 'flashcard-maker', displayName: 'フラッシュカード', displayNameEn: 'Flashcard Maker', template: 'lifestyle', subTemplate: 'log', category: 'Education', targetApp: 'AnkiMobile ($24.99)', difficulty: 2, description: '自作フラッシュカードで暗記学習' },
  { name: 'multiplication-table', displayName: '九九練習', displayNameEn: 'Multiplication Table', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Math apps ($1-3)', difficulty: 1, description: '九九の掛け算を練習・テスト' },
  { name: 'hiragana-practice', displayName: 'ひらがな練習', displayNameEn: 'Hiragana Practice', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Japanese learning ($3-10)', difficulty: 1, description: 'ひらがなの読み書きを練習' },
  { name: 'katakana-practice', displayName: 'カタカナ練習', displayNameEn: 'Katakana Practice', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Japanese learning ($3-10)', difficulty: 1, description: 'カタカナの読み書きを練習' },
  { name: 'alphabet-practice', displayName: 'アルファベット練習', displayNameEn: 'Alphabet Practice', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'ABC apps ($1-3)', difficulty: 1, description: '英語のアルファベット練習（子供向け）' },
  { name: 'english-grammar-quiz', displayName: '英文法クイズ', displayNameEn: 'English Grammar Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Grammar apps ($3-5)', difficulty: 2, description: '英文法の基礎をクイズで学習' },
  { name: 'eiken-quiz', displayName: '英検対策クイズ', displayNameEn: 'Eiken Test Prep', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: '英検アプリ (¥500-1000)', difficulty: 2, description: '実用英語技能検定の対策問題' },
  { name: 'study-planner', displayName: '勉強プランナー', displayNameEn: 'Study Planner', template: 'lifestyle', subTemplate: 'tracker', category: 'Education', targetApp: 'Study planners ($2-5)', difficulty: 2, description: '科目別の勉強計画と進捗を管理' },
  { name: 'vocabulary-notebook', displayName: '単語帳', displayNameEn: 'Vocabulary Notebook', template: 'lifestyle', subTemplate: 'log', category: 'Education', targetApp: 'Vocab apps ($1-5)', difficulty: 2, description: '自分だけの単語帳を作成・暗記' },
  { name: 'chinese-quiz', displayName: '中国語クイズ', displayNameEn: 'Chinese Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Chinese learning ($5-10/mo)', difficulty: 2, description: '中国語の基礎単語・ピンインクイズ' },
  { name: 'korean-quiz', displayName: '韓国語クイズ', displayNameEn: 'Korean Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Korean learning ($5-10/mo)', difficulty: 2, description: '韓国語の基礎単語・ハングルクイズ' },
  { name: 'french-quiz', displayName: 'フランス語クイズ', displayNameEn: 'French Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Language apps ($5-10/mo)', difficulty: 2, description: 'フランス語の基礎単語クイズ' },
  { name: 'chemistry-formula-quiz', displayName: '化学式クイズ', displayNameEn: 'Chemical Formula Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Science quiz ($1-3)', difficulty: 2, description: '化学式と元素記号のクイズ' },
  { name: 'math-formula-ref', displayName: '数学公式集', displayNameEn: 'Math Formula Reference', template: 'utility', subTemplate: 'reference', category: 'Education', targetApp: 'Math reference ($2-5)', difficulty: 1, description: '中学・高校の数学公式を一覧' },
  { name: 'physics-formula-ref', displayName: '物理公式集', displayNameEn: 'Physics Formula Reference', template: 'utility', subTemplate: 'reference', category: 'Education', targetApp: 'Physics reference ($2-5)', difficulty: 1, description: '物理の基本公式を一覧' },
  { name: 'history-timeline', displayName: '歴史年表', displayNameEn: 'History Timeline', template: 'utility', subTemplate: 'reference', category: 'Education', targetApp: 'History apps ($2-5)', difficulty: 1, description: '日本史・世界史の重要年号を一覧' },
];

const sportsApps: AppDef[] = [
  { name: 'golf-score', displayName: 'ゴルフスコア', displayNameEn: 'Golf Scorecard', template: 'lifestyle', subTemplate: 'log', category: 'Sports', targetApp: 'Golf apps ($5-30/yr)', difficulty: 2, description: 'ゴルフのスコアをホール別に記録' },
  { name: 'tennis-score', displayName: 'テニススコア', displayNameEn: 'Tennis Scorekeeper', template: 'utility', subTemplate: 'counter', category: 'Sports', targetApp: 'Tennis score ($1-3)', difficulty: 1, description: 'テニスのスコアを簡単記録' },
  { name: 'bowling-score', displayName: 'ボウリングスコア', displayNameEn: 'Bowling Scorecard', template: 'lifestyle', subTemplate: 'log', category: 'Sports', targetApp: 'Bowling apps ($1-3)', difficulty: 2, description: 'ボウリングのスコアを記録・平均計算' },
  { name: 'darts-score', displayName: 'ダーツスコア', displayNameEn: 'Darts Scorer', template: 'utility', subTemplate: 'counter', category: 'Sports', targetApp: 'Darts apps ($2-5)', difficulty: 2, description: 'ダーツの501/301スコアを計算' },
  { name: 'badminton-score', displayName: 'バドミントンスコア', displayNameEn: 'Badminton Scorer', template: 'utility', subTemplate: 'counter', category: 'Sports', targetApp: 'Score apps ($0.99-2)', difficulty: 1, description: 'バドミントンのスコアを記録' },
  { name: 'basketball-stats', displayName: 'バスケ統計', displayNameEn: 'Basketball Stats', template: 'lifestyle', subTemplate: 'log', category: 'Sports', targetApp: 'Sports stats ($2-5)', difficulty: 2, description: 'バスケの得点・リバウンド・アシストを記録' },
  { name: 'soccer-formation', displayName: 'サッカーフォーメーション', displayNameEn: 'Soccer Formation', template: 'utility', subTemplate: 'reference', category: 'Sports', targetApp: 'Tactics board ($1-5)', difficulty: 1, description: 'サッカーのフォーメーションを作成・共有' },
  { name: 'swimming-log', displayName: '水泳記録', displayNameEn: 'Swimming Log', template: 'lifestyle', subTemplate: 'log', category: 'Sports', targetApp: 'Swimming apps ($2-5)', difficulty: 2, description: '水泳の距離・タイム・ストロークを記録' },
  { name: 'cycling-log', displayName: 'サイクリング記録', displayNameEn: 'Cycling Log', template: 'lifestyle', subTemplate: 'log', category: 'Sports', targetApp: 'Cycling apps ($5-10/mo)', difficulty: 2, description: 'サイクリングの距離・時間・速度を記録' },
  { name: 'hiking-log', displayName: '登山記録', displayNameEn: 'Hiking Log', template: 'lifestyle', subTemplate: 'log', category: 'Sports', targetApp: 'YAMAP (¥480/mo)', difficulty: 2, description: '登山・ハイキングのルートと記録' },
  { name: 'referee-whistle', displayName: '審判ホイッスル', displayNameEn: 'Referee Whistle', template: 'utility', subTemplate: 'sound', category: 'Sports', targetApp: 'Whistle apps ($0.99)', difficulty: 1, description: 'スポーツ審判用のホイッスル音' },
  { name: 'coin-toss', displayName: 'コイントス', displayNameEn: 'Coin Toss', template: 'utility', subTemplate: 'generator', category: 'Sports', targetApp: 'Coin flip ($0.99)', difficulty: 1, description: 'コイントスで表裏をランダム決定' },
];

const homeTools: AppDef[] = [
  { name: 'spirit-level', displayName: '水平器', displayNameEn: 'Spirit Level', template: 'utility', subTemplate: 'counter', category: 'Utility', targetApp: 'Level apps ($0.99-2)', difficulty: 1, description: 'スマホを使った水平器・傾斜計' },
  { name: 'room-measure', displayName: '部屋の寸法メモ', displayNameEn: 'Room Dimension Note', template: 'lifestyle', subTemplate: 'log', category: 'Utility', targetApp: 'Home measurement ($2-5)', difficulty: 1, description: '部屋のサイズと家具の寸法を記録' },
  { name: 'home-inventory', displayName: '家の持ち物リスト', displayNameEn: 'Home Inventory', template: 'lifestyle', subTemplate: 'log', category: 'Lifestyle', targetApp: 'Home inventory ($3-5)', difficulty: 2, description: '家電・家具・貴重品のリストを管理' },
  { name: 'moving-checklist', displayName: '引越しチェックリスト', displayNameEn: 'Moving Checklist', template: 'lifestyle', subTemplate: 'tracker', category: 'Lifestyle', targetApp: 'Moving apps ($1-3)', difficulty: 1, description: '引越しの手続き・やることリスト' },
  { name: 'maintenance-log', displayName: '家のメンテナンス記録', displayNameEn: 'Home Maintenance Log', template: 'lifestyle', subTemplate: 'log', category: 'Lifestyle', targetApp: 'Home maintenance ($2-5)', difficulty: 2, description: '家電・住宅のメンテナンス履歴を記録' },
  { name: 'wallpaper-calc', displayName: '壁紙量計算', displayNameEn: 'Wallpaper Calculator', template: 'utility', subTemplate: 'calculator', category: 'Utility', targetApp: 'Home calculators ($1-3)', difficulty: 1, description: '部屋の面積から必要な壁紙量を計算' },
  { name: 'tile-calculator', displayName: 'タイル量計算', displayNameEn: 'Tile Calculator', template: 'utility', subTemplate: 'calculator', category: 'Utility', targetApp: 'Home calculators ($1-3)', difficulty: 1, description: '床面積から必要なタイル枚数を計算' },
  { name: 'laundry-timer', displayName: '洗濯タイマー', displayNameEn: 'Laundry Timer', template: 'utility', subTemplate: 'timer', category: 'Lifestyle', targetApp: 'Laundry apps ($0.99-2)', difficulty: 1, description: '洗濯機・乾燥機のタイマー' },
  { name: 'garbage-calendar', displayName: 'ゴミ出しカレンダー', displayNameEn: 'Trash Collection Calendar', template: 'utility', subTemplate: 'reference', category: 'Lifestyle', targetApp: 'ゴミ出しアプリ (¥100-300)', difficulty: 1, description: 'ゴミ収集日のリマインダー' },
  { name: 'electricity-usage', displayName: '電気使用量記録', displayNameEn: 'Electricity Usage Log', template: 'lifestyle', subTemplate: 'tracker', category: 'Utility', targetApp: 'Energy apps ($1-3)', difficulty: 2, description: '月々の電気使用量と料金を記録' },
  { name: 'gas-usage-tracker', displayName: 'ガス使用量記録', displayNameEn: 'Gas Usage Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Utility', targetApp: 'Energy apps ($1-3)', difficulty: 2, description: '月々のガス使用量と料金を記録' },
  { name: 'water-bill-tracker', displayName: '水道代記録', displayNameEn: 'Water Bill Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Utility', targetApp: 'Energy apps ($1-3)', difficulty: 2, description: '月々の水道使用量と料金を記録' },
];

const parentingKids: AppDef[] = [
  { name: 'growth-chart', displayName: '成長記録', displayNameEn: 'Growth Chart', template: 'lifestyle', subTemplate: 'tracker', category: 'Health', targetApp: 'Baby growth ($2-5)', difficulty: 2, description: '子供の身長・体重の成長記録' },
  { name: 'first-words-log', displayName: '初めてことば記録', displayNameEn: 'First Words Log', template: 'lifestyle', subTemplate: 'log', category: 'Lifestyle', targetApp: 'Baby milestone ($2-5)', difficulty: 1, description: '赤ちゃんの初めてのことばを記録' },
  { name: 'milestone-tracker', displayName: '成長マイルストーン', displayNameEn: 'Baby Milestone Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Lifestyle', targetApp: 'Baby milestone ($3-5)', difficulty: 2, description: '赤ちゃんの発達マイルストーンを記録' },
  { name: 'vaccine-schedule', displayName: '予防接種スケジュール', displayNameEn: 'Vaccine Schedule', template: 'utility', subTemplate: 'reference', category: 'Health', targetApp: 'Vaccine apps ($1-3)', difficulty: 1, description: '子供の予防接種スケジュールを管理' },
  { name: 'kids-math-quiz', displayName: 'さんすうクイズ', displayNameEn: 'Kids Math Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Kids math ($1-3)', difficulty: 1, description: '幼児・小学低学年向けの算数クイズ' },
  { name: 'kids-animal-sounds', displayName: 'どうぶつの声', displayNameEn: 'Animal Sounds for Kids', template: 'utility', subTemplate: 'sound', category: 'Education', targetApp: 'Kids animal ($0.99-2)', difficulty: 1, description: '動物の鳴き声を聞いて学ぶ（幼児向け）' },
  { name: 'kids-shape-quiz', displayName: 'かたちクイズ', displayNameEn: 'Shape Quiz for Kids', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Kids shape ($0.99-2)', difficulty: 1, description: '形と色を当てる幼児向けクイズ' },
  { name: 'kids-counting', displayName: 'かずをかぞえよう', displayNameEn: 'Counting for Kids', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Kids counting ($0.99-3)', difficulty: 1, description: '1から100までの数を数える練習' },
  { name: 'tooth-fairy-tracker', displayName: '歯の記録', displayNameEn: 'Tooth Fairy Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Lifestyle', targetApp: 'Tooth fairy ($0.99-2)', difficulty: 1, description: '乳歯が抜けた日と場所を記録' },
  { name: 'school-timetable', displayName: '時間割', displayNameEn: 'School Timetable', template: 'lifestyle', subTemplate: 'log', category: 'Education', targetApp: 'Timetable apps ($1-3)', difficulty: 1, description: '学校の時間割を登録・確認' },
  { name: 'allowance-tracker', displayName: 'おこづかい帳', displayNameEn: 'Allowance Tracker', template: 'lifestyle', subTemplate: 'budget', category: 'Finance', targetApp: 'Kids finance ($1-3)', difficulty: 1, description: '子供のおこづかいの収支を管理' },
  { name: 'chore-chart', displayName: 'お手伝い表', displayNameEn: 'Chore Chart', template: 'lifestyle', subTemplate: 'tracker', category: 'Lifestyle', targetApp: 'Chore apps ($2-5)', difficulty: 1, description: '子供のお手伝いをスタンプで記録' },
];

const beautyFashion: AppDef[] = [
  { name: 'skincare-routine', displayName: 'スキンケアルーティン', displayNameEn: 'Skincare Routine', template: 'lifestyle', subTemplate: 'tracker', category: 'Beauty', targetApp: 'Skincare apps ($3-5)', difficulty: 2, description: '朝晩のスキンケアルーティンを管理' },
  { name: 'nail-design-log', displayName: 'ネイルデザイン記録', displayNameEn: 'Nail Design Log', template: 'lifestyle', subTemplate: 'log', category: 'Beauty', targetApp: 'Nail apps ($1-3)', difficulty: 1, description: 'ネイルデザインの写真と履歴を記録' },
  { name: 'hair-color-log', displayName: 'ヘアカラー記録', displayNameEn: 'Hair Color Log', template: 'lifestyle', subTemplate: 'log', category: 'Beauty', targetApp: 'Hair apps ($1-3)', difficulty: 1, description: 'ヘアカラーの色番号・日付を記録' },
  { name: 'cosmetics-expiry', displayName: '化粧品使用期限管理', displayNameEn: 'Cosmetics Expiry Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Beauty', targetApp: 'Beauty apps ($2-5)', difficulty: 1, description: '化粧品の使用期限を管理・リマインド' },
  { name: 'outfit-diary', displayName: 'コーディネート日記', displayNameEn: 'Outfit Diary', template: 'lifestyle', subTemplate: 'log', category: 'Fashion', targetApp: 'Outfit apps ($3-10/mo)', difficulty: 2, description: '毎日のコーディネートを写真で記録' },
  { name: 'closet-inventory', displayName: 'クローゼット管理', displayNameEn: 'Closet Inventory', template: 'lifestyle', subTemplate: 'log', category: 'Fashion', targetApp: 'Closet apps ($3-5)', difficulty: 2, description: '持っている服を登録・管理' },
  { name: 'ring-size-chart', displayName: 'リングサイズ表', displayNameEn: 'Ring Size Chart', template: 'utility', subTemplate: 'reference', category: 'Utility', targetApp: 'Ring size ($0.99)', difficulty: 1, description: '日本・US・UK等のリングサイズ対照表' },
  { name: 'face-shape-guide', displayName: '顔型診断', displayNameEn: 'Face Shape Guide', template: 'utility', subTemplate: 'reference', category: 'Beauty', targetApp: 'Face shape ($1-3)', difficulty: 1, description: '顔型に合うヘアスタイル・メガネを提案' },
  { name: 'color-analysis', displayName: 'パーソナルカラー診断', displayNameEn: 'Personal Color Analysis', template: 'game', subTemplate: 'quiz', category: 'Beauty', targetApp: 'Color analysis ($2-5)', difficulty: 1, description: 'パーソナルカラー（春夏秋冬）診断' },
  { name: 'diet-log', displayName: 'ダイエット記録', displayNameEn: 'Diet Log', template: 'lifestyle', subTemplate: 'tracker', category: 'Health', targetApp: 'Diet apps ($3-10/mo)', difficulty: 2, description: '体重・食事・運動のダイエット記録' },
];

const checklistTodo: AppDef[] = [
  { name: 'shopping-list', displayName: '買い物リスト', displayNameEn: 'Shopping List', template: 'lifestyle', subTemplate: 'log', category: 'Lifestyle', targetApp: 'AnyList ($7.99/yr)', difficulty: 1, description: 'カテゴリ別の買い物チェックリスト' },
  { name: 'todo-list', displayName: 'やることリスト', displayNameEn: 'Todo List', template: 'lifestyle', subTemplate: 'tracker', category: 'Productivity', targetApp: 'Things 3 ($9.99)', difficulty: 2, description: 'シンプルなToDoリストとタスク管理' },
  { name: 'bucket-list', displayName: 'バケットリスト', displayNameEn: 'Bucket List', template: 'lifestyle', subTemplate: 'log', category: 'Lifestyle', targetApp: 'Bucket list ($1-3)', difficulty: 1, description: '人生でやりたいことリストを管理' },
  { name: 'wish-list', displayName: 'ほしい物リスト', displayNameEn: 'Wish List', template: 'lifestyle', subTemplate: 'log', category: 'Lifestyle', targetApp: 'WISHUPON ($1.99-14.99)', difficulty: 1, description: '欲しいもの・買いたいものリスト' },
  { name: 'grocery-list', displayName: '食料品リスト', displayNameEn: 'Grocery List', template: 'lifestyle', subTemplate: 'log', category: 'Food & Drink', targetApp: 'Grocery apps ($1-5)', difficulty: 1, description: '食料品の買い物リストをカテゴリ別に管理' },
  { name: 'daily-routine', displayName: 'デイリールーティン', displayNameEn: 'Daily Routine', template: 'lifestyle', subTemplate: 'tracker', category: 'Productivity', targetApp: 'Routine apps ($3-5)', difficulty: 2, description: '朝・昼・夜のルーティンをチェックリスト管理' },
  { name: 'project-task-list', displayName: 'プロジェクトタスク', displayNameEn: 'Project Tasks', template: 'lifestyle', subTemplate: 'tracker', category: 'Productivity', targetApp: 'Task managers ($5-10/mo)', difficulty: 2, description: 'プロジェクト別のタスクを管理' },
  { name: 'travel-checklist', displayName: '旅行チェックリスト', displayNameEn: 'Travel Checklist', template: 'lifestyle', subTemplate: 'log', category: 'Lifestyle', targetApp: 'PackPoint ($2.99)', difficulty: 1, description: '旅行の準備チェックリスト' },
  { name: 'disaster-prep-list', displayName: '防災チェックリスト', displayNameEn: 'Disaster Prep Checklist', template: 'utility', subTemplate: 'reference', category: 'Lifestyle', targetApp: 'Disaster prep (¥100-300)', difficulty: 1, description: '地震・台風に備える防災グッズチェックリスト' },
  { name: 'camping-checklist', displayName: 'キャンプ持ち物リスト', displayNameEn: 'Camping Checklist', template: 'lifestyle', subTemplate: 'log', category: 'Lifestyle', targetApp: 'Camping apps ($1-3)', difficulty: 1, description: 'キャンプに必要な持ち物リスト' },
];

const clockAlarm: AppDef[] = [
  { name: 'world-clock', displayName: '世界時計', displayNameEn: 'World Clock', template: 'utility', subTemplate: 'reference', category: 'Utility', targetApp: 'World clock ($1-3)', difficulty: 1, description: '世界各都市の現在時刻を一覧表示' },
  { name: 'analog-clock', displayName: 'アナログ時計', displayNameEn: 'Analog Clock', template: 'utility', subTemplate: 'reference', category: 'Utility', targetApp: 'Clock apps ($0.99-3)', difficulty: 1, description: '美しいアナログ時計の表示' },
  { name: 'flip-clock', displayName: 'フリップクロック', displayNameEn: 'Flip Clock', template: 'utility', subTemplate: 'reference', category: 'Utility', targetApp: 'Flip clock ($0.99-3)', difficulty: 1, description: 'レトロなフリップ式の時計表示' },
  { name: 'night-clock', displayName: 'ナイトクロック', displayNameEn: 'Night Clock', template: 'utility', subTemplate: 'reference', category: 'Utility', targetApp: 'Night clock ($0.99-2)', difficulty: 1, description: '暗い部屋でも見やすい夜用時計' },
  { name: 'sunrise-sunset', displayName: '日の出日の入り', displayNameEn: 'Sunrise Sunset', template: 'utility', subTemplate: 'reference', category: 'Utility', targetApp: 'Sun tracker ($1-3)', difficulty: 1, description: '日の出・日の入り時刻を確認' },
  { name: 'moon-phase', displayName: '月齢カレンダー', displayNameEn: 'Moon Phase Calendar', template: 'utility', subTemplate: 'reference', category: 'Utility', targetApp: 'Moon apps ($1-3)', difficulty: 1, description: '月の満ち欠け・月齢を確認' },
  { name: 'zodiac-calendar', displayName: '二十四節気カレンダー', displayNameEn: 'Solar Term Calendar', template: 'utility', subTemplate: 'reference', category: 'Lifestyle', targetApp: 'Japanese calendar (¥100-300)', difficulty: 1, description: '二十四節気と七十二候を確認' },
  { name: 'days-since', displayName: '経過日数カウント', displayNameEn: 'Days Since Counter', template: 'utility', subTemplate: 'counter', category: 'Utility', targetApp: 'Day counter ($0.99-2)', difficulty: 1, description: '記念日・イベントからの経過日数を表示' },
  { name: 'anniversary-counter', displayName: '記念日カウンター', displayNameEn: 'Anniversary Counter', template: 'utility', subTemplate: 'counter', category: 'Lifestyle', targetApp: 'Day counter ($0.99-2)', difficulty: 1, description: 'カップルの記念日をカウント' },
  { name: 'retirement-countdown', displayName: '定年カウントダウン', displayNameEn: 'Retirement Countdown', template: 'utility', subTemplate: 'counter', category: 'Lifestyle', targetApp: 'Countdown ($1-3)', difficulty: 1, description: '定年退職までのカウントダウン' },
];

const travelTools: AppDef[] = [
  { name: 'travel-phrase-en', displayName: '旅行英会話', displayNameEn: 'Travel English Phrases', template: 'utility', subTemplate: 'reference', category: 'Travel', targetApp: 'Travel phrase ($2-5)', difficulty: 1, description: '海外旅行で使える英語フレーズ集' },
  { name: 'travel-phrase-cn', displayName: '旅行中国語', displayNameEn: 'Travel Chinese Phrases', template: 'utility', subTemplate: 'reference', category: 'Travel', targetApp: 'Travel phrase ($2-5)', difficulty: 1, description: '中国旅行で使えるフレーズ集' },
  { name: 'travel-phrase-kr', displayName: '旅行韓国語', displayNameEn: 'Travel Korean Phrases', template: 'utility', subTemplate: 'reference', category: 'Travel', targetApp: 'Travel phrase ($2-5)', difficulty: 1, description: '韓国旅行で使えるフレーズ集' },
  { name: 'flight-time-calc', displayName: 'フライト時間計算', displayNameEn: 'Flight Time Calculator', template: 'utility', subTemplate: 'calculator', category: 'Travel', targetApp: 'Flight apps ($1-3)', difficulty: 1, description: '都市間のフライト時間を計算' },
  { name: 'jet-lag-calc', displayName: '時差ボケ計算', displayNameEn: 'Jet Lag Calculator', template: 'utility', subTemplate: 'calculator', category: 'Travel', targetApp: 'Jet lag ($1-3)', difficulty: 1, description: '時差ボケの回復スケジュールを計算' },
  { name: 'voltage-guide', displayName: '電圧・プラグガイド', displayNameEn: 'Voltage & Plug Guide', template: 'utility', subTemplate: 'reference', category: 'Travel', targetApp: 'Travel tools ($0.99-2)', difficulty: 1, description: '各国の電圧・コンセント形状を確認' },
  { name: 'travel-expense', displayName: '旅行費用記録', displayNameEn: 'Travel Expense Tracker', template: 'lifestyle', subTemplate: 'budget', category: 'Travel', targetApp: 'Trail Wallet ($4.99)', difficulty: 2, description: '旅行中の出費を通貨別に記録' },
  { name: 'suitcase-weight', displayName: 'スーツケース重量計算', displayNameEn: 'Luggage Weight Calculator', template: 'utility', subTemplate: 'calculator', category: 'Travel', targetApp: 'Travel tools ($0.99-2)', difficulty: 1, description: '手荷物の重量制限をチェック' },
  { name: 'country-info', displayName: '国情報ガイド', displayNameEn: 'Country Info Guide', template: 'utility', subTemplate: 'reference', category: 'Travel', targetApp: 'Travel guides ($2-5)', difficulty: 1, description: '各国の基本情報・ビザ・通貨を確認' },
  { name: 'tipping-guide', displayName: 'チップガイド', displayNameEn: 'Tipping Guide', template: 'utility', subTemplate: 'reference', category: 'Travel', targetApp: 'Tipping guide ($0.99-2)', difficulty: 1, description: '各国のチップ文化とマナーを確認' },
];

const moreGames: AppDef[] = [
  { name: 'rock-paper-scissors', displayName: 'じゃんけん', displayNameEn: 'Rock Paper Scissors', template: 'game', subTemplate: 'fortune', category: 'Games', targetApp: 'RPS apps ($0.99)', difficulty: 1, description: 'コンピュータとじゃんけん勝負' },
  { name: 'number-guessing', displayName: '数当てゲーム', displayNameEn: 'Number Guessing Game', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Number games ($0.99)', difficulty: 1, description: '1-100の数を当てるゲーム' },
  { name: 'hangman', displayName: 'ハングマン', displayNameEn: 'Hangman', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Word games ($0.99-2)', difficulty: 1, description: '文字を推測して単語を当てるゲーム' },
  { name: 'tic-tac-toe', displayName: '三目並べ', displayNameEn: 'Tic Tac Toe', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Tic Tac Toe ($0.99)', difficulty: 1, description: '○×の三目並べゲーム' },
  { name: 'connect-four', displayName: '四目並べ', displayNameEn: 'Connect Four', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Board games ($0.99-2)', difficulty: 1, description: '縦横斜めに4つ並べるゲーム' },
  { name: 'reversi', displayName: 'リバーシ', displayNameEn: 'Reversi (Othello)', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Reversi apps ($0.99-3)', difficulty: 2, description: '黒白のリバーシ（オセロ）ゲーム' },
  { name: 'gomoku', displayName: '五目並べ', displayNameEn: 'Gomoku', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Gomoku ($0.99-2)', difficulty: 2, description: '五目並べ対戦ゲーム' },
  { name: 'minesweeper', displayName: 'マインスイーパー', displayNameEn: 'Minesweeper', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Minesweeper ($0.99-3)', difficulty: 2, description: '地雷を避けてマスを開けるゲーム' },
  { name: 'lights-out', displayName: 'ライツアウト', displayNameEn: 'Lights Out', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Puzzle apps ($0.99)', difficulty: 2, description: '全てのライトを消すパズルゲーム' },
  { name: 'simon-says', displayName: 'サイモンセッズ', displayNameEn: 'Simon Says', template: 'game', subTemplate: 'memory', category: 'Games', targetApp: 'Memory games ($0.99-2)', difficulty: 1, description: '光と音の順番を覚えるゲーム' },
  { name: 'solitaire', displayName: 'ソリティア', displayNameEn: 'Solitaire', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Solitaire ($0.99-3)', difficulty: 1, description: 'トランプの一人遊びソリティア' },
  { name: 'freecell', displayName: 'フリーセル', displayNameEn: 'FreeCell', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Card games ($0.99-3)', difficulty: 2, description: 'トランプのフリーセルゲーム' },
  { name: 'shinkei-suijaku-animal', displayName: 'どうぶつ神経衰弱', displayNameEn: 'Animal Memory Match', template: 'game', subTemplate: 'memory', category: 'Games', targetApp: 'Memory games ($0.99)', difficulty: 1, description: '動物カードの神経衰弱ゲーム（子供向け）' },
  { name: 'spot-the-difference', displayName: '間違い探し', displayNameEn: 'Spot the Difference', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Spot diff ($0.99-3)', difficulty: 1, description: '2枚の絵の間違いを探すゲーム' },
  { name: 'word-chain', displayName: 'しりとり', displayNameEn: 'Word Chain (Shiritori)', template: 'game', subTemplate: 'quiz', category: 'Games', targetApp: 'Word games ($0.99-2)', difficulty: 1, description: 'コンピュータとしりとり対戦' },
];

const foodDrink: AppDef[] = [
  { name: 'ramen-log', displayName: 'ラーメン記録', displayNameEn: 'Ramen Log', template: 'lifestyle', subTemplate: 'log', category: 'Food & Drink', targetApp: 'Food logs ($1-3)', difficulty: 2, description: '食べたラーメンの店・味・評価を記録' },
  { name: 'sushi-guide', displayName: '寿司ネタ図鑑', displayNameEn: 'Sushi Guide', template: 'utility', subTemplate: 'reference', category: 'Food & Drink', targetApp: 'Food guides ($1-3)', difficulty: 1, description: '寿司ネタの旬・栄養・英語名を辞典' },
  { name: 'sake-log', displayName: '日本酒記録', displayNameEn: 'Sake Log', template: 'lifestyle', subTemplate: 'log', category: 'Food & Drink', targetApp: 'Sake apps ($1-3)', difficulty: 2, description: '飲んだ日本酒の銘柄・評価を記録' },
  { name: 'beer-log', displayName: 'ビール記録', displayNameEn: 'Beer Log', template: 'lifestyle', subTemplate: 'log', category: 'Food & Drink', targetApp: 'Untappd ($3.99/mo)', difficulty: 2, description: 'クラフトビールの銘柄・味を記録' },
  { name: 'tea-guide', displayName: 'お茶辞典', displayNameEn: 'Tea Guide', template: 'utility', subTemplate: 'reference', category: 'Food & Drink', targetApp: 'Tea apps ($1-3)', difficulty: 1, description: '日本茶・中国茶・紅茶の種類と淹れ方' },
  { name: 'whiskey-log', displayName: 'ウイスキー記録', displayNameEn: 'Whiskey Log', template: 'lifestyle', subTemplate: 'log', category: 'Food & Drink', targetApp: 'Whiskey apps ($2-5)', difficulty: 2, description: 'ウイスキーの銘柄・テイスティングノート' },
  { name: 'recipe-converter', displayName: 'レシピ分量変換', displayNameEn: 'Recipe Scaler', template: 'utility', subTemplate: 'calculator', category: 'Food & Drink', targetApp: 'Paprika ($4.99)', difficulty: 1, description: 'レシピの人数に合わせて分量を自動変換' },
  { name: 'baking-calc', displayName: 'パン・お菓子計算機', displayNameEn: 'Baking Calculator', template: 'utility', subTemplate: 'calculator', category: 'Food & Drink', targetApp: 'Baking apps ($1-3)', difficulty: 1, description: 'ベーカーズパーセントから分量を計算' },
  { name: 'fermentation-timer', displayName: '発酵タイマー', displayNameEn: 'Fermentation Timer', template: 'utility', subTemplate: 'timer', category: 'Food & Drink', targetApp: 'Fermentation ($1-3)', difficulty: 1, description: 'パン・味噌・ヨーグルトの発酵タイマー' },
  { name: 'coffee-ratio-calc', displayName: 'コーヒー比率計算', displayNameEn: 'Coffee Ratio Calculator', template: 'utility', subTemplate: 'calculator', category: 'Food & Drink', targetApp: 'Coffee apps ($1-3)', difficulty: 1, description: '豆の量と水量の比率を計算' },
  { name: 'calorie-lookup', displayName: 'カロリー辞典', displayNameEn: 'Calorie Lookup', template: 'utility', subTemplate: 'reference', category: 'Health', targetApp: 'Calorie apps ($3-10/mo)', difficulty: 1, description: '食品のカロリー・栄養素を検索' },
  { name: 'food-expiry', displayName: '食品賞味期限管理', displayNameEn: 'Food Expiry Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Food & Drink', targetApp: 'Expiry apps ($1-3)', difficulty: 1, description: '冷蔵庫の食品の賞味期限を管理' },
];

const petApps: AppDef[] = [
  { name: 'dog-walk-log', displayName: '散歩記録', displayNameEn: 'Dog Walk Log', template: 'lifestyle', subTemplate: 'log', category: 'Lifestyle', targetApp: 'Dog walk apps ($2-5)', difficulty: 2, description: '犬の散歩時間・距離を記録' },
  { name: 'pet-vaccine', displayName: 'ペットワクチン記録', displayNameEn: 'Pet Vaccine Log', template: 'lifestyle', subTemplate: 'tracker', category: 'Lifestyle', targetApp: 'Pet health ($2-5)', difficulty: 2, description: 'ペットのワクチン・予防接種を記録' },
  { name: 'pet-food-calc', displayName: 'ペットフード量計算', displayNameEn: 'Pet Food Calculator', template: 'utility', subTemplate: 'calculator', category: 'Lifestyle', targetApp: 'Pet apps ($1-3)', difficulty: 1, description: '体重に合わせたフード給餌量を計算' },
  { name: 'pet-birthday', displayName: 'ペット誕生日', displayNameEn: 'Pet Birthday Counter', template: 'utility', subTemplate: 'counter', category: 'Lifestyle', targetApp: 'Pet apps ($0.99-2)', difficulty: 1, description: 'ペットの誕生日カウントダウン' },
  { name: 'aquarium-log', displayName: 'アクアリウム記録', displayNameEn: 'Aquarium Log', template: 'lifestyle', subTemplate: 'log', category: 'Lifestyle', targetApp: 'Aquarium apps ($2-5)', difficulty: 2, description: '水槽の水質・メンテナンスを記録' },
  { name: 'bird-watching-log', displayName: '野鳥観察記録', displayNameEn: 'Bird Watching Log', template: 'lifestyle', subTemplate: 'log', category: 'Lifestyle', targetApp: 'Merlin ($1-5)', difficulty: 2, description: '観察した野鳥の種類・場所を記録' },
];

const autoApps: AppDef[] = [
  { name: 'fuel-log', displayName: '給油記録', displayNameEn: 'Fuel Log', template: 'lifestyle', subTemplate: 'log', category: 'Utility', targetApp: 'Fuel apps ($2-5)', difficulty: 2, description: '給油量・金額・燃費を記録' },
  { name: 'mileage-tracker', displayName: '走行距離記録', displayNameEn: 'Mileage Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Utility', targetApp: 'Mileage apps ($2-5)', difficulty: 2, description: '車の走行距離を記録・経費計算' },
  { name: 'parking-timer', displayName: '駐車タイマー', displayNameEn: 'Parking Timer', template: 'utility', subTemplate: 'timer', category: 'Utility', targetApp: 'Parking apps ($1-3)', difficulty: 1, description: 'パーキングメーターの残り時間をタイマー' },
  { name: 'oil-change-tracker', displayName: 'オイル交換記録', displayNameEn: 'Oil Change Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Utility', targetApp: 'Car maintenance ($1-3)', difficulty: 1, description: 'エンジンオイル交換時期をリマインド' },
  { name: 'tire-pressure-log', displayName: 'タイヤ空気圧記録', displayNameEn: 'Tire Pressure Log', template: 'lifestyle', subTemplate: 'tracker', category: 'Utility', targetApp: 'Car maintenance ($1-3)', difficulty: 1, description: 'タイヤ空気圧を定期的に記録' },
  { name: 'shaken-reminder', displayName: '車検リマインダー', displayNameEn: 'Vehicle Inspection Reminder', template: 'utility', subTemplate: 'timer', category: 'Utility', targetApp: 'Japanese car apps (¥100-300)', difficulty: 1, description: '車検・自賠責保険の期限をリマインド' },
  { name: 'license-plate-quiz', displayName: 'ナンバープレートクイズ', displayNameEn: 'License Plate Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Quiz apps ($0.99)', difficulty: 1, description: '車のナンバープレートの地名を当てるクイズ' },
];

const japanCulture: AppDef[] = [
  { name: 'manyo-hyakusen', displayName: '万葉集百選', displayNameEn: 'Manyo Anthology', template: 'utility', subTemplate: 'reference', category: 'Education', targetApp: 'Poetry apps (¥300-500)', difficulty: 1, description: '万葉集の名歌100首を鑑賞' },
  { name: 'haiku-guide', displayName: '俳句入門', displayNameEn: 'Haiku Guide', template: 'utility', subTemplate: 'reference', category: 'Education', targetApp: 'Haiku apps (¥100-300)', difficulty: 1, description: '俳句の基本ルールと季語辞典' },
  { name: 'nihongo-accent', displayName: '日本語アクセント辞典', displayNameEn: 'Japanese Accent Dictionary', template: 'utility', subTemplate: 'reference', category: 'Education', targetApp: 'NHKアクセント (¥2,000)', difficulty: 2, description: '日本語の正しいアクセントを確認' },
  { name: 'kisetsu-no-kotoba', displayName: '季節のことば', displayNameEn: 'Seasonal Words', template: 'utility', subTemplate: 'reference', category: 'Lifestyle', targetApp: 'Season apps (¥100-300)', difficulty: 1, description: '四季の美しい日本語表現を紹介' },
  { name: 'tegami-template', displayName: '手紙の書き方', displayNameEn: 'Letter Template', template: 'utility', subTemplate: 'reference', category: 'Lifestyle', targetApp: 'Letter apps (¥100-300)', difficulty: 1, description: '手紙の時候の挨拶・書き方テンプレート' },
  { name: 'kokuji-quiz', displayName: '国字クイズ', displayNameEn: 'Kokuji Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Kanji quiz (¥100-300)', difficulty: 1, description: '日本で作られた漢字「国字」のクイズ' },
  { name: 'nandoku-kanji', displayName: '難読漢字クイズ', displayNameEn: 'Difficult Kanji Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Kanji quiz (¥300-500)', difficulty: 2, description: '読めそうで読めない難読漢字クイズ' },
  { name: 'onomatopoeia-quiz', displayName: 'オノマトペクイズ', displayNameEn: 'Onomatopoeia Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Japanese quiz (¥100-300)', difficulty: 1, description: '擬音語・擬態語の意味を当てるクイズ' },
  { name: 'goju-on-trainer', displayName: '五十音トレーナー', displayNameEn: 'Gojuon Trainer', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Japanese learning ($1-3)', difficulty: 1, description: '五十音表の読み書きをトレーニング' },
  { name: 'prefecture-capital-quiz', displayName: '県庁所在地クイズ', displayNameEn: 'Prefecture Capital Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Geography quiz (¥100-300)', difficulty: 1, description: '47都道府県の県庁所在地を当てるクイズ' },
  { name: 'mountain-quiz', displayName: '日本の山クイズ', displayNameEn: 'Japanese Mountain Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Geography quiz (¥100-300)', difficulty: 1, description: '日本の名山の標高・場所を当てるクイズ' },
  { name: 'river-quiz', displayName: '日本の川クイズ', displayNameEn: 'Japanese River Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Geography quiz (¥100-300)', difficulty: 1, description: '日本の川の長さ・流域を当てるクイズ' },
];

const lifehack: AppDef[] = [
  { name: 'sleep-calculator', displayName: '睡眠計算機', displayNameEn: 'Sleep Calculator', template: 'utility', subTemplate: 'calculator', category: 'Health', targetApp: 'Sleep apps ($3-5)', difficulty: 1, description: '就寝・起床の最適時刻を睡眠サイクルから計算' },
  { name: 'event-planner', displayName: 'イベントプランナー', displayNameEn: 'Event Planner', template: 'lifestyle', subTemplate: 'tracker', category: 'Lifestyle', targetApp: 'Event apps ($2-5)', difficulty: 2, description: 'イベントのタスク・ゲストを管理' },
  { name: 'habit-score', displayName: '習慣スコア', displayNameEn: 'Habit Score', template: 'lifestyle', subTemplate: 'tracker', category: 'Productivity', targetApp: 'Habit apps ($3-5)', difficulty: 2, description: '習慣の達成率をスコア化して可視化' },
  { name: 'gratitude-counter', displayName: '感謝カウンター', displayNameEn: 'Gratitude Counter', template: 'utility', subTemplate: 'counter', category: 'Health', targetApp: 'Gratitude ($2-5)', difficulty: 1, description: '毎日の感謝の数をカウント' },
  { name: 'screen-time-log', displayName: 'スマホ時間記録', displayNameEn: 'Screen Time Log', template: 'lifestyle', subTemplate: 'tracker', category: 'Productivity', targetApp: 'Screen time ($2-5)', difficulty: 2, description: 'スマホ使用時間を自己記録・目標設定' },
  { name: 'morning-routine', displayName: '朝活チェック', displayNameEn: 'Morning Routine Checker', template: 'lifestyle', subTemplate: 'tracker', category: 'Productivity', targetApp: 'Routine apps ($2-5)', difficulty: 1, description: '朝のルーティンをチェックリストで管理' },
  { name: 'weekly-review', displayName: '週間振り返り', displayNameEn: 'Weekly Review', template: 'lifestyle', subTemplate: 'log', category: 'Productivity', targetApp: 'Journal apps ($3-5)', difficulty: 2, description: '1週間の振り返りを記録・改善' },
  { name: 'goal-tracker', displayName: '目標トラッカー', displayNameEn: 'Goal Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Productivity', targetApp: 'Goal apps ($3-5/mo)', difficulty: 2, description: '年間・月間目標の進捗を管理' },
  { name: 'expense-ratio-calc', displayName: '生活費比率計算', displayNameEn: 'Living Expense Ratio', template: 'utility', subTemplate: 'calculator', category: 'Finance', targetApp: 'Budget calculators ($1-3)', difficulty: 1, description: '収入に対する生活費の理想比率を計算' },
  { name: 'rent-vs-buy-calc', displayName: '賃貸vs購入計算', displayNameEn: 'Rent vs Buy Calculator', template: 'utility', subTemplate: 'calculator', category: 'Finance', targetApp: 'Real estate ($3-5)', difficulty: 2, description: '賃貸と購入どちらが得か試算' },
  { name: 'net-worth-calc', displayName: '純資産計算', displayNameEn: 'Net Worth Calculator', template: 'utility', subTemplate: 'calculator', category: 'Finance', targetApp: 'Finance apps ($3-10)', difficulty: 2, description: '資産と負債から純資産を計算' },
  { name: 'fire-calc', displayName: 'FIRE計算機', displayNameEn: 'FIRE Calculator', template: 'utility', subTemplate: 'calculator', category: 'Finance', targetApp: 'FIRE apps ($2-5)', difficulty: 2, description: '経済的自立（FIRE）達成までの年数を計算' },
  { name: 'tax-deduction-calc', displayName: '確定申告控除計算', displayNameEn: 'Tax Deduction Calculator', template: 'utility', subTemplate: 'calculator', category: 'Finance', targetApp: 'Tax apps (¥300-1000)', difficulty: 2, description: 'ふるさと納税・医療費等の控除額を計算' },
  { name: 'furusato-nozei-calc', displayName: 'ふるさと納税計算', displayNameEn: 'Furusato Tax Calculator', template: 'utility', subTemplate: 'calculator', category: 'Finance', targetApp: 'ふるさと納税アプリ (¥100-300)', difficulty: 2, description: '年収からふるさと納税の上限額を計算' },
  { name: 'social-insurance-calc', displayName: '社会保険料計算', displayNameEn: 'Social Insurance Calculator', template: 'utility', subTemplate: 'calculator', category: 'Finance', targetApp: 'Insurance calcs (¥300-500)', difficulty: 2, description: '給与から社会保険料を計算' },
  { name: 'inheritance-tax-calc', displayName: '相続税計算', displayNameEn: 'Inheritance Tax Calculator', template: 'utility', subTemplate: 'calculator', category: 'Finance', targetApp: 'Tax apps (¥500-1000)', difficulty: 3, description: '遺産額から相続税の概算を計算' },
  { name: 'point-card-tracker', displayName: 'ポイントカード管理', displayNameEn: 'Point Card Tracker', template: 'lifestyle', subTemplate: 'tracker', category: 'Finance', targetApp: 'Points apps (¥100-300)', difficulty: 1, description: '各種ポイントカードの残高を一括管理' },
  { name: 'stamp-rally', displayName: 'スタンプラリー', displayNameEn: 'Stamp Rally', template: 'lifestyle', subTemplate: 'tracker', category: 'Lifestyle', targetApp: 'Stamp apps ($0.99-2)', difficulty: 1, description: 'オリジナルスタンプラリーを作成・達成' },
  { name: 'quote-of-day', displayName: '今日の名言', displayNameEn: 'Quote of the Day', template: 'utility', subTemplate: 'generator', category: 'Lifestyle', targetApp: 'Quote apps ($1-3)', difficulty: 1, description: '毎日の名言・格言をランダム表示' },
];

const extras: AppDef[] = [
  // More converters
  { name: 'paper-size-converter', displayName: '用紙サイズ変換', displayNameEn: 'Paper Size Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Paper size ($0.99)', difficulty: 1, description: 'A4/B5/Letter等の用紙サイズを確認・変換' },
  { name: 'wire-gauge-converter', displayName: '線径変換', displayNameEn: 'Wire Gauge Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Engineering tools ($1-3)', difficulty: 1, description: 'AWG/mm等の電線サイズを変換' },
  { name: 'hardness-converter', displayName: '硬さ変換', displayNameEn: 'Hardness Converter', template: 'utility', subTemplate: 'converter', category: 'Utility', targetApp: 'Engineering tools ($2-5)', difficulty: 1, description: 'HRC/HV/HB等の硬さ単位を変換' },
  // More calculators
  { name: 'roof-pitch-calc', displayName: '屋根勾配計算', displayNameEn: 'Roof Pitch Calculator', template: 'utility', subTemplate: 'calculator', category: 'Utility', targetApp: 'Construction apps ($1-3)', difficulty: 1, description: '屋根の角度と面積を計算' },
  { name: 'bmi-for-kids', displayName: '子供BMI計算', displayNameEn: 'Kids BMI Calculator', template: 'utility', subTemplate: 'calculator', category: 'Health', targetApp: 'Kids health ($1-3)', difficulty: 1, description: '子供の年齢に合わせたBMIパーセンタイル' },
  { name: 'photo-print-size', displayName: '写真印刷サイズ計算', displayNameEn: 'Photo Print Size Calculator', template: 'utility', subTemplate: 'calculator', category: 'Utility', targetApp: 'Photo tools ($1-3)', difficulty: 1, description: '画像解像度から適切な印刷サイズを計算' },
  // More quizzes
  { name: 'world-heritage-quiz', displayName: '世界遺産クイズ', displayNameEn: 'World Heritage Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Heritage quiz ($1-3)', difficulty: 1, description: '世界遺産の名前と場所を当てるクイズ' },
  { name: 'dinosaur-quiz', displayName: '恐竜クイズ', displayNameEn: 'Dinosaur Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Kids science ($1-3)', difficulty: 1, description: '恐竜の名前と特徴を当てるクイズ' },
  { name: 'space-quiz', displayName: '宇宙クイズ', displayNameEn: 'Space Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Space quiz ($1-3)', difficulty: 1, description: '惑星・星・宇宙の知識クイズ' },
  { name: 'insect-quiz', displayName: '昆虫クイズ', displayNameEn: 'Insect Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Nature quiz ($0.99-2)', difficulty: 1, description: '昆虫の名前と特徴を当てるクイズ' },
  { name: 'fish-quiz', displayName: 'お魚クイズ', displayNameEn: 'Fish Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Nature quiz ($0.99-2)', difficulty: 1, description: '魚の名前と漢字を当てるクイズ' },
  { name: 'flower-quiz', displayName: 'お花クイズ', displayNameEn: 'Flower Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Nature quiz ($0.99-2)', difficulty: 1, description: '花の名前と花言葉を当てるクイズ' },
  { name: 'tree-quiz', displayName: '樹木クイズ', displayNameEn: 'Tree Quiz', template: 'game', subTemplate: 'quiz', category: 'Education', targetApp: 'Nature quiz ($0.99-2)', difficulty: 1, description: '木の名前と特徴を当てるクイズ' },
  // More games
  { name: 'pipe-puzzle', displayName: '配管パズル', displayNameEn: 'Pipe Puzzle', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Pipe puzzle ($0.99-2)', difficulty: 2, description: 'パイプをつなげて水を流すパズル' },
  { name: 'tangram', displayName: 'タングラム', displayNameEn: 'Tangram', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Tangram ($0.99-2)', difficulty: 2, description: '7つのピースでシルエットを作るパズル' },
  { name: 'kakuro-hard', displayName: 'カックロ上級', displayNameEn: 'Kakuro Advanced', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Kakuro ($1-3)', difficulty: 3, description: '上級者向けの大きなカックロパズル' },
  { name: 'killer-sudoku', displayName: 'キラー数独', displayNameEn: 'Killer Sudoku', template: 'game', subTemplate: 'puzzle', category: 'Games', targetApp: 'Killer Sudoku ($1-3)', difficulty: 3, description: '足し算ルール追加の変則数独' },
  // More trackers
  { name: 'blood-sugar-log', displayName: '血糖値記録', displayNameEn: 'Blood Sugar Log', template: 'lifestyle', subTemplate: 'tracker', category: 'Health', targetApp: 'Glucose apps ($3-5)', difficulty: 2, description: '血糖値を食前食後で記録・グラフ表示' },
  { name: 'symptom-diary', displayName: '症状日記', displayNameEn: 'Symptom Diary', template: 'lifestyle', subTemplate: 'log', category: 'Health', targetApp: 'Health logs ($2-5)', difficulty: 2, description: '体調・症状を日々記録して受診時に活用' },
  { name: 'gratitude-365', displayName: '365日感謝日記', displayNameEn: '365 Day Gratitude Journal', template: 'lifestyle', subTemplate: 'log', category: 'Health', targetApp: 'Journal apps ($3-5)', difficulty: 2, description: '1年間毎日の感謝を記録する日記' },
  // More sounds
  { name: 'thunder-sounds', displayName: '雷の音', displayNameEn: 'Thunder Sounds', template: 'utility', subTemplate: 'sound', category: 'Health', targetApp: 'Nature sounds ($2-5)', difficulty: 2, description: '雷鳴・激しい雨のリラックスサウンド' },
  { name: 'asmr-keyboard', displayName: 'ASMRキーボード音', displayNameEn: 'ASMR Keyboard Sounds', template: 'utility', subTemplate: 'sound', category: 'Health', targetApp: 'ASMR apps ($1-3)', difficulty: 2, description: 'メカニカルキーボードのASMRサウンド' },
  // More generators
  { name: 'username-generator', displayName: 'ユーザー名生成', displayNameEn: 'Username Generator', template: 'utility', subTemplate: 'generator', category: 'Utility', targetApp: 'Name generators ($0.99-2)', difficulty: 1, description: 'SNS・ゲーム用のユニークなユーザー名を生成' },
  { name: 'uuid-generator', displayName: 'UUID生成', displayNameEn: 'UUID Generator', template: 'utility', subTemplate: 'generator', category: 'Utility', targetApp: 'Dev tools ($0.99)', difficulty: 1, description: 'UUID v4をワンタップで生成・コピー' },
  // More fortune
  { name: 'biorhythm', displayName: 'バイオリズム', displayNameEn: 'Biorhythm', template: 'game', subTemplate: 'fortune', category: 'Entertainment', targetApp: 'Biorhythm ($0.99-2)', difficulty: 1, description: '生年月日からバイオリズムを計算・表示' },
  { name: 'aura-reading', displayName: 'オーラ診断', displayNameEn: 'Aura Reading', template: 'game', subTemplate: 'fortune', category: 'Entertainment', targetApp: 'Aura apps ($1-3)', difficulty: 1, description: '質問に答えてオーラの色を診断' },
  // More reference
  { name: 'japanese-manners', displayName: '日本のマナー', displayNameEn: 'Japanese Manners Guide', template: 'utility', subTemplate: 'reference', category: 'Lifestyle', targetApp: 'Manner apps (¥100-300)', difficulty: 1, description: '食事・ビジネス・日常のマナーガイド' },
  { name: 'knot-guide', displayName: '結び方辞典', displayNameEn: 'Knot Tying Guide', template: 'utility', subTemplate: 'reference', category: 'Utility', targetApp: 'Knot apps ($1-3)', difficulty: 1, description: 'ロープ・ネクタイ・靴紐の結び方図解' },
  { name: 'stain-removal', displayName: 'シミ抜きガイド', displayNameEn: 'Stain Removal Guide', template: 'utility', subTemplate: 'reference', category: 'Lifestyle', targetApp: 'Home tips ($0.99-2)', difficulty: 1, description: '素材別・汚れ別のシミ抜き方法を解説' },
  { name: 'measurement-guide', displayName: '計測単位ガイド', displayNameEn: 'Measurement Units Guide', template: 'utility', subTemplate: 'reference', category: 'Utility', targetApp: 'Reference ($0.99-2)', difficulty: 1, description: '各種計測単位の一覧と早見表' },
];

// Combine all
const allApps: AppDef[] = [
  ...converters,
  ...calculators,
  ...timers,
  ...counters,
  ...sounds,
  ...reference,
  ...trackers,
  ...logs,
  ...budgets,
  ...quizzes,
  ...puzzles,
  ...memory,
  ...fortune,
  ...generators,
  ...healthFitness,
  ...musicTools,
  ...textTools,
  ...studyApps,
  ...sportsApps,
  ...homeTools,
  ...parentingKids,
  ...beautyFashion,
  ...checklistTodo,
  ...clockAlarm,
  ...travelTools,
  ...moreGames,
  ...foodDrink,
  ...petApps,
  ...autoApps,
  ...japanCulture,
  ...lifehack,
  ...extras,
];

// Assign IDs, themes, and bundleIds
const masterList = allApps.map((app, index) => ({
  id: index + 1,
  name: app.name,
  displayName: app.displayName,
  displayNameEn: app.displayNameEn,
  template: app.template,
  subTemplate: app.subTemplate,
  theme: THEMES[index % THEMES.length],
  bundleId: `com.massapp.${app.name.replace(/-/g, '')}`,
  category: app.category,
  targetApp: app.targetApp,
  difficulty: app.difficulty,
  description: app.description,
}));

// Write CSV
const csvHeader = 'id,name,displayName,displayNameEn,template,subTemplate,theme,bundleId,category,targetApp,difficulty,description';
const csvRows = masterList.map((app) => {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  return [
    app.id,
    esc(app.name),
    esc(app.displayName),
    esc(app.displayNameEn),
    esc(app.template),
    esc(app.subTemplate),
    esc(app.theme),
    esc(app.bundleId),
    esc(app.category),
    esc(app.targetApp),
    app.difficulty,
    esc(app.description),
  ].join(',');
});
const csvContent = [csvHeader, ...csvRows].join('\n') + '\n';
const outPath = path.resolve(__dirname, '..', 'apps-master-list.csv');
fs.writeFileSync(outPath, '\uFEFF' + csvContent, 'utf-8');

// Also write JSON for programmatic use
const jsonPath = path.resolve(__dirname, '..', 'apps-master-list.json');
fs.writeFileSync(jsonPath, JSON.stringify(masterList, null, 2) + '\n', 'utf-8');

console.log(`Generated ${masterList.length} app definitions`);
console.log(`CSV: ${outPath}`);
console.log(`JSON: ${jsonPath}`);
console.log('');
console.log('Distribution:');
const dist: Record<string, number> = {};
for (const app of masterList) {
  dist[app.subTemplate] = (dist[app.subTemplate] || 0) + 1;
}
for (const [key, count] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${key}: ${count}`);
}
