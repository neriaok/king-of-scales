import type { Chord } from './notes';
import { TRIAD_INTERVALS } from './spelling';

/** MIDI number of middle C (C4). */
export const MIDDLE_C = 60;

/**
 * Root-position triad as semitone offsets from the first C of the keyboard diagram,
 * e.g. A minor → [9, 12, 16] (A, C, E). Always within two octaves (0–23).
 */
export const pianoVoicing = (chord: Chord): [number, number, number] => {
  const [root, third, fifth] = TRIAD_INTERVALS[chord.quality];
  return [chord.pitchClass + root, chord.pitchClass + third, chord.pitchClass + fifth];
};

/** MIDI notes for playback: the triad around C4 plus the root an octave lower. */
export const pianoMidiNotes = (chord: Chord): number[] => [
  MIDDLE_C - 12 + chord.pitchClass,
  ...pianoVoicing(chord).map((offset) => MIDDLE_C + offset),
];
