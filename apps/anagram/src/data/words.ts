import type { Difficulty } from '../types';

export interface WordEntry {
  word: string;
  hint: string;
  category: string;
}

export const words: WordEntry[] = [
  // 動物 (Animals)
  { word: 'パンダ', hint: '白黒の動物', category: '動物' },
  { word: 'キリン', hint: '首が長い動物', category: '動物' },
  { word: 'ウサギ', hint: '耳が長い動物', category: '動物' },
  { word: 'ライオン', hint: '百獣の王', category: '動物' },
  { word: 'ゴリラ', hint: '力強い霊長類', category: '動物' },
  { word: 'ペンギン', hint: '南極に住む鳥', category: '動物' },
  { word: 'イルカ', hint: '海の賢い哺乳類', category: '動物' },
  { word: 'コアラ', hint: 'ユーカリが好きな動物', category: '動物' },
  { word: 'カンガルー', hint: 'お腹に袋がある動物', category: '動物' },
  { word: 'ハムスター', hint: '小さくて頬袋がある', category: '動物' },
  { word: 'チーター', hint: '世界最速の陸上動物', category: '動物' },
  { word: 'フラミンゴ', hint: 'ピンク色の鳥', category: '動物' },
  { word: 'カメレオン', hint: '色が変わる爬虫類', category: '動物' },
  { word: 'アルパカ', hint: 'ふわふわの毛を持つ', category: '動物' },
  { word: 'ラッコ', hint: '海で貝を割る動物', category: '動物' },
  { word: 'ヒョウ', hint: '斑点模様のネコ科', category: '動物' },
  { word: 'カバ', hint: '水辺に住む大きな動物', category: '動物' },
  { word: 'サイ', hint: '角がある大きな動物', category: '動物' },
  { word: 'シマウマ', hint: '白黒の縞模様', category: '動物' },
  { word: 'ダチョウ', hint: '飛べない大きな鳥', category: '動物' },
  { word: 'オランウータン', hint: '森の賢い霊長類', category: '動物' },
  { word: 'カピバラ', hint: '世界最大のネズミの仲間', category: '動物' },
  { word: 'リス', hint: 'ドングリが好きな小動物', category: '動物' },
  { word: 'クジラ', hint: '海に住む最大の哺乳類', category: '動物' },
  { word: 'ワニ', hint: '水辺に住む爬虫類', category: '動物' },

  // 食べ物 (Food)
  { word: 'ラーメン', hint: '日本の人気麺料理', category: '食べ物' },
  { word: 'カレー', hint: 'スパイシーな料理', category: '食べ物' },
  { word: 'ピザ', hint: 'イタリア発祥の丸い食べ物', category: '食べ物' },
  { word: 'パスタ', hint: 'イタリアの麺料理', category: '食べ物' },
  { word: 'ハンバーガー', hint: 'バンズに挟んだ肉料理', category: '食べ物' },
  { word: 'チョコレート', hint: 'カカオから作る甘いお菓子', category: '食べ物' },
  { word: 'ドーナツ', hint: '穴が開いた揚げ菓子', category: '食べ物' },
  { word: 'クッキー', hint: '焼き菓子の定番', category: '食べ物' },
  { word: 'サンドイッチ', hint: 'パンに具を挟んだ食べ物', category: '食べ物' },
  { word: 'オムライス', hint: '卵で包んだご飯', category: '食べ物' },
  { word: 'タコス', hint: 'メキシコの代表料理', category: '食べ物' },
  { word: 'グラタン', hint: 'チーズをのせて焼く料理', category: '食べ物' },
  { word: 'プリン', hint: 'カラメルソースのデザート', category: '食べ物' },
  { word: 'ケーキ', hint: 'お祝いの甘いお菓子', category: '食べ物' },
  { word: 'ステーキ', hint: '焼いた厚切り肉', category: '食べ物' },
  { word: 'アイスクリーム', hint: '冷たくて甘いデザート', category: '食べ物' },
  { word: 'マカロン', hint: 'フランスのカラフルなお菓子', category: '食べ物' },
  { word: 'クレープ', hint: '薄い生地で包むお菓子', category: '食べ物' },
  { word: 'パンケーキ', hint: 'ふわふわの焼き菓子', category: '食べ物' },
  { word: 'コロッケ', hint: '衣をつけて揚げた料理', category: '食べ物' },
  { word: 'シチュー', hint: '煮込み料理', category: '食べ物' },
  { word: 'ナポリタン', hint: 'ケチャップ味のパスタ', category: '食べ物' },
  { word: 'ポテトサラダ', hint: 'ジャガイモのサラダ', category: '食べ物' },
  { word: 'バナナ', hint: '黄色い果物', category: '食べ物' },
  { word: 'メロン', hint: '高級な緑の果物', category: '食べ物' },
  { word: 'パイナップル', hint: 'トロピカルな果物', category: '食べ物' },

  // 国名 (Countries)
  { word: 'アメリカ', hint: '自由の女神がある国', category: '国名' },
  { word: 'イギリス', hint: 'ロンドンが首都の国', category: '国名' },
  { word: 'フランス', hint: 'エッフェル塔がある国', category: '国名' },
  { word: 'ドイツ', hint: 'ビールとソーセージの国', category: '国名' },
  { word: 'イタリア', hint: 'ピザとパスタの国', category: '国名' },
  { word: 'ブラジル', hint: 'サンバとサッカーの国', category: '国名' },
  { word: 'オーストラリア', hint: 'コアラとカンガルーの国', category: '国名' },
  { word: 'カナダ', hint: 'メープルシロップの国', category: '国名' },
  { word: 'ロシア', hint: '世界最大の面積の国', category: '国名' },
  { word: 'メキシコ', hint: 'タコスの発祥地', category: '国名' },
  { word: 'エジプト', hint: 'ピラミッドがある国', category: '国名' },
  { word: 'インド', hint: 'カレー発祥の国', category: '国名' },
  { word: 'スペイン', hint: 'フラメンコの国', category: '国名' },
  { word: 'ポルトガル', hint: 'カステラの起源の国', category: '国名' },
  { word: 'アルゼンチン', hint: 'タンゴの発祥地', category: '国名' },
  { word: 'タイ', hint: '微笑みの国', category: '国名' },
  { word: 'ベトナム', hint: 'フォーが有名な国', category: '国名' },
  { word: 'トルコ', hint: 'ヨーロッパとアジアの架け橋', category: '国名' },
  { word: 'ノルウェー', hint: 'フィヨルドの国', category: '国名' },
  { word: 'スイス', hint: 'チーズと時計の国', category: '国名' },
  { word: 'ギリシャ', hint: 'オリンピック発祥の国', category: '国名' },
  { word: 'フィンランド', hint: 'サウナとオーロラの国', category: '国名' },
  { word: 'シンガポール', hint: 'マーライオンの国', category: '国名' },
  { word: 'ニュージーランド', hint: 'キウイの国', category: '国名' },
  { word: 'モロッコ', hint: 'サハラ砂漠の入口', category: '国名' },
  { word: 'ペルー', hint: 'マチュピチュがある国', category: '国名' },

  // スポーツ (Sports)
  { word: 'サッカー', hint: 'ボールを蹴るスポーツ', category: 'スポーツ' },
  { word: 'テニス', hint: 'ラケットで打ち合う', category: 'スポーツ' },
  { word: 'バスケットボール', hint: 'リングにボールを入れる', category: 'スポーツ' },
  { word: 'バレーボール', hint: 'ネット越しに打ち合う', category: 'スポーツ' },
  { word: 'ゴルフ', hint: 'ボールを穴に入れる', category: 'スポーツ' },
  { word: 'スキー', hint: '雪山を滑るスポーツ', category: 'スポーツ' },
  { word: 'ボクシング', hint: 'グローブで戦う格闘技', category: 'スポーツ' },
  { word: 'マラソン', hint: '長距離を走る競技', category: 'スポーツ' },
  { word: 'バドミントン', hint: 'シャトルを打ち合う', category: 'スポーツ' },
  { word: 'ラグビー', hint: '楕円形のボールを使う', category: 'スポーツ' },
  { word: 'フェンシング', hint: '剣で戦うスポーツ', category: 'スポーツ' },
  { word: 'ハンドボール', hint: '手でボールを投げる', category: 'スポーツ' },
  { word: 'スノーボード', hint: '板で雪山を滑る', category: 'スポーツ' },
  { word: 'アーチェリー', hint: '弓で的を射る', category: 'スポーツ' },
  { word: 'カーリング', hint: '氷上でストーンを滑らせる', category: 'スポーツ' },
  { word: 'サーフィン', hint: '波に乗るスポーツ', category: 'スポーツ' },
  { word: 'クリケット', hint: 'イギリス発祥のバットスポーツ', category: 'スポーツ' },
  { word: 'ダイビング', hint: '水中に飛び込む競技', category: 'スポーツ' },
  { word: 'レスリング', hint: '組み合う格闘技', category: 'スポーツ' },
  { word: 'トライアスロン', hint: '三種目を連続で行う', category: 'スポーツ' },
  { word: 'フィギュアスケート', hint: '氷上で踊る競技', category: 'スポーツ' },
  { word: 'ボウリング', hint: 'ピンを倒すスポーツ', category: 'スポーツ' },
  { word: 'ホッケー', hint: 'スティックでボールを打つ', category: 'スポーツ' },
  { word: 'ヨガ', hint: '体と心を整える', category: 'スポーツ' },
  { word: 'ビリヤード', hint: 'キューで球を突く', category: 'スポーツ' },

  // 乗り物 (Vehicles)
  { word: 'タクシー', hint: '料金を払って乗る車', category: '乗り物' },
  { word: 'バス', hint: '大勢が乗れる車', category: '乗り物' },
  { word: 'ヘリコプター', hint: 'プロペラで飛ぶ乗り物', category: '乗り物' },
  { word: 'モノレール', hint: '一本のレールを走る', category: '乗り物' },
  { word: 'パトカー', hint: '警察の車', category: '乗り物' },
  { word: 'スクーター', hint: '小型の二輪車', category: '乗り物' },
  { word: 'トラック', hint: '荷物を運ぶ大型車', category: '乗り物' },
  { word: 'フェリー', hint: '海を渡る大型船', category: '乗り物' },
  { word: 'ロケット', hint: '宇宙に行く乗り物', category: '乗り物' },
  { word: 'カヌー', hint: '水上をパドルで進む', category: '乗り物' },
  { word: 'ゴンドラ', hint: 'ベネチアの水上乗り物', category: '乗り物' },
  { word: 'トロッコ', hint: 'レール上の小型車両', category: '乗り物' },
  { word: 'リムジン', hint: '長い高級車', category: '乗り物' },
  { word: 'ダンプカー', hint: '土砂を運ぶ車', category: '乗り物' },
  { word: 'クルーザー', hint: '豪華な船', category: '乗り物' },
  { word: 'ケーブルカー', hint: 'ケーブルで山を登る', category: '乗り物' },
  { word: 'セグウェイ', hint: '立って乗る電動の乗り物', category: '乗り物' },
  { word: 'ジェットスキー', hint: '水上を走るバイク', category: '乗り物' },
  { word: 'キックボード', hint: '足で蹴って進む', category: '乗り物' },
  { word: 'オートバイ', hint: 'エンジン付き二輪車', category: '乗り物' },
  { word: 'ショベルカー', hint: '地面を掘る車', category: '乗り物' },
  { word: 'スペースシャトル', hint: '宇宙を往復する乗り物', category: '乗り物' },
  { word: 'パラグライダー', hint: '空を飛ぶ布の翼', category: '乗り物' },
  { word: 'ヨット', hint: '風で進む船', category: '乗り物' },
  { word: 'リフト', hint: 'スキー場で山を登る', category: '乗り物' },

  // 日用品 (Daily items)
  { word: 'ハサミ', hint: '紙を切る道具', category: '日用品' },
  { word: 'タオル', hint: '体を拭くもの', category: '日用品' },
  { word: 'カレンダー', hint: '日付を確認するもの', category: '日用品' },
  { word: 'スリッパ', hint: '室内で履くもの', category: '日用品' },
  { word: 'シャンプー', hint: '髪を洗う液体', category: '日用品' },
  { word: 'ティッシュ', hint: '鼻をかむ紙', category: '日用品' },
  { word: 'リモコン', hint: 'テレビを操作する道具', category: '日用品' },
  { word: 'マグカップ', hint: '飲み物を入れる器', category: '日用品' },
  { word: 'エプロン', hint: '料理の時に着ける', category: '日用品' },
  { word: 'ハンガー', hint: '服を掛ける道具', category: '日用品' },
  { word: 'クッション', hint: 'ソファの上に置く柔らかいもの', category: '日用品' },
  { word: 'ドライヤー', hint: '髪を乾かす道具', category: '日用品' },
  { word: 'コースター', hint: 'コップの下に敷く', category: '日用品' },
  { word: 'カーテン', hint: '窓にかける布', category: '日用品' },
  { word: 'スプーン', hint: 'スープを飲む道具', category: '日用品' },
  { word: 'アイロン', hint: '服のしわを伸ばす', category: '日用品' },
  { word: 'フライパン', hint: '料理を焼く道具', category: '日用品' },
  { word: 'トースター', hint: 'パンを焼く家電', category: '日用品' },
  { word: 'ブラシ', hint: '髪をとかす道具', category: '日用品' },
  { word: 'ホチキス', hint: '紙を留める道具', category: '日用品' },
  { word: 'セロテープ', hint: '透明な粘着テープ', category: '日用品' },
  { word: 'ゴミバコ', hint: 'ゴミを捨てる容器', category: '日用品' },
  { word: 'マスク', hint: '顔に着ける衛生用品', category: '日用品' },
  { word: 'バケツ', hint: '水を入れる容器', category: '日用品' },
  { word: 'クリップ', hint: '紙を挟む小さな道具', category: '日用品' },
];

export function getWordsByDifficulty(difficulty: Difficulty): WordEntry[] {
  return words.filter((w) => {
    const len = w.word.length;
    switch (difficulty) {
      case 'easy':
        return len >= 2 && len <= 4;
      case 'medium':
        return len >= 5 && len <= 6;
      case 'hard':
        return len >= 7;
    }
  });
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function scrambleWord(word: string): string[] {
  const letters = word.split('');
  let scrambled = shuffleArray(letters);
  // Ensure the scrambled version is different from the original
  let attempts = 0;
  while (scrambled.join('') === word && attempts < 20) {
    scrambled = shuffleArray(letters);
    attempts++;
  }
  return scrambled;
}
