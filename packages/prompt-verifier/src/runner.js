#!/usr/bin/env node
/**
 * prompt-verifier CLI
 *
 * モード:
 *   --run [domain]    Claude CLIで実際に実行 → 採点（フルパイプライン）
 *   --mock [domain]   モック応答で採点（APIなし・オフライン検証）
 *   --compare         BK vs current CLAUDE.mdの比較
 *   --list-domains    ドメイン一覧表示
 *
 * 例:
 *   node src/runner.js --run
 *   node src/runner.js --run note
 *   node src/runner.js --mock
 *   node src/runner.js --compare
 */

import { writeFileSync, mkdirSync } from "fs";
import { DOMAINS, getAllPrompts } from "./domains.js";
import { CRITERIA, scoreResponse } from "./rubric.js";
import { MOCK } from "./mock-responses.js";
import { loadSystemPrompts, printLoadStatus } from "./loader.js";
import { runWithClaude, runCurrentCondition, checkClaudeAvailable } from "./executor.js";

const [, , mode = "--run", domainArg] = process.argv;

// ─── ドメイン一覧 ─────────────────────────────────────────────────────────────
if (mode === "--list-domains") {
  console.log("\n【利用可能なドメイン】\n");
  for (const [id, d] of Object.entries(DOMAINS)) {
    console.log(`  ${id.padEnd(14)} ${d.label} - ${d.description}`);
    for (const p of d.prompts) console.log(`    [${p.id}] "${p.prompt.slice(0, 50)}"`);
    console.log();
  }
  process.exit(0);
}

// ─── フルパイプライン実行 ─────────────────────────────────────────────────────
if (mode === "--run") {
  if (!checkClaudeAvailable()) {
    console.error("❌ claude CLIが見つかりません。Claude Codeがインストールされているか確認してください");
    process.exit(1);
  }

  const systemPrompts = loadSystemPrompts();
  printLoadStatus(systemPrompts);

  // 実行する条件を決定
  const conditions = [
    { key: "empty",   label: "empty（CLAUDE.mdなし）",   sp: null },
    { key: "current", label: "current（現在のCLAUDE.md）", sp: systemPrompts.current.content },
  ];
  if (systemPrompts.backupFound) {
    conditions.splice(1, 0, {
      key: "backup", label: "backup（削除前）", sp: systemPrompts.backup.content,
    });
  }

  const targetDomain = domainArg ?? null;
  const allPrompts = getAllPrompts().filter(p => !targetDomain || p.domainId === targetDomain);

  console.log(`モデル: claude-haiku-4-5-20251001（コスト最小化）`);
  console.log(`条件数: ${conditions.length}  プロンプト数: ${allPrompts.length}`);
  console.log(`合計実行: ${conditions.length * allPrompts.length}回\n`);

  const results = await runAll(allPrompts, conditions, true);
  printSummary(results, conditions.map(c => c.key), conditions.map(c => c.label));

  // 結果保存
  mkdirSync("results", { recursive: true });
  const out = `results/run-${Date.now()}.json`;
  writeFileSync(out, JSON.stringify(results, null, 2));
  console.log(`\n結果を保存: ${out}`);
  process.exit(0);
}

// ─── モックモード ─────────────────────────────────────────────────────────────
if (mode === "--mock") {
  console.log("\n=== prompt-verifier: モックテスト（オフライン）===\n");
  const targetDomain = domainArg ?? null;
  const allPrompts = getAllPrompts().filter(p => !targetDomain || p.domainId === targetDomain);
  const condKeys = ["empty", "current"];
  const condLabels = ["empty", "current"];

  const results = allPrompts.map(p => {
    const mock = MOCK[p.id] ?? {};
    return {
      promptId: p.id, domainId: p.domainId,
      prompt: p.prompt, expected: p.expected,
      responses: {
        empty:   { text: mock.empty ?? "", score: scoreResponse(mock.empty ?? "") },
        current: { text: mock.current ?? "", score: scoreResponse(mock.current ?? "") },
      },
    };
  });

  printDetailedResults(results, condKeys);
  printSummary(results, condKeys, condLabels);
  process.exit(0);
}

// ─── compare モード ───────────────────────────────────────────────────────────
if (mode === "--compare") {
  if (!checkClaudeAvailable()) {
    console.error("❌ claude CLIが見つかりません");
    process.exit(1);
  }

  const systemPrompts = loadSystemPrompts();
  printLoadStatus(systemPrompts);

  if (!systemPrompts.backupFound) {
    console.log("⚠️  backupが見つかりません: ~/.claude/CLAUDE.md.bk を配置してください");
    process.exit(1);
  }

  const conditions = [
    { key: "backup",  label: "backup（削除前）",        sp: systemPrompts.backup.content },
    { key: "current", label: "current（現在のCLAUDE.md）", sp: systemPrompts.current.content },
  ];

  const allPrompts = getAllPrompts();
  console.log(`\n比較実行: ${conditions.length}条件 × ${allPrompts.length}プロンプト = ${conditions.length * allPrompts.length}回\n`);

  const results = await runAll(allPrompts, conditions, true);
  printSummary(results, conditions.map(c => c.key), conditions.map(c => c.label));
  process.exit(0);
}

console.error(`不明なモード: ${mode}`);
console.error("使い方: node src/runner.js [--run | --mock | --compare | --list-domains] [domain]");
process.exit(1);

// ─── 実行ヘルパー ─────────────────────────────────────────────────────────────
async function runAll(allPrompts, conditions, verbose = false) {
  const results = [];

  for (const p of allPrompts) {
    const d = DOMAINS[p.domainId];
    process.stdout.write(`\n▶ [${d.label}] "${p.prompt.slice(0, 50)}"\n`);

    const entry = {
      promptId: p.id, domainId: p.domainId,
      prompt: p.prompt, expected: p.expected,
      responses: {},
    };

    for (const cond of conditions) {
      process.stdout.write(`  ${cond.key.padEnd(10)} ... `);
      // current条件はCLAUDE.mdを自動読み込みさせる（--system-promptなし）
      const { ok, text, error } = cond.key === "current"
        ? runCurrentCondition(p.prompt, { verbose })
        : runWithClaude(p.prompt, cond.sp, { verbose });

      if (!ok) {
        process.stdout.write(`❌ エラー: ${error}\n`);
        entry.responses[cond.key] = { text: "", score: scoreResponse(""), error };
        continue;
      }

      const score = scoreResponse(text);
      const icon = score.pct >= 60 ? "✅" : score.pct >= 40 ? "△" : "❌";
      process.stdout.write(`${icon} ${score.pct}%\n`);
      entry.responses[cond.key] = { text, score };
    }

    results.push(entry);
  }

  return results;
}

// ─── 詳細結果表示（ドメイン別） ───────────────────────────────────────────────
function printDetailedResults(results, condKeys) {
  let currentDomain = null;

  for (const r of results) {
    if (r.domainId !== currentDomain) {
      currentDomain = r.domainId;
      const d = DOMAINS[r.domainId];
      console.log(`\n${"═".repeat(60)}`);
      console.log(`【${d.label}】 ${d.description}`);
      console.log("═".repeat(60));
    }

    console.log(`\n  ▶ "${r.prompt.slice(0, 55)}"`);
    console.log(`    期待: ${r.expected.join(", ")}\n`);
    console.log(`    ${"Criterion".padEnd(26)} ${condKeys.map(k => k.padStart(9)).join("")}  判定`);
    console.log("    " + "─".repeat(52 + condKeys.length * 9));

    for (const c of CRITERIA) {
      const vals = condKeys.map(k => r.responses[k]?.score?.criteria[c.id]?.score ?? 0);
      const isExpected = r.expected.includes(c.id);
      if (!isExpected && vals.every(v => v === 0)) continue;

      const wLabel = c.weight >= 2 ? "★" : " ";
      const last = vals[vals.length - 1];
      const first = vals[0];
      let verdict = "";
      if (isExpected) {
        if (last === 1 && first === 0) verdict = "✅";
        else if (last === 1) verdict = "△ 両方";
        else verdict = "❌ 未検出";
      } else if (vals.some(v => v === 1)) {
        verdict = "〇 bonus";
      }

      const valStr = vals.map(v => String(v).padStart(9)).join("");
      console.log(`    ${wLabel}${c.label.padEnd(25)}${valStr}  ${verdict}`);
    }

    const pcts = condKeys.map(k => `${k}=${r.responses[k]?.score?.pct ?? 0}%`).join("  ");
    console.log(`\n    スコア: ${pcts}`);
  }
}

// ─── サマリー ─────────────────────────────────────────────────────────────────
function printSummary(results, condKeys, condLabels) {
  // ドメイン別・Criterion別の集計
  const domainStats = {};
  const criterionStats = {};
  for (const c of CRITERIA) {
    criterionStats[c.id] = {};
    for (const k of condKeys) criterionStats[c.id][k] = 0;
  }

  for (const r of results) {
    if (!domainStats[r.domainId]) {
      domainStats[r.domainId] = {};
      for (const k of condKeys) domainStats[r.domainId][k] = [];
    }
    for (const k of condKeys) {
      const s = r.responses[k]?.score;
      if (!s) continue;
      domainStats[r.domainId][k].push(s.pct);
      for (const c of CRITERIA) criterionStats[c.id][k] += s.criteria[c.id]?.score ?? 0;
    }
  }

  const N = results.length;
  const colW = condKeys.map(k => Math.max(k.length, 7));

  console.log(`\n${"═".repeat(70)}`);
  console.log("【ドメイン別 平均スコア】");
  console.log("═".repeat(70));
  console.log(`  ${"ドメイン".padEnd(14)} ${condKeys.map((k,i) => k.padStart(colW[i]+2)).join("")}  差分  効果`);
  console.log("  " + "─".repeat(65));

  for (const [domId, d] of Object.entries(DOMAINS)) {
    const stat = domainStats[domId];
    if (!stat) continue;
    const avgs = condKeys.map(k => {
      const arr = stat[k] ?? [];
      return arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
    });
    const diff = avgs[avgs.length-1] - avgs[0];
    const bar = "█".repeat(Math.max(0, Math.floor(diff / 10)));
    const verdict = diff >= 20 ? "✅" : diff > 0 ? "△" : "❌";
    console.log(`  ${d.label.padEnd(14)} ${avgs.map((v,i) => String(v+"%").padStart(colW[i]+2)).join("")}  +${diff}pt  ${verdict} ${bar}`);
  }

  console.log(`\n${"═".repeat(70)}`);
  console.log("【Criterion別 効果判定（empty → current の差分）】");
  console.log("═".repeat(70));
  console.log(`  ${"Criterion".padEnd(28)} ${condKeys.map((k,i) => k.padStart(colW[i]+2)).join("")}  判定`);
  console.log("  " + "─".repeat(65));

  for (const c of CRITERIA) {
    const vals = condKeys.map(k => Math.round((criterionStats[c.id][k] / N) * 100));
    const diff = vals[vals.length-1] - vals[0];
    const verdict = diff >= 20 ? "✅ 効果あり" : diff > 0 ? "△ 微小" : "❌ 効果なし";
    const wLabel = c.weight >= 2 ? "★" : " ";
    console.log(`  ${wLabel}${c.label.padEnd(27)} ${vals.map((v,i) => String(v+"%").padStart(colW[i]+2)).join("")}  ${verdict}`);
  }

  console.log("═".repeat(70));
}
