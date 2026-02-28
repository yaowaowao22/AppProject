export interface Yojijukugo {
  idiom: string;
  reading: string;
  meaning: string;
  level: 'basic' | 'intermediate' | 'advanced';
}

// ============================
// 初級 (basic) - 45 entries
// ============================
// ============================
// 中級 (intermediate) - 42 entries
// ============================
// ============================
// 上級 (advanced) - 43 entries
// ============================

export const yojijukugoData: Yojijukugo[] = [
  // ===== 初級 (basic) =====
  { idiom: '一石二鳥', reading: 'いっせきにちょう', meaning: '一つの行動で二つの利益を得ること', level: 'basic' },
  { idiom: '四面楚歌', reading: 'しめんそか', meaning: '周囲がすべて敵で孤立無援の状態', level: 'basic' },
  { idiom: '一期一会', reading: 'いちごいちえ', meaning: '一生に一度の出会いを大切にすること', level: 'basic' },
  { idiom: '七転八起', reading: 'しちてんはっき', meaning: '何度失敗しても諦めずに立ち上がること', level: 'basic' },
  { idiom: '以心伝心', reading: 'いしんでんしん', meaning: '言葉を使わなくても気持ちが通じ合うこと', level: 'basic' },
  { idiom: '自業自得', reading: 'じごうじとく', meaning: '自分の行いの報いを自分が受けること', level: 'basic' },
  { idiom: '温故知新', reading: 'おんこちしん', meaning: '昔のことを学んで新しい知識を得ること', level: 'basic' },
  { idiom: '起死回生', reading: 'きしかいせい', meaning: '絶望的な状態から立て直すこと', level: 'basic' },
  { idiom: '弱肉強食', reading: 'じゃくにくきょうしょく', meaning: '強い者が弱い者を餌食にすること', level: 'basic' },
  { idiom: '十人十色', reading: 'じゅうにんといろ', meaning: '人それぞれ考えや好みが違うこと', level: 'basic' },
  { idiom: '一日千秋', reading: 'いちじつせんしゅう', meaning: '待ち遠しく思うこと', level: 'basic' },
  { idiom: '半信半疑', reading: 'はんしんはんぎ', meaning: '半分信じ半分疑うこと', level: 'basic' },
  { idiom: '一心不乱', reading: 'いっしんふらん', meaning: '一つのことに集中して他に心を乱されないこと', level: 'basic' },
  { idiom: '因果応報', reading: 'いんがおうほう', meaning: '善い行いには善い報い、悪い行いには悪い報いがあること', level: 'basic' },
  { idiom: '単刀直入', reading: 'たんとうちょくにゅう', meaning: '前置きなしに本題に入ること', level: 'basic' },
  { idiom: '二束三文', reading: 'にそくさんもん', meaning: '非常に安い値段であること', level: 'basic' },
  { idiom: '三日坊主', reading: 'みっかぼうず', meaning: '物事が長続きしないこと', level: 'basic' },
  { idiom: '大器晩成', reading: 'たいきばんせい', meaning: '大人物は遅れて頭角を現すということ', level: 'basic' },
  { idiom: '一刀両断', reading: 'いっとうりょうだん', meaning: '思い切ってきっぱり決断すること', level: 'basic' },
  { idiom: '一朝一夕', reading: 'いっちょういっせき', meaning: 'わずかな期間のこと', level: 'basic' },
  { idiom: '五里霧中', reading: 'ごりむちゅう', meaning: '方向を見失い迷うこと', level: 'basic' },
  { idiom: '我田引水', reading: 'がでんいんすい', meaning: '自分に都合のいいように物事を進めること', level: 'basic' },
  { idiom: '花鳥風月', reading: 'かちょうふうげつ', meaning: '自然の美しい風景や風物', level: 'basic' },
  { idiom: '完全無欠', reading: 'かんぜんむけつ', meaning: '欠点がまったくないこと', level: 'basic' },
  { idiom: '喜怒哀楽', reading: 'きどあいらく', meaning: '喜び・怒り・悲しみ・楽しみの感情', level: 'basic' },
  { idiom: '空前絶後', reading: 'くうぜんぜつご', meaning: '過去にも将来にも例がないこと', level: 'basic' },
  { idiom: '公明正大', reading: 'こうめいせいだい', meaning: '私心がなく公正で堂々としていること', level: 'basic' },
  { idiom: '言語道断', reading: 'ごんごどうだん', meaning: 'もってのほかでとんでもないこと', level: 'basic' },
  { idiom: '才色兼備', reading: 'さいしょくけんび', meaning: '才能と美貌を兼ね備えていること', level: 'basic' },
  { idiom: '自画自賛', reading: 'じがじさん', meaning: '自分で自分を褒めること', level: 'basic' },
  { idiom: '四苦八苦', reading: 'しくはっく', meaning: '非常に苦労すること', level: 'basic' },
  { idiom: '試行錯誤', reading: 'しこうさくご', meaning: '何度も失敗を繰り返しながら解決策を見つけること', level: 'basic' },
  { idiom: '質実剛健', reading: 'しつじつごうけん', meaning: '飾り気がなく真面目で心身ともに強いこと', level: 'basic' },
  { idiom: '首尾一貫', reading: 'しゅびいっかん', meaning: '始めから終わりまで態度や方針が変わらないこと', level: 'basic' },
  { idiom: '順風満帆', reading: 'じゅんぷうまんぱん', meaning: '物事がすべて順調に進むこと', level: 'basic' },
  { idiom: '心機一転', reading: 'しんきいってん', meaning: 'あることをきっかけに気持ちを入れ替えること', level: 'basic' },
  { idiom: '晴耕雨読', reading: 'せいこううどく', meaning: '晴れた日は耕し雨の日は読書する悠々自適の生活', level: 'basic' },
  { idiom: '前代未聞', reading: 'ぜんだいみもん', meaning: '今まで聞いたことがないほど珍しいこと', level: 'basic' },
  { idiom: '天真爛漫', reading: 'てんしんらんまん', meaning: '飾り気がなく無邪気であること', level: 'basic' },
  { idiom: '二人三脚', reading: 'ににんさんきゃく', meaning: '二人が協力して物事に取り組むこと', level: 'basic' },
  { idiom: '八方美人', reading: 'はっぽうびじん', meaning: '誰にでもよい顔をする人', level: 'basic' },
  { idiom: '百発百中', reading: 'ひゃっぱつひゃくちゅう', meaning: '予想や計画がすべて的中すること', level: 'basic' },
  { idiom: '無我夢中', reading: 'むがむちゅう', meaning: '物事に熱中して我を忘れること', level: 'basic' },
  { idiom: '油断大敵', reading: 'ゆだんたいてき', meaning: '油断は最大の敵であるということ', level: 'basic' },
  { idiom: '臨機応変', reading: 'りんきおうへん', meaning: 'その場の状況に応じて適切に対応すること', level: 'basic' },

  // ===== 中級 (intermediate) =====
  { idiom: '臥薪嘗胆', reading: 'がしんしょうたん', meaning: '復讐のために苦労に耐えること。目的のために辛抱すること', level: 'intermediate' },
  { idiom: '画竜点睛', reading: 'がりょうてんせい', meaning: '物事を完成させるための最後の仕上げ', level: 'intermediate' },
  { idiom: '呉越同舟', reading: 'ごえつどうしゅう', meaning: '仲の悪い者同士が同じ場所に居合わせること', level: 'intermediate' },
  { idiom: '朝令暮改', reading: 'ちょうれいぼかい', meaning: '命令や方針がすぐに変わって一定しないこと', level: 'intermediate' },
  { idiom: '天衣無縫', reading: 'てんいむほう', meaning: '自然のままで飾り気がなく完璧であること', level: 'intermediate' },
  { idiom: '切磋琢磨', reading: 'せっさたくま', meaning: '互いに励まし合い学問や人格を磨くこと', level: 'intermediate' },
  { idiom: '意気投合', reading: 'いきとうごう', meaning: '互いの気持ちや考えがぴったり合うこと', level: 'intermediate' },
  { idiom: '異口同音', reading: 'いくどうおん', meaning: '多くの人が口を揃えて同じことを言うこと', level: 'intermediate' },
  { idiom: '一蓮托生', reading: 'いちれんたくしょう', meaning: '結果の善悪にかかわらず行動や運命をともにすること', level: 'intermediate' },
  { idiom: '一網打尽', reading: 'いちもうだじん', meaning: '一度にすべて捕まえること', level: 'intermediate' },
  { idiom: '右往左往', reading: 'うおうさおう', meaning: 'うろたえてあちこち動き回ること', level: 'intermediate' },
  { idiom: '紆余曲折', reading: 'うよきょくせつ', meaning: '事情が込み入って複雑な経過をたどること', level: 'intermediate' },
  { idiom: '岡目八目', reading: 'おかめはちもく', meaning: '第三者の方が当事者よりも冷静に判断できること', level: 'intermediate' },
  { idiom: '針小棒大', reading: 'しんしょうぼうだい', meaning: '小さなことを大げさに言うこと', level: 'intermediate' },
  { idiom: '粉骨砕身', reading: 'ふんこつさいしん', meaning: '力の限り努力すること', level: 'intermediate' },
  { idiom: '厚顔無恥', reading: 'こうがんむち', meaning: '厚かましくて恥知らずであること', level: 'intermediate' },
  { idiom: '疑心暗鬼', reading: 'ぎしんあんき', meaning: '疑いの心があると何でも恐ろしく感じること', level: 'intermediate' },
  { idiom: '危機一髪', reading: 'ききいっぱつ', meaning: '非常に危険な瀬戸際', level: 'intermediate' },
  { idiom: '快刀乱麻', reading: 'かいとうらんま', meaning: '複雑な問題を鮮やかに解決すること', level: 'intermediate' },
  { idiom: '一挙両得', reading: 'いっきょりょうとく', meaning: '一つの行動で二つの利益を得ること', level: 'intermediate' },
  { idiom: '馬耳東風', reading: 'ばじとうふう', meaning: '人の意見や忠告を聞き流して気にしないこと', level: 'intermediate' },
  { idiom: '傍若無人', reading: 'ぼうじゃくぶじん', meaning: '人目を気にせず勝手にふるまうこと', level: 'intermediate' },
  { idiom: '本末転倒', reading: 'ほんまつてんとう', meaning: '重要なことと些細なことを取り違えること', level: 'intermediate' },
  { idiom: '竜頭蛇尾', reading: 'りゅうとうだび', meaning: '始めは勢いがよいが終わりは振るわないこと', level: 'intermediate' },
  { idiom: '良妻賢母', reading: 'りょうさいけんぼ', meaning: 'よい妻であり賢い母であること', level: 'intermediate' },
  { idiom: '電光石火', reading: 'でんこうせっか', meaning: '非常に素早い動作やごく短い時間のたとえ', level: 'intermediate' },
  { idiom: '独立独歩', reading: 'どくりつどっぽ', meaning: '他に頼らず自分の力で進むこと', level: 'intermediate' },
  { idiom: '二律背反', reading: 'にりつはいはん', meaning: '二つの命題が互いに矛盾し合うこと', level: 'intermediate' },
  { idiom: '波瀾万丈', reading: 'はらんばんじょう', meaning: '変化が激しく劇的な様子', level: 'intermediate' },
  { idiom: '付和雷同', reading: 'ふわらいどう', meaning: '自分の考えを持たず他人の意見にすぐ同調すること', level: 'intermediate' },
  { idiom: '抱腹絶倒', reading: 'ほうふくぜっとう', meaning: '腹を抱えて大笑いすること', level: 'intermediate' },
  { idiom: '満身創痍', reading: 'まんしんそうい', meaning: '全身が傷だらけの状態', level: 'intermediate' },
  { idiom: '無味乾燥', reading: 'むみかんそう', meaning: '面白みや潤いがまったくないこと', level: 'intermediate' },
  { idiom: '門前雀羅', reading: 'もんぜんじゃくら', meaning: '訪れる人がなく閑散としていること', level: 'intermediate' },
  { idiom: '優柔不断', reading: 'ゆうじゅうふだん', meaning: 'ぐずぐずしていて決断できないこと', level: 'intermediate' },
  { idiom: '用意周到', reading: 'よういしゅうとう', meaning: '準備が隅々まで行き届いていること', level: 'intermediate' },
  { idiom: '羊頭狗肉', reading: 'ようとうくにく', meaning: '見かけは立派だが中身が伴わないこと', level: 'intermediate' },
  { idiom: '大同小異', reading: 'だいどうしょうい', meaning: '大体同じで細かい違いがあること', level: 'intermediate' },
  { idiom: '朝三暮四', reading: 'ちょうさんぼし', meaning: '目先の違いにとらわれて本質を見失うこと', level: 'intermediate' },
  { idiom: '美辞麗句', reading: 'びじれいく', meaning: '聞こえのよい美しい言葉', level: 'intermediate' },
  { idiom: '一騎当千', reading: 'いっきとうせん', meaning: '一人で千人の敵に当たるほど強いこと', level: 'intermediate' },
  { idiom: '取捨選択', reading: 'しゅしゃせんたく', meaning: '必要なものを選び不要なものを捨てること', level: 'intermediate' },

  // ===== 上級 (advanced) =====
  { idiom: '和光同塵', reading: 'わこうどうじん', meaning: '才能を隠して世俗に交わること', level: 'advanced' },
  { idiom: '明鏡止水', reading: 'めいきょうしすい', meaning: '邪念がなく澄み切った心の状態', level: 'advanced' },
  { idiom: '慇懃無礼', reading: 'いんぎんぶれい', meaning: '表面は丁寧だが実は尊大で無礼なこと', level: 'advanced' },
  { idiom: '夜郎自大', reading: 'やろうじだい', meaning: '自分の力量を知らず偉そうにすること', level: 'advanced' },
  { idiom: '換骨奪胎', reading: 'かんこつだったい', meaning: '先人の作品の趣旨を生かしつつ独自のものにすること', level: 'advanced' },
  { idiom: '曖昧模糊', reading: 'あいまいもこ', meaning: 'ぼんやりしてはっきりしないこと', level: 'advanced' },
  { idiom: '暗中模索', reading: 'あんちゅうもさく', meaning: '手がかりがないまま探り求めること', level: 'advanced' },
  { idiom: '威風堂々', reading: 'いふうどうどう', meaning: '態度や雰囲気に威厳があり堂々としていること', level: 'advanced' },
  { idiom: '栄枯盛衰', reading: 'えいこせいすい', meaning: '栄えたり衰えたりすること', level: 'advanced' },
  { idiom: '奇想天外', reading: 'きそうてんがい', meaning: '普通では考えられないほど奇抜であること', level: 'advanced' },
  { idiom: '旧態依然', reading: 'きゅうたいいぜん', meaning: '昔のままで少しも進歩していないこと', level: 'advanced' },
  { idiom: '荒唐無稽', reading: 'こうとうむけい', meaning: '言動に根拠がなくでたらめであること', level: 'advanced' },
  { idiom: '古今東西', reading: 'ここんとうざい', meaning: 'いつでもどこでも。あらゆる時代と場所', level: 'advanced' },
  { idiom: '錦上添花', reading: 'きんじょうてんか', meaning: '良いものにさらに良いものを加えること', level: 'advanced' },
  { idiom: '鶏口牛後', reading: 'けいこうぎゅうご', meaning: '大きな組織の末端より小さな組織の長がよいということ', level: 'advanced' },
  { idiom: '乾坤一擲', reading: 'けんこんいってき', meaning: '運命をかけて大勝負をすること', level: 'advanced' },
  { idiom: '厚徳載物', reading: 'こうとくさいぶつ', meaning: '深い徳のある人はすべてを包容できること', level: 'advanced' },
  { idiom: '三位一体', reading: 'さんみいったい', meaning: '三つのものが一つになって不可分であること', level: 'advanced' },
  { idiom: '自暴自棄', reading: 'じぼうじき', meaning: 'やけになって自分を粗末にすること', level: 'advanced' },
  { idiom: '森羅万象', reading: 'しんらばんしょう', meaning: '宇宙に存在するすべてのもの', level: 'advanced' },
  { idiom: '酔生夢死', reading: 'すいせいむし', meaning: '何もせずにぼんやりと一生を過ごすこと', level: 'advanced' },
  { idiom: '盛者必衰', reading: 'じょうしゃひっすい', meaning: '勢いの盛んな者もいつかは必ず衰えること', level: 'advanced' },
  { idiom: '泰然自若', reading: 'たいぜんじじゃく', meaning: '落ち着き払って少しも動じないこと', level: 'advanced' },
  { idiom: '大言壮語', reading: 'たいげんそうご', meaning: '威勢のいいことを大げさに言うこと', level: 'advanced' },
  { idiom: '天下泰平', reading: 'てんかたいへい', meaning: '世の中が穏やかに治まっていること', level: 'advanced' },
  { idiom: '天地無用', reading: 'てんちむよう', meaning: '上下を逆にしてはいけないこと', level: 'advanced' },
  { idiom: '博覧強記', reading: 'はくらんきょうき', meaning: '広く書物を読み記憶力が優れていること', level: 'advanced' },
  { idiom: '不撓不屈', reading: 'ふとうふくつ', meaning: '困難にも負けず意志を貫くこと', level: 'advanced' },
  { idiom: '偏頗依怙', reading: 'へんぱえこ', meaning: '一方に片寄って不公平であること', level: 'advanced' },
  { idiom: '傲岸不遜', reading: 'ごうがんふそん', meaning: 'おごり高ぶって人を見下すこと', level: 'advanced' },
  { idiom: '魑魅魍魎', reading: 'ちみもうりょう', meaning: 'さまざまな化け物。悪い人々のたとえ', level: 'advanced' },
  { idiom: '百花繚乱', reading: 'ひゃっかりょうらん', meaning: '多くの花が咲き乱れる。優れたものが多く現れること', level: 'advanced' },
  { idiom: '不倶戴天', reading: 'ふぐたいてん', meaning: '同じ空の下には生かしておけないほど恨みが深いこと', level: 'advanced' },
  { idiom: '面目躍如', reading: 'めんもくやくじょ', meaning: '世間の評価に値する活躍を見せること', level: 'advanced' },
  { idiom: '唯我独尊', reading: 'ゆいがどくそん', meaning: '自分だけが最も優れているとうぬぼれること', level: 'advanced' },
  { idiom: '六根清浄', reading: 'ろっこんしょうじょう', meaning: '六つの感覚器官を清めて欲や迷いを断つこと', level: 'advanced' },
  { idiom: '阿鼻叫喚', reading: 'あびきょうかん', meaning: '非常にむごたらしい状態のたとえ', level: 'advanced' },
  { idiom: '有為転変', reading: 'ういてんぺん', meaning: '世の中の物事は常に移り変わること', level: 'advanced' },
  { idiom: '内憂外患', reading: 'ないゆうがいかん', meaning: '国内の心配事と外国からの脅威', level: 'advanced' },
  { idiom: '天壌無窮', reading: 'てんじょうむきゅう', meaning: '天地とともに永遠に続くこと', level: 'advanced' },
  { idiom: '罵詈雑言', reading: 'ばりぞうごん', meaning: '口汚い悪口を並べ立てること', level: 'advanced' },
  { idiom: '支離滅裂', reading: 'しりめつれつ', meaning: '物事の筋道が通らずバラバラであること', level: 'advanced' },
  { idiom: '諸行無常', reading: 'しょぎょうむじょう', meaning: 'この世のすべてのものは絶えず変化するということ', level: 'advanced' },
];

// ============================
// レベルラベル
// ============================
export const LEVEL_OPTIONS: { key: Yojijukugo['level']; label: string }[] = [
  { key: 'basic', label: '初級' },
  { key: 'intermediate', label: '中級' },
  { key: 'advanced', label: '上級' },
];

export const LEVEL_LABELS: Record<Yojijukugo['level'], string> = {
  basic: '初級',
  intermediate: '中級',
  advanced: '上級',
};

// ============================
// クイズモード
// ============================
export type QuizMode = 'meaning' | 'reading' | 'fill';

export const QUIZ_MODES: { key: QuizMode; label: string }[] = [
  { key: 'meaning', label: '意味→四字熟語' },
  { key: 'reading', label: '読み問題' },
  { key: 'fill', label: '穴埋め問題' },
];

export const QUIZ_MODE_LABELS: Record<QuizMode, string> = {
  meaning: '意味→四字熟語',
  reading: '読み問題',
  fill: '穴埋め問題',
};

// ============================
// 出題数
// ============================
export type QuizCount = 10 | 20 | 30;

export const COUNT_OPTIONS: { label: string; value: QuizCount }[] = [
  { label: '10問', value: 10 },
  { label: '20問', value: 20 },
  { label: '30問', value: 30 },
];

// ============================
// 生成された問題型
// ============================
export interface GeneratedQuestion {
  idiom: Yojijukugo;
  questionText: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

// ============================
// 結果型
// ============================
export interface QuizResult {
  id: string;
  date: string;
  level: string;
  quizMode: string;
  correct: number;
  total: number;
  timeSeconds: number;
}

// ============================
// ユーティリティ関数
// ============================
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getByLevel(level: Yojijukugo['level']): Yojijukugo[] {
  return yojijukugoData.filter((y) => y.level === level);
}

// --- 意味→四字熟語モード ---
function generateMeaningQuestion(
  target: Yojijukugo,
  pool: Yojijukugo[]
): GeneratedQuestion {
  const correctAnswer = target.idiom;
  const wrongs: string[] = [];
  const used = new Set<string>([correctAnswer]);
  const shuffled = shuffleArray(pool);
  for (const item of shuffled) {
    if (!used.has(item.idiom) && wrongs.length < 3) {
      wrongs.push(item.idiom);
      used.add(item.idiom);
    }
  }
  // Fallback: pull from entire dataset
  if (wrongs.length < 3) {
    const allShuffled = shuffleArray(yojijukugoData);
    for (const item of allShuffled) {
      if (!used.has(item.idiom) && wrongs.length < 3) {
        wrongs.push(item.idiom);
        used.add(item.idiom);
      }
    }
  }

  const allChoices = shuffleArray([correctAnswer, ...wrongs]);
  const correctIndex = allChoices.indexOf(correctAnswer);

  return {
    idiom: target,
    questionText: target.meaning,
    choices: allChoices,
    correctIndex,
    explanation: `${target.idiom}（${target.reading}）\n${target.meaning}`,
  };
}

// --- 読み問題モード ---
function generateReadingQuestion(
  target: Yojijukugo,
  pool: Yojijukugo[]
): GeneratedQuestion {
  const correctAnswer = target.reading;
  const wrongs: string[] = [];
  const used = new Set<string>([correctAnswer]);
  const shuffled = shuffleArray(pool);
  for (const item of shuffled) {
    if (!used.has(item.reading) && wrongs.length < 3) {
      wrongs.push(item.reading);
      used.add(item.reading);
    }
  }
  if (wrongs.length < 3) {
    const allShuffled = shuffleArray(yojijukugoData);
    for (const item of allShuffled) {
      if (!used.has(item.reading) && wrongs.length < 3) {
        wrongs.push(item.reading);
        used.add(item.reading);
      }
    }
  }

  const allChoices = shuffleArray([correctAnswer, ...wrongs]);
  const correctIndex = allChoices.indexOf(correctAnswer);

  return {
    idiom: target,
    questionText: target.idiom,
    choices: allChoices,
    correctIndex,
    explanation: `${target.idiom}（${target.reading}）\n${target.meaning}`,
  };
}

// --- 穴埋めモード ---
function generateFillQuestion(
  target: Yojijukugo,
  pool: Yojijukugo[]
): GeneratedQuestion {
  const chars = target.idiom.split('');
  const blankIndex = Math.floor(Math.random() * 4);
  const correctChar = chars[blankIndex];
  const displayChars = chars.map((c, i) => (i === blankIndex ? '○' : c));
  const displayText = displayChars.join('');

  const wrongs: string[] = [];
  const used = new Set<string>([correctChar]);

  // Collect candidate characters from other idioms
  const candidateChars: string[] = [];
  for (const item of pool) {
    for (const c of item.idiom.split('')) {
      if (!used.has(c)) {
        candidateChars.push(c);
      }
    }
  }
  const shuffledCandidates = shuffleArray([...new Set(candidateChars)]);
  for (const c of shuffledCandidates) {
    if (!used.has(c) && wrongs.length < 3) {
      wrongs.push(c);
      used.add(c);
    }
  }

  // Fallback from entire dataset
  if (wrongs.length < 3) {
    const allCandidates: string[] = [];
    for (const item of yojijukugoData) {
      for (const c of item.idiom.split('')) {
        if (!used.has(c)) {
          allCandidates.push(c);
        }
      }
    }
    const fallbackShuffled = shuffleArray([...new Set(allCandidates)]);
    for (const c of fallbackShuffled) {
      if (!used.has(c) && wrongs.length < 3) {
        wrongs.push(c);
        used.add(c);
      }
    }
  }

  const allChoices = shuffleArray([correctChar, ...wrongs]);
  const correctIndex = allChoices.indexOf(correctChar);

  return {
    idiom: target,
    questionText: displayText,
    choices: allChoices,
    correctIndex,
    explanation: `${target.idiom}（${target.reading}）\n${target.meaning}`,
  };
}

// ============================
// メイン生成関数
// ============================
export function generateQuestions(
  level: Yojijukugo['level'],
  mode: QuizMode,
  count: number
): GeneratedQuestion[] {
  const pool = getByLevel(level);
  if (pool.length === 0) return [];

  let selected: Yojijukugo[];
  if (pool.length >= count) {
    selected = shuffleArray(pool).slice(0, count);
  } else {
    selected = [];
    while (selected.length < count) {
      selected = selected.concat(shuffleArray(pool));
    }
    selected = selected.slice(0, count);
  }

  return selected.map((target) => {
    switch (mode) {
      case 'meaning':
        return generateMeaningQuestion(target, pool);
      case 'reading':
        return generateReadingQuestion(target, pool);
      case 'fill':
        return generateFillQuestion(target, pool);
    }
  });
}
