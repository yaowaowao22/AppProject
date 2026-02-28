export type Peg = number[]; // array of disk sizes (1 = smallest)
export type GameState = [Peg, Peg, Peg];

export function createInitialState(diskCount: number): GameState {
  const disks: number[] = [];
  for (let i = diskCount; i >= 1; i--) {
    disks.push(i);
  }
  return [disks, [], []];
}

export function getOptimalMoves(diskCount: number): number {
  return Math.pow(2, diskCount) - 1;
}

export function isValidMove(state: GameState, from: number, to: number): boolean {
  if (from === to) return false;
  if (from < 0 || from > 2 || to < 0 || to > 2) return false;
  const fromPeg = state[from];
  if (fromPeg.length === 0) return false;
  const toPeg = state[to];
  const movingDisk = fromPeg[fromPeg.length - 1];
  if (toPeg.length > 0 && toPeg[toPeg.length - 1] < movingDisk) {
    return false;
  }
  return true;
}

export function moveDisk(state: GameState, from: number, to: number): GameState {
  const newState: GameState = [
    [...state[0]],
    [...state[1]],
    [...state[2]],
  ];
  const disk = newState[from].pop()!;
  newState[to].push(disk);
  return newState;
}

export function isComplete(state: GameState, diskCount: number): boolean {
  return state[2].length === diskCount;
}

export interface HanoiMove {
  from: number;
  to: number;
}

export function solveHanoi(diskCount: number): HanoiMove[] {
  const moves: HanoiMove[] = [];
  function solve(n: number, from: number, to: number, aux: number) {
    if (n === 0) return;
    solve(n - 1, from, aux, to);
    moves.push({ from, to });
    solve(n - 1, aux, to, from);
  }
  solve(diskCount, 0, 2, 1);
  return moves;
}

export function getNextOptimalMove(state: GameState, diskCount: number): HanoiMove | null {
  const allMoves = solveHanoi(diskCount);
  let simState = createInitialState(diskCount);

  for (const move of allMoves) {
    if (statesEqual(simState, state)) {
      return move;
    }
    simState = moveDisk(simState, move.from, move.to);
  }

  if (statesEqual(simState, state)) {
    return null; // already complete
  }

  // If current state is not on the optimal path, find a reasonable next move
  // by trying to move the smallest out-of-place disk toward its target
  return findBestMove(state, diskCount);
}

function statesEqual(a: GameState, b: GameState): boolean {
  for (let i = 0; i < 3; i++) {
    if (a[i].length !== b[i].length) return false;
    for (let j = 0; j < a[i].length; j++) {
      if (a[i][j] !== b[i][j]) return false;
    }
  }
  return true;
}

function findBestMove(state: GameState, diskCount: number): HanoiMove | null {
  // Try all valid moves and pick the one that leads to the state
  // closest to the goal (most disks on peg 2)
  let bestMove: HanoiMove | null = null;
  let bestScore = -1;

  for (let from = 0; from < 3; from++) {
    for (let to = 0; to < 3; to++) {
      if (from === to) continue;
      if (!isValidMove(state, from, to)) continue;
      const nextState = moveDisk(state, from, to);
      const score = evaluateState(nextState, diskCount);
      if (score > bestScore) {
        bestScore = score;
        bestMove = { from, to };
      }
    }
  }

  return bestMove;
}

function evaluateState(state: GameState, diskCount: number): number {
  let score = 0;
  // Reward disks correctly placed on peg 2 from bottom up
  for (let i = 0; i < state[2].length; i++) {
    if (state[2][i] === diskCount - i) {
      score += (diskCount - i) * 10;
    } else {
      break;
    }
  }
  return score;
}

export function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const DISK_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
];

export const DISK_COUNTS = [3, 4, 5, 6, 7] as const;
export type DiskCount = (typeof DISK_COUNTS)[number];
