export interface NandokuEntry {
  kanji: string;
  reading: string;
  meaning: string;
  category: string;
}

export const CATEGORIES = [
  { key: 'all', label: '全て' },
  { key: '動物', label: '動物' },
  { key: '植物', label: '植物' },
  { key: '食べ物', label: '食べ物' },
  { key: '体', label: '体' },
  { key: '自然', label: '自然' },
  { key: '日常', label: '日常' },
  { key: '地名', label: '地名' },
] as const;

export const QUESTION_COUNTS = [
  { value: 10, label: '10問' },
  { value: 20, label: '20問' },
  { value: 30, label: '30問' },
  { value: 50, label: '50問' },
];

export const nandokuKanjiData: NandokuEntry[] = [
  // ─── 動物 (25) ───
  { kanji: '海豚', reading: 'いるか', meaning: 'イルカ', category: '動物' },
  { kanji: '河馬', reading: 'かば', meaning: 'カバ', category: '動物' },
  { kanji: '土竜', reading: 'もぐら', meaning: 'モグラ', category: '動物' },
  { kanji: '蝸牛', reading: 'かたつむり', meaning: 'カタツムリ', category: '動物' },
  { kanji: '栗鼠', reading: 'りす', meaning: 'リス', category: '動物' },
  { kanji: '海月', reading: 'くらげ', meaning: 'クラゲ', category: '動物' },
  { kanji: '海星', reading: 'ひとで', meaning: 'ヒトデ', category: '動物' },
  { kanji: '啄木鳥', reading: 'きつつき', meaning: 'キツツキ', category: '動物' },
  { kanji: '蟷螂', reading: 'かまきり', meaning: 'カマキリ', category: '動物' },
  { kanji: '蜻蛉', reading: 'とんぼ', meaning: 'トンボ', category: '動物' },
  { kanji: '翡翠', reading: 'かわせみ', meaning: 'カワセミ', category: '動物' },
  { kanji: '家鴨', reading: 'あひる', meaning: 'アヒル', category: '動物' },
  { kanji: '信天翁', reading: 'あほうどり', meaning: 'アホウドリ', category: '動物' },
  { kanji: '膃肭臍', reading: 'おっとせい', meaning: 'オットセイ', category: '動物' },
  { kanji: '海鼠', reading: 'なまこ', meaning: 'ナマコ', category: '動物' },
  { kanji: '山羊', reading: 'やぎ', meaning: 'ヤギ', category: '動物' },
  { kanji: '百舌', reading: 'もず', meaning: 'モズ', category: '動物' },
  { kanji: '鸚鵡', reading: 'おうむ', meaning: 'オウム', category: '動物' },
  { kanji: '蝙蝠', reading: 'こうもり', meaning: 'コウモリ', category: '動物' },
  { kanji: '蛞蝓', reading: 'なめくじ', meaning: 'ナメクジ', category: '動物' },
  { kanji: '河豚', reading: 'ふぐ', meaning: 'フグ', category: '動物' },
  { kanji: '鍬形虫', reading: 'くわがたむし', meaning: 'クワガタムシ', category: '動物' },
  { kanji: '蟋蟀', reading: 'こおろぎ', meaning: 'コオロギ', category: '動物' },
  { kanji: '飛蝗', reading: 'ばった', meaning: 'バッタ', category: '動物' },
  { kanji: '鳳凰', reading: 'ほうおう', meaning: '想像上の霊鳥', category: '動物' },

  // ─── 植物 (23) ───
  { kanji: '向日葵', reading: 'ひまわり', meaning: 'ヒマワリ', category: '植物' },
  { kanji: '紫陽花', reading: 'あじさい', meaning: 'アジサイ', category: '植物' },
  { kanji: '蒲公英', reading: 'たんぽぽ', meaning: 'タンポポ', category: '植物' },
  { kanji: '彼岸花', reading: 'ひがんばな', meaning: 'ヒガンバナ', category: '植物' },
  { kanji: '仙人掌', reading: 'さぼてん', meaning: 'サボテン', category: '植物' },
  { kanji: '竜胆', reading: 'りんどう', meaning: 'リンドウ', category: '植物' },
  { kanji: '百日紅', reading: 'さるすべり', meaning: 'サルスベリ', category: '植物' },
  { kanji: '無花果', reading: 'いちじく', meaning: 'イチジク', category: '植物' },
  { kanji: '石楠花', reading: 'しゃくなげ', meaning: 'シャクナゲ', category: '植物' },
  { kanji: '木天蓼', reading: 'またたび', meaning: 'マタタビ', category: '植物' },
  { kanji: '金木犀', reading: 'きんもくせい', meaning: 'キンモクセイ', category: '植物' },
  { kanji: '沈丁花', reading: 'じんちょうげ', meaning: 'ジンチョウゲ', category: '植物' },
  { kanji: '公孫樹', reading: 'いちょう', meaning: 'イチョウ', category: '植物' },
  { kanji: '合歓木', reading: 'ねむのき', meaning: 'ネムノキ', category: '植物' },
  { kanji: '含羞草', reading: 'おじぎそう', meaning: 'オジギソウ', category: '植物' },
  { kanji: '馬酔木', reading: 'あせび', meaning: 'アセビ', category: '植物' },
  { kanji: '山茶花', reading: 'さざんか', meaning: 'サザンカ', category: '植物' },
  { kanji: '躑躅', reading: 'つつじ', meaning: 'ツツジ', category: '植物' },
  { kanji: '満天星', reading: 'どうだんつつじ', meaning: 'ドウダンツツジ', category: '植物' },
  { kanji: '蕺草', reading: 'どくだみ', meaning: 'ドクダミ', category: '植物' },
  { kanji: '薇', reading: 'ぜんまい', meaning: 'ゼンマイ', category: '植物' },
  { kanji: '零余子', reading: 'むかご', meaning: 'ムカゴ', category: '植物' },
  { kanji: '通草', reading: 'あけび', meaning: 'アケビ', category: '植物' },

  // ─── 食べ物 (23) ───
  { kanji: '心太', reading: 'ところてん', meaning: '海藻から作る食品', category: '食べ物' },
  { kanji: '饂飩', reading: 'うどん', meaning: 'うどん', category: '食べ物' },
  { kanji: '外郎', reading: 'ういろう', meaning: '和菓子の一種', category: '食べ物' },
  { kanji: '蒟蒻', reading: 'こんにゃく', meaning: 'コンニャク', category: '食べ物' },
  { kanji: '御強', reading: 'おこわ', meaning: 'もち米を蒸した飯', category: '食べ物' },
  { kanji: '薩摩芋', reading: 'さつまいも', meaning: 'サツマイモ', category: '食べ物' },
  { kanji: '牛蒡', reading: 'ごぼう', meaning: 'ゴボウ', category: '食べ物' },
  { kanji: '玉蜀黍', reading: 'とうもろこし', meaning: 'トウモロコシ', category: '食べ物' },
  { kanji: '胡瓜', reading: 'きゅうり', meaning: 'キュウリ', category: '食べ物' },
  { kanji: '南瓜', reading: 'かぼちゃ', meaning: 'カボチャ', category: '食べ物' },
  { kanji: '搾菜', reading: 'ざーさい', meaning: 'ザーサイ', category: '食べ物' },
  { kanji: '雲呑', reading: 'わんたん', meaning: 'ワンタン', category: '食べ物' },
  { kanji: '焼売', reading: 'しゅうまい', meaning: 'シュウマイ', category: '食べ物' },
  { kanji: '叉焼', reading: 'ちゃーしゅー', meaning: 'チャーシュー', category: '食べ物' },
  { kanji: '粽', reading: 'ちまき', meaning: 'ちまき', category: '食べ物' },
  { kanji: '汁粉', reading: 'しるこ', meaning: '小豆の汁に餅を入れたもの', category: '食べ物' },
  { kanji: '御節', reading: 'おせち', meaning: '正月料理', category: '食べ物' },
  { kanji: '味醂', reading: 'みりん', meaning: '調味料', category: '食べ物' },
  { kanji: '甘藍', reading: 'きゃべつ', meaning: 'キャベツ', category: '食べ物' },
  { kanji: '独活', reading: 'うど', meaning: 'ウド（山菜）', category: '食べ物' },
  { kanji: '占地', reading: 'しめじ', meaning: 'シメジ', category: '食べ物' },
  { kanji: '鹿尾菜', reading: 'ひじき', meaning: 'ヒジキ', category: '食べ物' },
  { kanji: '若布', reading: 'わかめ', meaning: 'ワカメ', category: '食べ物' },

  // ─── 体 (18) ───
  { kanji: '項', reading: 'うなじ', meaning: '首の後ろ', category: '体' },
  { kanji: '臍', reading: 'へそ', meaning: 'おへそ', category: '体' },
  { kanji: '踵', reading: 'かかと', meaning: '足の後部', category: '体' },
  { kanji: '睫毛', reading: 'まつげ', meaning: 'まつ毛', category: '体' },
  { kanji: '脹脛', reading: 'ふくらはぎ', meaning: 'ふくらはぎ', category: '体' },
  { kanji: '足裏', reading: 'あしうら', meaning: '足の裏', category: '体' },
  { kanji: '肘', reading: 'ひじ', meaning: '腕の関節', category: '体' },
  { kanji: '腋', reading: 'わき', meaning: '脇の下', category: '体' },
  { kanji: '鳩尾', reading: 'みぞおち', meaning: '胸の下のくぼみ', category: '体' },
  { kanji: '黒子', reading: 'ほくろ', meaning: '皮膚の小さな黒い点', category: '体' },
  { kanji: '旋毛', reading: 'つむじ', meaning: '頭頂部の毛の渦', category: '体' },
  { kanji: '拳', reading: 'こぶし', meaning: '握った手', category: '体' },
  { kanji: '顎', reading: 'あご', meaning: '下あご', category: '体' },
  { kanji: '腓', reading: 'こむら', meaning: 'ふくらはぎ（古語）', category: '体' },
  { kanji: '眦', reading: 'まなじり', meaning: '目尻', category: '体' },
  { kanji: '瞼', reading: 'まぶた', meaning: '目のふた', category: '体' },
  { kanji: '靨', reading: 'えくぼ', meaning: '笑った時の頬のくぼみ', category: '体' },
  { kanji: '蟀谷', reading: 'こめかみ', meaning: '側頭部', category: '体' },

  // ─── 自然 (20) ───
  { kanji: '飛沫', reading: 'しぶき', meaning: '飛び散る水滴', category: '自然' },
  { kanji: '陽炎', reading: 'かげろう', meaning: '地面からのゆらめき', category: '自然' },
  { kanji: '木枯らし', reading: 'こがらし', meaning: '晩秋の冷たい風', category: '自然' },
  { kanji: '時雨', reading: 'しぐれ', meaning: '秋から冬の通り雨', category: '自然' },
  { kanji: '霙', reading: 'みぞれ', meaning: '雨と雪が混じったもの', category: '自然' },
  { kanji: '霰', reading: 'あられ', meaning: '氷の粒', category: '自然' },
  { kanji: '雹', reading: 'ひょう', meaning: '大きな氷の粒', category: '自然' },
  { kanji: '東雲', reading: 'しののめ', meaning: '夜明け前の空', category: '自然' },
  { kanji: '黄昏', reading: 'たそがれ', meaning: '夕暮れ時', category: '自然' },
  { kanji: '朧月', reading: 'おぼろづき', meaning: 'かすんだ月', category: '自然' },
  { kanji: '五月雨', reading: 'さみだれ', meaning: '梅雨の雨', category: '自然' },
  { kanji: '吹雪', reading: 'ふぶき', meaning: '強風と雪', category: '自然' },
  { kanji: '雪崩', reading: 'なだれ', meaning: '山の雪が崩れ落ちること', category: '自然' },
  { kanji: '海嘯', reading: 'つなみ', meaning: '津波', category: '自然' },
  { kanji: '竜巻', reading: 'たつまき', meaning: '渦状の暴風', category: '自然' },
  { kanji: '篝火', reading: 'かがりび', meaning: '燃やすたいまつの火', category: '自然' },
  { kanji: '風花', reading: 'かざはな', meaning: '晴天に舞う雪', category: '自然' },
  { kanji: '氷柱', reading: 'つらら', meaning: '垂れ下がった氷', category: '自然' },
  { kanji: '霞', reading: 'かすみ', meaning: '春のもや', category: '自然' },
  { kanji: '朝凪', reading: 'あさなぎ', meaning: '朝の無風状態', category: '自然' },

  // ─── 日常 (25) ───
  { kanji: '煙草', reading: 'たばこ', meaning: 'タバコ', category: '日常' },
  { kanji: '硝子', reading: 'がらす', meaning: 'ガラス', category: '日常' },
  { kanji: '珈琲', reading: 'こーひー', meaning: 'コーヒー', category: '日常' },
  { kanji: '麦酒', reading: 'びーる', meaning: 'ビール', category: '日常' },
  { kanji: '釦', reading: 'ぼたん', meaning: 'ボタン', category: '日常' },
  { kanji: '合羽', reading: 'かっぱ', meaning: 'レインコート', category: '日常' },
  { kanji: '浴衣', reading: 'ゆかた', meaning: '夏の和服', category: '日常' },
  { kanji: '草鞋', reading: 'わらじ', meaning: '藁で編んだ履物', category: '日常' },
  { kanji: '雪駄', reading: 'せった', meaning: '竹皮の履物', category: '日常' },
  { kanji: '如雨露', reading: 'じょうろ', meaning: '水やり道具', category: '日常' },
  { kanji: '天麩羅', reading: 'てんぷら', meaning: '天ぷら', category: '日常' },
  { kanji: '土産', reading: 'みやげ', meaning: 'おみやげ', category: '日常' },
  { kanji: '欠伸', reading: 'あくび', meaning: 'あくび', category: '日常' },
  { kanji: '素人', reading: 'しろうと', meaning: '専門でない人', category: '日常' },
  { kanji: '玄人', reading: 'くろうと', meaning: '専門家', category: '日常' },
  { kanji: '十八番', reading: 'おはこ', meaning: '得意なもの', category: '日常' },
  { kanji: '老舗', reading: 'しにせ', meaning: '古くからの店', category: '日常' },
  { kanji: '雑魚', reading: 'ざこ', meaning: '小さい魚・取るに足らないもの', category: '日常' },
  { kanji: '行灯', reading: 'あんどん', meaning: '昔の照明器具', category: '日常' },
  { kanji: '襖', reading: 'ふすま', meaning: '和室の間仕切り', category: '日常' },
  { kanji: '暖簾', reading: 'のれん', meaning: '店先の布', category: '日常' },
  { kanji: '団扇', reading: 'うちわ', meaning: 'うちわ', category: '日常' },
  { kanji: '案山子', reading: 'かかし', meaning: '田畑の鳥よけ', category: '日常' },
  { kanji: '胡坐', reading: 'あぐら', meaning: 'あぐら', category: '日常' },
  { kanji: '三味線', reading: 'しゃみせん', meaning: '日本の弦楽器', category: '日常' },

  // ─── 地名 (22) ───
  { kanji: '百舌鳥', reading: 'もず', meaning: '大阪府堺市の地名', category: '地名' },
  { kanji: '喜連瓜破', reading: 'きれうりわり', meaning: '大阪市の地名', category: '地名' },
  { kanji: '放出', reading: 'はなてん', meaning: '大阪市の地名', category: '地名' },
  { kanji: '枚方', reading: 'ひらかた', meaning: '大阪府の市名', category: '地名' },
  { kanji: '交野', reading: 'かたの', meaning: '大阪府の市名', category: '地名' },
  { kanji: '我孫子', reading: 'あびこ', meaning: '千葉県の市名', category: '地名' },
  { kanji: '匝瑳', reading: 'そうさ', meaning: '千葉県の市名', category: '地名' },
  { kanji: '酒々井', reading: 'しすい', meaning: '千葉県の町名', category: '地名' },
  { kanji: '五月女', reading: 'そうとめ', meaning: '栃木県の地名', category: '地名' },
  { kanji: '出石', reading: 'いずし', meaning: '兵庫県の地名', category: '地名' },
  { kanji: '各務原', reading: 'かかみがはら', meaning: '岐阜県の市名', category: '地名' },
  { kanji: '指宿', reading: 'いぶすき', meaning: '鹿児島県の市名', category: '地名' },
  { kanji: '帷子ノ辻', reading: 'かたびらのつじ', meaning: '京都の地名', category: '地名' },
  { kanji: '雑餉隈', reading: 'ざっしょのくま', meaning: '福岡市の地名', category: '地名' },
  { kanji: '特牛', reading: 'こっとい', meaning: '山口県の地名', category: '地名' },
  { kanji: '神鉄道場', reading: 'しんてつどうじょう', meaning: '兵庫県の地名', category: '地名' },
  { kanji: '安心院', reading: 'あじむ', meaning: '大分県の地名', category: '地名' },
  { kanji: '不入斗', reading: 'いりやまず', meaning: '神奈川県の地名', category: '地名' },
  { kanji: '社家', reading: 'しゃけ', meaning: '神奈川県の地名', category: '地名' },
  { kanji: '五十公野', reading: 'いじみの', meaning: '新潟県の地名', category: '地名' },
  { kanji: '南風原', reading: 'はえばる', meaning: '沖縄県の町名', category: '地名' },
  { kanji: '温泉津', reading: 'ゆのつ', meaning: '島根県の地名', category: '地名' },
];

/** カテゴリでフィルタした問題を取得する */
export function getEntriesByCategory(categoryKey: string): NandokuEntry[] {
  if (categoryKey === 'all') return nandokuKanjiData;
  return nandokuKanjiData.filter((e) => e.category === categoryKey);
}

/** 配列をシャッフルして指定数だけ取り出す */
export function shuffleEntries(entries: NandokuEntry[], count: number): NandokuEntry[] {
  const shuffled = [...entries];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

/** 正解を含む4択の選択肢を生成する */
export function generateChoices(
  correctEntry: NandokuEntry,
  allEntries: NandokuEntry[],
): string[] {
  const wrongPool = allEntries.filter((e) => e.reading !== correctEntry.reading);
  const shuffledWrong = shuffleEntries(wrongPool, Math.min(3, wrongPool.length));
  const choices = [correctEntry.reading, ...shuffledWrong.map((e) => e.reading)];

  // シャッフル
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}
