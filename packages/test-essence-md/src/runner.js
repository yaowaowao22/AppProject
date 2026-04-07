#!/usr/bin/env node
/**
 * テスト実行エントリポイント（APIなし版）
 *
 * 3つのモード:
 *
 *   node src/runner.js --mock
 *     モック応答でルーブリックの精度を検証する
 *     → APIなしで rubric.js が正しく採点できるか確認
 *
 *   node src/runner.js --paste
 *     インタラクティブモード: プロンプトを表示→ユーザーが回答を貼り付け→自動採点
 *     → 実際のClaudeセッション（essence.mdあり/なし）を手動で比較できる
 *
 *   node src/runner.js --dry-run
 *     ルーブリックとシナリオ一覧の確認のみ
 */

import { createInterface } from "readline";
import { writeFileSync, mkdirSync } from "fs";
import { TEST_PROMPTS } from "./prompts.js";
import { CRITERIA, scoreResponse } from "./rubric.js";
import { MOCK_RESPONSES } from "./mock-responses.js";

const mode = process.argv[2] ?? "--mock";

// ─── ドライラン ──────────────────────────────────────────────────────────────
if (mode === "--dry-run") {
  console.log("\n=== DRY RUN: ルーブリック確認 ===\n");
  console.log("【採点基準一覧】");
  for (const c of CRITERIA) {
    const weightLabel = c.weight === 2 ? " [重要×2]" : "";
    console.log(`  ${c.id}${weightLabel}`);
    console.log(`    → ${c.label}`);
    console.log(`    → 出典: ${c.source}\n`);
  }
  console.log("【テストシナリオ一覧】");
  for (const p of TEST_PROMPTS) {
    console.log(`  [${p.id}] ${p.label}`);
    console.log(`    プロンプト: "${p.prompt}"`);
    console.log(`    期待発火: ${p.expected_triggers.join(", ")}\n`);
  }
  process.exit(0);
}

// ─── モックモード ────────────────────────────────────────────────────────────
if (mode === "--mock") {
  console.log("\n=== モック応答テスト（rubricの精度検証）===\n");
  console.log("目的: APIなしで rubric.js のキーワード検出が正しく機能するかを確認する");
  console.log("      「良い回答」→高スコア、「悪い回答」→低スコア になるか検証\n");

  const results = [];

  for (const [promptId, responses] of Object.entries(MOCK_RESPONSES)) {
    const prompt = TEST_PROMPTS.find((p) => p.id === promptId);
    if (!prompt) continue;

    console.log(`▶ [${promptId}] ${prompt.label}`);
    console.log(`  プロンプト: "${prompt.prompt}"\n`);

    const controlScore = scoreResponse(responses.control);
    const essenceScore = scoreResponse(responses.essence);

    // Criterion別の結果を表示
    console.log(`  ${"Criterion".padEnd(28)} ${"control".padStart(7)} ${"essence".padStart(7)} 判定`);
    console.log("  " + "-".repeat(55));

    let allCorrect = true;
    for (const c of CRITERIA) {
      const cs = controlScore.criteria[c.id].score;
      const es = essenceScore.criteria[c.id].score;
      const isExpected = prompt.expected_triggers.includes(c.id);
      const wLabel = c.weight === 2 ? "★" : " ";

      // 期待されているCriterionでessenceが1、controlが0 → 正解
      // 期待されていないCriterionで差がない → 正解
      let verdict = "  ";
      if (isExpected) {
        if (es === 1 && cs === 0) verdict = "✅";
        else if (es === 1 && cs === 1) verdict = "△ 両方検出";
        else if (es === 0) { verdict = "❌ 未検出"; allCorrect = false; }
      } else {
        if (es === cs) verdict = "  ";
        else if (es > cs) verdict = "〇 bonus";
      }

      console.log(
        `  ${wLabel}${c.label.padEnd(27)} ${String(cs).padStart(7)} ${String(es).padStart(7)}  ${verdict}`
      );
    }

    const diff = essenceScore.percentage - controlScore.percentage;
    const diffLabel = diff > 0 ? `+${diff}pt` : `${diff}pt`;
    console.log(`\n  スコア: control=${controlScore.percentage}%  essence=${essenceScore.percentage}%  差=${diffLabel}`);
    const rubricVerdict = diff >= 20 ? "✅ ルーブリック正常（essenceを高く評価できた）" : diff >= 0 ? "⚠️ 差が小さい（キーワード調整が必要かも）" : "❌ ルーブリック逆転（要修正）";
    console.log(`  判定: ${rubricVerdict}\n`);
    console.log("  " + "─".repeat(55) + "\n");

    results.push({ promptId, controlScore, essenceScore, diff });
  }

  // サマリー
  printSummary(results, "mock");
  process.exit(0);
}

// ─── インタラクティブ貼り付けモード ──────────────────────────────────────────
if (mode === "--paste") {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

  console.log("\n=== インタラクティブ採点モード ===");
  console.log("使い方:");
  console.log("  1. 表示されたプロンプトをClaudeに送る（essence.mdありのセッション）");
  console.log("  2. Claudeの回答をコピーしてターミナルに貼り付ける");
  console.log("  3. 空行+Enterで採点");
  console.log("  4. 次に同じプロンプトをessence.mdなしのセッションで試す\n");

  const sessionResults = [];

  for (const prompt of TEST_PROMPTS) {
    console.log("=".repeat(60));
    console.log(`【${prompt.label}】`);
    console.log(`プロンプト: "${prompt.prompt}"`);
    if (prompt.context && prompt.context.length < 100) {
      console.log(`コンテキスト: ${prompt.context}`);
    }
    console.log(`期待される動作: ${prompt.expected_triggers.join(", ")}`);
    console.log("=".repeat(60));

    const testResult = { promptId: prompt.id, label: prompt.label, responses: {} };

    for (const condition of ["essence（システムプロンプトあり）", "control（システムプロンプトなし）"]) {
      const condKey = condition.startsWith("essence") ? "essence" : "control";
      console.log(`\n[${condition}] の回答を貼り付けてください`);
      console.log("（貼り付け後、空行を入力してEnterで確定）\n");

      const lines = [];
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const line = await ask("");
        if (line === "" && lines.length > 0 && lines[lines.length - 1] === "") break;
        lines.push(line);
      }
      const responseText = lines.join("\n").trim();
      const scored = scoreResponse(responseText);
      testResult.responses[condKey] = { text: responseText, scored };

      console.log(`\n  スコア: ${scored.percentage}% (${scored.totalScore}/${scored.maxScore})`);
      for (const c of CRITERIA) {
        const s = scored.criteria[c.id].score;
        const icon = s === 1 ? "✅" : "  ";
        const wLabel = c.weight === 2 ? "★" : " ";
        if (s === 1 || prompt.expected_triggers.includes(c.id)) {
          console.log(`  ${icon} ${wLabel}${c.label}`);
        }
      }
      console.log();
    }

    sessionResults.push(testResult);

    const cont = await ask("次のシナリオに進みますか？ (Enter で続行, q で終了): ");
    if (cont.toLowerCase() === "q") break;
  }

  rl.close();

  // 結果を保存
  mkdirSync("results", { recursive: true });
  const filename = `results/paste-${Date.now()}.json`;
  writeFileSync(filename, JSON.stringify(sessionResults, null, 2));
  console.log(`\n結果を保存: ${filename}`);

  const flatResults = sessionResults.map((r) => ({
    promptId: r.promptId,
    controlScore: r.responses.control?.scored,
    essenceScore: r.responses.essence?.scored,
    diff: (r.responses.essence?.scored?.percentage ?? 0) - (r.responses.control?.scored?.percentage ?? 0),
  }));
  printSummary(flatResults, "paste");
  process.exit(0);
}

console.error(`不明なモード: ${mode}`);
console.error("使い方: node src/runner.js [--mock | --paste | --dry-run]");
process.exit(1);

// ─── 共通レポート関数 ─────────────────────────────────────────────────────────
function printSummary(results, mode) {
  console.log("=".repeat(65));
  console.log("【最終サマリー】");
  console.log("=".repeat(65));

  // Criterion別の集計
  const criterionStats = {};
  for (const c of CRITERIA) {
    criterionStats[c.id] = { controlTotal: 0, essenceTotal: 0, count: 0 };
  }

  for (const r of results) {
    if (!r.controlScore || !r.essenceScore) continue;
    for (const c of CRITERIA) {
      criterionStats[c.id].controlTotal += r.controlScore.criteria[c.id]?.score ?? 0;
      criterionStats[c.id].essenceTotal += r.essenceScore.criteria[c.id]?.score ?? 0;
      criterionStats[c.id].count += 1;
    }
  }

  const n = results.length;
  console.log(`\n  ${"Criterion".padEnd(28)} ${"control".padStart(7)} ${"essence".padStart(7)} 効果判定`);
  console.log("  " + "-".repeat(62));

  for (const c of CRITERIA) {
    const stat = criterionStats[c.id];
    if (stat.count === 0) continue;
    const cp = Math.round((stat.controlTotal / stat.count) * 100);
    const ep = Math.round((stat.essenceTotal / stat.count) * 100);
    const diff = ep - cp;
    const verdict = diff >= 20 ? "✅ 効果あり" : diff > 0 ? "△ 微小" : "❌ 効果なし";
    const wLabel = c.weight === 2 ? "★" : " ";
    console.log(`  ${wLabel}${c.label.padEnd(27)} ${String(cp + "%").padStart(7)} ${String(ep + "%").padStart(7)}  ${verdict}`);
  }

  const avgControl = Math.round(results.reduce((a, r) => a + (r.controlScore?.percentage ?? 0), 0) / n);
  const avgEssence = Math.round(results.reduce((a, r) => a + (r.essenceScore?.percentage ?? 0), 0) / n);

  console.log(`\n  平均スコア: control=${avgControl}%  essence=${avgEssence}%  差=+${avgEssence - avgControl}pt`);

  // 「検証中」項目の判定
  const verificationTargets = ["quantitative_target", "residual_risk", "completion_by_layer"];
  console.log("\n【「検証中」項目の結果 → essence.mdを更新すべきか？】");
  for (const id of verificationTargets) {
    const stat = criterionStats[id];
    if (!stat || stat.count === 0) continue;
    const c = CRITERIA.find((x) => x.id === id);
    const ep = Math.round((stat.essenceTotal / stat.count) * 100);
    const verdict = ep >= 60 ? "→ ✅ 確定に昇格" : ep >= 30 ? "→ △ 要観察" : "→ ❌ 削除検討";
    console.log(`  ${c.label}: ${ep}%  ${verdict}`);
  }

  console.log("\n" + "=".repeat(65));
}
