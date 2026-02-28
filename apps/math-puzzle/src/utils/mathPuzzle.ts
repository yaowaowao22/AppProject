import type { Difficulty, Puzzle } from '../types';

/**
 * Generate a random integer between min and max (inclusive).
 */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get the difficulty label in Japanese.
 */
export function getDifficultyLabel(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'easy':
      return '初級';
    case 'medium':
      return '中級';
    case 'hard':
      return '上級';
  }
}

/**
 * Format seconds into mm:ss string.
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * The operators available per difficulty.
 */
function getOperators(difficulty: Difficulty): string[] {
  switch (difficulty) {
    case 'easy':
      return ['+', '-'];
    case 'medium':
    case 'hard':
      return ['+', '-', '*', '/'];
  }
}

/**
 * Generate number ranges per difficulty.
 */
function getNumberRange(difficulty: Difficulty): [number, number] {
  switch (difficulty) {
    case 'easy':
      return [1, 9];
    case 'medium':
      return [1, 15];
    case 'hard':
      return [2, 25];
  }
}

/**
 * Safely evaluate a simple expression with basic arithmetic.
 * Returns NaN if the expression is invalid or produces non-integer results via division.
 */
function safeEval(expr: string): number {
  try {
    const sanitized = expr.replace(/\s/g, '');
    if (!/^[\d+\-*/().]+$/.test(sanitized)) {
      return NaN;
    }
    const fn = new Function(`"use strict"; return (${sanitized});`);
    const result = fn();
    if (typeof result !== 'number' || !isFinite(result)) {
      return NaN;
    }
    return result;
  } catch {
    return NaN;
  }
}

/**
 * Try all permutations and operator combinations to find a valid expression
 * that equals the target using the given numbers.
 */
function findSolution(
  numbers: number[],
  target: number,
  operators: string[],
  mustUseAll: boolean,
): string | null {
  const perms = permutations(numbers);

  for (const perm of perms) {
    const opCombinations = operatorCombinations(operators, perm.length - 1);

    for (const ops of opCombinations) {
      // Try without parentheses first
      const expr = buildExpression(perm, ops);
      const result = safeEval(expr);
      if (result === target) {
        return formatExpression(perm, ops);
      }

      // Try with parentheses on first two numbers
      if (perm.length >= 3) {
        const expr2 = `(${perm[0]}${ops[0]}${perm[1]})${ops[1]}${perm[2]}${perm.length === 4 ? ops[2] + perm[3] : ''}`;
        const result2 = safeEval(expr2);
        if (result2 === target) {
          return formatParenExpression(perm, ops, 'first');
        }
      }

      // Try with parentheses on last two numbers
      if (perm.length >= 3) {
        const lastStart = perm.length === 4 ? 2 : 1;
        const expr3 =
          perm.length === 4
            ? `${perm[0]}${ops[0]}${perm[1]}${ops[1]}(${perm[2]}${ops[2]}${perm[3]})`
            : `${perm[0]}${ops[0]}(${perm[1]}${ops[1]}${perm[2]})`;
        const result3 = safeEval(expr3);
        if (result3 === target) {
          return formatParenExpression(perm, ops, 'last');
        }
      }

      // Try with two groups of parentheses for 4 numbers: (a op b) op (c op d)
      if (perm.length === 4) {
        const expr4 = `(${perm[0]}${ops[0]}${perm[1]})${ops[1]}(${perm[2]}${ops[2]}${perm[3]})`;
        const result4 = safeEval(expr4);
        if (result4 === target) {
          return formatParenExpression(perm, ops, 'both');
        }
      }

      // Try nested: ((a op b) op c) op d
      if (perm.length === 4) {
        const expr5 = `((${perm[0]}${ops[0]}${perm[1]})${ops[1]}${perm[2]})${ops[2]}${perm[3]}`;
        const result5 = safeEval(expr5);
        if (result5 === target) {
          return formatParenExpression(perm, ops, 'nestedLeft');
        }
      }

      // Try nested: a op (b op (c op d))
      if (perm.length === 4) {
        const expr6 = `${perm[0]}${ops[0]}(${perm[1]}${ops[1]}(${perm[2]}${ops[2]}${perm[3]}))`;
        const result6 = safeEval(expr6);
        if (result6 === target) {
          return formatParenExpression(perm, ops, 'nestedRight');
        }
      }

      // Try: a op ((b op c) op d)
      if (perm.length === 4) {
        const expr7 = `${perm[0]}${ops[0]}((${perm[1]}${ops[1]}${perm[2]})${ops[2]}${perm[3]})`;
        const result7 = safeEval(expr7);
        if (result7 === target) {
          return formatParenExpression(perm, ops, 'middleLeft');
        }
      }
    }
  }

  return null;
}

function buildExpression(nums: number[], ops: string[]): string {
  let expr = nums[0].toString();
  for (let i = 0; i < ops.length; i++) {
    expr += ops[i] + nums[i + 1];
  }
  return expr;
}

function opToDisplay(op: string): string {
  switch (op) {
    case '*':
      return ' \u00d7 ';
    case '/':
      return ' \u00f7 ';
    default:
      return ` ${op} `;
  }
}

function formatExpression(nums: number[], ops: string[]): string {
  let expr = nums[0].toString();
  for (let i = 0; i < ops.length; i++) {
    expr += opToDisplay(ops[i]) + nums[i + 1];
  }
  return expr;
}

function formatParenExpression(
  nums: number[],
  ops: string[],
  type: 'first' | 'last' | 'both' | 'nestedLeft' | 'nestedRight' | 'middleLeft',
): string {
  switch (type) {
    case 'first':
      if (nums.length === 4) {
        return `(${nums[0]}${opToDisplay(ops[0])}${nums[1]})${opToDisplay(ops[1])}${nums[2]}${opToDisplay(ops[2])}${nums[3]}`;
      }
      return `(${nums[0]}${opToDisplay(ops[0])}${nums[1]})${opToDisplay(ops[1])}${nums[2]}`;
    case 'last':
      if (nums.length === 4) {
        return `${nums[0]}${opToDisplay(ops[0])}${nums[1]}${opToDisplay(ops[1])}(${nums[2]}${opToDisplay(ops[2])}${nums[3]})`;
      }
      return `${nums[0]}${opToDisplay(ops[0])}(${nums[1]}${opToDisplay(ops[1])}${nums[2]})`;
    case 'both':
      return `(${nums[0]}${opToDisplay(ops[0])}${nums[1]})${opToDisplay(ops[1])}(${nums[2]}${opToDisplay(ops[2])}${nums[3]})`;
    case 'nestedLeft':
      return `((${nums[0]}${opToDisplay(ops[0])}${nums[1]})${opToDisplay(ops[1])}${nums[2]})${opToDisplay(ops[2])}${nums[3]}`;
    case 'nestedRight':
      return `${nums[0]}${opToDisplay(ops[0])}(${nums[1]}${opToDisplay(ops[1])}(${nums[2]}${opToDisplay(ops[2])}${nums[3]}))`;
    case 'middleLeft':
      return `${nums[0]}${opToDisplay(ops[0])}((${nums[1]}${opToDisplay(ops[1])}${nums[2]})${opToDisplay(ops[2])}${nums[3]})`;
  }
}

/**
 * Generate all permutations of an array.
 */
function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const restPerms = permutations(rest);
    for (const perm of restPerms) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

/**
 * Generate all combinations of operators of a given length.
 */
function operatorCombinations(operators: string[], length: number): string[][] {
  if (length === 0) return [[]];
  const result: string[][] = [];
  const sub = operatorCombinations(operators, length - 1);
  for (const op of operators) {
    for (const combo of sub) {
      result.push([op, ...combo]);
    }
  }
  return result;
}

/**
 * Generate a math puzzle for the given difficulty.
 */
export function generatePuzzle(difficulty: Difficulty): Puzzle {
  const operators = getOperators(difficulty);
  const [minNum, maxNum] = getNumberRange(difficulty);
  const numCount = 4;
  const mustUseAll = difficulty === 'hard';

  let attempts = 0;
  const maxAttempts = 500;

  while (attempts < maxAttempts) {
    attempts++;
    const numbers: number[] = [];
    for (let i = 0; i < numCount; i++) {
      numbers.push(randInt(minNum, maxNum));
    }

    // Generate a target by actually computing a result from the numbers
    const perms = permutations(numbers);
    const shuffledPerms = perms.sort(() => Math.random() - 0.5);

    for (const perm of shuffledPerms.slice(0, 10)) {
      const opCombo = operatorCombinations(operators, numCount - 1);
      const shuffledOps = opCombo.sort(() => Math.random() - 0.5);

      for (const ops of shuffledOps.slice(0, 10)) {
        // Try various expression structures
        const expressions = [
          buildExpression(perm, ops),
          `(${perm[0]}${ops[0]}${perm[1]})${ops[1]}${perm[2]}${ops[2]}${perm[3]}`,
          `${perm[0]}${ops[0]}(${perm[1]}${ops[1]}${perm[2]})${ops[2]}${perm[3]}`,
          `(${perm[0]}${ops[0]}${perm[1]})${ops[1]}(${perm[2]}${ops[2]}${perm[3]})`,
        ];

        for (const expr of expressions) {
          const result = safeEval(expr);
          if (!isNaN(result) && Number.isInteger(result) && result > 0 && result <= 100) {
            // Verify we can find a solution
            const solution = findSolution(numbers, result, operators, mustUseAll);
            if (solution) {
              return {
                numbers,
                target: result,
                solution,
                difficulty,
              };
            }
          }
        }
      }
    }
  }

  // Fallback: generate a simple puzzle
  return generateFallbackPuzzle(difficulty);
}

/**
 * Fallback puzzle generation with guaranteed solvability.
 */
function generateFallbackPuzzle(difficulty: Difficulty): Puzzle {
  const operators = getOperators(difficulty);

  switch (difficulty) {
    case 'easy': {
      const a = randInt(1, 9);
      const b = randInt(1, 9);
      const c = randInt(1, 9);
      const d = randInt(1, 9);
      const target = a + b + c - d;
      return {
        numbers: [a, b, c, d],
        target: target > 0 ? target : a + b + c + d,
        solution:
          target > 0
            ? `${a} + ${b} + ${c} - ${d}`
            : `${a} + ${b} + ${c} + ${d}`,
        difficulty,
      };
    }
    case 'medium': {
      const a = randInt(2, 10);
      const b = randInt(2, 6);
      const c = randInt(1, 5);
      const d = randInt(1, 5);
      const target = a * b + c - d;
      return {
        numbers: [a, b, c, d],
        target,
        solution: `${a} \u00d7 ${b} + ${c} - ${d}`,
        difficulty,
      };
    }
    case 'hard': {
      const a = randInt(3, 15);
      const b = randInt(2, 8);
      const c = randInt(2, 10);
      const d = randInt(1, 5);
      const target = a * b - c + d;
      return {
        numbers: [a, b, c, d],
        target,
        solution: `${a} \u00d7 ${b} - ${c} + ${d}`,
        difficulty,
      };
    }
  }
}

/**
 * Validate a user-built expression: check that it uses only the given numbers
 * and evaluates to the target.
 */
export function validateExpression(
  expression: string,
  availableNumbers: number[],
  target: number,
): { valid: boolean; result: number | null; error: string | null } {
  if (!expression.trim()) {
    return { valid: false, result: null, error: '式を入力してください' };
  }

  // Convert display operators to JS operators
  const jsExpr = expression.replace(/\u00d7/g, '*').replace(/\u00f7/g, '/');

  // Extract numbers from the expression
  const exprNumbers = jsExpr.match(/\d+/g);
  if (!exprNumbers) {
    return { valid: false, result: null, error: '数字を使ってください' };
  }

  const usedNumbers = exprNumbers.map(Number);
  const sortedAvailable = [...availableNumbers].sort((a, b) => a - b);
  const sortedUsed = [...usedNumbers].sort((a, b) => a - b);

  if (sortedUsed.length !== sortedAvailable.length) {
    return { valid: false, result: null, error: '全ての数字を使ってください' };
  }

  for (let i = 0; i < sortedUsed.length; i++) {
    if (sortedUsed[i] !== sortedAvailable[i]) {
      return { valid: false, result: null, error: '使える数字が異なります' };
    }
  }

  // Evaluate the expression
  const result = safeEval(jsExpr);
  if (isNaN(result)) {
    return { valid: false, result: null, error: '式が正しくありません' };
  }

  if (result !== target) {
    return { valid: false, result, error: null };
  }

  return { valid: true, result, error: null };
}
