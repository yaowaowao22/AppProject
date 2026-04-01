// HEX ⇔ HSL 変換ユーティリティ
// ライトネス・彩度のコントラスト調整に使用

/** HEX (#RRGGBB) → [H(0-360), S(0-100), L(0-100)] */
export function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return [0, 0, l * 100];
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }

  return [Math.round(h * 360), s * 100, l * 100];
}

/** [H(0-360), S(0-100), L(0-100)] → HEX (#RRGGBB) */
export function hslToHex(h: number, s: number, l: number): string {
  const sl = s / 100;
  const ll = l / 100;

  const hue2rgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  let r: number;
  let g: number;
  let b: number;

  if (sl === 0) {
    r = g = b = ll;
  } else {
    const q = ll < 0.5 ? ll * (1 + sl) : ll + sl - ll * sl;
    const p = 2 * ll - q;
    r = hue2rgb(p, q, h / 360 + 1 / 3);
    g = hue2rgb(p, q, h / 360);
    b = hue2rgb(p, q, h / 360 - 1 / 3);
  }

  const toHex = (x: number): string => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * HEXカラーのライトネスを deltaL ぶん増減させる（クランプ: 0-100）
 * rgba(...) など非HEX文字列はそのまま返す
 */
export function adjustHexLightness(hex: string, deltaL: number): string {
  if (!hex.startsWith('#') || hex.length < 7) return hex;
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.min(100, Math.max(0, l + deltaL)));
}

/**
 * HEXカラーの彩度を deltaS ぶん増減させる（クランプ: 0-100）
 * rgba(...) など非HEX文字列はそのまま返す
 */
export function adjustHexSaturation(hex: string, deltaS: number): string {
  if (!hex.startsWith('#') || hex.length < 7) return hex;
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, Math.min(100, Math.max(0, s + deltaS)), l);
}
