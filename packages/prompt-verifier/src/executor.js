/**
 * Claude CLI 実行ラッパー
 *
 * 3条件での実行:
 *   empty   : --system-prompt で最小限のプロンプトを注入（CLAUDE.mdを実質無効化）
 *   backup  : --system-prompt でBKの内容を注入
 *   current : フラグなし（CLAUDE.mdを自動読み込み）
 *
 * ⚠️ --bare はAPIキーが必要なため使用しない。
 *    --system-prompt は CLAUDE.md の内容を上書きする（appendではなくreplace）。
 */

import { execSync } from "child_process";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { tmpdir } from "os";

const MODEL = process.env.TEST_MODEL ?? "claude-haiku-4-5-20251001";
const TIMEOUT = 60_000;

// emptyの疑似ベースライン: CLAUDE.mdの行動指示を持たないデフォルト的な応答を引き出す
const EMPTY_SYSTEM_PROMPT = `You are a helpful assistant. Answer questions directly and concisely.
When asked to help with code, provide straightforward solutions.
Ask for clarification when a question is unclear or lacks detail.`;

export function runWithClaude(prompt, systemPromptContent, { verbose = false } = {}) {
  let tmpFile = null;

  try {
    const baseArgs = [
      "claude", "--print",
      "--model", MODEL,
      "--no-session-persistence",
    ];

    let args;

    if (systemPromptContent === null) {
      // empty条件: 最小限のデフォルト的プロンプトでCLAUDE.md挙動を無効化
      tmpFile = writeTmpFile(EMPTY_SYSTEM_PROMPT);
      args = [...baseArgs, "--system-prompt-file", tmpFile];
    } else {
      // backup/current: 指定のsystem promptを注入
      tmpFile = writeTmpFile(systemPromptContent);
      args = [...baseArgs, "--system-prompt-file", tmpFile];
    }

    const cmd = args.join(" ");
    if (verbose) process.stderr.write(`  [model=${MODEL}]\n`);

    const output = execSync(cmd, {
      input: prompt,
      encoding: "utf-8",
      timeout: TIMEOUT,
      maxBuffer: 2 * 1024 * 1024,
    });

    return { ok: true, text: output.trim() };
  } catch (err) {
    return { ok: false, text: "", error: err.message.slice(0, 200) };
  } finally {
    if (tmpFile && existsSync(tmpFile)) unlinkSync(tmpFile);
  }
}

/** current条件: CLAUDE.mdを自動読み込みさせる（フラグなし） */
export function runCurrentCondition(prompt, { verbose = false } = {}) {
  try {
    const args = [
      "claude", "--print",
      "--model", MODEL,
      "--no-session-persistence",
    ];

    if (verbose) process.stderr.write(`  [current / model=${MODEL}]\n`);

    const output = execSync(args.join(" "), {
      input: prompt,
      encoding: "utf-8",
      timeout: TIMEOUT,
      maxBuffer: 2 * 1024 * 1024,
    });

    return { ok: true, text: output.trim() };
  } catch (err) {
    return { ok: false, text: "", error: err.message.slice(0, 200) };
  }
}

function writeTmpFile(content) {
  const path = `${tmpdir()}/pv-sp-${Date.now()}-${Math.random().toString(36).slice(2)}.md`;
  writeFileSync(path, content, "utf-8");
  return path;
}

export function checkClaudeAvailable() {
  try {
    execSync("claude --version", { encoding: "utf-8", timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
