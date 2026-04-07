/**
 * CLAUDE.mdファイルの自動読み込み
 *
 * 読み込み対象:
 *   current : ~/.claude/CLAUDE.md + @参照ファイルを展開した完全版
 *   backup  : ~/.claude/CLAUDE.md.bk (またはCLAUDE.md.backup)
 *   empty   : システムプロンプトなし（ベースライン）
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const CLAUDE_DIR = join(homedir(), ".claude");

function resolveAtReferences(content, baseDir) {
  return content.replace(/^@(.+)$/gm, (_, ref) => {
    const refPath = join(baseDir, ref.trim());
    if (existsSync(refPath)) {
      return `\n# [${ref.trim()}]\n` + readFileSync(refPath, "utf-8");
    }
    return `# [missing: ${ref.trim()}]`;
  });
}

export function loadSystemPrompts(backupPath = null) {
  const claudeMdPath = join(CLAUDE_DIR, "CLAUDE.md");

  // current: CLAUDE.mdを読んで@参照を展開
  let current = null;
  if (existsSync(claudeMdPath)) {
    const raw = readFileSync(claudeMdPath, "utf-8");
    current = resolveAtReferences(raw, CLAUDE_DIR);
  }

  // backup: 引数で指定、なければ .bk / .backup を探す
  let backup = null;
  const candidates = backupPath
    ? [backupPath]
    : [
        join(CLAUDE_DIR, "CLAUDE.md.bk"),
        join(CLAUDE_DIR, "CLAUDE.md.backup"),
        join(CLAUDE_DIR, "CLAUDE.md.old"),
      ];
  for (const p of candidates) {
    if (existsSync(p)) {
      const raw = readFileSync(p, "utf-8");
      backup = resolveAtReferences(raw, CLAUDE_DIR);
      break;
    }
  }

  return {
    // 比較対象の3条件
    empty:   { label: "empty（プロンプトなし）",   content: null },
    backup:  { label: "backup（削除前のCLAUDE.md）", content: backup },
    current: { label: "current（現在のCLAUDE.md）", content: current },

    // メタ情報
    currentPath: claudeMdPath,
    backupFound: backup !== null,
    currentFound: current !== null,
    currentLength: current?.length ?? 0,
    backupLength: backup?.length ?? 0,
  };
}

export function printLoadStatus(prompts) {
  console.log("【CLAUDE.md 読み込み状況】");
  console.log(`  current : ${prompts.currentFound ? `✅ ${prompts.currentLength}文字` : "❌ 未検出"}`);
  console.log(`  backup  : ${prompts.backupFound  ? `✅ ${prompts.backupLength}文字`  : "❌ 未検出 (.bk/.backup/.old を確認)"}`);
  console.log(`  empty   : ✅ ベースライン（プロンプトなし）\n`);
}
