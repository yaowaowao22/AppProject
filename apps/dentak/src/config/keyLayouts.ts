// ══════════════════════════════════════════════
// 無音の演算 — Key Layout System
// キーカタログ + プリセットレイアウト + カスタマイズ型定義
// ══════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export type BtnType = 'fn' | 'num' | 'op' | 'op-eq' | 'mic' | 'util';

export interface KeyDef {
  /** Unique identifier — used as keyId in layouts */
  id:        string;
  /** Display label */
  label:     string;
  /** Key sent to handleKeyPress */
  pressKey:  string;
  /** Visual type (determines color) */
  type:      BtnType;
  /** Use monospace font */
  mono?:     boolean;
  /** Override label font size */
  fontSize?: number;
}

/** One cell in the layout grid */
export interface LayoutCell {
  /** References KEY_CATALOG by id */
  keyId: string;
  /** flex value for the cell; default 1 */
  flex?: number;
}

export type LayoutRow  = LayoutCell[];
export type KeyLayout  = LayoutRow[];

export type PresetName = 'standard' | 'extended' | 'casio';

// ── Key Catalog ──────────────────────────────────────────────────────────────
// All available keys that can be placed in the grid.

export const KEY_CATALOG: Record<string, KeyDef> = {
  // ── Digits ──
  '0':   { id: '0',   label: '0',   pressKey: '0',   type: 'num' },
  '1':   { id: '1',   label: '1',   pressKey: '1',   type: 'num' },
  '2':   { id: '2',   label: '2',   pressKey: '2',   type: 'num' },
  '3':   { id: '3',   label: '3',   pressKey: '3',   type: 'num' },
  '4':   { id: '4',   label: '4',   pressKey: '4',   type: 'num' },
  '5':   { id: '5',   label: '5',   pressKey: '5',   type: 'num' },
  '6':   { id: '6',   label: '6',   pressKey: '6',   type: 'num' },
  '7':   { id: '7',   label: '7',   pressKey: '7',   type: 'num' },
  '8':   { id: '8',   label: '8',   pressKey: '8',   type: 'num' },
  '9':   { id: '9',   label: '9',   pressKey: '9',   type: 'num' },
  '.':   { id: '.',   label: '.',   pressKey: '.',   type: 'num' },

  // ── Operators ──
  '+':   { id: '+',   label: '+',   pressKey: '+',   type: 'op' },
  '-':   { id: '-',   label: '−',   pressKey: '-',   type: 'op' },
  '×':   { id: '×',   label: '×',   pressKey: '×',   type: 'op' },
  '÷':   { id: '÷',   label: '÷',   pressKey: '÷',   type: 'op' },
  '=':   { id: '=',   label: '=',   pressKey: '=',   type: 'op-eq' },

  // ── Functions ──
  'AC':    { id: 'AC',    label: 'AC',    pressKey: 'AC',    type: 'fn' },
  '±':     { id: '±',     label: '±',     pressKey: '±',     type: 'fn' },
  '%':     { id: '%',     label: '%',     pressKey: '%',     type: 'fn' },
  'π':     { id: 'π',     label: 'π',     pressKey: 'π',     type: 'fn',  mono: true },
  'e':     { id: 'e',     label: 'e',     pressKey: 'e',     type: 'fn',  mono: true },
  'sqrt':  { id: 'sqrt',  label: '√x',   pressKey: 'sqrt',  type: 'fn',  mono: true, fontSize: 14 },
  'x²':    { id: 'x²',   label: 'x²',   pressKey: 'x²',   type: 'fn',  mono: true, fontSize: 14 },
  'log':   { id: 'log',   label: 'log',  pressKey: 'log',   type: 'fn',  mono: true, fontSize: 14 },
  'ln':    { id: 'ln',    label: 'ln',   pressKey: 'ln',    type: 'fn',  mono: true, fontSize: 14 },
  'sin':   { id: 'sin',   label: 'sin',  pressKey: 'sin',   type: 'fn',  mono: true, fontSize: 14 },
  'cos':   { id: 'cos',   label: 'cos',  pressKey: 'cos',   type: 'fn',  mono: true, fontSize: 14 },
  'tan':   { id: 'tan',   label: 'tan',  pressKey: 'tan',   type: 'fn',  mono: true, fontSize: 14 },
  'asin':  { id: 'asin',  label: 'sin⁻¹', pressKey: 'asin', type: 'fn',  mono: true, fontSize: 12 },
  'acos':  { id: 'acos',  label: 'cos⁻¹', pressKey: 'acos', type: 'fn',  mono: true, fontSize: 12 },
  'atan':  { id: 'atan',  label: 'tan⁻¹', pressKey: 'atan', type: 'fn',  mono: true, fontSize: 12 },
  'x³':    { id: 'x³',   label: 'x³',   pressKey: 'x³',   type: 'fn',  mono: true, fontSize: 14 },
  'cbrt':  { id: 'cbrt',  label: '∛x',   pressKey: 'cbrt',  type: 'fn',  mono: true, fontSize: 14 },
  'xⁿ':    { id: 'xⁿ',   label: 'xⁿ',   pressKey: 'xⁿ',   type: 'fn',  mono: true, fontSize: 14 },
  'eˣ':    { id: 'eˣ',   label: 'eˣ',   pressKey: 'eˣ',   type: 'fn',  mono: true, fontSize: 14 },
  '10^x':  { id: '10^x', label: '10ˣ',  pressKey: '10^x',  type: 'fn',  mono: true, fontSize: 12 },
  'n!':    { id: 'n!',    label: 'n!',   pressKey: 'n!',    type: 'fn',  mono: true, fontSize: 14 },
  '1/x':   { id: '1/x',  label: 'x⁻¹',  pressKey: '1/x',   type: 'fn',  mono: true, fontSize: 14 },

  // ── Utility ──
  '(':     { id: '(',     label: '（',   pressKey: '(',     type: 'util' },
  ')':     { id: ')',     label: '）',   pressKey: ')',     type: 'util' },
  'EE':    { id: 'EE',    label: 'EE',   pressKey: 'EE',    type: 'util' },
  'ANS':   { id: 'ANS',   label: 'ANS',  pressKey: 'ANS',   type: 'util' },
  '⌫':    { id: '⌫',    label: '⌫',   pressKey: '⌫',    type: 'util' },

  // ── Mic ──
  'mic':   { id: 'mic',   label: 'mic',  pressKey: 'mic',   type: 'mic' },
};

/** Flat list of all key IDs for the picker UI */
export const ALL_KEY_IDS = Object.keys(KEY_CATALOG);

/** Resolve a LayoutCell to a full KeyDef (returns undefined for unknown IDs) */
export function resolveKey(keyId: string): KeyDef | undefined {
  return KEY_CATALOG[keyId];
}

// ── Preset Layouts ───────────────────────────────────────────────────────────

/**
 * Standard: iOS Calculator / CASIO風 4列レイアウト
 * 数字キーと演算子のみ。関数キーはSciRowに集約。
 * 🎙はUtilBarに配置。
 */
export const PRESET_STANDARD: KeyLayout = [
  [
    { keyId: 'AC' },
    { keyId: '±' },
    { keyId: '%' },
    { keyId: '÷' },
  ],
  [
    { keyId: '7' },
    { keyId: '8' },
    { keyId: '9' },
    { keyId: '×' },
  ],
  [
    { keyId: '4' },
    { keyId: '5' },
    { keyId: '6' },
    { keyId: '-' },
  ],
  [
    { keyId: '1' },
    { keyId: '2' },
    { keyId: '3' },
    { keyId: '+' },
  ],
  [
    { keyId: '0', flex: 2 },
    { keyId: '.' },
    { keyId: '=' },
  ],
];

/**
 * Extended: 5列レイアウト（関数ショートカット付き）
 * よく使う関数キーを数字グリッドに統合。
 */
export const PRESET_EXTENDED: KeyLayout = [
  [
    { keyId: 'AC' },
    { keyId: '±' },
    { keyId: '%' },
    { keyId: 'π' },
    { keyId: '÷' },
  ],
  [
    { keyId: '7' },
    { keyId: '8' },
    { keyId: '9' },
    { keyId: 'sqrt' },
    { keyId: '×' },
  ],
  [
    { keyId: '4' },
    { keyId: '5' },
    { keyId: '6' },
    { keyId: 'x²' },
    { keyId: '-' },
  ],
  [
    { keyId: '1' },
    { keyId: '2' },
    { keyId: '3' },
    { keyId: 'log' },
    { keyId: '+' },
  ],
  [
    { keyId: '0', flex: 2 },
    { keyId: '.' },
    { keyId: 'mic' },
    { keyId: '=' },
  ],
];

/**
 * CASIO: CASIO fx-991風レイアウト
 * DEL/ACが右上、Ansキー付き、演算子が右2列。
 */
export const PRESET_CASIO: KeyLayout = [
  [
    { keyId: '7' },
    { keyId: '8' },
    { keyId: '9' },
    { keyId: '⌫' },
    { keyId: 'AC' },
  ],
  [
    { keyId: '4' },
    { keyId: '5' },
    { keyId: '6' },
    { keyId: '×' },
    { keyId: '÷' },
  ],
  [
    { keyId: '1' },
    { keyId: '2' },
    { keyId: '3' },
    { keyId: '+' },
    { keyId: '-' },
  ],
  [
    { keyId: '0', flex: 2 },
    { keyId: '.' },
    { keyId: 'ANS' },
    { keyId: '=' },
  ],
];

export const PRESETS: Record<PresetName, KeyLayout> = {
  standard: PRESET_STANDARD,
  extended: PRESET_EXTENDED,
  casio:    PRESET_CASIO,
};

export const PRESET_LABELS: Record<PresetName, string> = {
  standard: 'スタンダード',
  extended: '拡張 (5列)',
  casio:    'CASIO風',
};

/** Utility bar presets per layout type */
export const UTIL_BAR_PRESETS: Record<PresetName, LayoutRow> = {
  standard: [
    { keyId: '(' },
    { keyId: ')' },
    { keyId: 'EE' },
    { keyId: 'ANS' },
    { keyId: 'mic' },
    { keyId: '⌫' },
  ],
  extended: [
    { keyId: '(' },
    { keyId: ')' },
    { keyId: 'EE' },
    { keyId: 'ANS' },
    { keyId: '⌫' },
  ],
  casio: [
    { keyId: '(' },
    { keyId: ')' },
    { keyId: 'EE' },
    { keyId: 'mic' },
    { keyId: '±' },
    { keyId: '%' },
  ],
};

/** Deep-clone a layout for safe mutation */
export function cloneLayout(layout: KeyLayout): KeyLayout {
  return layout.map(row => row.map(cell => ({ ...cell })));
}

/** Validate that all keyIds in a layout exist in KEY_CATALOG */
export function validateLayout(layout: KeyLayout): boolean {
  return layout.every(row =>
    row.every(cell => cell.keyId in KEY_CATALOG),
  );
}
