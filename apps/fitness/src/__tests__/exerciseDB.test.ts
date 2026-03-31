import {
  BODY_PARTS,
  EXERCISES,
  EXERCISES_BY_PART,
  JP_TO_BODY_PART,
  QUICK_START_IDS,
} from '../exerciseDB';
import type { BodyPart } from '../types';

// ── BODY_PARTS ────────────────────────────────────────────────────────────────

describe('BODY_PARTS', () => {
  it('6 部位が定義されている', () => {
    expect(BODY_PARTS).toHaveLength(6);
  });

  it('すべての部位に必須フィールドがある', () => {
    BODY_PARTS.forEach(part => {
      expect(part.id).toBeTruthy();
      expect(part.label).toBeTruthy();
      expect(part.labelEn).toBeTruthy();
      expect(part.icon).toBeTruthy();
      expect(typeof part.exerciseCount).toBe('number');
      expect(part.exerciseCount).toBeGreaterThan(0);
    });
  });

  it('期待される 6 部位 ID がすべて含まれている', () => {
    const ids = BODY_PARTS.map(p => p.id);
    const expected: BodyPart[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
    expected.forEach(id => expect(ids).toContain(id));
  });

  it('部位 ID が一意である', () => {
    const ids = BODY_PARTS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── EXERCISES ────────────────────────────────────────────────────────────────

describe('EXERCISES', () => {
  it('合計 45 種目が定義されている', () => {
    expect(EXERCISES).toHaveLength(45);
  });

  it('すべての種目に必須フィールドがある', () => {
    EXERCISES.forEach(ex => {
      expect(ex.id).toBeTruthy();
      expect(ex.name).toBeTruthy();
      expect(ex.nameEn).toBeTruthy();
      expect(ex.bodyPart).toBeTruthy();
      expect(ex.icon).toBeTruthy();
      expect(ex.equipment).toBeTruthy();
    });
  });

  it('すべての種目 ID が一意である', () => {
    const ids = EXERCISES.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('すべての bodyPart が有効な値である', () => {
    const valid: BodyPart[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
    EXERCISES.forEach(ex => {
      expect(valid).toContain(ex.bodyPart);
    });
  });

  it('種目 ID が "{bodyPart}_{3桁}" 形式に従っている', () => {
    EXERCISES.forEach(ex => {
      expect(ex.id).toMatch(/^[a-z]+_\d{3}$/);
    });
  });
});

// ── EXERCISES_BY_PART ─────────────────────────────────────────────────────────

describe('EXERCISES_BY_PART', () => {
  it('胸は 8 種目', () => expect(EXERCISES_BY_PART.chest).toHaveLength(8));
  it('背中は 10 種目', () => expect(EXERCISES_BY_PART.back).toHaveLength(10));
  it('脚は 9 種目', () => expect(EXERCISES_BY_PART.legs).toHaveLength(9));
  it('肩は 6 種目', () => expect(EXERCISES_BY_PART.shoulders).toHaveLength(6));
  it('腕は 7 種目', () => expect(EXERCISES_BY_PART.arms).toHaveLength(7));
  it('腹は 5 種目', () => expect(EXERCISES_BY_PART.core).toHaveLength(5));

  it('全部位の合計が EXERCISES と一致する', () => {
    const total = Object.values(EXERCISES_BY_PART).reduce(
      (sum, arr) => sum + arr.length,
      0,
    );
    expect(total).toBe(EXERCISES.length);
  });

  it('各部位の種目の bodyPart がキーと一致する', () => {
    (Object.entries(EXERCISES_BY_PART) as [BodyPart, typeof EXERCISES][]).forEach(
      ([part, exercises]) => {
        exercises.forEach(ex => expect(ex.bodyPart).toBe(part));
      },
    );
  });
});

// ── JP_TO_BODY_PART ──────────────────────────────────────────────────────────

describe('JP_TO_BODY_PART', () => {
  it('6 つの日本語部位名マッピングがある', () => {
    expect(Object.keys(JP_TO_BODY_PART)).toHaveLength(6);
  });

  it.each([
    ['胸', 'chest'],
    ['背中', 'back'],
    ['脚', 'legs'],
    ['肩', 'shoulders'],
    ['腕', 'arms'],
    ['腹', 'core'],
  ] as const)('"%s" → "%s"', (jp, en) => {
    expect(JP_TO_BODY_PART[jp]).toBe(en);
  });
});

// ── QUICK_START_IDS ──────────────────────────────────────────────────────────

describe('QUICK_START_IDS', () => {
  it('デフォルト 5 件', () => {
    expect(QUICK_START_IDS).toHaveLength(5);
  });

  it('すべての ID が EXERCISES に存在する', () => {
    const exerciseIdSet = new Set(EXERCISES.map(e => e.id));
    QUICK_START_IDS.forEach(id => {
      expect(exerciseIdSet.has(id)).toBe(true);
    });
  });

  it('重複 ID がない', () => {
    expect(new Set(QUICK_START_IDS).size).toBe(QUICK_START_IDS.length);
  });
});
