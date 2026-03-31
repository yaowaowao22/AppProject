/**
 * types.ts はランタイムコードを持たない型定義ファイルのため、
 * ここでは型が期待する「形」を持つオブジェクトを組み立て、
 * TypeScript コンパイラと Jest の両方で問題ないことを確認する。
 */
import type {
  BodyPart,
  EquipmentType,
  Exercise,
  WorkoutSet,
  WorkoutSession,
  DailyWorkout,
  PersonalRecord,
  PartVolumePR,
  WeeklyStats,
  ExerciseHistoryEntry,
  WorkoutTemplate,
  ReportItem,
  BodyPartConfig,
  HistoryTabType,
  AppSettings,
  CalendarDayData,
} from '../types';

// ── 型検証ヘルパー ────────────────────────────────────────────────────────────
// TypeScript が型エラーを検出した場合にコンパイルが失敗する

const assertShape = <T>(value: T): T => value;

// ── BodyPart ─────────────────────────────────────────────────────────────────

describe('BodyPart', () => {
  it('有効な BodyPart 値が 6 種類', () => {
    const parts: BodyPart[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
    expect(parts).toHaveLength(6);
  });
});

// ── EquipmentType ────────────────────────────────────────────────────────────

describe('EquipmentType', () => {
  it('有効な器具種別が存在する', () => {
    const equipment: EquipmentType[] = [
      'バーベル',
      'ダンベル',
      'マシン',
      'ケーブル',
      '自重',
      'ローラー',
      'ツール',
    ];
    expect(equipment).toHaveLength(7);
  });
});

// ── Exercise ─────────────────────────────────────────────────────────────────

describe('Exercise shape', () => {
  it('必須フィールドを持つオブジェクトを構築できる', () => {
    const ex = assertShape<Exercise>({
      id: 'chest_001',
      name: 'ベンチプレス',
      nameEn: 'Bench Press',
      bodyPart: 'chest',
      icon: 'barbell-outline',
      equipment: 'バーベル',
    });
    expect(ex.id).toBe('chest_001');
    expect(ex.muscleDetail).toBeUndefined(); // optional
  });

  it('muscleDetail はオプショナル', () => {
    const ex = assertShape<Exercise>({
      id: 'core_001',
      name: 'クランチ',
      nameEn: 'Crunch',
      bodyPart: 'core',
      icon: 'body-outline',
      equipment: '自重',
      muscleDetail: '腹直筋',
    });
    expect(ex.muscleDetail).toBe('腹直筋');
  });
});

// ── WorkoutSet ────────────────────────────────────────────────────────────────

describe('WorkoutSet shape', () => {
  it('自重種目は weight/reps が null', () => {
    const set = assertShape<WorkoutSet>({
      id: 's1',
      weight: null,
      reps: null,
      completedAt: '2026-03-31T10:00:00.000Z',
    });
    expect(set.weight).toBeNull();
    expect(set.reps).toBeNull();
    expect(set.isPersonalRecord).toBeUndefined();
  });

  it('通常セットは数値', () => {
    const set = assertShape<WorkoutSet>({
      id: 's2',
      weight: 100,
      reps: 5,
      completedAt: '2026-03-31T10:00:00.000Z',
      isPersonalRecord: true,
    });
    expect(set.weight).toBe(100);
    expect(set.isPersonalRecord).toBe(true);
  });
});

// ── WorkoutSession ────────────────────────────────────────────────────────────

describe('WorkoutSession shape', () => {
  it('最小構成で構築できる', () => {
    const session = assertShape<WorkoutSession>({
      id: 'sess1',
      exerciseId: 'chest_001',
      sets: [],
      startedAt: '2026-03-31T09:00:00.000Z',
    });
    expect(session.completedAt).toBeUndefined();
    expect(session.notes).toBeUndefined();
  });
});

// ── DailyWorkout ──────────────────────────────────────────────────────────────

describe('DailyWorkout shape', () => {
  it('正常に構築できる', () => {
    const workout = assertShape<DailyWorkout>({
      id: 'd1',
      date: '2026-03-31',
      sessions: [],
      totalVolume: 1000,
      duration: 3600,
    });
    expect(workout.date).toBe('2026-03-31');
  });
});

// ── PersonalRecord ────────────────────────────────────────────────────────────

describe('PersonalRecord shape', () => {
  it('自重種目は maxWeight が null', () => {
    const pr = assertShape<PersonalRecord>({
      exerciseId: 'core_001',
      maxWeight: null,
      maxReps: 30,
      maxVolume: 0,
      achievedAt: '2026-03-31T10:00:00.000Z',
    });
    expect(pr.maxWeight).toBeNull();
  });
});

// ── PartVolumePR ──────────────────────────────────────────────────────────────

describe('PartVolumePR shape', () => {
  it('正常に構築できる', () => {
    const pvpr = assertShape<PartVolumePR>({
      bodyPart: 'chest',
      volume: 5000,
      achievedAt: '2026-03-31',
    });
    expect(pvpr.bodyPart).toBe('chest');
  });
});

// ── WeeklyStats ───────────────────────────────────────────────────────────────

describe('WeeklyStats shape', () => {
  it('正常に構築できる', () => {
    const stats = assertShape<WeeklyStats>({
      workoutCount: 4,
      totalVolume: 20000,
      streakDays: 7,
    });
    expect(stats.streakDays).toBe(7);
  });
});

// ── ExerciseHistoryEntry ──────────────────────────────────────────────────────

describe('ExerciseHistoryEntry shape', () => {
  it('自重は weight が null', () => {
    const entry = assertShape<ExerciseHistoryEntry>({ date: '3/31', weight: null });
    expect(entry.weight).toBeNull();
  });

  it('通常種目は数値', () => {
    const entry = assertShape<ExerciseHistoryEntry>({ date: '3/31', weight: 100 });
    expect(entry.weight).toBe(100);
  });
});

// ── WorkoutTemplate ───────────────────────────────────────────────────────────

describe('WorkoutTemplate shape', () => {
  it('正常に構築できる', () => {
    const tmpl = assertShape<WorkoutTemplate>({
      id: 't1',
      name: 'Push Day',
      exerciseIds: ['chest_001', 'shoulders_001'],
      createdAt: '2026-03-31T09:00:00.000Z',
    });
    expect(tmpl.exerciseIds).toHaveLength(2);
  });
});

// ── ReportItem ────────────────────────────────────────────────────────────────

describe('ReportItem shape', () => {
  it('PR ありの場合', () => {
    const item = assertShape<ReportItem>({
      name: 'ベンチプレス',
      sets: 5,
      maxWeight: 100,
      prevBest: 97.5,
      isPR: true,
    });
    expect(item.isPR).toBe(true);
  });

  it('自重種目は maxWeight/prevBest が null', () => {
    const item = assertShape<ReportItem>({
      name: 'クランチ',
      sets: 3,
      maxWeight: null,
      prevBest: null,
      isPR: false,
    });
    expect(item.maxWeight).toBeNull();
  });
});

// ── BodyPartConfig ────────────────────────────────────────────────────────────

describe('BodyPartConfig shape', () => {
  it('正常に構築できる', () => {
    const cfg = assertShape<BodyPartConfig>({
      id: 'chest',
      label: '胸',
      labelEn: 'Chest',
      icon: 'barbell-outline',
      exerciseCount: 8,
    });
    expect(cfg.id).toBe('chest');
  });
});

// ── HistoryTabType ────────────────────────────────────────────────────────────

describe('HistoryTabType', () => {
  it('有効なタブ種別', () => {
    const tabs: HistoryTabType[] = ['daily', 'bodyPart', 'exercise'];
    expect(tabs).toHaveLength(3);
  });
});

// ── AppSettings ───────────────────────────────────────────────────────────────

describe('AppSettings shape', () => {
  it('正常に構築できる', () => {
    const settings = assertShape<AppSettings>({
      showCalendar: true,
      showQuickStart: false,
    });
    expect(settings.showCalendar).toBe(true);
  });
});

// ── CalendarDayData ───────────────────────────────────────────────────────────

describe('CalendarDayData shape', () => {
  it('ワークアウトあり', () => {
    const day = assertShape<CalendarDayData>({
      date: '2026-03-31',
      hasWorkout: true,
      bodyParts: ['chest', 'shoulders'],
      totalVolume: 3000,
    });
    expect(day.bodyParts).toHaveLength(2);
  });

  it('ワークアウトなし', () => {
    const day = assertShape<CalendarDayData>({
      date: '2026-03-31',
      hasWorkout: false,
      bodyParts: [],
      totalVolume: 0,
    });
    expect(day.hasWorkout).toBe(false);
  });
});
