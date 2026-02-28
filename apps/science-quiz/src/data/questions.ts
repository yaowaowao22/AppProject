export interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  subject: string;
  explanation: string;
}

// ============================================================
// 物理 (Physics) - 32 questions
// ============================================================
const physicsQuestions: Question[] = [
  // ----- 力学 (Mechanics) -----
  {
    question: '物体に力がはたらかないとき、物体はどのような運動をするか？',
    options: ['等速直線運動', '等加速度運動', '円運動', '振動運動'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      'ニュートンの第一法則（慣性の法則）により、力がはたらかない物体は静止し続けるか、等速直線運動を続けます。',
  },
  {
    question: '重力加速度の大きさは地球上で約何m/s²か？',
    options: ['9.8', '8.9', '10.5', '7.8'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '地球の表面における重力加速度は約9.8m/s²です。計算では約10m/s²として扱うこともあります。',
  },
  {
    question: '力の単位「ニュートン（N）」はどの物理学者にちなんでいるか？',
    options: [
      'アイザック・ニュートン',
      'アルバート・アインシュタイン',
      'ガリレオ・ガリレイ',
      'ロバート・フック',
    ],
    correctIndex: 0,
    subject: '物理',
    explanation:
      'ニュートン（N）は万有引力の法則や運動の法則を発見したアイザック・ニュートンにちなんだ力の単位です。',
  },
  {
    question: '質量2kgの物体に10Nの力を加えたとき、加速度は何m/s²か？',
    options: ['5', '10', '20', '2'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      'ニュートンの第二法則 F=ma より、a=F/m=10/2=5m/s² となります。',
  },
  {
    question: '作用・反作用の法則はニュートンの第何法則か？',
    options: ['第三法則', '第一法則', '第二法則', '第四法則'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '作用・反作用の法則はニュートンの第三法則です。「すべての作用には等しく反対向きの反作用がある」というものです。',
  },
  {
    question: 'ばねの伸びは加えた力に比例する。この法則を何というか？',
    options: ['フックの法則', 'オームの法則', 'ボイルの法則', 'シャルルの法則'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      'フックの法則は「ばねの伸び（変形量）は加えた力に比例する」という法則で、F=kx で表されます。',
  },
  // ----- 電気 (Electricity) -----
  {
    question: '電流の単位は何か？',
    options: ['アンペア（A）', 'ボルト（V）', 'オーム（Ω）', 'ワット（W）'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '電流の単位はアンペア（A）です。ボルトは電圧、オームは電気抵抗、ワットは電力の単位です。',
  },
  {
    question: '電圧＝電流×抵抗の関係を何の法則というか？',
    options: ['オームの法則', 'フックの法則', 'クーロンの法則', 'アンペールの法則'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      'オームの法則は V=IR で表され、電圧（V）、電流（I）、抵抗（R）の関係を示す基本法則です。',
  },
  {
    question: '直列回路で各抵抗に流れる電流はどうなるか？',
    options: ['すべて等しい', 'それぞれ異なる', '抵抗値に比例する', 'ゼロになる'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '直列回路では回路全体を同じ電流が流れるため、各抵抗に流れる電流はすべて等しくなります。',
  },
  {
    question: '静電気が起きるのは、何が移動するためか？',
    options: ['電子', '陽子', '中性子', '原子核'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '静電気は、物体をこすったときに電子が一方の物体からもう一方に移動することで生じます。',
  },
  {
    question: '電力の単位ワット（W）は何と何の積か？',
    options: ['電圧と電流', '電流と抵抗', '電圧と抵抗', '電流と時間'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '電力 P=VI で、電圧（V）と電流（I）の積で計算されます。単位はワット（W）です。',
  },
  // ----- 光 (Light) -----
  {
    question: '光の速さは秒速約何kmか？',
    options: ['約30万km', '約3万km', '約300万km', '約3000km'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '光の速さは真空中で秒速約30万km（正確には299,792km/s）です。宇宙で最も速い速度です。',
  },
  {
    question: '白色光をプリズムに通すと何が観察されるか？',
    options: ['虹色のスペクトル', '白い光のまま', '黒い影', '赤い光だけ'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '白色光はさまざまな波長の光が混ざっており、プリズムで屈折率の違いにより虹色のスペクトルに分かれます。',
  },
  {
    question: '光が鏡に当たって跳ね返ることを何というか？',
    options: ['反射', '屈折', '回折', '干渉'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '光が物体の表面で跳ね返る現象を反射といいます。入射角と反射角は等しくなります。',
  },
  {
    question: '光が水中からガラスに入るとき、進む方向が変わる現象を何というか？',
    options: ['屈折', '反射', '散乱', '偏光'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '光が異なる物質の境界面で進む方向が変わる現象を屈折といいます。これはスネルの法則に従います。',
  },
  // ----- 音 (Sound) -----
  {
    question: '音は真空中を伝わることができるか？',
    options: ['伝わらない', '伝わる', '光より速く伝わる', '逆方向に伝わる'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '音は空気などの媒質の振動で伝わるため、媒質のない真空中では伝わりません。',
  },
  {
    question: '空気中での音の速さは約何m/sか？',
    options: ['約340m/s', '約170m/s', '約680m/s', '約1000m/s'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '空気中の音速は約340m/s（15℃のとき）です。温度が高くなると音速も速くなります。',
  },
  {
    question: '音の高さは何によって決まるか？',
    options: ['振動数（周波数）', '振幅', '波長', '速さ'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '音の高さは振動数（周波数）で決まり、振動数が大きいほど高い音になります。単位はHz（ヘルツ）です。',
  },
  {
    question: '音の大きさは何によって決まるか？',
    options: ['振幅', '振動数', '波長', '速さ'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '音の大きさ（音量）は振幅によって決まります。振幅が大きいほど大きな音になります。',
  },
  // ----- 熱 (Heat) -----
  {
    question: '水が沸騰する温度（標準気圧）は何℃か？',
    options: ['100℃', '90℃', '110℃', '80℃'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '標準気圧（1気圧＝1013hPa）のもとで、水の沸点は100℃です。気圧が変わると沸点も変化します。',
  },
  {
    question: '絶対零度は何℃か？',
    options: ['-273℃', '-100℃', '0℃', '-460℃'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '絶対零度は-273.15℃（0K）で、理論上の最低温度です。分子の運動がほぼ止まる状態です。',
  },
  {
    question: '熱の伝わり方のうち、物質の移動を伴うものはどれか？',
    options: ['対流', '伝導', '放射', '蒸発'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '対流は、液体や気体が温められて移動することで熱が伝わる現象です。伝導は物質内部を、放射は電磁波で伝わります。',
  },
  {
    question: '氷が水になるときの状態変化を何というか？',
    options: ['融解', '蒸発', '凝固', '昇華'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '固体が液体に変化することを融解といいます。逆の変化（液体→固体）は凝固です。',
  },
  {
    question: 'セルシウス温度（℃）と絶対温度（K）の関係式で正しいのはどれか？',
    options: ['K = ℃ + 273', 'K = ℃ - 273', 'K = ℃ × 2', 'K = ℃ / 273'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '絶対温度（K）= セルシウス温度（℃）+ 273 です。例えば0℃は273K、100℃は373Kとなります。',
  },
  // ----- 追加の物理問題 -----
  {
    question: '地球上で物体が自由落下するとき、落下距離は時間の何乗に比例するか？',
    options: ['2乗', '1乗', '3乗', '1/2乗'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '自由落下の公式 h=½gt² より、落下距離は時間の2乗に比例します。',
  },
  {
    question: 'てこの原理で、支点から力点までの距離が長いほど、必要な力はどうなるか？',
    options: ['小さくなる', '大きくなる', '変わらない', '距離に関係ない'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      'てこの原理により、支点から力点までの距離が長いほど小さな力で物体を動かせます。',
  },
  {
    question: '凸レンズで焦点より内側に物体を置くと、どのような像ができるか？',
    options: ['正立の虚像', '倒立の実像', '等倍の実像', '像はできない'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '凸レンズの焦点より内側に物体を置くと、レンズを通して見たときに正立の虚像（拡大された像）が見えます。',
  },
  {
    question: '磁石のN極とS極を近づけるとどうなるか？',
    options: ['引き合う', '反発する', '何も起きない', '磁力が消える'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '磁石の異なる極（N極とS極）は引き合い、同じ極（N極同士・S極同士）は反発します。',
  },
  {
    question: '電磁誘導を発見した科学者は誰か？',
    options: ['ファラデー', 'マクスウェル', 'アンペール', 'ヘルツ'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      'マイケル・ファラデーは1831年に電磁誘導を発見し、磁場の変化が電流を生むことを示しました。',
  },
  {
    question: '並列回路の合成抵抗は、各抵抗の値と比べてどうなるか？',
    options: ['小さくなる', '大きくなる', '変わらない', '合計と等しい'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '並列回路の合成抵抗は各抵抗の値よりも小さくなります。電流の通り道が増えるためです。',
  },
  {
    question: '波の振動数が2倍になると、波長はどうなるか？（速さ一定の場合）',
    options: ['半分になる', '2倍になる', '変わらない', '4倍になる'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '波の速さ v=fλ より、速さが一定の場合、振動数fが2倍になると波長λは半分になります。',
  },
  {
    question: '仕事の単位ジュール（J）はどのように定義されるか？',
    options: ['1Nの力で1m動かす仕事', '1kgを1m持ち上げる仕事', '1Wを1秒使うエネルギー', '1calの熱量'],
    correctIndex: 0,
    subject: '物理',
    explanation:
      '1ジュールは1ニュートンの力で物体を力の方向に1メートル動かしたときの仕事です（1J=1N・m）。',
  },
];

// ============================================================
// 化学 (Chemistry) - 32 questions
// ============================================================
const chemistryQuestions: Question[] = [
  // ----- 元素 (Elements) -----
  {
    question: '水の化学式は何か？',
    options: ['H₂O', 'CO₂', 'NaCl', 'O₂'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '水の化学式はH₂Oで、水素原子2つと酸素原子1つから構成されています。',
  },
  {
    question: '元素記号「Fe」は何の元素を表すか？',
    options: ['鉄', '金', '銅', '銀'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      'Feはラテン語のFerrum（鉄）に由来する元素記号です。鉄は原子番号26の金属元素です。',
  },
  {
    question: '空気中に最も多く含まれる気体は何か？',
    options: ['窒素', '酸素', '二酸化炭素', 'アルゴン'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '空気の約78%は窒素（N₂）で構成されています。酸素は約21%です。',
  },
  {
    question: '元素記号「Au」は何の元素を表すか？',
    options: ['金', '銀', '銅', 'アルミニウム'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      'Auはラテン語のAurum（金）に由来する元素記号です。金は原子番号79の貴金属です。',
  },
  {
    question: '原子番号1の元素は何か？',
    options: ['水素', 'ヘリウム', 'リチウム', '酸素'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '原子番号1は水素（H）です。最も軽い元素で、宇宙で最も多く存在する元素です。',
  },
  {
    question: '常温で液体の金属はどれか？',
    options: ['水銀', '鉄', '銅', 'アルミニウム'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '水銀（Hg）は常温で液体の唯一の金属元素です。融点は-38.83℃です。',
  },
  // ----- 化合物 (Compounds) -----
  {
    question: '二酸化炭素の化学式は何か？',
    options: ['CO₂', 'CO', 'H₂O', 'NO₂'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '二酸化炭素の化学式はCO₂で、炭素原子1つと酸素原子2つから構成されています。',
  },
  {
    question: '食塩の化学式は何か？',
    options: ['NaCl', 'KCl', 'CaCl₂', 'MgCl₂'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '食塩（塩化ナトリウム）の化学式はNaClで、ナトリウムと塩素のイオン結合でできています。',
  },
  {
    question: '炭酸水素ナトリウムの別名はどれか？',
    options: ['重曹', '食塩', '石灰', 'ミョウバン'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '炭酸水素ナトリウム（NaHCO₃）は一般に「重曹」として知られ、料理や掃除に使われます。',
  },
  {
    question: '鉄が空気中の酸素と水分で酸化される現象を何というか？',
    options: ['さび（腐食）', '燃焼', '発酵', '中和'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '鉄が空気中の酸素と水分と反応してできる酸化鉄がさび（錆）です。これは腐食の一種です。',
  },
  // ----- 反応 (Reactions) -----
  {
    question: '物質が酸素と結びつく反応を何というか？',
    options: ['酸化', '還元', '中和', '分解'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '物質が酸素と結びつく反応を酸化といいます。逆に酸素を失う反応を還元といいます。',
  },
  {
    question: '水を電気分解すると何が発生するか？',
    options: ['水素と酸素', '窒素と酸素', '水素と窒素', '二酸化炭素と水素'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '水を電気分解すると、陰極から水素（H₂）、陽極から酸素（O₂）が発生します。体積比は2:1です。',
  },
  {
    question: '化学反応の前後で物質の総質量はどうなるか？',
    options: ['変化しない', '増加する', '減少する', '反応によって異なる'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '質量保存の法則により、化学反応の前後で物質の総質量は変化しません。ラボアジエが発見しました。',
  },
  {
    question: '触媒の特徴として正しいのはどれか？',
    options: [
      '反応速度を変えるが自身は変化しない',
      '反応で消費される',
      '必ず反応を遅くする',
      '温度に関係なく作用する',
    ],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '触媒は化学反応の速度を変える物質で、反応の前後で自身は変化しません（消費されません）。',
  },
  // ----- 酸・塩基 (Acids & Bases) -----
  {
    question: '酸性の水溶液に青色リトマス紙を入れると何色に変わるか？',
    options: ['赤色', '青色のまま', '黄色', '緑色'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '酸性の水溶液は青色リトマス紙を赤色に変えます。逆にアルカリ性は赤色リトマス紙を青色に変えます。',
  },
  {
    question: 'pH7は何性を示すか？',
    options: ['中性', '酸性', 'アルカリ性', '弱酸性'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      'pH7は中性です。pH7未満が酸性、pH7を超えるとアルカリ性（塩基性）になります。',
  },
  {
    question: '酸とアルカリが反応して塩と水ができる反応を何というか？',
    options: ['中和反応', '酸化反応', '還元反応', '分解反応'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '酸とアルカリ（塩基）が反応して塩と水を生成する反応を中和反応といいます。',
  },
  {
    question: 'レモン汁のpHはおよそいくつか？',
    options: ['約2', '約7', '約10', '約14'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      'レモン汁はクエン酸を含む強い酸性の液体で、pHは約2です。',
  },
  // ----- 周期表 (Periodic Table) -----
  {
    question: '周期表を考案した科学者は誰か？',
    options: ['メンデレーエフ', 'ドルトン', 'アボガドロ', 'ラボアジエ'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      'ドミトリ・メンデレーエフは1869年に元素の周期表を考案し、未発見の元素の存在を予測しました。',
  },
  {
    question: '周期表の第18族元素（貴ガス）の特徴はどれか？',
    options: [
      '化学的に安定で反応しにくい',
      '非常に反応しやすい',
      '常温で液体である',
      'すべて放射性である',
    ],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '第18族の貴ガス（ヘリウム、ネオンなど）は最外殻電子が満たされており、化学的に非常に安定です。',
  },
  {
    question: '周期表で同じ族に属する元素の共通点はどれか？',
    options: [
      '化学的性質が似ている',
      '原子量が同じ',
      '色が同じ',
      '融点が同じ',
    ],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '同じ族の元素は最外殻電子数が同じため、化学的性質が似ています。例えばアルカリ金属は全て水と激しく反応します。',
  },
  // ----- 追加の化学問題 -----
  {
    question: 'ダイヤモンドと鉛筆の芯（黒鉛）の共通点はどれか？',
    options: [
      'どちらも炭素からできている',
      'どちらも金属である',
      'どちらも同じ硬さ',
      'どちらも電気を通さない',
    ],
    correctIndex: 0,
    subject: '化学',
    explanation:
      'ダイヤモンドと黒鉛はどちらも炭素（C）の同素体です。結晶構造の違いにより性質が大きく異なります。',
  },
  {
    question: '酸素の元素記号はどれか？',
    options: ['O', 'Ox', 'Os', 'Og'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '酸素の元素記号はOです。Osはオスミウム、Ogはオガネソンの元素記号です。',
  },
  {
    question: '塩酸の化学式はどれか？',
    options: ['HCl', 'H₂SO₄', 'HNO₃', 'H₃PO₄'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '塩酸の化学式はHCl（塩化水素の水溶液）です。H₂SO₄は硫酸、HNO₃は硝酸です。',
  },
  {
    question: 'ドライアイスは何の固体か？',
    options: ['二酸化炭素', '窒素', '酸素', '水蒸気'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      'ドライアイスは二酸化炭素（CO₂）の固体で、-78.5℃以下で固体になります。常圧では液体にならず昇華します。',
  },
  {
    question: '原子の中心にあるものは何か？',
    options: ['原子核', '電子', '中性子だけ', '陽子だけ'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '原子の中心には原子核があり、原子核は陽子と中性子からなります。電子は原子核の周りを回っています。',
  },
  {
    question: 'アボガドロ数はおよそいくつか？',
    options: ['6.0×10²³', '6.0×10²⁰', '3.0×10²³', '1.0×10²³'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      'アボガドロ数は約6.02×10²³で、1molの物質に含まれる粒子の数を表します。',
  },
  {
    question: '水溶液中で電流を通す物質を何というか？',
    options: ['電解質', '非電解質', '有機物', '触媒'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '水に溶かすとイオンに分かれ、電流を通す物質を電解質といいます。食塩や塩酸は電解質です。',
  },
  {
    question: '化学変化で熱を放出する反応を何というか？',
    options: ['発熱反応', '吸熱反応', '中和反応', '分解反応'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '化学変化で周囲に熱を放出する反応を発熱反応といいます。燃焼や中和反応は代表的な発熱反応です。',
  },
  {
    question: '有機物に共通して含まれる元素はどれか？',
    options: ['炭素', '鉄', 'ナトリウム', 'カルシウム'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '有機物は炭素（C）を基本骨格とする化合物です。砂糖、エタノール、プラスチックなどが有機物です。',
  },
  {
    question: '化学結合のうち、電子を共有する結合を何というか？',
    options: ['共有結合', 'イオン結合', '金属結合', '水素結合'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '2つの原子が電子対を共有してできる結合を共有結合といいます。水分子のO-H結合が代表例です。',
  },
  {
    question: '同じ元素でも中性子の数が異なるものを何というか？',
    options: ['同位体（アイソトープ）', '同素体', '異性体', '化合物'],
    correctIndex: 0,
    subject: '化学',
    explanation:
      '同じ元素で陽子数は同じだが中性子数が異なるものを同位体（アイソトープ）といいます。',
  },
];

// ============================================================
// 生物 (Biology) - 32 questions
// ============================================================
const biologyQuestions: Question[] = [
  // ----- 細胞 (Cells) -----
  {
    question: '細胞の中で遺伝情報を含む構造は何か？',
    options: ['核', 'ミトコンドリア', 'リボソーム', '細胞膜'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      '細胞の核にはDNA（遺伝情報）が含まれています。核は細胞の制御中枢です。',
  },
  {
    question: '植物細胞にあって動物細胞にない構造はどれか？',
    options: ['細胞壁', 'ミトコンドリア', 'リボソーム', '核'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      '細胞壁は植物細胞の外側を覆う丈夫な構造で、細胞を保護し形を維持します。動物細胞にはありません。',
  },
  {
    question: '細胞内でエネルギー（ATP）を生成する器官は何か？',
    options: ['ミトコンドリア', 'リボソーム', 'ゴルジ体', '小胞体'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      'ミトコンドリアは「細胞のエネルギー工場」と呼ばれ、酸素を使ってATP（アデノシン三リン酸）を生成します。',
  },
  {
    question: '植物の緑色の色素を何というか？',
    options: ['クロロフィル（葉緑素）', 'メラニン', 'カロテン', 'ヘモグロビン'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      'クロロフィル（葉緑素）は葉緑体に含まれる緑色の色素で、光合成で光エネルギーを吸収します。',
  },
  {
    question: '細胞分裂の際にDNAが複製される過程を何というか？',
    options: ['DNA複製', '転写', '翻訳', '変異'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      '細胞分裂の前にDNAは正確にコピー（複製）されます。二重らせんがほどけ、それぞれの鎖を鋳型に新しい鎖が合成されます。',
  },
  {
    question: '体細胞分裂で染色体数はどうなるか？',
    options: ['変わらない', '半分になる', '2倍になる', '3倍になる'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      '体細胞分裂では染色体数は変わらず、元の細胞と同じ染色体数の細胞が2つできます。',
  },
  // ----- 遺伝 (Genetics) -----
  {
    question: 'DNAの二重らせん構造を発見したのは誰か？',
    options: [
      'ワトソンとクリック',
      'メンデル',
      'ダーウィン',
      'パスツール',
    ],
    correctIndex: 0,
    subject: '生物',
    explanation:
      'ジェームズ・ワトソンとフランシス・クリックが1953年にDNAの二重らせん構造を発表しました。',
  },
  {
    question: 'DNAの塩基のうち、アデニン（A）と対をなすのはどれか？',
    options: ['チミン（T）', 'グアニン（G）', 'シトシン（C）', 'ウラシル（U）'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      'DNAではアデニン（A）はチミン（T）と、グアニン（G）はシトシン（C）と塩基対を形成します。',
  },
  {
    question: 'メンデルの法則を発見するために使われた生物は何か？',
    options: ['エンドウ', 'ショウジョウバエ', 'マウス', 'イヌ'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      'グレゴール・メンデルはエンドウの交配実験から遺伝の法則（優性の法則、分離の法則、独立の法則）を発見しました。',
  },
  {
    question: 'ヒトの体細胞に含まれる染色体の数は何本か？',
    options: ['46本', '23本', '48本', '44本'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      'ヒトの体細胞には46本（23対）の染色体があります。生殖細胞（精子・卵子）は23本です。',
  },
  {
    question: '遺伝子の本体となる物質は何か？',
    options: ['DNA', 'タンパク質', '脂質', '糖質'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      '遺伝子の本体はDNA（デオキシリボ核酸）です。DNAの塩基配列がタンパク質の設計図となっています。',
  },
  // ----- 進化 (Evolution) -----
  {
    question: '「種の起源」を著した科学者は誰か？',
    options: ['ダーウィン', 'メンデル', 'ラマルク', 'リンネ'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      'チャールズ・ダーウィンは1859年に「種の起源」を発表し、自然選択による進化の理論を示しました。',
  },
  {
    question: '生物の進化の主な原動力となるのはどれか？',
    options: ['自然選択', '人工選択', '突然変異のみ', '環境汚染'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      '自然選択（自然淘汰）は、環境に適した個体が生き残り子孫を残すことで進化が進む仕組みです。',
  },
  {
    question: '異なる生物が似た環境に適応して似た形態になることを何というか？',
    options: ['収束進化', '共進化', '適応放散', '退化'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      '収束進化とは、系統的に遠い生物が似た環境に適応して似た形態を持つようになる現象です。イルカとサメの体形が例です。',
  },
  // ----- 人体 (Human Body) -----
  {
    question: '人体で最も大きい臓器はどれか？',
    options: ['肝臓', '心臓', '脳', '腎臓'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      '肝臓は人体最大の臓器で、成人で約1.2〜1.5kgあります。解毒、胆汁生成、栄養素の代謝など500以上の機能を持ちます。',
  },
  {
    question: '血液中で酸素を運搬する成分は何か？',
    options: ['赤血球（ヘモグロビン）', '白血球', '血小板', '血漿'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      '赤血球に含まれるヘモグロビンが酸素と結合して全身に酸素を運搬します。',
  },
  {
    question: '食物の消化で最初にはたらく消化酵素はどれか？',
    options: ['アミラーゼ（唾液）', 'ペプシン（胃液）', 'リパーゼ', 'トリプシン'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      'アミラーゼは唾液に含まれ、口の中でデンプンを分解する最初の消化酵素です。',
  },
  {
    question: '心臓の部屋はいくつあるか？',
    options: ['4つ', '2つ', '3つ', '6つ'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      'ヒトの心臓は右心房・右心室・左心房・左心室の4つの部屋からなっています。',
  },
  {
    question: '人体の骨の総数はおよそいくつか？',
    options: ['約206本', '約100本', '約300本', '約350本'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      '成人の骨の数は約206本です。赤ちゃんは約300本ですが、成長とともに融合して減少します。',
  },
  {
    question: '体内で細菌やウイルスと戦う血液成分はどれか？',
    options: ['白血球', '赤血球', '血小板', '血漿'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      '白血球は免疫機能を担い、体内に侵入した細菌やウイルスなどの病原体と戦います。',
  },
  // ----- 生態系 (Ecosystem) -----
  {
    question: '食物連鎖の最下層に位置する生物は通常何か？',
    options: ['植物（生産者）', '草食動物', '肉食動物', '分解者'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      '食物連鎖の最下層には光合成で有機物を作る植物（生産者）がいます。そこからエネルギーが上位に伝わります。',
  },
  {
    question: '生態系で枯れ葉や動物の死骸を分解する生物を何というか？',
    options: ['分解者', '生産者', '消費者', '捕食者'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      '分解者（菌類や細菌など）は有機物を無機物に分解し、栄養素を土に戻す重要な役割を担っています。',
  },
  {
    question: '光合成で植物が吸収するのは何か？',
    options: ['二酸化炭素と水', '酸素と水', '窒素と水', '二酸化炭素と酸素'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      '光合成では二酸化炭素と水を吸収し、光エネルギーを使ってブドウ糖と酸素を生成します。',
  },
  {
    question: '生物の多様性が最も高い生態系はどれか？',
    options: ['熱帯雨林', '砂漠', 'ツンドラ', '温帯草原'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      '熱帯雨林は地球上で最も生物多様性が高い生態系で、全生物種の半数以上が生息するとされています。',
  },
  // ----- 追加の生物問題 -----
  {
    question: '光合成が行われる細胞小器官は何か？',
    options: ['葉緑体', 'ミトコンドリア', 'リボソーム', '核'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      '葉緑体は植物細胞に含まれる細胞小器官で、光エネルギーを化学エネルギーに変換する光合成の場です。',
  },
  {
    question: '減数分裂で染色体数はどうなるか？',
    options: ['半分になる', '変わらない', '2倍になる', '4倍になる'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      '減数分裂では染色体数が半分になります。これにより生殖細胞（精子・卵子）が作られます。',
  },
  {
    question: 'インスリンを分泌する臓器はどれか？',
    options: ['膵臓', '肝臓', '腎臓', '脾臓'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      'インスリンは膵臓のランゲルハンス島β細胞から分泌されるホルモンで、血糖値を下げる働きがあります。',
  },
  {
    question: '呼吸で体内に取り込む気体は何か？',
    options: ['酸素', '二酸化炭素', '窒素', '水素'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      '呼吸では酸素を取り込み、細胞内でエネルギーを生成した後に二酸化炭素を排出します。',
  },
  {
    question: '両生類の代表的な動物はどれか？',
    options: ['カエル', 'トカゲ', 'ヘビ', 'カメ'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      'カエルは両生類の代表で、幼生（おたまじゃくし）はえら呼吸、成体は肺呼吸と皮膚呼吸を行います。',
  },
  {
    question: '哺乳類の特徴として正しいのはどれか？',
    options: ['母乳で子を育てる', '卵で繁殖する', '変温動物である', 'えら呼吸をする'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      '哺乳類は母乳で子を育てること、恒温動物であること、体毛があることなどが主な特徴です。',
  },
  {
    question: '植物の根から水を吸い上げる力の主な要因は何か？',
    options: ['蒸散作用', '光合成', '呼吸', '浸透圧のみ'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      '蒸散作用により葉から水分が蒸発し、その引っ張る力（蒸散流）で根から水を吸い上げます。',
  },
  {
    question: 'タンパク質を合成する細胞小器官は何か？',
    options: ['リボソーム', 'ミトコンドリア', 'ゴルジ体', 'リソソーム'],
    correctIndex: 0,
    subject: '生物',
    explanation:
      'リボソームはmRNAの情報をもとにアミノ酸をつなげてタンパク質を合成する細胞小器官です。',
  },
];

// ============================================================
// 地学 (Earth Science) - 32 questions
// ============================================================
const earthScienceQuestions: Question[] = [
  // ----- 地球 (Earth) -----
  {
    question: '地球の内部構造で最も外側の層を何というか？',
    options: ['地殻', 'マントル', '外核', '内核'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '地球は外側から地殻、マントル、外核、内核の4層構造をしています。地殻は最も薄い層です。',
  },
  {
    question: '地球の表面積のうち、海が占める割合はおよそ何%か？',
    options: ['約70%', '約50%', '約30%', '約90%'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '地球の表面積の約70%は海（海洋）で覆われています。残りの約30%が陸地です。',
  },
  {
    question: '地球が太陽の周りを1周するのにかかる時間はどれくらいか？',
    options: ['約365日', '約30日', '約24時間', '約7日'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '地球は太陽の周りを約365.25日で1周（公転）します。この余りの0.25日がうるう年の原因です。',
  },
  {
    question: '地球の自転の周期はおよそどれくらいか？',
    options: ['約24時間', '約12時間', '約365日', '約30日'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '地球は約24時間（正確には23時間56分4秒）で1回自転します。これにより昼夜の変化が起きます。',
  },
  {
    question: 'プレートテクトニクス理論で、地球の表面を構成するものは何か？',
    options: [
      '複数のプレート',
      '1枚の巨大な岩盤',
      'マグマの海',
      '氷の層',
    ],
    correctIndex: 0,
    subject: '地学',
    explanation:
      'プレートテクトニクス理論によると、地球の表面は十数枚のプレート（岩盤）で覆われ、それらがゆっくり移動しています。',
  },
  {
    question: '地球の大気で2番目に多い気体は何か？',
    options: ['酸素', '窒素', '二酸化炭素', 'アルゴン'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '地球の大気は窒素（約78%）が最も多く、次に酸素（約21%）が多く含まれています。',
  },
  // ----- 天気 (Weather) -----
  {
    question: '雲ができる主な原因はどれか？',
    options: [
      '空気が上昇して冷えること',
      '太陽の直射日光',
      '地面からの蒸発',
      '風が強いこと',
    ],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '空気が上昇すると気圧が下がり膨張して温度が下がります。露点に達すると水蒸気が凝結して雲ができます。',
  },
  {
    question: '気象庁で使われる天気記号で、丸の中に×がある記号は何を表すか？',
    options: ['曇り', '晴れ', '雨', '雪'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '日本の天気記号で、二重丸（◎）が曇り、○が快晴です。×は曇りの天気記号です。',
  },
  {
    question: '台風の中心部を何というか？',
    options: ['目（eye）', '壁（wall）', '核（core）', '腕（arm）'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '台風の中心部は「目」と呼ばれ、風が弱く雲が少ない比較的穏やかな領域です。',
  },
  {
    question: '寒冷前線が温暖前線に追いついてできる前線を何というか？',
    options: ['閉塞前線', '停滞前線', '気圧前線', '梅雨前線'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '閉塞前線は寒冷前線が温暖前線に追いついたときにできる前線で、温帯低気圧の発達の最終段階で見られます。',
  },
  {
    question: '気圧の単位として現在主に使われるのはどれか？',
    options: ['ヘクトパスカル（hPa）', 'ミリバール（mb）', '気圧（atm）', 'パスカル（Pa）'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '現在の気象学ではヘクトパスカル（hPa）が主に使われます。標準気圧は1013.25hPaです。',
  },
  {
    question: '日本の梅雨の原因となる前線は何か？',
    options: ['梅雨前線（停滞前線）', '寒冷前線', '温暖前線', '閉塞前線'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '梅雨はオホーツク海気団と太平洋気団の間にできる停滞前線（梅雨前線）が原因です。',
  },
  // ----- 宇宙 (Space) -----
  {
    question: '太陽系で最も大きい惑星はどれか？',
    options: ['木星', '土星', '天王星', '海王星'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '木星は太陽系最大の惑星で、直径は地球の約11倍、質量は地球の約318倍です。',
  },
  {
    question: '太陽系の惑星で環（リング）を持つことで有名なのはどれか？',
    options: ['土星', '木星', '火星', '金星'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '土星は美しい環（リング）で有名です。環は主に氷の粒や岩石のかけらで構成されています。',
  },
  {
    question: '地球から最も近い恒星は何か？',
    options: ['太陽', 'プロキシマ・ケンタウリ', 'シリウス', 'ベガ'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '地球から最も近い恒星は太陽で、約1.5億km（1天文単位）の距離にあります。次に近い恒星はプロキシマ・ケンタウリ（約4.2光年）です。',
  },
  {
    question: '月が地球の周りを1周するのにかかる時間はおよそどれくらいか？',
    options: ['約27日', '約7日', '約365日', '約24時間'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '月は約27.3日で地球の周りを1周（公転）します。月の満ち欠けの周期（朔望月）は約29.5日です。',
  },
  {
    question: '太陽はどのような天体か？',
    options: ['恒星', '惑星', '衛星', '小惑星'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '太陽は自ら光と熱を放つ恒星です。水素の核融合反応によりエネルギーを生成しています。',
  },
  {
    question: '銀河系（天の川銀河）のおよその直径はどれくらいか？',
    options: ['約10万光年', '約1万光年', '約100万光年', '約1000光年'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '天の川銀河の直径は約10万光年で、約2000億個の恒星を含む渦巻銀河です。',
  },
  // ----- 地震 (Earthquakes) -----
  {
    question: '地震のゆれの大きさを表す指標を何というか？',
    options: ['震度', 'マグニチュード', '震源深さ', '波長'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '震度は各地点でのゆれの大きさを表す指標です。日本では0〜7の10段階（5と6に弱・強あり）で表されます。',
  },
  {
    question: '地震そのもののエネルギーの大きさを表す指標を何というか？',
    options: ['マグニチュード', '震度', '震源深さ', '加速度'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      'マグニチュードは地震そのもののエネルギー規模を表す指標で、1つの地震に1つの値が決まります。',
  },
  {
    question: '地震で最初に届く速い波を何というか？',
    options: ['P波（初期微動）', 'S波（主要動）', '表面波', '津波'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      'P波（Primary wave）は地震で最初に届く縦波で、初期微動を引き起こします。S波より速く伝わります。',
  },
  {
    question: '日本列島が地震が多い理由として正しいのはどれか？',
    options: [
      '複数のプレートの境界に位置する',
      '赤道に近い',
      '島国である',
      '山が多い',
    ],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '日本は太平洋プレート、フィリピン海プレート、ユーラシアプレート、北米プレートの境界付近に位置するため地震が多い。',
  },
  {
    question: '海底で起きた地震によって発生する大きな波を何というか？',
    options: ['津波', '高潮', 'うねり', '暴風波'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '津波は海底の地震や海底地すべりなどにより海水が大きく動いて発生する波です。',
  },
  // ----- 火山 (Volcanoes) -----
  {
    question: '火山の噴火で流れ出す溶けた岩石を何というか？',
    options: ['溶岩', 'マグマ', '火山灰', '軽石'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '地表に流れ出したマグマを溶岩といいます。マグマは地下にある溶けた岩石のことです。',
  },
  {
    question: '日本で最も高い火山（活火山）はどれか？',
    options: ['富士山', '阿蘇山', '桜島', '浅間山'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '富士山は標高3,776mで日本最高峰であり、気象庁が指定する活火山の一つです。',
  },
  {
    question: '火山の形が円錐形になる噴火の特徴はどれか？',
    options: [
      '溶岩と火山灰が交互に積み重なる',
      '溶岩が非常にゆっくり流れる',
      '爆発的な噴火だけ起きる',
      'マグマが地下で固まる',
    ],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '成層火山（円錐形の火山）は溶岩流と火山砕屑物が交互に積み重なってできます。富士山が代表例です。',
  },
  {
    question: '火山噴出物のうち、直径2mm未満のものを何というか？',
    options: ['火山灰', '火山れき', '火山弾', '軽石'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '火山噴出物は大きさで分類され、直径2mm未満のものを火山灰、2〜64mmを火山れきといいます。',
  },
  // ----- 追加の地学問題 -----
  {
    question: '化石燃料に含まれないものはどれか？',
    options: ['ウラン', '石炭', '石油', '天然ガス'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '化石燃料は古代の生物の遺骸が変化してできた燃料で、石炭・石油・天然ガスがあります。ウランは核燃料です。',
  },
  {
    question: '堆積岩の一種で、生物の遺骸からできた岩石はどれか？',
    options: ['石灰岩', '砂岩', '泥岩', '礫岩'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '石灰岩はサンゴや貝などの生物の遺骸（炭酸カルシウム）が堆積してできた岩石です。',
  },
  {
    question: '地層の上下関係から年代を推定する法則を何というか？',
    options: ['地層累重の法則', '化石の法則', '万有引力の法則', '質量保存の法則'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '地層累重の法則は「下の地層ほど古い」という法則で、地層の年代関係を判断する基本原理です。',
  },
  {
    question: 'オゾン層が存在する大気の層はどれか？',
    options: ['成層圏', '対流圏', '中間圏', '熱圏'],
    correctIndex: 0,
    subject: '地学',
    explanation:
      'オゾン層は成層圏（高度約15〜50km）に存在し、有害な紫外線を吸収して地上の生物を守っています。',
  },
  {
    question: '季節が変わる主な原因はどれか？',
    options: [
      '地球の自転軸が傾いていること',
      '地球と太陽の距離が変わること',
      '太陽の温度が変化すること',
      '月の引力',
    ],
    correctIndex: 0,
    subject: '地学',
    explanation:
      '地球の自転軸は約23.4度傾いているため、公転中に太陽光の当たり方が変わり季節が生じます。',
  },
];

export const allQuestions: Question[] = [
  ...physicsQuestions,
  ...chemistryQuestions,
  ...biologyQuestions,
  ...earthScienceQuestions,
];

export const subjects = ['物理', '化学', '生物', '地学'] as const;
export type Subject = (typeof subjects)[number];

export function getQuestionsBySubject(subject: Subject): Question[] {
  return allQuestions.filter((q) => q.subject === subject);
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateQuiz(
  subject: Subject | 'all',
  count: number
): Question[] {
  let pool: Question[];
  if (subject === 'all') {
    pool = [...allQuestions];
  } else {
    pool = allQuestions.filter((q) => q.subject === subject);
  }
  const shuffled = shuffleArray(pool);
  return shuffled.slice(0, count);
}
