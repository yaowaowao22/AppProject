export interface EmojiQuestion {
  emojis: string;
  answer: string;
  hint: string;
  category: string;
}

export const CATEGORIES = [
  '映画',
  '食べ物',
  '動物',
  '国',
  'ことわざ',
  '有名人',
  '文化',
  'スポーツ',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_ICONS: Record<Category, string> = {
  映画: '🎬',
  食べ物: '🍽️',
  動物: '🐾',
  国: '🌍',
  ことわざ: '📜',
  有名人: '⭐',
  文化: '🏯',
  スポーツ: '🏅',
};

export const emojiQuestions: EmojiQuestion[] = [
  // ===== 映画 (20問) =====
  { emojis: '🦁👑', answer: 'ライオンキング', hint: 'ディズニー映画', category: '映画' },
  { emojis: '❄️👸', answer: 'アナと雪の女王', hint: 'ディズニー映画・Let It Go', category: '映画' },
  { emojis: '🧸🍯', answer: 'くまのプーさん', hint: 'ディズニーキャラクター', category: '映画' },
  { emojis: '🧜‍♀️🌊', answer: 'リトルマーメイド', hint: 'ディズニー映画・海の中', category: '映画' },
  { emojis: '🤖🌱', answer: 'ウォーリー', hint: 'ピクサー映画・ロボット', category: '映画' },
  { emojis: '👻🏚️', answer: 'ゴーストバスターズ', hint: 'アメリカのコメディ映画', category: '映画' },
  { emojis: '🕷️🧑', answer: 'スパイダーマン', hint: 'マーベルヒーロー', category: '映画' },
  { emojis: '🦇🌃', answer: 'バットマン', hint: 'DCヒーロー', category: '映画' },
  { emojis: '🚀⭐🔫', answer: 'スターウォーズ', hint: 'SFシリーズ大作', category: '映画' },
  { emojis: '💍🧝‍♂️🌋', answer: 'ロードオブザリング', hint: 'ファンタジー冒険映画', category: '映画' },
  { emojis: '🦖🏝️', answer: 'ジュラシックパーク', hint: '恐竜が蘇る映画', category: '映画' },
  { emojis: '🐠🔍', answer: 'ファインディング・ニモ', hint: 'ピクサー映画・海の魚', category: '映画' },
  { emojis: '👨‍🚀🌕', answer: 'アポロ13', hint: '宇宙ミッション映画', category: '映画' },
  { emojis: '🧙‍♂️⚡👓', answer: 'ハリーポッター', hint: '魔法使いの少年', category: '映画' },
  { emojis: '🐉🏯⚔️', answer: 'ムーラン', hint: 'ディズニー映画・中国が舞台', category: '映画' },
  { emojis: '🎃👻🎄', answer: 'ナイトメアー・ビフォア・クリスマス', hint: 'ティム・バートン監督', category: '映画' },
  { emojis: '🏴‍☠️🚢💀', answer: 'パイレーツオブカリビアン', hint: '海賊のアクション映画', category: '映画' },
  { emojis: '🐒🍌👑', answer: 'ターザン', hint: 'ジャングルで育った男', category: '映画' },
  { emojis: '🏠👆💨', answer: 'カールじいさんの空飛ぶ家', hint: 'ピクサー映画・風船', category: '映画' },
  { emojis: '🤡🎈🔪', answer: 'IT', hint: 'ホラー映画・ピエロ', category: '映画' },

  // ===== 食べ物 (18問) =====
  { emojis: '🍣🐟', answer: '寿司', hint: '日本食', category: '食べ物' },
  { emojis: '🍜🐷🥚', answer: 'ラーメン', hint: '中華麺料理', category: '食べ物' },
  { emojis: '🍛🌶️💛', answer: 'カレーライス', hint: 'スパイス料理', category: '食べ物' },
  { emojis: '🐙🔴⚫', answer: 'たこ焼き', hint: '大阪名物', category: '食べ物' },
  { emojis: '🍞🥬🍖', answer: 'サンドイッチ', hint: 'パンに挟む', category: '食べ物' },
  { emojis: '🍝🍅🧀', answer: 'パスタ', hint: 'イタリア料理', category: '食べ物' },
  { emojis: '🍚🥢🐔', answer: '親子丼', hint: '鶏肉と卵の丼', category: '食べ物' },
  { emojis: '🧈🥞🍯', answer: 'パンケーキ', hint: '甘いデザート朝食', category: '食べ物' },
  { emojis: '🍩☕🍫', answer: 'ドーナツ', hint: '丸い揚げ菓子', category: '食べ物' },
  { emojis: '🥟🥢💨', answer: '餃子', hint: '中華料理の点心', category: '食べ物' },
  { emojis: '🍢🔥🏪', answer: 'おでん', hint: 'コンビニでも買える冬の料理', category: '食べ物' },
  { emojis: '🍠🔥🍂', answer: '焼き芋', hint: '秋の定番おやつ', category: '食べ物' },
  { emojis: '🫘🍚🎌', answer: '赤飯', hint: 'お祝いごとに食べる', category: '食べ物' },
  { emojis: '🥩🔥🍺', answer: '焼肉', hint: '韓国発祥の肉料理', category: '食べ物' },
  { emojis: '🐡💀🔪', answer: 'ふぐ', hint: '毒がある高級魚', category: '食べ物' },
  { emojis: '🍵🍡🌸', answer: '茶道', hint: '日本の伝統文化', category: '食べ物' },
  { emojis: '🌰🍰🍂', answer: 'モンブラン', hint: '栗のケーキ', category: '食べ物' },
  { emojis: '🧊🍧🍓', answer: 'かき氷', hint: '夏の定番スイーツ', category: '食べ物' },

  // ===== 動物 (15問) =====
  { emojis: '🐼🎋🇨🇳', answer: 'パンダ', hint: '中国の国宝', category: '動物' },
  { emojis: '🦅🗽🇺🇸', answer: 'ハクトウワシ', hint: 'アメリカの象徴', category: '動物' },
  { emojis: '🐨🇦🇺🌿', answer: 'コアラ', hint: 'オーストラリアの動物', category: '動物' },
  { emojis: '🦘🥊🇦🇺', answer: 'カンガルー', hint: 'お腹の袋で赤ちゃんを育てる', category: '動物' },
  { emojis: '🐪🏜️☀️', answer: 'ラクダ', hint: '砂漠を歩く動物', category: '動物' },
  { emojis: '🐧❄️🌊', answer: 'ペンギン', hint: '南極にいる鳥', category: '動物' },
  { emojis: '🦈🦷🌊', answer: 'サメ', hint: '海の捕食者', category: '動物' },
  { emojis: '🐢💯🏖️', answer: 'ウミガメ', hint: '長寿の海の生き物', category: '動物' },
  { emojis: '🦩🩷🦵', answer: 'フラミンゴ', hint: 'ピンク色の鳥', category: '動物' },
  { emojis: '🐙🌊8️⃣', answer: 'タコ', hint: '足が8本の海の生き物', category: '動物' },
  { emojis: '🦁🌍👪', answer: 'ライオン', hint: '百獣の王', category: '動物' },
  { emojis: '🐘🦷🌳', answer: 'ゾウ', hint: '陸上最大の動物', category: '動物' },
  { emojis: '🦊🏮🌾', answer: 'キツネ', hint: '稲荷神社の使い', category: '動物' },
  { emojis: '🐺🌕🗻', answer: 'オオカミ', hint: '月に吠える', category: '動物' },
  { emojis: '🦉🌙📚', answer: 'フクロウ', hint: '夜行性の知恵の鳥', category: '動物' },

  // ===== 国 (15問) =====
  { emojis: '🗼🇫🇷🥐', answer: 'フランス', hint: 'ヨーロッパの国', category: '国' },
  { emojis: '🗽🇺🇸🍔', answer: 'アメリカ', hint: '北米の大国', category: '国' },
  { emojis: '🏯🗻🌸', answer: '日本', hint: '富士山がある国', category: '国' },
  { emojis: '🐉🧧🏮', answer: '中国', hint: 'アジアの大国', category: '国' },
  { emojis: '🏝️🌺🤙', answer: 'ハワイ', hint: 'アメリカの島', category: '国' },
  { emojis: '🍕🏟️🇮🇹', answer: 'イタリア', hint: 'ヨーロッパの国・ピザ', category: '国' },
  { emojis: '🐂💃🥘', answer: 'スペイン', hint: '闘牛とフラメンコの国', category: '国' },
  { emojis: '🫖👑🎡', answer: 'イギリス', hint: '紅茶と王室の国', category: '国' },
  { emojis: '🏔️🧀🍫', answer: 'スイス', hint: 'ヨーロッパの山岳国', category: '国' },
  { emojis: '🎭🥨🍺', answer: 'ドイツ', hint: 'ヨーロッパの国・ビール', category: '国' },
  { emojis: '🐨🏄‍♂️🦘', answer: 'オーストラリア', hint: '南半球の大陸国', category: '国' },
  { emojis: '🌴🐘🍛', answer: 'インド', hint: 'カレーの本場', category: '国' },
  { emojis: '🏺🏛️🫒', answer: 'ギリシャ', hint: '古代文明の国', category: '国' },
  { emojis: '🌷🚲🧀', answer: 'オランダ', hint: 'チューリップの国', category: '国' },
  { emojis: '🎶🥁🌍', answer: 'ブラジル', hint: 'サンバとカーニバルの国', category: '国' },

  // ===== ことわざ (18問) =====
  { emojis: '🐱🗣️🔔', answer: '猫に小判', hint: '価値がわからない', category: 'ことわざ' },
  { emojis: '🌸❌🍡', answer: '花より団子', hint: '風流より実利', category: 'ことわざ' },
  { emojis: '🐸👶🐸', answer: '蛙の子は蛙', hint: '親と子は似る', category: 'ことわざ' },
  { emojis: '🐵🌳⬇️', answer: '猿も木から落ちる', hint: '名人でも失敗する', category: 'ことわざ' },
  { emojis: '🗑️👀🐟', answer: '腐っても鯛', hint: '元が良ければ価値がある', category: 'ことわざ' },
  { emojis: '🌬️🏮☁️', answer: '風前の灯火', hint: '消えそうな危うい状態', category: 'ことわざ' },
  { emojis: '👁️🌿👀', answer: '目に青葉', hint: '初夏の風物詩', category: 'ことわざ' },
  { emojis: '🐕🌅🚶', answer: '犬も歩けば棒に当たる', hint: '行動すれば何かある', category: 'ことわざ' },
  { emojis: '💧🪨⏳', answer: '雨垂れ石を穿つ', hint: '小さな努力の積み重ね', category: 'ことわざ' },
  { emojis: '🐤🍆🐄', answer: '鶴の一声', hint: '権力者の一言で決まる', category: 'ことわざ' },
  { emojis: '🐴👂📖', answer: '馬の耳に念仏', hint: '言っても無駄', category: 'ことわざ' },
  { emojis: '⛰️⛰️🚶', answer: '石橋を叩いて渡る', hint: '慎重すぎること', category: 'ことわざ' },
  { emojis: '🌊🗼🏄', answer: '七転び八起き', hint: '何度失敗しても立ち上がる', category: 'ことわざ' },
  { emojis: '🔥❌🚬💨', answer: '火のないところに煙は立たぬ', hint: '噂には根拠がある', category: 'ことわざ' },
  { emojis: '🍡🎋🏮', answer: '棚からぼたもち', hint: '思わぬ幸運', category: 'ことわざ' },
  { emojis: '🕊️✉️🏹', answer: '一石二鳥', hint: '一つで二つの利益', category: 'ことわざ' },
  { emojis: '🐍👣🐾', answer: '蛇足', hint: '余計なこと', category: 'ことわざ' },
  { emojis: '🍂🐝🍯', answer: '能ある鷹は爪を隠す', hint: '実力者はひけらかさない', category: 'ことわざ' },

  // ===== 有名人 (10問) =====
  { emojis: '🎹🎵🧑‍🦯', answer: 'ベートーヴェン', hint: '耳が聞こえなくなった作曲家', category: '有名人' },
  { emojis: '🍎⬇️💡', answer: 'ニュートン', hint: '万有引力の発見者', category: '有名人' },
  { emojis: '⚡💡🔌', answer: 'エジソン', hint: '発明王', category: '有名人' },
  { emojis: '🎨🌻🇳🇱', answer: 'ゴッホ', hint: 'ひまわりの画家', category: '有名人' },
  { emojis: '🧪☢️👩‍🔬', answer: 'キュリー夫人', hint: '放射能の研究者', category: '有名人' },
  { emojis: '✈️🌍👩‍✈️', answer: 'ライト兄弟', hint: '飛行機を発明した', category: '有名人' },
  { emojis: '🎭🖋️💀', answer: 'シェイクスピア', hint: 'イギリスの劇作家', category: '有名人' },
  { emojis: '🌌⏰🧠', answer: 'アインシュタイン', hint: '相対性理論の物理学者', category: '有名人' },
  { emojis: '🏯⚔️🇯🇵', answer: '織田信長', hint: '戦国武将', category: '有名人' },
  { emojis: '🎤👑🕺', answer: 'マイケル・ジャクソン', hint: 'キング・オブ・ポップ', category: '有名人' },

  // ===== 文化 (10問) =====
  { emojis: '🐒🍑', answer: '桃太郎', hint: '日本の昔話', category: '文化' },
  { emojis: '🎋🌟👫', answer: '七夕', hint: '7月7日の行事', category: '文化' },
  { emojis: '🎍🎌🔔', answer: 'お正月', hint: '1月1日', category: '文化' },
  { emojis: '👹💥👊', answer: '節分', hint: '豆をまく行事', category: '文化' },
  { emojis: '🎎👧👦', answer: 'ひな祭り', hint: '3月3日の行事', category: '文化' },
  { emojis: '🎏🏯🎌', answer: 'こどもの日', hint: '5月5日の行事', category: '文化' },
  { emojis: '🐇🌕🍡', answer: 'お月見', hint: '秋の満月を見る行事', category: '文化' },
  { emojis: '👘🎆🏮', answer: '夏祭り', hint: '夏の風物詩', category: '文化' },
  { emojis: '🏔️⛩️🙏', answer: '初詣', hint: '新年の参拝', category: '文化' },
  { emojis: '🐉💧🛶', answer: 'ドラゴンボート', hint: '端午節の競争', category: '文化' },

  // ===== スポーツ (10問) =====
  { emojis: '⚽🏟️🏆', answer: 'ワールドカップ', hint: 'サッカーの世界大会', category: 'スポーツ' },
  { emojis: '🥋🔴⚪', answer: '柔道', hint: '日本発祥の武道', category: 'スポーツ' },
  { emojis: '🏊‍♂️🚴‍♂️🏃‍♂️', answer: 'トライアスロン', hint: '3種目の耐久レース', category: 'スポーツ' },
  { emojis: '🎾🏆🍓', answer: 'ウィンブルドン', hint: 'イギリスのテニス大会', category: 'スポーツ' },
  { emojis: '🏀🇺🇸⭐', answer: 'NBA', hint: 'アメリカのバスケリーグ', category: 'スポーツ' },
  { emojis: '⛷️🏔️❄️', answer: 'スキー', hint: '冬のウインタースポーツ', category: 'スポーツ' },
  { emojis: '🥊🔔💪', answer: 'ボクシング', hint: 'リングで戦う格闘技', category: 'スポーツ' },
  { emojis: '🏄🌊☀️', answer: 'サーフィン', hint: '波に乗るスポーツ', category: 'スポーツ' },
  { emojis: '⚾9️⃣🏟️', answer: '野球', hint: '9人制の球技', category: 'スポーツ' },
  { emojis: '🏇🐎🏁', answer: '競馬', hint: '馬のレース', category: 'スポーツ' },
];

/**
 * Shuffle an array (Fisher-Yates)
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Get questions filtered by category, shuffled
 */
export function getQuestions(category?: string, count?: number): EmojiQuestion[] {
  let filtered = category
    ? emojiQuestions.filter((q) => q.category === category)
    : emojiQuestions;
  const shuffled = shuffleArray(filtered);
  return count ? shuffled.slice(0, count) : shuffled;
}

/**
 * Generate 4 multiple-choice options for a given question.
 * Includes the correct answer and 3 random distractors from the same category (or other categories).
 */
export function generateChoices(
  question: EmojiQuestion,
  allQuestions: EmojiQuestion[]
): string[] {
  const sameCat = allQuestions.filter(
    (q) => q.category === question.category && q.answer !== question.answer
  );
  const otherCat = allQuestions.filter(
    (q) => q.category !== question.category && q.answer !== question.answer
  );

  const pool = shuffleArray([...sameCat, ...otherCat]);
  const distractors: string[] = [];
  const usedAnswers = new Set<string>([question.answer]);

  for (const q of pool) {
    if (!usedAnswers.has(q.answer)) {
      distractors.push(q.answer);
      usedAnswers.add(q.answer);
    }
    if (distractors.length >= 3) break;
  }

  const choices = shuffleArray([question.answer, ...distractors]);
  return choices;
}
