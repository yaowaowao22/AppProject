import {
  STORAGE_KEYS,
  SPRING_EASING,
  EASE_OUT_DURATION,
  ANIMATION,
  WORKOUT,
  APP,
  CALENDAR,
} from '../config';

// ── STORAGE_KEYS ──────────────────────────────────────────────────────────────

describe('STORAGE_KEYS', () => {
  it('必要なキーがすべて存在する', () => {
    expect(STORAGE_KEYS.WORKOUTS).toBeDefined();
    expect(STORAGE_KEYS.PERSONAL_RECORDS).toBeDefined();
    expect(STORAGE_KEYS.PART_VOLUME_PRS).toBeDefined();
    expect(STORAGE_KEYS.QUICK_START_IDS).toBeDefined();
    expect(STORAGE_KEYS.LAST_WEIGHTS).toBeDefined();
    expect(STORAGE_KEYS.STREAK_DATA).toBeDefined();
    expect(STORAGE_KEYS.TEMPLATES).toBeDefined();
    expect(STORAGE_KEYS.WORKOUT_CONFIG).toBeDefined();
    expect(STORAGE_KEYS.APP_SETTINGS).toBeDefined();
  });

  it('すべてのキー値が "tanren_" プレフィックスを持つ', () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      expect(key).toMatch(/^tanren_/);
    });
  });

  it('すべてのキー値が一意である', () => {
    const values = Object.values(STORAGE_KEYS);
    expect(new Set(values).size).toBe(values.length);
  });
});

// ── ANIMATION ────────────────────────────────────────────────────────────────

describe('ANIMATION', () => {
  it('すべての値が正の数値である', () => {
    Object.values(ANIMATION).forEach(value => {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    });
  });

  it('setCompletePause は setComplete より長い', () => {
    expect(ANIMATION.setCompletePause).toBeGreaterThan(ANIMATION.setComplete);
  });
});

describe('SPRING_EASING', () => {
  it('damping・stiffness・mass がすべて正の数値', () => {
    expect(SPRING_EASING.damping).toBeGreaterThan(0);
    expect(SPRING_EASING.stiffness).toBeGreaterThan(0);
    expect(SPRING_EASING.mass).toBeGreaterThan(0);
  });
});

describe('EASE_OUT_DURATION', () => {
  it('正の数値である', () => {
    expect(EASE_OUT_DURATION).toBeGreaterThan(0);
  });
});

// ── WORKOUT ──────────────────────────────────────────────────────────────────

describe('WORKOUT', () => {
  it('DEFAULT_SETS は正の整数', () => {
    expect(WORKOUT.DEFAULT_SETS).toBeGreaterThan(0);
    expect(Number.isInteger(WORKOUT.DEFAULT_SETS)).toBe(true);
  });

  it('DEFAULT_WEIGHT は正の数値', () => {
    expect(WORKOUT.DEFAULT_WEIGHT).toBeGreaterThan(0);
  });

  it('DEFAULT_REPS は正の整数', () => {
    expect(WORKOUT.DEFAULT_REPS).toBeGreaterThan(0);
    expect(Number.isInteger(WORKOUT.DEFAULT_REPS)).toBe(true);
  });

  it('WEIGHT_STEP は正の数値', () => {
    expect(WORKOUT.WEIGHT_STEP).toBeGreaterThan(0);
  });

  it('REPS_STEP は正の整数', () => {
    expect(WORKOUT.REPS_STEP).toBeGreaterThan(0);
    expect(Number.isInteger(WORKOUT.REPS_STEP)).toBe(true);
  });

  it('MIN_WEIGHT は 0 以上', () => {
    expect(WORKOUT.MIN_WEIGHT).toBeGreaterThanOrEqual(0);
  });

  it('MIN_REPS は 1 以上', () => {
    expect(WORKOUT.MIN_REPS).toBeGreaterThanOrEqual(1);
  });
});

// ── APP ──────────────────────────────────────────────────────────────────────

describe('APP', () => {
  it('NAME が "TANREN"', () => {
    expect(APP.NAME).toBe('TANREN');
  });

  it('VERSION が semver 形式', () => {
    expect(APP.VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('SPARK_MAX_SESSIONS は正の整数', () => {
    expect(APP.SPARK_MAX_SESSIONS).toBeGreaterThan(0);
    expect(Number.isInteger(APP.SPARK_MAX_SESSIONS)).toBe(true);
  });

  it('VOLUME_CHART_DAYS は正の整数', () => {
    expect(APP.VOLUME_CHART_DAYS).toBeGreaterThan(0);
    expect(Number.isInteger(APP.VOLUME_CHART_DAYS)).toBe(true);
  });

  it('DEFAULT_APP_SETTINGS に showCalendar と showQuickStart がある', () => {
    expect(typeof APP.DEFAULT_APP_SETTINGS.showCalendar).toBe('boolean');
    expect(typeof APP.DEFAULT_APP_SETTINGS.showQuickStart).toBe('boolean');
  });
});

// ── CALENDAR ─────────────────────────────────────────────────────────────────

describe('CALENDAR', () => {
  it('WEEKS_TO_SHOW は正の整数', () => {
    expect(CALENDAR.WEEKS_TO_SHOW).toBeGreaterThan(0);
    expect(Number.isInteger(CALENDAR.WEEKS_TO_SHOW)).toBe(true);
  });

  it('WEEK_START は 0（日曜）または 1（月曜）', () => {
    expect([0, 1]).toContain(CALENDAR.WEEK_START);
  });
});
