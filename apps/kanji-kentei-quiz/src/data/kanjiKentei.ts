import type {
  KenteiLevel,
  QuestionType,
  YomiEntry,
  KakiEntry,
  BushuEntry,
  YojiEntry,
  KenteiEntry,
} from '../types';

// ============================
// 読み問題 (50+ per level target, total 55+ entries)
// ============================
const yomiData: YomiEntry[] = [
  // --- 10級 (小1) ---
  { type: '読み', word: '山川', reading: 'やまかわ', meaning: '山と川', level: '10級' },
  { type: '読み', word: '大小', reading: 'だいしょう', meaning: '大きいと小さい', level: '10級' },
  { type: '読み', word: '上下', reading: 'じょうげ', meaning: '上と下', level: '10級' },
  { type: '読み', word: '左右', reading: 'さゆう', meaning: '左と右', level: '10級' },
  { type: '読み', word: '天気', reading: 'てんき', meaning: '空のようす', level: '10級' },
  { type: '読み', word: '花火', reading: 'はなび', meaning: '夏の風物詩', level: '10級' },
  { type: '読み', word: '入口', reading: 'いりぐち', meaning: '入るところ', level: '10級' },
  { type: '読み', word: '出口', reading: 'でぐち', meaning: '出るところ', level: '10級' },
  { type: '読み', word: '休日', reading: 'きゅうじつ', meaning: '休みの日', level: '10級' },
  { type: '読み', word: '学校', reading: 'がっこう', meaning: '勉強する場所', level: '10級' },
  { type: '読み', word: '先生', reading: 'せんせい', meaning: '教える人', level: '10級' },
  { type: '読み', word: '男女', reading: 'だんじょ', meaning: '男と女', level: '10級' },
  { type: '読み', word: '正月', reading: 'しょうがつ', meaning: '一月', level: '10級' },

  // --- 8級 (小3) ---
  { type: '読み', word: '世界', reading: 'せかい', meaning: '全ての国々', level: '8級' },
  { type: '読み', word: '動物', reading: 'どうぶつ', meaning: '生き物', level: '8級' },
  { type: '読み', word: '植物', reading: 'しょくぶつ', meaning: '草木の総称', level: '8級' },
  { type: '読み', word: '温度', reading: 'おんど', meaning: '温かさの度合い', level: '8級' },
  { type: '読み', word: '問題', reading: 'もんだい', meaning: '答えを求める事', level: '8級' },
  { type: '読み', word: '宿題', reading: 'しゅくだい', meaning: '家でやる課題', level: '8級' },
  { type: '読み', word: '暗記', reading: 'あんき', meaning: '覚えること', level: '8級' },
  { type: '読み', word: '勝負', reading: 'しょうぶ', meaning: '戦い', level: '8級' },
  { type: '読み', word: '期待', reading: 'きたい', meaning: '望み', level: '8級' },
  { type: '読み', word: '島国', reading: 'しまぐに', meaning: '島からなる国', level: '8級' },
  { type: '読み', word: '農業', reading: 'のうぎょう', meaning: '作物を育てる', level: '8級' },

  // --- 6級 (小5) ---
  { type: '読み', word: '経験', reading: 'けいけん', meaning: '体験', level: '6級' },
  { type: '読み', word: '演説', reading: 'えんぜつ', meaning: '大勢の前で話す', level: '6級' },
  { type: '読み', word: '条件', reading: 'じょうけん', meaning: '約束事', level: '6級' },
  { type: '読み', word: '複雑', reading: 'ふくざつ', meaning: '入り組んでいる', level: '6級' },
  { type: '読み', word: '興味', reading: 'きょうみ', meaning: '関心', level: '6級' },
  { type: '読み', word: '貿易', reading: 'ぼうえき', meaning: '国同士の取引', level: '6級' },
  { type: '読み', word: '築造', reading: 'ちくぞう', meaning: '建てること', level: '6級' },
  { type: '読み', word: '設備', reading: 'せつび', meaning: '必要な装置', level: '6級' },
  { type: '読み', word: '限界', reading: 'げんかい', meaning: 'これ以上ない所', level: '6級' },
  { type: '読み', word: '態度', reading: 'たいど', meaning: 'ふるまい', level: '6級' },
  { type: '読み', word: '弁護', reading: 'べんご', meaning: 'かばうこと', level: '6級' },

  // --- 4級 (中学) ---
  { type: '読み', word: '憂鬱', reading: 'ゆううつ', meaning: '気分が沈む', level: '4級' },
  { type: '読み', word: '挑戦', reading: 'ちょうせん', meaning: '立ち向かう', level: '4級' },
  { type: '読み', word: '克服', reading: 'こくふく', meaning: '打ち勝つ', level: '4級' },
  { type: '読み', word: '抽象', reading: 'ちゅうしょう', meaning: '形のないもの', level: '4級' },
  { type: '読み', word: '恩恵', reading: 'おんけい', meaning: 'ありがたいこと', level: '4級' },
  { type: '読み', word: '慎重', reading: 'しんちょう', meaning: '注意深い', level: '4級' },
  { type: '読み', word: '把握', reading: 'はあく', meaning: '理解する', level: '4級' },
  { type: '読み', word: '納得', reading: 'なっとく', meaning: '理解して受け入れる', level: '4級' },
  { type: '読み', word: '貢献', reading: 'こうけん', meaning: '役に立つ', level: '4級' },
  { type: '読み', word: '喚起', reading: 'かんき', meaning: '呼び起こす', level: '4級' },

  // --- 3級 (中学卒) ---
  { type: '読み', word: '遵守', reading: 'じゅんしゅ', meaning: '決まりを守る', level: '3級' },
  { type: '読み', word: '斡旋', reading: 'あっせん', meaning: '間に入って世話する', level: '3級' },
  { type: '読み', word: '顕著', reading: 'けんちょ', meaning: 'はっきりしている', level: '3級' },
  { type: '読み', word: '拘束', reading: 'こうそく', meaning: '自由を奪う', level: '3級' },
  { type: '読み', word: '措置', reading: 'そち', meaning: '対応する手段', level: '3級' },
  { type: '読み', word: '暫定', reading: 'ざんてい', meaning: '一時的に決める', level: '3級' },
  { type: '読み', word: '脆弱', reading: 'ぜいじゃく', meaning: 'もろく弱い', level: '3級' },
  { type: '読み', word: '逸脱', reading: 'いつだつ', meaning: 'はずれる', level: '3級' },
  { type: '読み', word: '恣意', reading: 'しい', meaning: '自分勝手', level: '3級' },
  { type: '読み', word: '矛盾', reading: 'むじゅん', meaning: 'つじつまが合わない', level: '3級' },

  // --- 準2級 (高校) ---
  { type: '読み', word: '毀損', reading: 'きそん', meaning: '傷つけること', level: '準2級' },
  { type: '読み', word: '忖度', reading: 'そんたく', meaning: '相手の気持ちを推し量る', level: '準2級' },
  { type: '読み', word: '邁進', reading: 'まいしん', meaning: 'ひたすら進む', level: '準2級' },
  { type: '読み', word: '瓦解', reading: 'がかい', meaning: '組織が崩れる', level: '準2級' },
  { type: '読み', word: '慟哭', reading: 'どうこく', meaning: '声を上げて泣く', level: '準2級' },
  { type: '読み', word: '齟齬', reading: 'そご', meaning: 'かみ合わない', level: '準2級' },
  { type: '読み', word: '蹂躙', reading: 'じゅうりん', meaning: '踏みにじる', level: '準2級' },
  { type: '読み', word: '蒐集', reading: 'しゅうしゅう', meaning: '集めること', level: '準2級' },
  { type: '読み', word: '拙劣', reading: 'せつれつ', meaning: '下手なこと', level: '準2級' },
  { type: '読み', word: '暗澹', reading: 'あんたん', meaning: '暗く沈んだ様子', level: '準2級' },
];

// ============================
// 書き問題 (30+ entries)
// ============================
const kakiData: KakiEntry[] = [
  // --- 10級 ---
  { type: '書き', reading: 'がっこう', correctKanji: '学校', meaning: '勉強する場所', level: '10級' },
  { type: '書き', reading: 'せんせい', correctKanji: '先生', meaning: '教える人', level: '10級' },
  { type: '書き', reading: 'てんき', correctKanji: '天気', meaning: '空のようす', level: '10級' },
  { type: '書き', reading: 'やまかわ', correctKanji: '山川', meaning: '山と川', level: '10級' },
  { type: '書き', reading: 'はなび', correctKanji: '花火', meaning: '夏の風物詩', level: '10級' },
  { type: '書き', reading: 'きゅうじつ', correctKanji: '休日', meaning: '休みの日', level: '10級' },

  // --- 8級 ---
  { type: '書き', reading: 'もんだい', correctKanji: '問題', meaning: '答えを求める事', level: '8級' },
  { type: '書き', reading: 'どうぶつ', correctKanji: '動物', meaning: '生き物', level: '8級' },
  { type: '書き', reading: 'しゅくだい', correctKanji: '宿題', meaning: '家でやる課題', level: '8級' },
  { type: '書き', reading: 'しょうぶ', correctKanji: '勝負', meaning: '戦い', level: '8級' },
  { type: '書き', reading: 'おんど', correctKanji: '温度', meaning: '温かさの度合い', level: '8級' },

  // --- 6級 ---
  { type: '書き', reading: 'けいけん', correctKanji: '経験', meaning: '体験', level: '6級' },
  { type: '書き', reading: 'じょうけん', correctKanji: '条件', meaning: '約束事', level: '6級' },
  { type: '書き', reading: 'ぼうえき', correctKanji: '貿易', meaning: '国同士の取引', level: '6級' },
  { type: '書き', reading: 'せつび', correctKanji: '設備', meaning: '必要な装置', level: '6級' },
  { type: '書き', reading: 'たいど', correctKanji: '態度', meaning: 'ふるまい', level: '6級' },

  // --- 4級 ---
  { type: '書き', reading: 'ちょうせん', correctKanji: '挑戦', meaning: '立ち向かう', level: '4級' },
  { type: '書き', reading: 'こくふく', correctKanji: '克服', meaning: '打ち勝つ', level: '4級' },
  { type: '書き', reading: 'しんちょう', correctKanji: '慎重', meaning: '注意深い', level: '4級' },
  { type: '書き', reading: 'なっとく', correctKanji: '納得', meaning: '理解して受け入れる', level: '4級' },
  { type: '書き', reading: 'こうけん', correctKanji: '貢献', meaning: '役に立つ', level: '4級' },

  // --- 3級 ---
  { type: '書き', reading: 'じゅんしゅ', correctKanji: '遵守', meaning: '決まりを守る', level: '3級' },
  { type: '書き', reading: 'けんちょ', correctKanji: '顕著', meaning: 'はっきりしている', level: '3級' },
  { type: '書き', reading: 'そち', correctKanji: '措置', meaning: '対応する手段', level: '3級' },
  { type: '書き', reading: 'むじゅん', correctKanji: '矛盾', meaning: 'つじつまが合わない', level: '3級' },
  { type: '書き', reading: 'こうそく', correctKanji: '拘束', meaning: '自由を奪う', level: '3級' },

  // --- 準2級 ---
  { type: '書き', reading: 'きそん', correctKanji: '毀損', meaning: '傷つけること', level: '準2級' },
  { type: '書き', reading: 'そんたく', correctKanji: '忖度', meaning: '推し量る', level: '準2級' },
  { type: '書き', reading: 'まいしん', correctKanji: '邁進', meaning: 'ひたすら進む', level: '準2級' },
  { type: '書き', reading: 'がかい', correctKanji: '瓦解', meaning: '組織が崩れる', level: '準2級' },
  { type: '書き', reading: 'せつれつ', correctKanji: '拙劣', meaning: '下手なこと', level: '準2級' },
];

// ============================
// 部首問題 (20+ entries)
// ============================
const bushuData: BushuEntry[] = [
  // --- 10級 ---
  { type: '部首', kanji: '花', bushuName: 'くさかんむり', bushuChar: '艹', level: '10級' },
  { type: '部首', kanji: '休', bushuName: 'にんべん', bushuChar: '亻', level: '10級' },
  { type: '部首', kanji: '村', bushuName: 'きへん', bushuChar: '木', level: '10級' },
  { type: '部首', kanji: '池', bushuName: 'さんずい', bushuChar: '氵', level: '10級' },

  // --- 8級 ---
  { type: '部首', kanji: '話', bushuName: 'ごんべん', bushuChar: '訁', level: '8級' },
  { type: '部首', kanji: '鉄', bushuName: 'かねへん', bushuChar: '釒', level: '8級' },
  { type: '部首', kanji: '院', bushuName: 'こざとへん', bushuChar: '阝', level: '8級' },
  { type: '部首', kanji: '持', bushuName: 'てへん', bushuChar: '扌', level: '8級' },

  // --- 6級 ---
  { type: '部首', kanji: '経', bushuName: 'いとへん', bushuChar: '糸', level: '6級' },
  { type: '部首', kanji: '飯', bushuName: 'しょくへん', bushuChar: '飠', level: '6級' },
  { type: '部首', kanji: '路', bushuName: 'あしへん', bushuChar: '足', level: '6級' },
  { type: '部首', kanji: '腰', bushuName: 'にくづき', bushuChar: '月', level: '6級' },

  // --- 4級 ---
  { type: '部首', kanji: '鋭', bushuName: 'かねへん', bushuChar: '釒', level: '4級' },
  { type: '部首', kanji: '慎', bushuName: 'りっしんべん', bushuChar: '忄', level: '4級' },
  { type: '部首', kanji: '掘', bushuName: 'てへん', bushuChar: '扌', level: '4級' },
  { type: '部首', kanji: '隣', bushuName: 'こざとへん', bushuChar: '阝', level: '4級' },

  // --- 3級 ---
  { type: '部首', kanji: '謀', bushuName: 'ごんべん', bushuChar: '訁', level: '3級' },
  { type: '部首', kanji: '濃', bushuName: 'さんずい', bushuChar: '氵', level: '3級' },
  { type: '部首', kanji: '膨', bushuName: 'にくづき', bushuChar: '月', level: '3級' },
  { type: '部首', kanji: '穏', bushuName: 'のぎへん', bushuChar: '禾', level: '3級' },

  // --- 準2級 ---
  { type: '部首', kanji: '繊', bushuName: 'いとへん', bushuChar: '糸', level: '準2級' },
  { type: '部首', kanji: '嘱', bushuName: 'くちへん', bushuChar: '口', level: '準2級' },
  { type: '部首', kanji: '漆', bushuName: 'さんずい', bushuChar: '氵', level: '準2級' },
  { type: '部首', kanji: '撤', bushuName: 'てへん', bushuChar: '扌', level: '準2級' },
];

// ============================
// 四字熟語 (20+ entries)
// ============================
const yojiData: YojiEntry[] = [
  // --- 10級 ---
  { type: '四字熟語', full: '一石二鳥', display: '一石○鳥', answer: '二', meaning: '一つの行動で二つの利益を得る', level: '10級' },
  { type: '四字熟語', full: '一日千秋', display: '一日○秋', answer: '千', meaning: '待ち遠しいこと', level: '10級' },
  { type: '四字熟語', full: '十人十色', display: '十人○色', answer: '十', meaning: '人それぞれ違う', level: '10級' },

  // --- 8級 ---
  { type: '四字熟語', full: '以心伝心', display: '以○伝心', answer: '心', meaning: '言葉なしで気持ちが通じる', level: '8級' },
  { type: '四字熟語', full: '弱肉強食', display: '弱肉○食', answer: '強', meaning: '強い者が弱い者を餌食にする', level: '8級' },
  { type: '四字熟語', full: '自業自得', display: '自業○得', answer: '自', meaning: '自分の行いの報い', level: '8級' },
  { type: '四字熟語', full: '半信半疑', display: '半信○疑', answer: '半', meaning: '半分信じ半分疑う', level: '8級' },

  // --- 6級 ---
  { type: '四字熟語', full: '臨機応変', display: '臨機○変', answer: '応', meaning: '場に応じて対応する', level: '6級' },
  { type: '四字熟語', full: '試行錯誤', display: '試行○誤', answer: '錯', meaning: '繰り返し試す', level: '6級' },
  { type: '四字熟語', full: '起死回生', display: '起死○生', answer: '回', meaning: '危機から立ち直る', level: '6級' },
  { type: '四字熟語', full: '前代未聞', display: '前代○聞', answer: '未', meaning: '今まで聞いたことがない', level: '6級' },

  // --- 4級 ---
  { type: '四字熟語', full: '切磋琢磨', display: '切磋○磨', answer: '琢', meaning: '互いに励まし合い向上する', level: '4級' },
  { type: '四字熟語', full: '言語道断', display: '言語○断', answer: '道', meaning: 'とんでもないこと', level: '4級' },
  { type: '四字熟語', full: '異口同音', display: '異口○音', answer: '同', meaning: '多くの人が同じ意見', level: '4級' },
  { type: '四字熟語', full: '意気投合', display: '意気○合', answer: '投', meaning: '気持ちがぴったり合う', level: '4級' },

  // --- 3級 ---
  { type: '四字熟語', full: '朝令暮改', display: '朝令○改', answer: '暮', meaning: '命令がすぐ変わる', level: '3級' },
  { type: '四字熟語', full: '厚顔無恥', display: '厚顔○恥', answer: '無', meaning: '恥知らず', level: '3級' },
  { type: '四字熟語', full: '針小棒大', display: '針小○大', answer: '棒', meaning: '大げさに言う', level: '3級' },
  { type: '四字熟語', full: '粉骨砕身', display: '粉骨○身', answer: '砕', meaning: '力の限り努力する', level: '3級' },

  // --- 準2級 ---
  { type: '四字熟語', full: '傍若無人', display: '傍若○人', answer: '無', meaning: '人の迷惑を考えない', level: '準2級' },
  { type: '四字熟語', full: '換骨奪胎', display: '換骨○胎', answer: '奪', meaning: '本質を変えて新しくする', level: '準2級' },
  { type: '四字熟語', full: '曖昧模糊', display: '曖昧○糊', answer: '模', meaning: 'はっきりしない', level: '準2級' },
  { type: '四字熟語', full: '呉越同舟', display: '呉越○舟', answer: '同', meaning: '仲の悪い者が同じ場にいる', level: '準2級' },
];

// ============================
// All bushu names for wrong choices
// ============================
const allBushuNames: string[] = [
  'くさかんむり', 'にんべん', 'きへん', 'さんずい',
  'ごんべん', 'かねへん', 'こざとへん', 'てへん',
  'いとへん', 'しょくへん', 'あしへん', 'にくづき',
  'りっしんべん', 'のぎへん', 'くちへん', 'おおざと',
  'ひへん', 'うかんむり', 'しんにょう', 'つちへん',
  'おんなへん', 'こころ', 'たけかんむり', 'やまへん',
];

// ============================
// Exports & Utility Functions
// ============================

export const allData: KenteiEntry[] = [
  ...yomiData,
  ...kakiData,
  ...bushuData,
  ...yojiData,
];

export const LEVELS: KenteiLevel[] = ['10級', '8級', '6級', '4級', '3級', '準2級'];

export const LEVEL_LABELS: Record<KenteiLevel, string> = {
  '10級': '10級（小1）',
  '8級': '8級（小3）',
  '6級': '6級（小5）',
  '4級': '4級（中学）',
  '3級': '3級（中学卒）',
  '準2級': '準2級（高校）',
};

export const QUESTION_TYPES: QuestionType[] = ['読み', '書き', '部首', '四字熟語'];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  '読み': '読み問題',
  '書き': '書き問題',
  '部首': '部首問題',
  '四字熟語': '四字熟語',
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getEntriesByLevelAndType(level: KenteiLevel, type: QuestionType): KenteiEntry[] {
  return allData.filter((e) => e.level === level && e.type === type);
}

function getWrongChoicesForYomi(correct: YomiEntry, pool: YomiEntry[]): string[] {
  const wrongs: string[] = [];
  const used = new Set<string>([correct.reading]);
  const shuffled = shuffleArray(pool);
  for (const item of shuffled) {
    if (!used.has(item.reading) && wrongs.length < 3) {
      wrongs.push(item.reading);
      used.add(item.reading);
    }
  }
  // Fallback from all yomi data
  if (wrongs.length < 3) {
    const allPool = shuffleArray(yomiData);
    for (const item of allPool) {
      if (!used.has(item.reading) && wrongs.length < 3) {
        wrongs.push(item.reading);
        used.add(item.reading);
      }
    }
  }
  return wrongs;
}

function getWrongChoicesForKaki(correct: KakiEntry, pool: KakiEntry[]): string[] {
  const wrongs: string[] = [];
  const used = new Set<string>([correct.correctKanji]);
  const shuffled = shuffleArray(pool);
  for (const item of shuffled) {
    if (!used.has(item.correctKanji) && wrongs.length < 3) {
      wrongs.push(item.correctKanji);
      used.add(item.correctKanji);
    }
  }
  if (wrongs.length < 3) {
    const allPool = shuffleArray(kakiData);
    for (const item of allPool) {
      if (!used.has(item.correctKanji) && wrongs.length < 3) {
        wrongs.push(item.correctKanji);
        used.add(item.correctKanji);
      }
    }
  }
  return wrongs;
}

function getWrongChoicesForBushu(correct: BushuEntry): string[] {
  const wrongs: string[] = [];
  const used = new Set<string>([correct.bushuName]);
  const shuffled = shuffleArray(allBushuNames);
  for (const name of shuffled) {
    if (!used.has(name) && wrongs.length < 3) {
      wrongs.push(name);
      used.add(name);
    }
  }
  return wrongs;
}

function getWrongChoicesForYoji(correct: YojiEntry, pool: YojiEntry[]): string[] {
  const wrongs: string[] = [];
  const used = new Set<string>([correct.answer]);
  const shuffled = shuffleArray(pool);
  for (const item of shuffled) {
    if (!used.has(item.answer) && wrongs.length < 3) {
      wrongs.push(item.answer);
      used.add(item.answer);
    }
  }
  // Fallback with single kanji characters
  const fallbackChars = shuffleArray(['生', '心', '火', '水', '金', '木', '土', '月', '日', '風', '雪', '雷', '光', '闇']);
  for (const ch of fallbackChars) {
    if (!used.has(ch) && wrongs.length < 3) {
      wrongs.push(ch);
      used.add(ch);
    }
  }
  return wrongs;
}

export interface GeneratedQuestion {
  entry: KenteiEntry;
  questionText: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export function generateQuestions(
  level: KenteiLevel,
  type: QuestionType,
  count: number
): GeneratedQuestion[] {
  const pool = getEntriesByLevelAndType(level, type);

  if (pool.length === 0) return [];

  // If pool is smaller than count, repeat questions (shuffle to vary order)
  let selected: KenteiEntry[];
  if (pool.length >= count) {
    selected = shuffleArray(pool).slice(0, count);
  } else {
    selected = [];
    while (selected.length < count) {
      const shuffled = shuffleArray(pool);
      selected = selected.concat(shuffled);
    }
    selected = selected.slice(0, count);
  }

  return selected.map((entry) => {
    let questionText = '';
    let correctAnswer = '';
    let wrongs: string[] = [];
    let explanation = '';

    switch (entry.type) {
      case '読み': {
        const e = entry as YomiEntry;
        questionText = `「${e.word}」の読みは？`;
        correctAnswer = e.reading;
        wrongs = getWrongChoicesForYomi(e, yomiData.filter((y) => y.level === level));
        explanation = `${e.word}（${e.reading}）：${e.meaning}`;
        break;
      }
      case '書き': {
        const e = entry as KakiEntry;
        questionText = `「${e.reading}」を漢字で書くと？`;
        correctAnswer = e.correctKanji;
        wrongs = getWrongChoicesForKaki(e, kakiData.filter((k) => k.level === level));
        explanation = `${e.reading} → ${e.correctKanji}：${e.meaning}`;
        break;
      }
      case '部首': {
        const e = entry as BushuEntry;
        questionText = `「${e.kanji}」の部首は？`;
        correctAnswer = e.bushuName;
        wrongs = getWrongChoicesForBushu(e);
        explanation = `${e.kanji}の部首は「${e.bushuName}」（${e.bushuChar}）`;
        break;
      }
      case '四字熟語': {
        const e = entry as YojiEntry;
        questionText = `${e.display}の○に入る漢字は？`;
        correctAnswer = e.answer;
        wrongs = getWrongChoicesForYoji(e, yojiData.filter((y) => y.level === level));
        explanation = `${e.full}：${e.meaning}`;
        break;
      }
    }

    const allChoices = shuffleArray([correctAnswer, ...wrongs]);
    const correctIndex = allChoices.indexOf(correctAnswer);

    return {
      entry,
      questionText,
      choices: allChoices,
      correctIndex,
      explanation,
    };
  });
}
