import { describe, expect, it, vi } from 'vitest';
import { ChordPlayer, STRUM_DELAY, midiToFrequency } from './audio';
import { getGuitarVoicing } from './guitarVoicings';
import { parseChord } from './notes';

interface Started {
  frequency: number;
  type: OscillatorType;
  at: number;
}

const createFakeContext = (state: AudioContextState = 'running') => {
  const started: Started[] = [];
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  const node = <T extends object>(extra: T) => ({
    ...extra,
    connect: vi.fn(function (this: unknown, next: unknown) {
      return next;
    }),
  });
  const context = {
    state,
    currentTime: 1,
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    createOscillator: () => {
      const oscillator = node({
        type: 'sine' as OscillatorType,
        frequency: param(),
        start: (at: number) =>
          started.push({ frequency: oscillator.frequency.value, type: oscillator.type, at }),
        stop: vi.fn(),
      });
      return oscillator;
    },
    createBiquadFilter: () => node({ type: 'allpass', frequency: param() }),
    createGain: () => node({ gain: param() }),
  };
  return { context: context as unknown as AudioContext, started, resume: context.resume };
};

describe('ChordPlayer', () => {
  it('creates the AudioContext lazily, on the first play', () => {
    const fake = createFakeContext();
    const factory = vi.fn(() => fake.context);
    const player = new ChordPlayer(factory);
    expect(factory).not.toHaveBeenCalled();
    expect(player.isReady).toBe(false);

    player.playPiano(parseChord('C'));
    player.playPiano(parseChord('G'));
    expect(factory).toHaveBeenCalledTimes(1);
    expect(player.isReady).toBe(true);
  });

  it('strums the guitar voicing low to high, 35 ms apart', () => {
    const fake = createFakeContext();
    const player = new ChordPlayer(() => fake.context);
    player.playGuitar(getGuitarVoicing(parseChord('C'))); // x 3 2 0 1 0

    expect(fake.started.map((s) => s.frequency)).toEqual([48, 52, 55, 60, 64].map(midiToFrequency));
    const gaps = fake.started.slice(1).map((s, i) => s.at - (fake.started[i]?.at ?? 0));
    gaps.forEach((gap) => expect(gap).toBeCloseTo(STRUM_DELAY));
    expect(fake.started.every((s) => s.type === 'sawtooth')).toBe(true);
  });

  it('plays the piano triad around C4 with the root an octave lower, together', () => {
    const fake = createFakeContext();
    const player = new ChordPlayer(() => fake.context);
    player.play(parseChord('Am'), 'piano', getGuitarVoicing(parseChord('Am')));

    expect(fake.started.map((s) => s.frequency)).toEqual([57, 69, 72, 76].map(midiToFrequency));
    expect(new Set(fake.started.map((s) => s.at)).size).toBe(1);
  });

  it('resumes a suspended context', () => {
    const fake = createFakeContext('suspended');
    new ChordPlayer(() => fake.context).playPiano(parseChord('C'));
    expect(fake.resume).toHaveBeenCalled();
  });

  it('does nothing when Web Audio is unavailable', () => {
    const player = new ChordPlayer(() => null);
    expect(() => player.playPiano(parseChord('C'))).not.toThrow();
    const throwing = new ChordPlayer(() => {
      throw new Error('not allowed');
    });
    expect(() => throwing.playGuitar(getGuitarVoicing(parseChord('C')))).not.toThrow();
  });

  it('converts MIDI to frequency', () => {
    expect(midiToFrequency(69)).toBe(440);
    expect(midiToFrequency(60)).toBeCloseTo(261.63, 2);
  });
});
