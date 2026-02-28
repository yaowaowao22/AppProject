const fs = require('fs');

const themes = [
  "warm-orange", "monochrome", "ocean-blue", "forest-green",
  "sunset-purple", "sakura-pink", "midnight-navy", "earth-brown",
  "neon-cyber", "pastel-dream", "mint-fresh", "coral-reef"
];

let id = 0;
function t() { return themes[id % 12]; }
function app(name, displayName, displayNameEn, template, subTemplate, category, targetApp, difficulty, description) {
  id++;
  return {
    id,
    name,
    displayName,
    displayNameEn,
    template,
    subTemplate,
    theme: themes[(id - 1) % 12],
    bundleId: "com.massapp." + name.replace(/-/g, ""),
    category,
    targetApp,
    difficulty,
    description
  };
}

const apps = [];

// ===== CONVERTERS (~50) =====
apps.push(app("unit-converter-length","長さ変換","Length Converter","utility","converter","Utility","Various paid unit converters ($2-5)",1,"長さの単位を変換（メートル、フィート、インチ等）"));
apps.push(app("unit-converter-weight","重さ変換","Weight Converter","utility","converter","Utility","Various paid unit converters ($2-5)",1,"重さの単位を変換（キログラム、ポンド、オンス等）"));
apps.push(app("unit-converter-temperature","温度変換","Temperature Converter","utility","converter","Utility","Unit Converter Pro ($3)",1,"温度の単位を変換（摂氏、華氏、ケルビン）"));
apps.push(app("unit-converter-area","面積変換","Area Converter","utility","converter","Utility","Various paid unit converters ($2-5)",1,"面積の単位を変換（平方メートル、坪、エーカー等）"));
apps.push(app("unit-converter-volume","体積変換","Volume Converter","utility","converter","Utility","Various paid unit converters ($2-5)",1,"体積の単位を変換（リットル、ガロン、カップ等）"));
apps.push(app("unit-converter-speed","速度変換","Speed Converter","utility","converter","Utility","Unit Converter Plus ($3)",1,"速度の単位を変換（km/h、mph、m/s等）"));
apps.push(app("unit-converter-time","時間変換","Time Converter","utility","converter","Utility","Various paid unit converters ($2-5)",1,"時間の単位を変換（秒、分、時間、日等）"));
apps.push(app("unit-converter-data","データ容量変換","Data Size Converter","utility","converter","Utility","Unit Converter Pro ($3)",1,"データ容量の単位を変換（KB、MB、GB、TB等）"));
apps.push(app("unit-converter-pressure","気圧変換","Pressure Converter","utility","converter","Utility","Engineering Unit Converter ($4)",2,"気圧の単位を変換（hPa、atm、psi等）"));
apps.push(app("unit-converter-energy","エネルギー変換","Energy Converter","utility","converter","Utility","Engineering Unit Converter ($4)",2,"エネルギーの単位を変換（ジュール、カロリー、kWh等）"));
apps.push(app("unit-converter-power","電力変換","Power Converter","utility","converter","Utility","Engineering Unit Converter ($4)",2,"電力の単位を変換（ワット、馬力等）"));
apps.push(app("unit-converter-frequency","周波数変換","Frequency Converter","utility","converter","Utility","Engineering Unit Converter ($4)",2,"周波数の単位を変換（Hz、kHz、MHz、GHz等）"));
apps.push(app("unit-converter-angle","角度変換","Angle Converter","utility","converter","Utility","Various paid unit converters ($2-5)",1,"角度の単位を変換（度、ラジアン、グラジアン等）"));
apps.push(app("unit-converter-fuel","燃費変換","Fuel Efficiency Converter","utility","converter","Utility","Fuel Cost Calculator ($3)",2,"燃費の単位を変換（km/L、mpg、L/100km等）"));
apps.push(app("unit-converter-cooking","料理計量変換","Cooking Unit Converter","utility","converter","Utility","Kitchen Calculator ($3)",1,"料理用の計量単位を変換（カップ、大さじ、ml等）"));
apps.push(app("unit-converter-shoe-size","靴サイズ変換","Shoe Size Converter","utility","converter","Utility","Size Converter ($2)",1,"日本・US・UK・EUの靴サイズを相互変換"));
apps.push(app("unit-converter-clothing","服サイズ変換","Clothing Size Converter","utility","converter","Utility","Size Converter ($2)",1,"日本・US・UK・EUの服サイズを相互変換"));
apps.push(app("unit-converter-ring","指輪サイズ変換","Ring Size Converter","utility","converter","Utility","Ring Sizer ($3)",1,"日本号数・US・UK・EUの指輪サイズを変換"));
apps.push(app("currency-converter-usd-jpy","ドル円換算","USD JPY Converter","utility","converter","Finance","XE Currency ($5)",2,"米ドルと日本円の為替換算（レート手動入力）"));
apps.push(app("currency-converter-eur-jpy","ユーロ円換算","EUR JPY Converter","utility","converter","Finance","XE Currency ($5)",2,"ユーロと日本円の為替換算（レート手動入力）"));
apps.push(app("currency-converter-gbp-jpy","ポンド円換算","GBP JPY Converter","utility","converter","Finance","XE Currency ($5)",2,"英ポンドと日本円の為替換算（レート手動入力）"));
apps.push(app("currency-converter-multi","多通貨換算","Multi Currency Converter","utility","converter","Finance","XE Currency ($5)",2,"主要通貨間の為替換算（レート手動入力）"));
apps.push(app("wareki-converter","和暦西暦変換","Japanese Era Converter","utility","converter","Utility","和暦変換 ($2)",1,"和暦（令和・平成・昭和等）と西暦を相互変換"));
apps.push(app("eto-calculator","干支計算","Chinese Zodiac Calculator","utility","converter","Utility","干支アプリ ($2)",1,"生年月日から干支を計算"));
apps.push(app("age-calculator","年齢早見表","Age Calculator","utility","converter","Utility","年齢早見表 ($2)",1,"生年月日から年齢・学年・干支をすぐ表示"));
apps.push(app("timezone-converter","時差変換","Timezone Converter","utility","converter","Utility","World Clock Pro ($4)",2,"世界の主要都市間の時差を変換"));
apps.push(app("color-code-converter","カラーコード変換","Color Code Converter","utility","converter","Utility","Color Converter Pro ($3)",2,"HEX・RGB・HSL・CMYKのカラーコードを変換"));
apps.push(app("number-base-converter","進数変換","Number Base Converter","utility","converter","Utility","Programmer Calculator ($3)",2,"2進数・8進数・10進数・16進数を相互変換"));
apps.push(app("roman-numeral-converter","ローマ数字変換","Roman Numeral Converter","utility","converter","Utility","Various paid converters ($2)",1,"ローマ数字とアラビア数字を相互変換"));
apps.push(app("tsubo-meter-converter","坪平米変換","Tsubo Sqm Converter","utility","converter","Utility","不動産計算 ($3)",1,"坪と平方メートルを相互変換（不動産向け）"));
apps.push(app("shakkan-converter","尺貫法変換","Shakkan Unit Converter","utility","converter","Utility","和単位変換 ($2)",1,"尺貫法（尺・寸・間・升等）とメートル法を変換"));
apps.push(app("paper-size-converter","用紙サイズ変換","Paper Size Converter","utility","converter","Utility","Various paid converters ($2)",1,"A判・B判・レター等の用紙サイズを表示・変換"));
apps.push(app("photo-size-converter","写真サイズ変換","Photo Size Converter","utility","converter","Utility","Photo Size Calculator ($2)",1,"写真サイズとピクセル・mmを相互変換"));
apps.push(app("byte-bit-converter","ビットバイト変換","Bit Byte Converter","utility","converter","Utility","Data Calculator ($2)",1,"ビットとバイトの単位を変換"));
apps.push(app("density-converter","密度変換","Density Converter","utility","converter","Utility","Engineering Unit Converter ($4)",2,"密度の単位を変換（kg/m³、g/cm³等）"));
apps.push(app("force-converter","力の変換","Force Converter","utility","converter","Utility","Engineering Unit Converter ($4)",2,"力の単位を変換（ニュートン、kgf等）"));
apps.push(app("torque-converter","トルク変換","Torque Converter","utility","converter","Utility","Engineering Unit Converter ($4)",2,"トルクの単位を変換（N・m、kgf・cm等）"));
apps.push(app("flow-rate-converter","流量変換","Flow Rate Converter","utility","converter","Utility","Engineering Unit Converter ($4)",2,"流量の単位を変換（L/min、m³/h等）"));
apps.push(app("illuminance-converter","照度変換","Illuminance Converter","utility","converter","Utility","Engineering Unit Converter ($4)",2,"照度の単位を変換（ルクス、フートカンデラ等）"));
apps.push(app("acceleration-converter","加速度変換","Acceleration Converter","utility","converter","Utility","Engineering Unit Converter ($4)",2,"加速度の単位を変換（m/s²、G等）"));
apps.push(app("concentration-converter","濃度変換","Concentration Converter","utility","converter","Utility","Chemistry Calculator ($4)",2,"濃度の単位を変換（%、ppm、mol/L等）"));
apps.push(app("radiation-converter","放射線量変換","Radiation Converter","utility","converter","Utility","Radiation Calculator ($3)",2,"放射線量の単位を変換（シーベルト、グレイ等）"));
apps.push(app("japanese-counter-converter","助数詞変換","Japanese Counter Converter","utility","converter","Education","日本語助数詞 ($2)",1,"日本語の助数詞（個・本・枚等）を確認・変換"));
apps.push(app("kanji-number-converter","漢数字変換","Kanji Number Converter","utility","converter","Utility","漢数字変換 ($2)",1,"漢数字とアラビア数字を相互変換"));
apps.push(app("electrical-converter","電気単位変換","Electrical Unit Converter","utility","converter","Utility","Electrical Calculator ($4)",2,"電気の単位を変換（V、A、Ω、W等）"));
apps.push(app("blood-sugar-converter","血糖値変換","Blood Sugar Converter","utility","converter","Health & Fitness","Glucose Converter ($2)",1,"血糖値の単位を変換（mg/dL、mmol/L）"));
apps.push(app("bra-size-converter","ブラサイズ変換","Bra Size Converter","utility","converter","Utility","Size Converter ($2)",1,"日本・US・UK・EUのブラサイズを変換"));
apps.push(app("distance-converter","距離変換","Distance Converter","utility","converter","Utility","Various paid unit converters ($2-5)",1,"距離の単位を変換（km、マイル、海里等）"));
apps.push(app("speed-of-sound-converter","音速変換","Speed of Sound Converter","utility","converter","Utility","Physics Calculator ($3)",2,"音速・マッハ数と速度を相互変換"));
apps.push(app("lumber-converter","木材寸法変換","Lumber Size Converter","utility","converter","Utility","Wood Calculator ($3)",2,"木材の寸法表記（インチ・mm）を変換"));

// ===== CALCULATORS (~60) =====
apps.push(app("bmi-calculator","BMI計算","BMI Calculator","utility","calculator","Health & Fitness","BMI Calculator Pro ($3)",1,"身長と体重からBMIを計算・判定"));
apps.push(app("calorie-calculator","カロリー計算","Calorie Calculator","utility","calculator","Health & Fitness","MyFitnessPal Premium ($10)",2,"食事のカロリーを計算"));
apps.push(app("tip-calculator","チップ計算","Tip Calculator","utility","calculator","Finance","Tip Calculator Pro ($2)",1,"レストランのチップを計算"));
apps.push(app("warikan-calculator","割り勘計算","Split Bill Calculator","utility","calculator","Finance","割り勘アプリ ($2)",1,"食事代を人数で割り勘計算（端数調整付き）"));
apps.push(app("tax-calculator","消費税計算","Tax Calculator","utility","calculator","Finance","税計算 ($2)",1,"消費税（10%・8%軽減税率）を計算"));
apps.push(app("loan-calculator","ローン計算","Loan Calculator","utility","calculator","Finance","Loan Calculator Pro ($5)",2,"住宅ローン・自動車ローンの返済額を計算"));
apps.push(app("mortgage-calculator","住宅ローン計算","Mortgage Calculator","utility","calculator","Finance","Housing Loan Calc ($4)",2,"住宅ローンの返済シミュレーション"));
apps.push(app("interest-calculator","利息計算","Interest Calculator","utility","calculator","Finance","Financial Calculator ($4)",2,"預金・借入の利息を計算"));
apps.push(app("compound-interest-calculator","複利計算","Compound Interest Calculator","utility","calculator","Finance","Financial Calculator ($4)",2,"複利での運用シミュレーション"));
apps.push(app("salary-calculator","給料計算","Salary Calculator","utility","calculator","Finance","給料計算 ($3)",2,"月給・年収から手取り額を概算"));
apps.push(app("overtime-calculator","残業代計算","Overtime Calculator","utility","calculator","Finance","残業代計算 ($3)",2,"残業時間から残業代を計算"));
apps.push(app("pension-calculator","年金計算","Pension Calculator","utility","calculator","Finance","年金計算 ($3)",3,"年金受給額をシミュレーション"));
apps.push(app("retirement-calculator","退職金計算","Retirement Bonus Calculator","utility","calculator","Finance","退職金計算 ($3)",2,"退職金の概算シミュレーション"));
apps.push(app("inheritance-tax-calculator","相続税計算","Inheritance Tax Calculator","utility","calculator","Finance","相続税計算 ($5)",3,"相続税の概算シミュレーション"));
apps.push(app("income-tax-calculator","所得税計算","Income Tax Calculator","utility","calculator","Finance","確定申告計算 ($5)",3,"所得税の概算計算"));
apps.push(app("percentage-calculator","パーセント計算","Percentage Calculator","utility","calculator","Utility","Percentage Calc Pro ($2)",1,"パーセントの各種計算（割合・増減等）"));
apps.push(app("discount-calculator","割引計算","Discount Calculator","utility","calculator","Utility","Discount Calc ($2)",1,"割引価格・割引率を計算"));
apps.push(app("date-calculator","日数計算","Date Calculator","utility","calculator","Utility","Date Calculator ($3)",2,"2つの日付間の日数を計算"));
apps.push(app("age-birthday-calculator","年齢計算","Age Calculator","utility","calculator","Utility","Age Calculator ($2)",1,"生年月日から正確な年齢を計算"));
apps.push(app("due-date-calculator","出産予定日計算","Due Date Calculator","utility","calculator","Health & Fitness","Pregnancy Calculator ($3)",1,"最終月経日から出産予定日を計算"));
apps.push(app("ovulation-calculator","排卵日計算","Ovulation Calculator","utility","calculator","Health & Fitness","Period Tracker ($5)",2,"生理周期から排卵日を予測計算"));
apps.push(app("ideal-weight-calculator","理想体重計算","Ideal Weight Calculator","utility","calculator","Health & Fitness","Weight Calculator ($2)",1,"身長から理想体重を計算"));
apps.push(app("body-fat-calculator","体脂肪率計算","Body Fat Calculator","utility","calculator","Health & Fitness","Body Fat Calc ($3)",2,"身体の計測値から体脂肪率を推定"));
apps.push(app("basal-metabolism-calculator","基礎代謝計算","BMR Calculator","utility","calculator","Health & Fitness","BMR Calculator ($3)",2,"基礎代謝量を計算"));
apps.push(app("water-intake-calculator","水分摂取計算","Water Intake Calculator","utility","calculator","Health & Fitness","Water Reminder ($3)",1,"1日の必要水分量を計算"));
apps.push(app("gpa-calculator","GPA計算","GPA Calculator","utility","calculator","Education","GPA Calculator ($2)",2,"成績からGPAを計算"));
apps.push(app("grade-calculator","成績計算","Grade Calculator","utility","calculator","Education","Grade Calculator ($2)",2,"テストの点数から成績を計算"));
apps.push(app("scientific-calculator","関数電卓","Scientific Calculator","utility","calculator","Utility","Scientific Calc Pro ($5)",3,"三角関数・対数等が使える関数電卓"));
apps.push(app("fraction-calculator","分数計算","Fraction Calculator","utility","calculator","Education","Fraction Calc ($3)",2,"分数の四則演算・約分・通分"));
apps.push(app("matrix-calculator","行列計算","Matrix Calculator","utility","calculator","Education","Matrix Calculator ($4)",3,"行列の加減乗算・行列式・逆行列"));
apps.push(app("quadratic-calculator","二次方程式計算","Quadratic Equation Solver","utility","calculator","Education","Math Solver ($4)",2,"二次方程式の解を計算"));
apps.push(app("statistics-calculator","統計計算","Statistics Calculator","utility","calculator","Education","Statistics Pro ($5)",3,"平均・中央値・標準偏差等の統計値を計算"));
apps.push(app("probability-calculator","確率計算","Probability Calculator","utility","calculator","Education","Probability Calc ($3)",2,"順列・組み合わせ・確率を計算"));
apps.push(app("area-calculator","面積計算","Area Calculator","utility","calculator","Utility","Geo Calculator ($3)",2,"各種図形の面積を計算"));
apps.push(app("volume-calculator","体積計算","Volume Calculator","utility","calculator","Utility","Geo Calculator ($3)",2,"各種立体の体積を計算"));
apps.push(app("paint-calculator","塗料計算","Paint Calculator","utility","calculator","Utility","Paint Calculator ($3)",2,"壁面積から必要な塗料の量を計算"));
apps.push(app("tile-calculator","タイル計算","Tile Calculator","utility","calculator","Utility","Tile Calculator ($3)",2,"床面積から必要なタイル数を計算"));
apps.push(app("concrete-calculator","コンクリート計算","Concrete Calculator","utility","calculator","Utility","Concrete Calculator ($3)",2,"必要なコンクリート量を計算"));
apps.push(app("fuel-cost-calculator","ガソリン代計算","Fuel Cost Calculator","utility","calculator","Utility","Fuel Cost Calculator ($3)",2,"距離と燃費からガソリン代を計算"));
apps.push(app("electricity-calculator","電気代計算","Electricity Cost Calculator","utility","calculator","Utility","電気代計算 ($2)",2,"家電の電気代を計算"));
apps.push(app("dog-age-calculator","犬年齢計算","Dog Age Calculator","utility","calculator","Utility","Dog Years ($2)",1,"犬の年齢を人間年齢に換算"));
apps.push(app("cat-age-calculator","猫年齢計算","Cat Age Calculator","utility","calculator","Utility","Cat Years ($2)",1,"猫の年齢を人間年齢に換算"));
apps.push(app("alcohol-calculator","アルコール計算","Alcohol Calculator","utility","calculator","Health & Fitness","BAC Calculator ($3)",2,"飲酒量からアルコール分解時間を計算"));
apps.push(app("caffeine-calculator","カフェイン計算","Caffeine Calculator","utility","calculator","Health & Fitness","Caffeine Tracker ($3)",2,"飲料からカフェイン摂取量を計算"));
apps.push(app("sleep-cycle-calculator","睡眠サイクル計算","Sleep Cycle Calculator","utility","calculator","Health & Fitness","Sleep Cycle ($3)",1,"就寝・起床の最適時刻をレム睡眠周期で計算"));
apps.push(app("pace-calculator","ペース計算","Running Pace Calculator","utility","calculator","Health & Fitness","Running Pace ($3)",2,"ランニングのペースとタイムを計算"));
apps.push(app("nengapou-calculator","年号早見表","Japanese Year Quick Ref","utility","calculator","Utility","年号早見表 ($2)",1,"西暦から年号・出来事を一覧表示"));
apps.push(app("childrens-age-calculator","子供年齢計算","Children Age Calculator","utility","calculator","Utility","子供年齢計算 ($2)",1,"子供の月齢・入園入学年を計算"));
apps.push(app("construction-calculator","建築計算","Construction Calculator","utility","calculator","Utility","Construction Calc ($5)",3,"建築に必要な各種計算（勾配・面積等）"));
apps.push(app("subnet-calculator","サブネット計算","Subnet Calculator","utility","calculator","Utility","Network Calc ($4)",3,"IPアドレスのサブネット計算"));
apps.push(app("ohms-law-calculator","オームの法則計算","Ohms Law Calculator","utility","calculator","Education","Electronics Calc ($3)",2,"オームの法則（V=IR）で電圧・電流・抵抗を計算"));
apps.push(app("aspect-ratio-calculator","アスペクト比計算","Aspect Ratio Calculator","utility","calculator","Utility","Aspect Ratio ($2)",1,"画面のアスペクト比を計算"));
apps.push(app("proportion-calculator","比例計算","Proportion Calculator","utility","calculator","Utility","Ratio Calculator ($2)",1,"比例配分・比率の計算"));
apps.push(app("tax-withholding-calculator","源泉徴収計算","Tax Withholding Calculator","utility","calculator","Finance","源泉徴収計算 ($3)",3,"給与からの源泉徴収税額を概算"));
apps.push(app("stamp-duty-calculator","印紙税計算","Stamp Duty Calculator","utility","calculator","Finance","印紙税計算 ($2)",1,"契約金額から必要な印紙税を計算"));
apps.push(app("moving-cost-calculator","引越し費用計算","Moving Cost Calculator","utility","calculator","Finance","引越し費用 ($3)",2,"引越しの概算費用を計算"));
apps.push(app("wedding-budget-calculator","結婚式費用計算","Wedding Budget Calculator","utility","calculator","Finance","Wedding Budget ($4)",2,"結婚式の概算費用を計算"));
apps.push(app("baby-cost-calculator","出産費用計算","Baby Cost Calculator","utility","calculator","Finance","出産費用 ($3)",2,"出産・育児の概算費用を計算"));
apps.push(app("investment-return-calculator","投資利回り計算","Investment Return Calculator","utility","calculator","Finance","Investment Calc ($4)",2,"投資の利回りを計算"));

// ===== TIMERS (~30) =====
apps.push(app("pomodoro-timer","ポモドーロタイマー","Pomodoro Timer","utility","timer","Productivity","Focus Timer ($4)",2,"ポモドーロ・テクニック用タイマー（25分集中5分休憩）"));
apps.push(app("hiit-timer","HIITタイマー","HIIT Timer","utility","timer","Health & Fitness","Interval Timer Pro ($5)",2,"HIITトレーニング用インターバルタイマー"));
apps.push(app("cooking-timer","クッキングタイマー","Cooking Timer","utility","timer","Food & Drink","Kitchen Timer Pro ($3)",2,"複数同時に使える料理用タイマー"));
apps.push(app("meditation-timer","瞑想タイマー","Meditation Timer","utility","timer","Health & Fitness","Insight Timer Premium ($10)",2,"瞑想用タイマー（ベル音付き）"));
apps.push(app("tea-timer","お茶タイマー","Tea Timer","utility","timer","Food & Drink","Tea Timer ($2)",1,"お茶の種類別抽出タイマー"));
apps.push(app("egg-timer","ゆで卵タイマー","Egg Timer","utility","timer","Food & Drink","Egg Timer Pro ($2)",1,"半熟・固ゆで等の卵タイマー"));
apps.push(app("nap-timer","昼寝タイマー","Nap Timer","utility","timer","Health & Fitness","Power Nap ($3)",1,"昼寝用アラームタイマー"));
apps.push(app("presentation-timer","プレゼンタイマー","Presentation Timer","utility","timer","Productivity","Speech Timer ($3)",2,"プレゼン・スピーチ用タイマー"));
apps.push(app("tabata-timer","タバタタイマー","Tabata Timer","utility","timer","Health & Fitness","Tabata Pro ($4)",2,"タバタ式トレーニング用タイマー"));
apps.push(app("plank-timer","プランクタイマー","Plank Timer","utility","timer","Health & Fitness","Plank Workout ($3)",1,"プランクトレーニング用タイマー"));
apps.push(app("brush-teeth-timer","歯磨きタイマー","Tooth Brush Timer","utility","timer","Health & Fitness","Brush Timer ($2)",1,"2分間の歯磨きタイマー"));
apps.push(app("study-timer","勉強タイマー","Study Timer","utility","timer","Education","Study Timer ($3)",2,"勉強時間を計測するタイマー"));
apps.push(app("chess-timer","対局時計","Chess Clock","utility","timer","Utility","Chess Clock Pro ($3)",2,"チェス・将棋用の対局時計"));
apps.push(app("debate-timer","ディベートタイマー","Debate Timer","utility","timer","Education","Debate Timer ($2)",2,"ディベート・討論用タイマー"));
apps.push(app("stretch-timer","ストレッチタイマー","Stretch Timer","utility","timer","Health & Fitness","Stretch Reminder ($3)",2,"ストレッチ用インターバルタイマー"));
apps.push(app("yoga-timer","ヨガタイマー","Yoga Timer","utility","timer","Health & Fitness","Yoga Timer ($3)",2,"ヨガのポーズ保持用タイマー"));
apps.push(app("laundry-timer","洗濯タイマー","Laundry Timer","utility","timer","Utility","Laundry Timer ($2)",1,"洗濯・乾燥の終了時刻タイマー"));
apps.push(app("parking-timer","駐車タイマー","Parking Timer","utility","timer","Utility","Parking Timer ($2)",1,"駐車時間のカウントダウンタイマー"));
apps.push(app("meeting-timer","会議タイマー","Meeting Timer","utility","timer","Productivity","Meeting Timer ($3)",2,"会議・ミーティングの時間管理タイマー"));
apps.push(app("baby-feeding-timer","授乳タイマー","Baby Feeding Timer","utility","timer","Health & Fitness","Baby Tracker ($5)",2,"授乳間隔を計測するタイマー"));
apps.push(app("eye-rest-timer","目の休憩タイマー","Eye Rest Timer","utility","timer","Health & Fitness","Eye Care 20/20 ($2)",1,"20-20-20ルールの目の休憩タイマー"));
apps.push(app("fasting-timer","断食タイマー","Fasting Timer","utility","timer","Health & Fitness","Zero Fasting ($5)",2,"間欠性断食（16:8等）のタイマー"));
apps.push(app("multi-timer","複数タイマー","Multi Timer","utility","timer","Utility","Multi Timer Pro ($4)",3,"複数のタイマーを同時に管理"));
apps.push(app("countdown-days","カウントダウン日数","Countdown Days","utility","timer","Utility","Countdown App ($3)",2,"イベントまでの日数をカウントダウン"));
apps.push(app("contraction-timer","陣痛タイマー","Contraction Timer","utility","timer","Health & Fitness","Contraction Timer ($3)",2,"陣痛の間隔を計測するタイマー"));
apps.push(app("breathing-timer","呼吸法タイマー","Breathing Exercise Timer","utility","timer","Health & Fitness","Breathe+ ($3)",2,"478呼吸法等の呼吸エクササイズタイマー"));
apps.push(app("speed-cube-timer","スピードキューブタイマー","Speed Cube Timer","utility","timer","Utility","Cube Timer ($3)",2,"ルービックキューブのタイム計測"));
apps.push(app("round-timer","ラウンドタイマー","Round Timer","utility","timer","Health & Fitness","Boxing Timer ($3)",2,"ボクシング・格闘技のラウンドタイマー"));
apps.push(app("visual-timer","ビジュアルタイマー","Visual Timer","utility","timer","Education","Time Timer ($5)",2,"視覚的に残り時間がわかるタイマー"));
apps.push(app("stopwatch-lap","ラップストップウォッチ","Lap Stopwatch","utility","timer","Utility","Stopwatch Pro ($3)",2,"ラップ機能付きストップウォッチ"));

// ===== COUNTERS (~20) =====
apps.push(app("tally-counter","数取器","Tally Counter","utility","counter","Utility","Tally Counter Pro ($3)",1,"ボタンを押して数をカウント"));
apps.push(app("score-counter","スコアカウンター","Score Counter","utility","counter","Utility","Score Keeper ($3)",2,"スポーツ等のスコアをカウント"));
apps.push(app("lap-counter","ラップカウンター","Lap Counter","utility","counter","Utility","Lap Counter ($2)",1,"周回数をカウント"));
apps.push(app("people-counter","人数カウンター","People Counter","utility","counter","Utility","People Counter ($3)",1,"入退場者の人数をカウント"));
apps.push(app("knitting-counter","編み物カウンター","Knitting Counter","utility","counter","Utility","Knit Counter ($3)",1,"編み物の段数・目数をカウント"));
apps.push(app("prayer-counter","念珠カウンター","Prayer Counter","utility","counter","Utility","Prayer Beads ($2)",1,"念仏・お経の回数をカウント"));
apps.push(app("pitch-counter","投球カウンター","Pitch Counter","utility","counter","Utility","Pitch Counter ($3)",1,"野球の投球数をカウント"));
apps.push(app("drink-counter","飲酒カウンター","Drink Counter","utility","counter","Health & Fitness","Drink Counter ($2)",1,"飲酒量（杯数）をカウント"));
apps.push(app("multi-counter","マルチカウンター","Multi Counter","utility","counter","Utility","Multi Counter ($3)",2,"複数のカウンターを同時管理"));
apps.push(app("blood-pressure-counter","血圧カウンター","Blood Pressure Counter","utility","counter","Health & Fitness","BP Counter ($3)",1,"血圧測定値を記録・カウント"));
apps.push(app("step-goal-counter","歩数目標カウンター","Step Goal Counter","utility","counter","Health & Fitness","Step Counter ($3)",1,"手動入力の歩数目標カウンター"));
apps.push(app("cigarette-counter","禁煙カウンター","Smoking Counter","utility","counter","Health & Fitness","Smoke Free ($5)",1,"喫煙本数・禁煙日数をカウント"));
apps.push(app("snack-counter","間食カウンター","Snack Counter","utility","counter","Health & Fitness","Snack Counter ($2)",1,"間食回数をカウント"));
apps.push(app("pushup-counter","腕立てカウンター","Pushup Counter","utility","counter","Health & Fitness","Pushup Counter ($2)",1,"腕立て伏せの回数をカウント"));
apps.push(app("sit-up-counter","腹筋カウンター","Sit Up Counter","utility","counter","Health & Fitness","Sit Up Counter ($2)",1,"腹筋の回数をカウント"));
apps.push(app("squat-counter","スクワットカウンター","Squat Counter","utility","counter","Health & Fitness","Squat Counter ($2)",1,"スクワットの回数をカウント"));
apps.push(app("day-counter","日数カウンター","Day Counter","utility","counter","Utility","Day Counter ($2)",1,"特定の日からの経過日数をカウント"));
apps.push(app("game-score-counter","ゲームスコア記録","Game Score Counter","utility","counter","Utility","Score Board ($3)",2,"ボードゲーム等のスコアを記録"));
apps.push(app("bird-watching-counter","野鳥観察カウンター","Bird Watching Counter","utility","counter","Utility","Bird Count ($3)",2,"野鳥観察の種類・数をカウント"));
apps.push(app("habit-streak-counter","継続日数カウンター","Habit Streak Counter","utility","counter","Utility","Streak Counter ($3)",1,"習慣の継続日数をカウント"));

// ===== SOUND/RELAXATION (~30) =====
apps.push(app("white-noise","ホワイトノイズ","White Noise","lifestyle","sound","Health & Fitness","White Noise ($3)",2,"ホワイトノイズで集中・睡眠サポート"));
apps.push(app("rain-sounds","雨の音","Rain Sounds","lifestyle","sound","Health & Fitness","Rain Rain ($4)",2,"リラックスできる雨の音"));
apps.push(app("ocean-sounds","波の音","Ocean Sounds","lifestyle","sound","Health & Fitness","Ocean Sounds ($3)",2,"心地よい波・海の音"));
apps.push(app("forest-sounds","森の音","Forest Sounds","lifestyle","sound","Health & Fitness","Forest Sounds ($3)",2,"鳥のさえずり・木々のざわめき"));
apps.push(app("cafe-sounds","カフェの音","Cafe Sounds","lifestyle","sound","Health & Fitness","Coffitivity ($3)",2,"カフェの環境音で集中力アップ"));
apps.push(app("fireplace-sounds","暖炉の音","Fireplace Sounds","lifestyle","sound","Health & Fitness","Fireplace Live ($3)",2,"暖炉のパチパチ音でリラックス"));
apps.push(app("thunder-sounds","雷の音","Thunder Sounds","lifestyle","sound","Health & Fitness","Thunder Sounds ($2)",2,"雷と雨の環境音"));
apps.push(app("wind-sounds","風の音","Wind Sounds","lifestyle","sound","Health & Fitness","Nature Sounds ($3)",2,"風の環境音でリラックス"));
apps.push(app("river-sounds","川の音","River Sounds","lifestyle","sound","Health & Fitness","Nature Sounds ($3)",2,"川のせせらぎの音"));
apps.push(app("bird-sounds","鳥の鳴き声","Bird Sounds","lifestyle","sound","Health & Fitness","Bird Songs ($3)",2,"鳥のさえずりの環境音"));
apps.push(app("cricket-sounds","虫の声","Cricket Sounds","lifestyle","sound","Health & Fitness","Nature Sounds ($3)",2,"秋の虫の声でリラックス"));
apps.push(app("fan-sounds","扇風機の音","Fan Sounds","lifestyle","sound","Health & Fitness","Fan Noise ($2)",2,"扇風機のゴーッという音"));
apps.push(app("train-sounds","電車の音","Train Sounds","lifestyle","sound","Health & Fitness","Train Sounds ($2)",2,"電車の走行音でリラックス"));
apps.push(app("pink-noise","ピンクノイズ","Pink Noise","lifestyle","sound","Health & Fitness","Pink Noise ($3)",2,"ピンクノイズで深い睡眠をサポート"));
apps.push(app("brown-noise","ブラウンノイズ","Brown Noise","lifestyle","sound","Health & Fitness","Brown Noise ($3)",2,"ブラウンノイズで集中力アップ"));
apps.push(app("binaural-beats","バイノーラルビート","Binaural Beats","lifestyle","sound","Health & Fitness","Binaural Beats ($5)",3,"バイノーラルビートで脳波を調整"));
apps.push(app("singing-bowl","シンギングボウル","Singing Bowl","lifestyle","sound","Health & Fitness","Singing Bowl ($3)",2,"シンギングボウルの癒しの音"));
apps.push(app("waterfall-sounds","滝の音","Waterfall Sounds","lifestyle","sound","Health & Fitness","Nature Sounds ($3)",2,"滝の轟音でリラックス"));
apps.push(app("cat-purr-sounds","猫のゴロゴロ音","Cat Purr Sounds","lifestyle","sound","Health & Fitness","Purrli ($3)",2,"猫のゴロゴロ音で癒し"));
apps.push(app("asmr-sounds","ASMR音","ASMR Sounds","lifestyle","sound","Health & Fitness","ASMR App ($4)",2,"ASMR系の心地よい音"));
apps.push(app("sleep-stories","眠れる音","Sleep Sounds Mix","lifestyle","sound","Health & Fitness","Calm ($15)",3,"複数の環境音をミックスして再生"));
apps.push(app("temple-bell-sounds","お寺の鐘の音","Temple Bell Sounds","lifestyle","sound","Health & Fitness","Zen Sounds ($3)",2,"お寺の鐘・木魚の音で瞑想"));
apps.push(app("wind-chime-sounds","風鈴の音","Wind Chime Sounds","lifestyle","sound","Health & Fitness","Wind Chime ($2)",2,"風鈴の涼しげな音"));
apps.push(app("library-sounds","図書館の音","Library Sounds","lifestyle","sound","Health & Fitness","Ambient Sounds ($3)",2,"図書館の静かな環境音"));
apps.push(app("keyboard-sounds","キーボードの音","Keyboard Sounds","lifestyle","sound","Health & Fitness","Ambient Sounds ($3)",2,"タイピング・キーボードの心地よい音"));
apps.push(app("underwater-sounds","水中の音","Underwater Sounds","lifestyle","sound","Health & Fitness","Nature Sounds ($3)",2,"水中の環境音でリラックス"));
apps.push(app("city-sounds","都会の音","City Sounds","lifestyle","sound","Health & Fitness","Ambient Sounds ($3)",2,"街中の環境音（車・人の声等）"));
apps.push(app("airplane-sounds","飛行機の音","Airplane Sounds","lifestyle","sound","Health & Fitness","Ambient Sounds ($3)",2,"飛行機の機内音でリラックス"));
apps.push(app("nature-mix-sounds","自然音ミックス","Nature Sound Mixer","lifestyle","sound","Health & Fitness","Relax Melodies ($10)",3,"自然音を自由にミックスして再生"));
apps.push(app("lullaby-sounds","子守唄オルゴール","Lullaby Music Box","lifestyle","sound","Health & Fitness","Lullaby ($3)",2,"子守唄のオルゴール音で赤ちゃんの寝かしつけ"));

// ===== REFERENCE (~40) =====
apps.push(app("kanji-dictionary","漢字辞典","Kanji Dictionary","utility","reference","Education","漢字辞典 ($5)",3,"漢字の読み・書き順・意味を検索"));
apps.push(app("yojijukugo-dictionary","四字熟語辞典","Yojijukugo Dictionary","utility","reference","Education","四字熟語辞典 ($4)",2,"四字熟語の意味・用例を検索"));
apps.push(app("kotowaza-dictionary","ことわざ辞典","Proverb Dictionary","utility","reference","Education","ことわざ辞典 ($3)",2,"ことわざ・慣用句の意味を検索"));
apps.push(app("keigo-reference","敬語チェック","Keigo Reference","utility","reference","Education","敬語マスター ($4)",2,"正しい敬語表現をチェック・確認"));
apps.push(app("manners-reference","冠婚葬祭マナー","Ceremony Manners","utility","reference","Lifestyle","マナー事典 ($4)",2,"冠婚葬祭のマナーを確認"));
apps.push(app("noshi-reference","のし袋ガイド","Noshi Guide","utility","reference","Lifestyle","のし袋 ($3)",2,"のし袋の書き方・金額の目安を確認"));
apps.push(app("rokuyo-calendar","六曜カレンダー","Rokuyo Calendar","utility","reference","Utility","六曜カレンダー ($3)",2,"大安・仏滅等の六曜を確認できるカレンダー"));
apps.push(app("seasonal-words","季語辞典","Seasonal Words Dictionary","utility","reference","Education","季語辞典 ($3)",2,"俳句の季語を季節別に検索"));
apps.push(app("country-info","国情報辞典","Country Information","utility","reference","Education","World Facts ($3)",2,"世界の国の首都・人口・面積等を検索"));
apps.push(app("element-table","元素周期表","Periodic Table","utility","reference","Education","Periodic Table Pro ($4)",2,"元素周期表と各元素の詳細情報"));
apps.push(app("constellation-guide","星座ガイド","Constellation Guide","utility","reference","Education","Star Chart ($5)",2,"星座の見つけ方・神話を解説"));
apps.push(app("first-aid-guide","応急処置ガイド","First Aid Guide","utility","reference","Health & Fitness","First Aid ($4)",2,"応急処置の方法を確認"));
apps.push(app("nutrition-reference","栄養成分表","Nutrition Reference","utility","reference","Health & Fitness","Nutrition Facts ($4)",2,"食品の栄養成分を検索"));
apps.push(app("muscle-reference","筋肉辞典","Muscle Reference","utility","reference","Health & Fitness","Muscle Anatomy ($5)",2,"筋肉の名称・位置・トレーニング方法"));
apps.push(app("dog-breed-reference","犬種図鑑","Dog Breed Reference","utility","reference","Reference","Dog Breeds ($4)",2,"犬種の特徴・性格・飼い方を検索"));
apps.push(app("cat-breed-reference","猫種図鑑","Cat Breed Reference","utility","reference","Reference","Cat Breeds ($4)",2,"猫種の特徴・性格・飼い方を検索"));
apps.push(app("flower-reference","花図鑑","Flower Reference","utility","reference","Reference","Flower Guide ($4)",2,"花の名前・花言葉・育て方を検索"));
apps.push(app("birthstone-reference","誕生石一覧","Birthstone Reference","utility","reference","Reference","Birthstone ($2)",1,"月別の誕生石と意味を確認"));
apps.push(app("hanakotoba-reference","花言葉辞典","Hanakotoba Dictionary","utility","reference","Reference","花言葉 ($3)",2,"花言葉を花名から検索"));
apps.push(app("ascii-table","ASCII表","ASCII Table","utility","reference","Utility","ASCII Reference ($2)",1,"ASCII文字コード表を表示"));
apps.push(app("http-status-reference","HTTPステータスコード","HTTP Status Reference","utility","reference","Utility","HTTP Codes ($2)",1,"HTTPステータスコードの一覧と説明"));
apps.push(app("color-palette-reference","カラーパレット","Color Palette Reference","utility","reference","Utility","Color Reference ($3)",2,"色の名前・コード・配色パターン"));
apps.push(app("morse-code-reference","モールス信号表","Morse Code Reference","utility","reference","Education","Morse Code ($2)",1,"モールス信号の一覧と変換"));
apps.push(app("sign-language-reference","手話辞典","Sign Language Reference","utility","reference","Education","手話辞典 ($5)",3,"基本的な手話表現を図解付きで検索"));
apps.push(app("japanese-history-timeline","日本史年表","Japan History Timeline","utility","reference","Education","日本史年表 ($3)",2,"日本史の年表と主要な出来事"));
apps.push(app("world-history-timeline","世界史年表","World History Timeline","utility","reference","Education","World History ($3)",2,"世界史の年表と主要な出来事"));
apps.push(app("constitution-reference","日本国憲法","Japan Constitution","utility","reference","Education","日本国憲法 ($2)",1,"日本国憲法の全文と解説"));
apps.push(app("prefecture-info","都道府県情報","Prefecture Info","utility","reference","Education","都道府県 ($3)",2,"47都道府県の情報（県庁所在地・名産等）"));
apps.push(app("train-line-reference","路線図一覧","Train Line Reference","utility","reference","Travel","路線図 ($3)",2,"主要鉄道路線の路線図・駅一覧"));
apps.push(app("emoji-reference","絵文字辞典","Emoji Reference","utility","reference","Utility","Emoji Dictionary ($2)",1,"絵文字の意味と使い方を検索"));
apps.push(app("shortcut-key-reference","ショートカットキー","Shortcut Key Reference","utility","reference","Utility","Shortcut Keys ($3)",2,"PC・アプリのショートカットキー一覧"));
apps.push(app("baby-name-reference","赤ちゃん名前辞典","Baby Name Dictionary","utility","reference","Lifestyle","名前辞典 ($4)",3,"赤ちゃんの名前の読み・画数・意味を検索"));
apps.push(app("sake-reference","日本酒辞典","Sake Dictionary","utility","reference","Food & Drink","日本酒 ($3)",2,"日本酒の種類・味わい・合う料理を検索"));
apps.push(app("tea-reference","お茶辞典","Tea Dictionary","utility","reference","Food & Drink","Tea Guide ($3)",2,"お茶の種類・淹れ方・効能を検索"));
apps.push(app("wine-reference","ワイン辞典","Wine Dictionary","utility","reference","Food & Drink","Wine Guide ($4)",2,"ワインの種類・産地・合う料理を検索"));
apps.push(app("cooking-reference","料理用語辞典","Cooking Terms Dictionary","utility","reference","Food & Drink","Cooking Terms ($3)",2,"料理用語の意味を検索"));
apps.push(app("music-theory-reference","音楽理論辞典","Music Theory Reference","utility","reference","Education","Music Theory ($5)",3,"コード・スケール・音楽理論を検索"));
apps.push(app("knot-reference","結び方辞典","Knot Reference","utility","reference","Reference","Knot Guide ($3)",2,"ロープ・ネクタイ等の結び方を図解"));
apps.push(app("zodiac-reference","星座早見表","Zodiac Reference","utility","reference","Reference","Zodiac Signs ($2)",1,"12星座の基本情報・性格を確認"));
apps.push(app("blood-type-reference","血液型性格辞典","Blood Type Reference","utility","reference","Reference","血液型 ($2)",1,"血液型別の性格・相性を確認"));

// ===== TRACKERS (~60) =====
apps.push(app("habit-tracker","習慣トラッカー","Habit Tracker","lifestyle","tracker","Health & Fitness","Streaks ($5)",3,"毎日の習慣を記録・管理"));
apps.push(app("weight-tracker","体重トラッカー","Weight Tracker","lifestyle","tracker","Health & Fitness","Happy Scale ($5)",3,"体重の変化を記録・グラフ表示"));
apps.push(app("water-tracker","水分トラッカー","Water Tracker","lifestyle","tracker","Health & Fitness","Water Reminder ($3)",2,"1日の水分摂取量を記録"));
apps.push(app("mood-tracker","気分トラッカー","Mood Tracker","lifestyle","tracker","Health & Fitness","Daylio ($5)",3,"毎日の気分を記録・分析"));
apps.push(app("sleep-tracker","睡眠トラッカー","Sleep Tracker","lifestyle","tracker","Health & Fitness","Sleep Cycle ($5)",3,"睡眠時間・質を記録"));
apps.push(app("period-tracker","生理トラッカー","Period Tracker","lifestyle","tracker","Health & Fitness","Clue ($5)",3,"生理周期を記録・予測"));
apps.push(app("medicine-tracker","服薬トラッカー","Medicine Tracker","lifestyle","tracker","Health & Fitness","Medisafe ($5)",3,"薬の服用を記録・リマインド"));
apps.push(app("blood-pressure-tracker","血圧トラッカー","Blood Pressure Tracker","lifestyle","tracker","Health & Fitness","BP Monitor ($4)",3,"血圧の測定値を記録・グラフ表示"));
apps.push(app("headache-tracker","頭痛トラッカー","Headache Tracker","lifestyle","tracker","Health & Fitness","Migraine Buddy ($5)",3,"頭痛の発生・程度・原因を記録"));
apps.push(app("allergy-tracker","アレルギートラッカー","Allergy Tracker","lifestyle","tracker","Health & Fitness","Allergy Tracker ($3)",2,"アレルギー症状を記録・管理"));
apps.push(app("symptom-tracker","症状トラッカー","Symptom Tracker","lifestyle","tracker","Health & Fitness","Symptom Tracker ($4)",3,"体の症状を記録・管理"));
apps.push(app("baby-tracker","赤ちゃんトラッカー","Baby Tracker","lifestyle","tracker","Health & Fitness","Baby Tracker ($5)",3,"授乳・おむつ替え・睡眠を記録"));
apps.push(app("pregnancy-tracker","妊娠トラッカー","Pregnancy Tracker","lifestyle","tracker","Health & Fitness","Pregnancy+ ($5)",3,"妊娠週数・体重・検診を記録"));
apps.push(app("pet-care-tracker","ペットケアトラッカー","Pet Care Tracker","lifestyle","tracker","Lifestyle","Pet Care ($4)",3,"ペットの食事・散歩・通院を記録"));
apps.push(app("plant-care-tracker","植物ケアトラッカー","Plant Care Tracker","lifestyle","tracker","Lifestyle","Planta ($5)",3,"植物の水やり・肥料を記録・リマインド"));
apps.push(app("reading-tracker","読書トラッカー","Reading Tracker","lifestyle","tracker","Education","Bookly ($5)",3,"読書量・感想を記録"));
apps.push(app("movie-tracker","映画トラッカー","Movie Tracker","lifestyle","tracker","Entertainment","Letterboxd Pro ($5)",3,"鑑賞した映画を記録・評価"));
apps.push(app("anime-tracker","アニメトラッカー","Anime Tracker","lifestyle","tracker","Entertainment","AniList ($3)",3,"視聴アニメを記録・管理"));
apps.push(app("exercise-tracker","運動トラッカー","Exercise Tracker","lifestyle","tracker","Health & Fitness","Strong ($5)",3,"運動・筋トレの記録を管理"));
apps.push(app("running-tracker","ランニングトラッカー","Running Tracker","lifestyle","tracker","Health & Fitness","Running Log ($4)",3,"ランニングの距離・タイムを記録"));
apps.push(app("walking-tracker","ウォーキングトラッカー","Walking Tracker","lifestyle","tracker","Health & Fitness","Walking Tracker ($3)",2,"ウォーキングの記録を管理"));
apps.push(app("cycling-tracker","サイクリングトラッカー","Cycling Tracker","lifestyle","tracker","Health & Fitness","Cycling Log ($4)",3,"サイクリングの記録を管理"));
apps.push(app("swimming-tracker","水泳トラッカー","Swimming Tracker","lifestyle","tracker","Health & Fitness","Swim Log ($4)",3,"水泳の距離・タイムを記録"));
apps.push(app("meditation-tracker","瞑想トラッカー","Meditation Tracker","lifestyle","tracker","Health & Fitness","Insight Timer ($10)",2,"瞑想の回数・時間を記録"));
apps.push(app("smoking-quit-tracker","禁煙トラッカー","Quit Smoking Tracker","lifestyle","tracker","Health & Fitness","Smoke Free ($5)",2,"禁煙日数・節約金額を追跡"));
apps.push(app("alcohol-quit-tracker","禁酒トラッカー","Quit Alcohol Tracker","lifestyle","tracker","Health & Fitness","Sober Time ($4)",2,"禁酒日数を追跡"));
apps.push(app("skincare-tracker","スキンケアトラッカー","Skincare Tracker","lifestyle","tracker","Health & Fitness","Skincare Routine ($4)",2,"スキンケアのルーティンを記録"));
apps.push(app("meal-tracker","食事トラッカー","Meal Tracker","lifestyle","tracker","Health & Fitness","MyFitnessPal ($10)",3,"食事内容を記録"));
apps.push(app("caffeine-tracker","カフェインtトラッカー","Caffeine Tracker","lifestyle","tracker","Health & Fitness","Caffeine Tracker ($3)",2,"カフェイン摂取量を記録"));
apps.push(app("study-tracker","勉強トラッカー","Study Tracker","lifestyle","tracker","Education","Study Log ($4)",3,"勉強時間・内容を記録"));
apps.push(app("cleaning-tracker","掃除トラッカー","Cleaning Tracker","lifestyle","tracker","Lifestyle","Tody ($4)",2,"掃除スケジュールを記録・管理"));
apps.push(app("vitamin-tracker","サプリトラッカー","Vitamin Tracker","lifestyle","tracker","Health & Fitness","Supplement Tracker ($3)",2,"サプリメントの服用を記録"));
apps.push(app("pain-tracker","痛みトラッカー","Pain Tracker","lifestyle","tracker","Health & Fitness","Pain Diary ($4)",3,"痛みの部位・程度を記録"));
apps.push(app("bowel-tracker","お通じトラッカー","Bowel Tracker","lifestyle","tracker","Health & Fitness","Poop Tracker ($3)",2,"お通じの回数・状態を記録"));
apps.push(app("temperature-body-tracker","体温トラッカー","Body Temperature Tracker","lifestyle","tracker","Health & Fitness","Body Temp ($3)",2,"毎日の体温を記録・グラフ表示"));
apps.push(app("music-practice-tracker","楽器練習トラッカー","Music Practice Tracker","lifestyle","tracker","Education","Practice+ ($5)",3,"楽器の練習時間を記録"));
apps.push(app("language-study-tracker","語学学習トラッカー","Language Study Tracker","lifestyle","tracker","Education","Language Log ($3)",2,"語学学習の時間・内容を記録"));
apps.push(app("project-tracker","プロジェクトトラッカー","Project Tracker","lifestyle","tracker","Productivity","Project Tracker ($5)",3,"プロジェクトの進捗を管理"));
apps.push(app("goal-tracker","目標トラッカー","Goal Tracker","lifestyle","tracker","Productivity","Goals ($4)",3,"目標と達成度を記録・管理"));
apps.push(app("chore-tracker","家事トラッカー","Chore Tracker","lifestyle","tracker","Lifestyle","Chore Tracker ($3)",2,"家事の分担と実施を記録"));
apps.push(app("car-maintenance-tracker","車メンテトラッカー","Car Maintenance Tracker","lifestyle","tracker","Utility","Car Minder ($5)",3,"車の整備・給油を記録"));
apps.push(app("screen-time-tracker","スクリーンタイム記録","Screen Time Tracker","lifestyle","tracker","Health & Fitness","Screen Time ($3)",2,"スマホ使用時間を手動記録"));
apps.push(app("gratitude-tracker","感謝トラッカー","Gratitude Tracker","lifestyle","tracker","Health & Fitness","Gratitude ($4)",2,"毎日の感謝を記録"));
apps.push(app("anxiety-tracker","不安トラッカー","Anxiety Tracker","lifestyle","tracker","Health & Fitness","Worry Watch ($4)",3,"不安・ストレスの程度を記録"));
apps.push(app("pollen-tracker","花粉情報トラッカー","Pollen Tracker","lifestyle","tracker","Health & Fitness","花粉アプリ ($3)",2,"花粉症の症状と花粉量を記録"));
apps.push(app("heatstroke-index","熱中症指数","Heatstroke Index","lifestyle","tracker","Health & Fitness","熱中症アラート ($3)",2,"気温・湿度から熱中症危険度を記録"));
apps.push(app("uv-tracker","紫外線トラッカー","UV Tracker","lifestyle","tracker","Health & Fitness","UV Index ($3)",2,"紫外線指数を記録・管理"));
apps.push(app("nail-care-tracker","ネイルケアトラッカー","Nail Care Tracker","lifestyle","tracker","Lifestyle","Nail Tracker ($2)",2,"ネイルのデザイン・施術日を記録"));
apps.push(app("hair-care-tracker","ヘアケアトラッカー","Hair Care Tracker","lifestyle","tracker","Lifestyle","Hair Care ($3)",2,"ヘアカット・カラーの記録を管理"));
apps.push(app("dental-tracker","歯科通院トラッカー","Dental Tracker","lifestyle","tracker","Health & Fitness","Dental Tracker ($3)",2,"歯科通院・歯磨き記録を管理"));
apps.push(app("bird-watching-tracker","野鳥観察トラッカー","Bird Watching Tracker","lifestyle","tracker","Lifestyle","eBird ($3)",3,"野鳥観察の記録を管理"));
apps.push(app("garden-tracker","家庭菜園トラッカー","Garden Tracker","lifestyle","tracker","Lifestyle","Gardenize ($5)",3,"家庭菜園の種まき・収穫を記録"));
apps.push(app("fishing-tracker","釣りトラッカー","Fishing Tracker","lifestyle","tracker","Lifestyle","Fishing Log ($4)",3,"釣果を記録・管理"));
apps.push(app("travel-tracker","旅行トラッカー","Travel Tracker","lifestyle","tracker","Travel","Trip Tracker ($4)",2,"旅行先・日程を記録"));
apps.push(app("vaccine-tracker","ワクチン記録","Vaccine Tracker","lifestyle","tracker","Health & Fitness","Vaccine Record ($3)",2,"ワクチン接種歴を記録"));
apps.push(app("collection-tracker","コレクショントラッカー","Collection Tracker","lifestyle","tracker","Lifestyle","Collection Log ($3)",3,"コレクション（切手・コイン等）を記録"));
apps.push(app("recipe-tracker","レシピ記録","Recipe Tracker","lifestyle","tracker","Food & Drink","Recipe Box ($4)",3,"お気に入りレシピを記録・管理"));
apps.push(app("soroban-tracker","そろばん練習記録","Soroban Tracker","lifestyle","tracker","Education","そろばん ($3)",2,"そろばん練習の記録を管理"));
apps.push(app("diary-streak-tracker","日記継続トラッカー","Diary Streak Tracker","lifestyle","tracker","Lifestyle","Diary Streak ($3)",2,"日記の継続日数を追跡"));

// ===== LOGS/JOURNALS (~30) =====
apps.push(app("simple-diary","シンプル日記","Simple Diary","lifestyle","log","Lifestyle","Day One ($5)",3,"毎日の出来事を記録するシンプルな日記"));
apps.push(app("dream-journal","夢日記","Dream Journal","lifestyle","log","Lifestyle","Dream Journal ($4)",2,"見た夢を記録する夢日記"));
apps.push(app("gratitude-journal","感謝日記","Gratitude Journal","lifestyle","log","Lifestyle","Gratitude Journal ($4)",2,"毎日の感謝を記録する日記"));
apps.push(app("food-journal","食事日記","Food Journal","lifestyle","log","Health & Fitness","Food Diary ($4)",3,"毎日の食事を記録する日記"));
apps.push(app("workout-journal","筋トレ日記","Workout Journal","lifestyle","log","Health & Fitness","Workout Log ($5)",3,"筋トレの内容・回数・重量を記録"));
apps.push(app("travel-journal","旅行日記","Travel Journal","lifestyle","log","Travel","Travel Journal ($4)",3,"旅行の思い出を記録する日記"));
apps.push(app("pregnancy-journal","妊娠日記","Pregnancy Journal","lifestyle","log","Health & Fitness","Pregnancy Diary ($4)",2,"妊娠中の体調・気持ちを記録"));
apps.push(app("baby-journal","育児日記","Baby Journal","lifestyle","log","Lifestyle","Baby Journal ($5)",3,"赤ちゃんの成長を記録する日記"));
apps.push(app("pet-journal","ペット日記","Pet Journal","lifestyle","log","Lifestyle","Pet Diary ($3)",2,"ペットの日々を記録する日記"));
apps.push(app("garden-journal","ガーデニング日記","Garden Journal","lifestyle","log","Lifestyle","Garden Journal ($4)",2,"植物の成長を記録する日記"));
apps.push(app("wine-journal","ワイン日記","Wine Journal","lifestyle","log","Food & Drink","Wine Diary ($4)",2,"飲んだワインの感想を記録"));
apps.push(app("coffee-journal","コーヒー日記","Coffee Journal","lifestyle","log","Food & Drink","Coffee Diary ($3)",2,"飲んだコーヒーの味・産地を記録"));
apps.push(app("beer-journal","ビール日記","Beer Journal","lifestyle","log","Food & Drink","Beer Diary ($3)",2,"飲んだビールの感想を記録"));
apps.push(app("ramen-journal","ラーメン日記","Ramen Journal","lifestyle","log","Food & Drink","ラーメン日記 ($3)",2,"食べたラーメンを記録・評価"));
apps.push(app("sushi-journal","お寿司日記","Sushi Journal","lifestyle","log","Food & Drink","グルメ日記 ($3)",2,"食べたお寿司を記録・評価"));
apps.push(app("book-journal","読書日記","Book Journal","lifestyle","log","Education","Reading Journal ($4)",3,"読んだ本の感想・評価を記録"));
apps.push(app("movie-journal","映画日記","Movie Journal","lifestyle","log","Entertainment","Movie Diary ($3)",2,"観た映画の感想・評価を記録"));
apps.push(app("anime-journal","アニメ日記","Anime Journal","lifestyle","log","Entertainment","Anime Diary ($3)",2,"観たアニメの感想を記録"));
apps.push(app("game-journal","ゲーム日記","Game Journal","lifestyle","log","Entertainment","Game Diary ($3)",2,"プレイしたゲームの記録"));
apps.push(app("concert-journal","ライブ日記","Concert Journal","lifestyle","log","Entertainment","Concert Diary ($3)",2,"行ったライブ・コンサートの記録"));
apps.push(app("meditation-journal","瞑想日記","Meditation Journal","lifestyle","log","Health & Fitness","Meditation Diary ($3)",2,"瞑想の内容・感想を記録"));
apps.push(app("therapy-journal","セラピー日記","Therapy Journal","lifestyle","log","Health & Fitness","CBT Journal ($5)",3,"認知行動療法の記録・振り返り"));
apps.push(app("fishing-journal","釣り日記","Fishing Journal","lifestyle","log","Lifestyle","Fishing Diary ($4)",2,"釣果・場所・天候を記録"));
apps.push(app("hiking-journal","ハイキング日記","Hiking Journal","lifestyle","log","Lifestyle","Hiking Log ($4)",2,"ハイキング・登山の記録"));
apps.push(app("stamp-rally-journal","スタンプラリー日記","Stamp Rally Journal","lifestyle","log","Lifestyle","Stamp Rally ($3)",2,"スタンプラリー・御朱印の記録"));
apps.push(app("photo-diary","写真日記","Photo Diary","lifestyle","log","Lifestyle","Photo Journal ($4)",2,"写真付きの一行日記"));
apps.push(app("one-line-diary","一行日記","One Line Diary","lifestyle","log","Lifestyle","1Line Diary ($3)",2,"毎日一行だけ書くシンプル日記"));
apps.push(app("weather-diary","天気日記","Weather Diary","lifestyle","log","Lifestyle","Weather Journal ($2)",2,"毎日の天気を記録する日記"));
apps.push(app("learning-journal","学習日記","Learning Journal","lifestyle","log","Education","Study Diary ($3)",2,"勉強した内容を記録する日記"));
apps.push(app("idea-journal","アイデア帳","Idea Journal","lifestyle","log","Productivity","Idea Notebook ($3)",2,"思いついたアイデアを記録"));

// ===== BUDGET/FINANCE (~30) =====
apps.push(app("simple-expense","シンプル家計簿","Simple Expense Tracker","lifestyle","budget","Finance","家計簿 ($5)",3,"日々の支出を記録する家計簿"));
apps.push(app("monthly-budget","月別予算管理","Monthly Budget","lifestyle","budget","Finance","Budget Planner ($5)",3,"月ごとの予算と支出を管理"));
apps.push(app("envelope-budget","封筒家計簿","Envelope Budget","lifestyle","budget","Finance","Goodbudget ($5)",3,"封筒式の予算管理"));
apps.push(app("savings-goal","貯金目標","Savings Goal","lifestyle","budget","Finance","Savings Goal ($3)",2,"貯金目標を設定・進捗を管理"));
apps.push(app("subscription-manager","サブスク管理","Subscription Manager","lifestyle","budget","Finance","Bobby ($3)",3,"サブスクの月額・年額を管理"));
apps.push(app("shopping-list","買い物リスト","Shopping List","lifestyle","budget","Productivity","Shopping List ($3)",2,"買い物リストを作成・管理"));
apps.push(app("price-comparison","価格比較メモ","Price Comparison","lifestyle","budget","Finance","Price Compare ($3)",2,"商品の価格を比較メモ"));
apps.push(app("coupon-tracker","クーポン管理","Coupon Tracker","lifestyle","budget","Finance","Coupon Tracker ($3)",2,"クーポン・割引券の管理"));
apps.push(app("debt-tracker","借金返済トラッカー","Debt Tracker","lifestyle","budget","Finance","Debt Payoff ($4)",3,"借金の返済計画と進捗を管理"));
apps.push(app("net-worth-tracker","資産管理","Net Worth Tracker","lifestyle","budget","Finance","Net Worth ($5)",3,"総資産を記録・管理"));
apps.push(app("travel-expense","旅費管理","Travel Expense","lifestyle","budget","Finance","Trail Wallet ($5)",3,"旅行中の出費を記録・管理"));
apps.push(app("group-expense","グループ費用管理","Group Expense","lifestyle","budget","Finance","Splitwise ($5)",3,"グループでの費用分担を管理"));
apps.push(app("gift-budget","ギフト予算管理","Gift Budget","lifestyle","budget","Finance","Gift Budget ($3)",2,"贈り物の予算・購入記録を管理"));
apps.push(app("wedding-expense","結婚式費用管理","Wedding Expense","lifestyle","budget","Finance","Wedding Budget ($5)",3,"結婚式の費用を項目別に管理"));
apps.push(app("baby-expense","育児費用管理","Baby Expense","lifestyle","budget","Finance","Baby Budget ($4)",3,"育児に関する費用を記録"));
apps.push(app("pet-expense","ペット費用管理","Pet Expense","lifestyle","budget","Finance","Pet Budget ($3)",2,"ペットに関する費用を記録"));
apps.push(app("car-expense","車費用管理","Car Expense","lifestyle","budget","Finance","Car Expense ($4)",3,"車に関する費用（ガソリン・保険等）を記録"));
apps.push(app("lunch-expense","ランチ代管理","Lunch Expense","lifestyle","budget","Finance","Lunch Money ($3)",2,"毎日のランチ代を記録・管理"));
apps.push(app("otoshidama-manager","お年玉管理","Otoshidama Manager","lifestyle","budget","Finance","お年玉管理 ($2)",1,"お年玉の金額・送り先を管理"));
apps.push(app("kakeibo","カケイボ","Kakeibo","lifestyle","budget","Finance","カケイボ ($5)",3,"日本式家計簿（カケイボ方式）"));
apps.push(app("investment-tracker","投資記録","Investment Tracker","lifestyle","budget","Finance","Investment ($5)",3,"株式・投資信託の記録を管理"));
apps.push(app("allowance-manager","お小遣い帳","Allowance Manager","lifestyle","budget","Finance","お小遣い帳 ($3)",2,"お小遣いの収支を記録"));
apps.push(app("tax-deduction-tracker","控除管理","Tax Deduction Tracker","lifestyle","budget","Finance","Tax Deduction ($4)",3,"確定申告の控除項目を記録"));
apps.push(app("electricity-bill-tracker","光熱費管理","Utility Bill Tracker","lifestyle","budget","Finance","Utility Bills ($3)",2,"電気・ガス・水道代を記録・比較"));
apps.push(app("medical-expense-tracker","医療費管理","Medical Expense Tracker","lifestyle","budget","Finance","Medical Expense ($4)",3,"医療費の記録・確定申告用管理"));
apps.push(app("education-expense","教育費管理","Education Expense","lifestyle","budget","Finance","Education Budget ($4)",3,"教育費（塾・習い事等）を記録"));
apps.push(app("freelance-income","フリーランス収入管理","Freelance Income","lifestyle","budget","Finance","Freelance ($5)",3,"フリーランスの収入・経費を管理"));
apps.push(app("coin-savings","小銭貯金","Coin Savings","lifestyle","budget","Finance","Coin Jar ($2)",1,"500円玉貯金等の小銭貯金を記録"));
apps.push(app("goal-savings","目標貯金","Goal Savings","lifestyle","budget","Finance","Savings Goals ($3)",2,"複数の貯金目標を設定・管理"));
apps.push(app("daily-expense","日別支出記録","Daily Expense","lifestyle","budget","Finance","Daily Budget ($4)",3,"1日の予算を設定し支出を記録"));

// ===== QUIZZES (~60) =====
apps.push(app("kanji-quiz","漢字クイズ","Kanji Quiz","game","quiz","Education","漢字検定 ($5)",2,"漢字の読み書きクイズ"));
apps.push(app("yojijukugo-quiz","四字熟語クイズ","Yojijukugo Quiz","game","quiz","Education","四字熟語クイズ ($3)",2,"四字熟語の意味・用法クイズ"));
apps.push(app("kotowaza-quiz","ことわざクイズ","Proverb Quiz","game","quiz","Education","ことわざクイズ ($3)",2,"ことわざの意味を当てるクイズ"));
apps.push(app("hyakunin-isshu-quiz","百人一首クイズ","Hyakunin Isshu Quiz","game","quiz","Education","百人一首 ($4)",2,"百人一首の上の句・下の句クイズ"));
apps.push(app("prefecture-quiz","都道府県クイズ","Prefecture Quiz","game","quiz","Education","都道府県クイズ ($3)",2,"都道府県の位置・県庁所在地クイズ"));
apps.push(app("station-name-quiz","駅名クイズ","Station Name Quiz","game","quiz","Education","駅名クイズ ($3)",2,"難読駅名の読みを当てるクイズ"));
apps.push(app("japanese-history-quiz","日本史クイズ","Japan History Quiz","game","quiz","Education","日本史クイズ ($4)",2,"日本の歴史に関するクイズ"));
apps.push(app("world-history-quiz","世界史クイズ","World History Quiz","game","quiz","Education","World History Quiz ($3)",2,"世界の歴史に関するクイズ"));
apps.push(app("geography-quiz","地理クイズ","Geography Quiz","game","quiz","Education","Geography Quiz ($3)",2,"世界の地理に関するクイズ"));
apps.push(app("capital-city-quiz","首都クイズ","Capital City Quiz","game","quiz","Education","Capital Quiz ($3)",2,"世界の首都を当てるクイズ"));
apps.push(app("flag-quiz","国旗クイズ","Flag Quiz","game","quiz","Education","Flag Quiz ($3)",2,"国旗から国名を当てるクイズ"));
apps.push(app("science-quiz","理科クイズ","Science Quiz","game","quiz","Education","Science Quiz ($3)",2,"理科・科学に関するクイズ"));
apps.push(app("math-quiz","算数クイズ","Math Quiz","game","quiz","Education","Math Quiz ($3)",2,"算数・数学のクイズ"));
apps.push(app("english-vocabulary-quiz","英単語クイズ","English Vocab Quiz","game","quiz","Education","英単語 ($5)",2,"英単語の意味を当てるクイズ"));
apps.push(app("english-grammar-quiz","英文法クイズ","English Grammar Quiz","game","quiz","Education","英文法 ($5)",2,"英文法の正誤を判定するクイズ"));
apps.push(app("toeic-quiz","TOEICクイズ","TOEIC Quiz","game","quiz","Education","TOEIC対策 ($5)",3,"TOEIC形式の問題クイズ"));
apps.push(app("animal-quiz","動物クイズ","Animal Quiz","game","quiz","Education","Animal Quiz ($2)",1,"動物に関するクイズ"));
apps.push(app("dinosaur-quiz","恐竜クイズ","Dinosaur Quiz","game","quiz","Education","Dinosaur Quiz ($2)",2,"恐竜に関するクイズ"));
apps.push(app("space-quiz","宇宙クイズ","Space Quiz","game","quiz","Education","Space Quiz ($3)",2,"宇宙・天文に関するクイズ"));
apps.push(app("human-body-quiz","人体クイズ","Human Body Quiz","game","quiz","Education","Anatomy Quiz ($4)",2,"人体の構造に関するクイズ"));
apps.push(app("food-quiz","食べ物クイズ","Food Quiz","game","quiz","Education","Food Quiz ($2)",1,"食べ物・料理に関するクイズ"));
apps.push(app("music-quiz","音楽クイズ","Music Quiz","game","quiz","Entertainment","Music Quiz ($3)",2,"音楽に関するクイズ"));
apps.push(app("movie-quiz","映画クイズ","Movie Quiz","game","quiz","Entertainment","Movie Quiz ($3)",2,"映画に関するクイズ"));
apps.push(app("sports-quiz","スポーツクイズ","Sports Quiz","game","quiz","Entertainment","Sports Quiz ($3)",2,"スポーツに関するクイズ"));
apps.push(app("olympic-quiz","オリンピッククイズ","Olympic Quiz","game","quiz","Entertainment","Olympic Quiz ($2)",2,"オリンピックに関するクイズ"));
apps.push(app("japanese-culture-quiz","日本文化クイズ","Japanese Culture Quiz","game","quiz","Education","日本文化 ($3)",2,"日本の文化・伝統に関するクイズ"));
apps.push(app("literature-quiz","文学クイズ","Literature Quiz","game","quiz","Education","Literature Quiz ($3)",2,"日本・世界の文学に関するクイズ"));
apps.push(app("art-quiz","美術クイズ","Art Quiz","game","quiz","Education","Art Quiz ($3)",2,"美術・絵画に関するクイズ"));
apps.push(app("inventor-quiz","発明家クイズ","Inventor Quiz","game","quiz","Education","Inventor Quiz ($2)",2,"発明家と発明品に関するクイズ"));
apps.push(app("mythology-quiz","神話クイズ","Mythology Quiz","game","quiz","Education","Mythology Quiz ($3)",2,"世界の神話に関するクイズ"));
apps.push(app("philosophy-quiz","哲学クイズ","Philosophy Quiz","game","quiz","Education","Philosophy Quiz ($3)",2,"哲学・思想に関するクイズ"));
apps.push(app("law-quiz","法律クイズ","Law Quiz","game","quiz","Education","Law Quiz ($3)",2,"一般常識としての法律クイズ"));
apps.push(app("economics-quiz","経済クイズ","Economics Quiz","game","quiz","Education","Economics Quiz ($3)",2,"経済に関するクイズ"));
apps.push(app("it-quiz","ITクイズ","IT Quiz","game","quiz","Education","IT Quiz ($3)",2,"IT・コンピュータに関するクイズ"));
apps.push(app("manner-quiz","マナークイズ","Manner Quiz","game","quiz","Education","マナークイズ ($3)",2,"ビジネス・一般マナーのクイズ"));
apps.push(app("weather-quiz","天気クイズ","Weather Quiz","game","quiz","Education","Weather Quiz ($2)",1,"天気・気象に関するクイズ"));
apps.push(app("plant-quiz","植物クイズ","Plant Quiz","game","quiz","Education","Plant Quiz ($2)",1,"植物に関するクイズ"));
apps.push(app("insect-quiz","昆虫クイズ","Insect Quiz","game","quiz","Education","Insect Quiz ($2)",1,"昆虫に関するクイズ"));
apps.push(app("bird-quiz","鳥クイズ","Bird Quiz","game","quiz","Education","Bird Quiz ($2)",1,"鳥に関するクイズ"));
apps.push(app("fish-quiz","魚クイズ","Fish Quiz","game","quiz","Education","Fish Quiz ($2)",1,"魚に関するクイズ"));
apps.push(app("kanji-reading-quiz","難読漢字クイズ","Difficult Kanji Quiz","game","quiz","Education","難読漢字 ($3)",2,"難読漢字の読みを当てるクイズ"));
apps.push(app("opposite-word-quiz","反対語クイズ","Antonym Quiz","game","quiz","Education","反対語 ($2)",1,"反対語（対義語）を当てるクイズ"));
apps.push(app("synonym-quiz","類義語クイズ","Synonym Quiz","game","quiz","Education","類義語 ($2)",1,"類義語を当てるクイズ"));
apps.push(app("onomatopoeia-quiz","オノマトペクイズ","Onomatopoeia Quiz","game","quiz","Education","オノマトペ ($2)",2,"オノマトペ（擬音語・擬態語）のクイズ"));
apps.push(app("keigo-quiz","敬語クイズ","Keigo Quiz","game","quiz","Education","敬語クイズ ($3)",2,"正しい敬語を選ぶクイズ"));
apps.push(app("general-knowledge-quiz","一般常識クイズ","General Knowledge Quiz","game","quiz","Education","常識クイズ ($3)",2,"一般常識・雑学クイズ"));
apps.push(app("spi-quiz","SPI対策クイズ","SPI Quiz","game","quiz","Education","SPI対策 ($5)",3,"就活SPI試験の対策クイズ"));
apps.push(app("driving-license-quiz","運転免許クイズ","Driving License Quiz","game","quiz","Education","運転免許 ($4)",2,"運転免許試験の対策クイズ"));
apps.push(app("iq-quiz","IQテスト","IQ Test","game","quiz","Education","IQ Test ($3)",2,"IQを測定するクイズ"));
apps.push(app("emoji-quiz","絵文字クイズ","Emoji Quiz","game","quiz","Entertainment","Emoji Quiz ($2)",1,"絵文字から答えを当てるクイズ"));
apps.push(app("true-false-quiz","○×クイズ","True or False Quiz","game","quiz","Entertainment","True or False ($2)",1,"○か×かで答える雑学クイズ"));
apps.push(app("speed-quiz","スピードクイズ","Speed Quiz","game","quiz","Entertainment","Speed Quiz ($3)",2,"制限時間内に答えるスピードクイズ"));
apps.push(app("chemistry-quiz","化学クイズ","Chemistry Quiz","game","quiz","Education","Chemistry Quiz ($3)",2,"化学・元素に関するクイズ"));
apps.push(app("physics-quiz","物理クイズ","Physics Quiz","game","quiz","Education","Physics Quiz ($3)",2,"物理に関するクイズ"));
apps.push(app("biology-quiz","生物クイズ","Biology Quiz","game","quiz","Education","Biology Quiz ($3)",2,"生物に関するクイズ"));
apps.push(app("world-landmark-quiz","世界遺産クイズ","World Landmark Quiz","game","quiz","Education","Landmark Quiz ($3)",2,"世界遺産・名所に関するクイズ"));
apps.push(app("japanese-food-quiz","和食クイズ","Japanese Food Quiz","game","quiz","Education","和食クイズ ($2)",2,"和食・日本料理に関するクイズ"));
apps.push(app("math-mental-quiz","暗算クイズ","Mental Math Quiz","game","quiz","Education","暗算トレーニング ($3)",2,"暗算力を鍛えるスピード計算クイズ"));
apps.push(app("vocabulary-level-quiz","語彙力テスト","Vocabulary Level Test","game","quiz","Education","語彙力 ($4)",2,"日本語の語彙力を測定するテスト"));
apps.push(app("common-sense-quiz","常識力テスト","Common Sense Test","game","quiz","Education","常識テスト ($3)",2,"社会人の常識力をテスト"));

// ===== PUZZLES (~30) =====
apps.push(app("sudoku-puzzle","数独","Sudoku","game","puzzle","Games","Sudoku Pro ($4)",3,"数独（ナンプレ）パズル"));
apps.push(app("crossword-puzzle","クロスワード","Crossword","game","puzzle","Games","Crossword Pro ($5)",4,"クロスワードパズル"));
apps.push(app("word-search-puzzle","ワードサーチ","Word Search","game","puzzle","Games","Word Search ($3)",3,"文字の中から単語を探すパズル"));
apps.push(app("math-puzzle","数学パズル","Math Puzzle","game","puzzle","Games","Math Puzzle ($3)",2,"数字を使ったロジックパズル"));
apps.push(app("logic-puzzle","ロジックパズル","Logic Puzzle","game","puzzle","Games","Logic Puzzles ($4)",3,"論理的に解くパズル"));
apps.push(app("sliding-puzzle","スライドパズル","Sliding Puzzle","game","puzzle","Games","Sliding Puzzle ($2)",2,"タイルをスライドして並べるパズル"));
apps.push(app("jigsaw-number-puzzle","ナンバーパズル","Number Jigsaw","game","puzzle","Games","Number Puzzle ($3)",2,"数字を使ったジグソーパズル"));
apps.push(app("kakuro-puzzle","カックロ","Kakuro","game","puzzle","Games","Kakuro Pro ($4)",3,"カックロ（加算クロス）パズル"));
apps.push(app("nonogram-puzzle","ノノグラム","Nonogram","game","puzzle","Games","Nonogram Pro ($4)",3,"ノノグラム（イラストロジック）パズル"));
apps.push(app("futoshiki-puzzle","不等号パズル","Futoshiki","game","puzzle","Games","Futoshiki ($3)",3,"不等号を使った数字パズル"));
apps.push(app("kenken-puzzle","賢賢パズル","KenKen","game","puzzle","Games","KenKen ($4)",3,"四則演算を使った数字パズル"));
apps.push(app("maze-puzzle","迷路","Maze Puzzle","game","puzzle","Games","Maze ($3)",2,"迷路を解くパズル"));
apps.push(app("tower-of-hanoi","ハノイの塔","Tower of Hanoi","game","puzzle","Games","Hanoi ($2)",2,"ハノイの塔パズル"));
apps.push(app("fifteen-puzzle","15パズル","15 Puzzle","game","puzzle","Games","15 Puzzle ($2)",2,"15パズル（数字並べ替え）"));
apps.push(app("minesweeper","マインスイーパー","Minesweeper","game","puzzle","Games","Minesweeper ($3)",3,"マインスイーパーゲーム"));
apps.push(app("lights-out-puzzle","ライツアウト","Lights Out","game","puzzle","Games","Lights Out ($2)",2,"全てのライトを消すパズル"));
apps.push(app("match-equation","マッチ棒パズル","Matchstick Puzzle","game","puzzle","Games","Match Puzzle ($2)",2,"マッチ棒を動かして等式を完成"));
apps.push(app("tangram-puzzle","タングラム","Tangram","game","puzzle","Games","Tangram ($3)",2,"図形を組み合わせるタングラムパズル"));
apps.push(app("river-crossing-puzzle","川渡りパズル","River Crossing","game","puzzle","Games","River Crossing ($2)",2,"川渡りのロジックパズル"));
apps.push(app("anagram-puzzle","アナグラム","Anagram","game","puzzle","Games","Anagram ($3)",2,"文字を並べ替えて単語を作るパズル"));
apps.push(app("word-chain-puzzle","しりとりパズル","Word Chain","game","puzzle","Games","しりとり ($2)",2,"しりとりパズル"));
apps.push(app("fill-in-puzzle","穴埋めパズル","Fill in Puzzle","game","puzzle","Games","Fill-Ins ($3)",2,"言葉の穴埋めパズル"));
apps.push(app("color-puzzle","色パズル","Color Puzzle","game","puzzle","Games","Color Puzzle ($2)",2,"色を使ったロジックパズル"));
apps.push(app("pattern-puzzle","パターンパズル","Pattern Puzzle","game","puzzle","Games","Pattern ($3)",2,"パターンの法則を見つけるパズル"));
apps.push(app("pipe-puzzle","パイプパズル","Pipe Puzzle","game","puzzle","Games","Pipe Puzzle ($3)",3,"パイプを繋げるパズル"));
apps.push(app("bridge-puzzle","橋パズル","Bridge Puzzle","game","puzzle","Games","Bridges ($3)",3,"島と島を橋で繋ぐパズル"));
apps.push(app("binary-puzzle","バイナリパズル","Binary Puzzle","game","puzzle","Games","Binary Puzzle ($3)",3,"0と1を配置するバイナリパズル"));
apps.push(app("domino-puzzle","ドミノパズル","Domino Puzzle","game","puzzle","Games","Domino Puzzle ($3)",2,"ドミノを使ったパズル"));
apps.push(app("shikaku-puzzle","四角に切れ","Shikaku Puzzle","game","puzzle","Games","Shikaku ($3)",3,"長方形に分割するパズル"));
apps.push(app("hidato-puzzle","ナンバーチェーン","Hidato","game","puzzle","Games","Hidato ($3)",3,"数字を連鎖させるパズル"));

// ===== MEMORY/BRAIN (~20) =====
apps.push(app("memory-match-game","神経衰弱","Memory Match","game","memory","Games","Memory Match ($3)",2,"カードの神経衰弱ゲーム"));
apps.push(app("sequence-memory","記憶力ゲーム","Sequence Memory","game","memory","Games","Memory Game ($3)",2,"光の順番を覚えるゲーム（サイモン型）"));
apps.push(app("speed-match","スピードマッチ","Speed Match","game","memory","Games","Lumosity ($12)",2,"前の図形と同じかを素早く判断"));
apps.push(app("number-memory","数字記憶","Number Memory","game","memory","Games","Brain Training ($5)",2,"表示された数字を記憶するゲーム"));
apps.push(app("color-memory","色記憶ゲーム","Color Memory","game","memory","Games","Brain Games ($4)",2,"色の順番を記憶するゲーム"));
apps.push(app("word-memory","単語記憶","Word Memory","game","memory","Games","Memory Training ($4)",2,"表示された単語を記憶するゲーム"));
apps.push(app("dual-n-back","デュアルNバック","Dual N-Back","game","memory","Games","Dual N-Back ($5)",3,"ワーキングメモリを鍛えるNバック課題"));
apps.push(app("mental-calculation","暗算トレーニング","Mental Calculation","game","memory","Education","暗算 ($3)",2,"暗算力を鍛えるトレーニング"));
apps.push(app("reaction-time","反射神経テスト","Reaction Time","game","memory","Games","Reaction Test ($2)",1,"反射神経の速さを測定"));
apps.push(app("stroop-test","ストループテスト","Stroop Test","game","memory","Games","Stroop Test ($2)",2,"ストループ効果で脳を鍛える"));
apps.push(app("visual-memory","ビジュアルメモリ","Visual Memory","game","memory","Games","Brain Training ($5)",2,"画面上の位置を記憶するゲーム"));
apps.push(app("face-memory","顔記憶ゲーム","Face Memory","game","memory","Games","Face Memory ($3)",2,"顔の特徴を記憶するゲーム"));
apps.push(app("soroban-training","そろばんトレーニング","Soroban Training","game","memory","Education","そろばん ($4)",3,"そろばんの暗算トレーニング"));
apps.push(app("focus-training","集中力トレーニング","Focus Training","game","memory","Games","Focus ($4)",2,"集中力を鍛えるゲーム"));
apps.push(app("pattern-recognition","パターン認識","Pattern Recognition","game","memory","Games","Brain Train ($4)",2,"パターンを素早く認識するゲーム"));
apps.push(app("spatial-memory","空間記憶","Spatial Memory","game","memory","Games","Spatial ($3)",2,"空間的な位置を記憶するゲーム"));
apps.push(app("calculation-speed","計算スピード","Calculation Speed","game","memory","Education","Calc Speed ($3)",2,"計算の速さを競うゲーム"));
apps.push(app("brain-age-test","脳年齢テスト","Brain Age Test","game","memory","Games","Brain Age ($5)",3,"脳年齢を測定するテスト"));
apps.push(app("attention-training","注意力トレーニング","Attention Training","game","memory","Games","Attention ($3)",2,"注意力を鍛えるゲーム"));
apps.push(app("typing-speed","タイピング速度","Typing Speed","game","memory","Games","Typing ($3)",2,"フリック入力の速度を測定"));

// ===== FORTUNE/HOROSCOPE (~20) =====
apps.push(app("daily-fortune","今日の運勢","Daily Fortune","lifestyle","fortune","Entertainment","占い ($4)",1,"毎日の運勢を表示"));
apps.push(app("omikuji","おみくじ","Omikuji","lifestyle","fortune","Entertainment","おみくじ ($2)",1,"デジタルおみくじを引く"));
apps.push(app("blood-type-fortune","血液型占い","Blood Type Fortune","lifestyle","fortune","Entertainment","血液型占い ($2)",1,"血液型で今日の運勢を占う"));
apps.push(app("zodiac-fortune","星座占い","Zodiac Fortune","lifestyle","fortune","Entertainment","星座占い ($3)",2,"12星座の今日の運勢"));
apps.push(app("seimei-handan","姓名判断","Seimei Handan","lifestyle","fortune","Entertainment","姓名判断 ($5)",3,"名前の画数から運勢を判断"));
apps.push(app("kusei-kigaku","九星気学","Kusei Kigaku","lifestyle","fortune","Entertainment","九星気学 ($4)",2,"九星気学で運勢を占う"));
apps.push(app("fusui-fortune","風水占い","Feng Shui Fortune","lifestyle","fortune","Entertainment","風水 ($4)",2,"風水で方角・色の運勢を占う"));
apps.push(app("tarot-fortune","タロット占い","Tarot Reading","lifestyle","fortune","Entertainment","Tarot ($5)",3,"タロットカードで運勢を占う"));
apps.push(app("love-fortune","恋愛占い","Love Fortune","lifestyle","fortune","Entertainment","恋愛占い ($3)",2,"恋愛運を占う"));
apps.push(app("compatibility-fortune","相性占い","Compatibility Fortune","lifestyle","fortune","Entertainment","相性占い ($3)",2,"二人の相性を占う"));
apps.push(app("birthday-fortune","誕生日占い","Birthday Fortune","lifestyle","fortune","Entertainment","誕生日占い ($3)",2,"誕生日から性格・運勢を占う"));
apps.push(app("numerology-fortune","数秘術","Numerology","lifestyle","fortune","Entertainment","Numerology ($4)",2,"数秘術で運命の数字を占う"));
apps.push(app("palm-reading","手相占い","Palm Reading Guide","lifestyle","fortune","Entertainment","手相占い ($4)",2,"手相の見方と運勢のガイド"));
apps.push(app("dream-fortune","夢占い","Dream Fortune","lifestyle","fortune","Entertainment","夢占い ($3)",2,"夢の内容から運勢を占う"));
apps.push(app("color-fortune","カラー占い","Color Fortune","lifestyle","fortune","Entertainment","Color Fortune ($2)",1,"好きな色から運勢を占う"));
apps.push(app("animal-fortune","動物占い","Animal Fortune","lifestyle","fortune","Entertainment","動物占い ($3)",2,"生年月日から動物キャラクターで性格診断"));
apps.push(app("rokusei-fortune","六星占術","Rokusei Fortune","lifestyle","fortune","Entertainment","六星占術 ($4)",2,"六星占術で運勢を占う"));
apps.push(app("i-ching-fortune","易占い","I Ching Fortune","lifestyle","fortune","Entertainment","易経 ($4)",3,"易経に基づいた占い"));
apps.push(app("fortune-cookie","フォーチュンクッキー","Fortune Cookie","lifestyle","fortune","Entertainment","Fortune Cookie ($2)",1,"フォーチュンクッキーのメッセージを表示"));
apps.push(app("yes-no-fortune","Yes No占い","Yes No Oracle","lifestyle","fortune","Entertainment","Yes No Oracle ($2)",1,"質問にYes/Noで答える占い"));

// ===== GENERATORS (~20) =====
apps.push(app("password-generator","パスワード生成","Password Generator","utility","generator","Utility","Password Gen ($3)",2,"安全なパスワードを自動生成"));
apps.push(app("random-number-generator","乱数生成","Random Number Generator","utility","generator","Utility","Random Number ($2)",1,"指定範囲の乱数を生成"));
apps.push(app("dice-roller","サイコロ","Dice Roller","utility","generator","Utility","Dice ($2)",1,"サイコロを振る（1個〜複数個）"));
apps.push(app("coin-flip","コイントス","Coin Flip","utility","generator","Utility","Coin Flip ($1)",1,"コインを投げて表裏を決定"));
apps.push(app("lottery-generator","ロト番号生成","Lottery Number Generator","utility","generator","Utility","Lotto Gen ($2)",1,"ロト6・ロト7の番号を自動生成"));
apps.push(app("team-generator","チーム分け","Team Generator","utility","generator","Utility","Team Maker ($3)",2,"メンバーをランダムにチーム分け"));
apps.push(app("name-generator","名前生成","Name Generator","utility","generator","Utility","Name Generator ($3)",2,"ランダムに名前を生成"));
apps.push(app("baby-name-generator","赤ちゃん名前候補","Baby Name Generator","utility","generator","Lifestyle","Baby Names ($4)",2,"赤ちゃんの名前候補を生成"));
apps.push(app("color-generator","ランダムカラー","Random Color Generator","utility","generator","Utility","Color Generator ($2)",1,"ランダムに色を生成"));
apps.push(app("nickname-generator","ニックネーム生成","Nickname Generator","utility","generator","Utility","Nickname Gen ($2)",1,"ランダムにニックネームを生成"));
apps.push(app("excuse-generator","言い訳生成","Excuse Generator","utility","generator","Entertainment","Excuse Gen ($2)",1,"ランダムに面白い言い訳を生成"));
apps.push(app("compliment-generator","褒め言葉生成","Compliment Generator","utility","generator","Entertainment","Compliment ($2)",1,"ランダムに褒め言葉を生成"));
apps.push(app("quote-generator","名言生成","Quote Generator","utility","generator","Entertainment","Quotes ($3)",1,"ランダムに名言・格言を表示"));
apps.push(app("menu-generator","献立生成","Menu Generator","utility","generator","Food & Drink","Menu Planner ($4)",2,"ランダムに今日の献立を提案"));
apps.push(app("workout-generator","筋トレメニュー生成","Workout Generator","utility","generator","Health & Fitness","Workout Gen ($4)",2,"ランダムにトレーニングメニューを生成"));
apps.push(app("roulette-generator","ルーレット","Roulette Wheel","utility","generator","Utility","Roulette ($2)",2,"選択肢をルーレットで決定"));
apps.push(app("bingo-generator","ビンゴ","Bingo Generator","utility","generator","Entertainment","Bingo ($3)",2,"ビンゴの番号を生成・カード作成"));
apps.push(app("janken-game","じゃんけん","Rock Paper Scissors","utility","generator","Entertainment","Janken ($1)",1,"じゃんけんゲーム"));
apps.push(app("amida-generator","あみだくじ","Amida Lottery","utility","generator","Utility","あみだくじ ($2)",2,"あみだくじを作成・実行"));
apps.push(app("uuid-generator","UUID生成","UUID Generator","utility","generator","Utility","UUID Generator ($2)",1,"UUID/GUIDを自動生成"));

// Verify count
console.log(`Total apps: ${apps.length}`);

fs.writeFileSync(
  'C:/Users/ytata/AppProject/baseProject/apps-master-list.json',
  JSON.stringify(apps, null, 2),
  'utf-8'
);

console.log('File written successfully.');

// Print distribution
const dist = {};
apps.forEach(a => {
  dist[a.subTemplate] = (dist[a.subTemplate] || 0) + 1;
});
console.log('\nDistribution by subTemplate:');
Object.entries(dist).sort((a,b) => b[1] - a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

const themeDist = {};
apps.forEach(a => {
  themeDist[a.theme] = (themeDist[a.theme] || 0) + 1;
});
console.log('\nDistribution by theme:');
Object.entries(themeDist).sort((a,b) => b[1] - a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
