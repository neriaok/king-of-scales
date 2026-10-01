import type { ChordQuality } from './notes';

export type DegreeId = '1' | '2m' | '3m' | '4' | '5' | '6m' | '7dim';

export interface Degree {
  id: DegreeId;
  /** Label shown in the UI, e.g. `7°`. */
  label: string;
  quality: ChordQuality;
  /** Semitones above the key's root (major-scale formula). */
  semitones: number;
  /** Position in the scale, 0–6; also the letter offset from the root. */
  step: number;
  /** Function of the degree in Hebrew, when it has a common one. */
  role: string | null;
  /** The chord this degree gives in C, e.g. `F` for 4. */
  inC: string;
}

/** The seven diatonic triads of a major key, in degree order. */
export const DEGREES: readonly Degree[] = [
  { id: '1', label: '1', quality: 'major', semitones: 0, step: 0, role: 'בית', inC: 'C' },
  { id: '2m', label: '2m', quality: 'minor', semitones: 2, step: 1, role: null, inC: 'Dm' },
  { id: '3m', label: '3m', quality: 'minor', semitones: 4, step: 2, role: null, inC: 'Em' },
  { id: '4', label: '4', quality: 'major', semitones: 5, step: 3, role: 'מתרחק', inC: 'F' },
  {
    id: '5',
    label: '5',
    quality: 'major',
    semitones: 7,
    step: 4,
    role: 'מתח · דומיננטה',
    inC: 'G',
  },
  {
    id: '6m',
    label: '6m',
    quality: 'minor',
    semitones: 9,
    step: 5,
    role: 'מינור מקביל',
    inC: 'Am',
  },
  { id: '7dim', label: '7°', quality: 'diminished', semitones: 11, step: 6, role: null, inC: 'B°' },
];

export const DEGREE_IDS: readonly DegreeId[] = DEGREES.map((degree) => degree.id);

const DEGREE_BY_ID = new Map<DegreeId, Degree>(DEGREES.map((degree) => [degree.id, degree]));

export const isDegreeId = (value: unknown): value is DegreeId =>
  typeof value === 'string' && DEGREE_BY_ID.has(value as DegreeId);

export const getDegree = (id: DegreeId): Degree => {
  const degree = DEGREE_BY_ID.get(id);
  if (!degree) throw new Error(`Unknown degree: ${id}`);
  return degree;
};

/** Returns the selection in degree order (1 → 7°) without duplicates. */
export const sortDegrees = (selection: readonly DegreeId[]): DegreeId[] =>
  DEGREE_IDS.filter((id) => selection.includes(id));

export type PresetId = 'all' | 'oneFourFive' | 'major' | 'minor' | 'pop';

export interface Preset {
  id: PresetId;
  label: string;
  /** Degrees in the order they are named; the table always shows them in degree order. */
  degrees: readonly DegreeId[];
}

export const PRESETS: readonly Preset[] = [
  { id: 'all', label: 'הכל', degrees: DEGREE_IDS },
  { id: 'oneFourFive', label: '1 · 4 · 5', degrees: ['1', '4', '5'] },
  { id: 'major', label: 'מז׳ור', degrees: ['1', '4', '5'] },
  { id: 'minor', label: 'מינור', degrees: ['2m', '3m', '6m'] },
  { id: 'pop', label: 'פופ 1·5·6·4', degrees: ['1', '5', '6m', '4'] },
];

export const getPreset = (id: PresetId): Preset => {
  const preset = PRESETS.find((candidate) => candidate.id === id);
  if (!preset) throw new Error(`Unknown preset: ${id}`);
  return preset;
};

/** True when the selection contains exactly the preset's degrees, in any order. */
export const matchesPreset = (selection: readonly DegreeId[], preset: Preset): boolean => {
  const selected = sortDegrees(selection);
  const wanted = sortDegrees(preset.degrees);
  return selected.length === wanted.length && selected.every((id, index) => id === wanted[index]);
};

/** The first preset that matches the selection exactly, or null. */
export const findActivePreset = (selection: readonly DegreeId[]): PresetId | null =>
  PRESETS.find((preset) => matchesPreset(selection, preset))?.id ?? null;
