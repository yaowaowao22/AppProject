// ============================================================
// generateHint - 答えのキーワードを ______ に置換する穴埋めヒント生成
// Flashcard Peek Widget 用
// ============================================================

/**
 * 答え文字列からキーワードを `______` に置換した穴埋めヒントを生成する。
 * 文を句読点で分割し、各文の末尾単語をブランクに変える。
 *
 * 例: "SFAは営業活動の自動化" → "SFAは営業活動の ______"
 */
export function generateHint(answer: string): string {
  if (!answer) return '______';

  const parts = answer.split(/[、。,.]/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => {
      const words = p.trim().split(/\s+/);
      words.pop();
      return [...words, '______'].join(' ');
    })
    .join('、');
}
