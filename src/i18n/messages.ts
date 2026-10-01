import type { DegreeId, PresetId } from '../lib/music/degrees';
import { getDegree, getPreset } from '../lib/music/degrees';
import type { ChordQuality } from '../lib/music/notes';
import type { SuggestionId } from '../lib/music/sequence';

export type Language = 'he' | 'en';

export const LANGUAGES: readonly Language[] = ['he', 'en'];

export const isLanguage = (value: unknown): value is Language =>
  typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);

/** Text direction of each language. Chord names, tables and diagrams stay LTR in both. */
export const LANGUAGE_DIR: Readonly<Record<Language, 'rtl' | 'ltr'>> = { he: 'rtl', en: 'ltr' };

/** Each language's name in itself, for the language switch. */
export const LANGUAGE_NAMES: Readonly<Record<Language, string>> = { he: 'עברית', en: 'English' };

export interface PresetLabel {
  name?: string;
  sequence?: string;
}

/** Every user-facing string. Adding a key here makes TypeScript require it in both languages. */
export interface Messages {
  appTitle: string;
  subtitle: string;
  languageLabel: string;
  instrumentLabel: string;
  instruments: Record<'guitar' | 'piano', string>;
  pickerLabel: string;
  presetsLabel: string;
  /** Preset button text: a name and/or a degree sequence that always reads left to right. */
  presets: Record<PresetId, PresetLabel>;
  lastDegreeHint: string;
  sequence: {
    label: string;
    placeholder: string;
    help: string;
    submit: string;
    errorEmpty: string;
    errorInvalid: (characters: string) => string;
    duplicates: string;
    suggestionsLabel: string;
    suggestions: Record<SuggestionId, string>;
  };
  tableCaption: string;
  keyColumn: string;
  capoColumn: string;
  noCapo: string;
  easyKey: string;
  /** Role names for degrees that have one. */
  roles: Partial<Record<DegreeId, string>>;
  /** Subtitle under a column header, e.g. "like F". */
  likeChord: (chordInC: string) => string;
  qualities: Record<ChordQuality, string>;
  legendLabel: string;
  legend: { major: string; minor: string; diminished: string; easy: string };
  close: string;
  play: string;
  chordTonesLabel: string;
  tips: { guitarBarre: string; guitarOpen: string; piano: string };
  guitarDiagramLabel: (chord: string) => string;
  pianoDiagramLabel: (chord: string) => string;
}

const role = (id: DegreeId): string => getDegree(id).role ?? '';

const he: Messages = {
  appTitle: 'מלך הסולמות',
  subtitle: 'כל שורה עולה חצי טון. לחץ על אקורד כדי לראות איך מנגנים אותו.',
  languageLabel: 'שפה',
  instrumentLabel: 'כלי',
  instruments: { guitar: 'גיטרה', piano: 'פסנתר' },
  pickerLabel: 'אילו אקורדים להציג',
  presetsLabel: 'בחירה מהירה',
  presets: {
    all: { name: getPreset('all').label },
    oneFourFive: { sequence: getPreset('oneFourFive').label },
    major: { name: getPreset('major').label },
    minor: { name: getPreset('minor').label },
    pop: { name: 'פופ', sequence: '1·5·6·4' },
  },
  lastDegreeHint: 'חייב להישאר לפחות אקורד אחד בטבלה',
  sequence: {
    label: 'רצף משלך',
    placeholder: 'לדוגמה 1-6-4-5',
    help: 'ספרות 1 עד 7. העמודות יוצגו בסדר שהקלדת.',
    submit: 'הצג',
    errorEmpty: 'הקלד לפחות ספרה אחת בין 1 ל-7',
    errorInvalid: (characters) => `אפשר להשתמש רק בספרות 1 עד 7 (לא: ${characters})`,
    duplicates: 'מספר שחזר על עצמו מוצג פעם אחת',
    suggestionsLabel: 'רצפים נפוצים',
    suggestions: {
      pop: 'פופ',
      fifties: 'שנות ה-50',
      sensitive: 'פופ במינור',
      jazz: 'ג׳אז',
      blues: 'בלוז ורוק',
    },
  },
  tableCaption: 'אקורדים לפי דרגה בכל 12 הסולמות',
  keyColumn: 'סולם',
  capoColumn: 'קאפו על צורות C',
  noCapo: '—',
  easyKey: 'נוח באקורדים פתוחים',
  roles: { '1': role('1'), '4': role('4'), '5': role('5'), '6m': role('6m') },
  likeChord: (chordInC) => `כמו ${chordInC}`,
  qualities: { major: 'מז׳ור', minor: 'מינור', diminished: 'מוקטן' },
  legendLabel: 'מקרא',
  legend: {
    major: 'מז׳ור',
    minor: 'מינור',
    diminished: 'מוקטן (נדיר בשירים)',
    easy: 'נוח באקורדים פתוחים, בלי ברה',
  },
  close: 'סגור',
  play: '▶ נגן',
  chordTonesLabel: 'צלילי האקורד',
  tips: {
    guitarBarre: 'המספר בצד הוא הסריג שבו מתחיל התרשים. הפס המלא הוא ברה עם האצבע המורה.',
    guitarOpen: '× = לא לפרוט על המיתר · ○ = מיתר פתוח.',
    piano: 'אצבעות מומלצות ביד ימין: 1, 3, 5 (אגודל, אמה, זרת). בבס ביד שמאל: הצליל הראשון.',
  },
  guitarDiagramLabel: (chord) => `תרשים אצבוע לגיטרה: ${chord}`,
  pianoDiagramLabel: (chord) => `תרשים קלידים לפסנתר: ${chord}`,
};

const en: Messages = {
  appTitle: 'King of Scales',
  subtitle: 'Each row moves up a half step. Tap a chord to see how to play it.',
  languageLabel: 'Language',
  instrumentLabel: 'Instrument',
  instruments: { guitar: 'Guitar', piano: 'Piano' },
  pickerLabel: 'Which chords to show',
  presetsLabel: 'Quick picks',
  presets: {
    all: { name: 'All' },
    oneFourFive: { sequence: '1 · 4 · 5' },
    major: { name: 'Major' },
    minor: { name: 'Minor' },
    pop: { name: 'Pop', sequence: '1·5·6·4' },
  },
  lastDegreeHint: 'At least one chord must stay in the table',
  sequence: {
    label: 'Your own sequence',
    placeholder: 'e.g. 1-6-4-5',
    help: 'Digits 1 to 7. Columns appear in the order you type.',
    submit: 'Show',
    errorEmpty: 'Type at least one digit from 1 to 7',
    errorInvalid: (characters) => `Only digits 1 to 7 can be used (not: ${characters})`,
    duplicates: 'A repeated number is shown once',
    suggestionsLabel: 'Common progressions',
    suggestions: {
      pop: 'Pop',
      fifties: "'50s",
      sensitive: 'Minor pop',
      jazz: 'Jazz',
      blues: 'Blues & rock',
    },
  },
  tableCaption: 'Chords by scale degree in all 12 keys',
  keyColumn: 'Key',
  capoColumn: 'Capo with C shapes',
  noCapo: '—',
  easyKey: 'Easy with open chords',
  roles: { '1': 'Home', '4': 'Moving away', '5': 'Tension · dominant', '6m': 'Relative minor' },
  likeChord: (chordInC) => `like ${chordInC}`,
  qualities: { major: 'major', minor: 'minor', diminished: 'diminished' },
  legendLabel: 'Legend',
  legend: {
    major: 'Major',
    minor: 'Minor',
    diminished: 'Diminished (rare in songs)',
    easy: 'Easy with open chords, no barre',
  },
  close: 'Close',
  play: '▶ Play',
  chordTonesLabel: 'Chord tones',
  tips: {
    guitarBarre:
      'The number on the side is the fret the diagram starts at. The long bar is a barre with your index finger.',
    guitarOpen: '× = don’t play this string · ○ = open string.',
    piano:
      'Suggested right-hand fingers: 1, 3, 5 (thumb, middle, pinky). Left hand plays the root in the bass.',
  },
  guitarDiagramLabel: (chord) => `Guitar chord diagram: ${chord}`,
  pianoDiagramLabel: (chord) => `Piano keyboard diagram: ${chord}`,
};

export const MESSAGES: Readonly<Record<Language, Messages>> = { he, en };
