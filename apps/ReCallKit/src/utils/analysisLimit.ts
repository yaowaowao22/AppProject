import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'analysis_limit';
const FREE_LIMIT_PER_DAY = 3;

/**
 * 解析回数制限の有効/無効フラグ。
 * false = 無制限（開発・テスト用）
 * true  = 1日3回まで（本番用）
 * リリース前に true に戻すこと。
 */
const LIMIT_ENABLED = false;

interface AnalysisLimitData {
  date: string; // YYYY-MM-DD
  count: number;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function load(): Promise<AnalysisLimitData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: today(), count: 0 };
    const data = JSON.parse(raw) as AnalysisLimitData;
    // 日付が変わっていたらリセット
    if (data.date !== today()) return { date: today(), count: 0 };
    return data;
  } catch {
    return { date: today(), count: 0 };
  }
}

async function save(data: AnalysisLimitData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** 本日の残り無料解析回数を返す（0以上）。制限無効時は常に999を返す */
export async function getRemainingCount(): Promise<number> {
  if (!LIMIT_ENABLED) return 999;
  const data = await load();
  return Math.max(0, FREE_LIMIT_PER_DAY - data.count);
}

/** 解析1回を消費する（制限無効時は何もしない） */
export async function consumeOne(): Promise<void> {
  if (!LIMIT_ENABLED) return;
  const data = await load();
  await save({ ...data, count: data.count + 1 });
}

/** 日付が変わっていたらカウントをリセットする */
export async function resetIfNewDay(): Promise<void> {
  const data = await load();
  // load() が日付チェックを行うため、新日なら count=0 の状態が返る
  await save(data);
}
