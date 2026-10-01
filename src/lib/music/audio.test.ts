import { describe, expect, it, vi } from 'vitest';
import { ChordPlayer, GUITAR_NOTE_SECONDS, STRUM_DELAY, midiToFrequency } from './audio';
import { getGuitarVoicing } from './guitarVoicings';
import { parseChord } from './notes';

interface Started {
  kind: 'oscillator' | 'buffer';
  frequency?: number;
  length?: number;
  at: number;
}

const SAMPLE_RATE = 8000;

const createFakeContext = (state: AudioContextState = 'running') => {
  const started: Started[] = [];
  const connections: [unknown, unknown][] = [];
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  const node = <T extends object>(extra: T) => {
    const self = {
      ...extra,
      connect: (next: unknown) => {
        connections.push([self, next]);
        return next;
      },
    };
    return self;
  };
  const destination = { name: 'destination' };
  const context = {
    state,
    sampleRate: SAMPLE_RATE,
    currentTime: 1,
    destination,
    resume: vi.fn(() => Promise.resolve()),
    createOscillator: () => {
      const oscillator = node({
        type: 'sine' as OscillatorType,
        frequency: param(),
        start: (at: number) =>
          started.push({ kind: 'oscillator', frequency: oscillator.frequency.value, at }),
        stop: vi.fn(),
      });
      return oscillator;
    },
    createBuffer: (_channels: number, length: number) => {
      const data = new Float32Array(length);
      return { length, getChannelData: () => data };
    },
    createBufferSource: () => {
      const source = node({
        buffer: null as { length: number } | null,
        start: (at: number) => started.push({ kind: 'buffer', length: source.buffer?.length, at }),
      });
      return source;
    },
    createBiquadFilter: () =>
      node({ type: 'allpass', frequency: param(), Q: param(), gain: param() }),
    createGain: () => node({ gain: param() }),
  };
  return {
    context: context as unknown as AudioContext,
    started,
    connections,
    destination,
    resume: context.resume,
  };
};

describe('ChordPlayer', () => {
  it('creates the AudioContext lazily, on the first play', () => {
    const fake = createFakeContext();
    const factory = vi.fn(() => fake.context);
    const player = new ChordPlayer(factory);
    expect(factory).not.toHaveBeenCalled();
    expect(player.isReady).toBe(false);

    player.playPiano(parseChord('C'));
    player.playGuitar(getGuitarVoicing(parseChord('G')));
    expect(factory).toHaveBeenCalledTimes(1);
    expect(player.isReady).toBe(true);
  });

  it('strums one plucked string per sounding string, low to high, 35 ms apart', () => {
    const fake = createFakeContext();
    new ChordPlayer(() => fake.context).playGuitar(getGuitarVoicing(parseChord('C'))); // x32010

    expect(fake.started).toHaveLength(5);
    expect(fake.started.every((s) => s.kind === 'buffer')).toBe(true);
    expect(fake.started.every((s) => s.length === SAMPLE_RATE * GUITAR_NOTE_SECONDS)).toBe(true);
    const gaps = fake.started.slice(1).map((s, i) => s.at - (fake.started[i]?.at ?? 0));
    gaps.forEach((gap) => expect(gap).toBeCloseTo(STRUM_DELAY));
  });

  it('routes the strings through the body filters to the speakers', () => {
    const fake = createFakeContext();
    new ChordPlayer(() => fake.context).playGuitar(getGuitarVoicing(parseChord('Em')));
    const toSpeakers = fake.connections.filter(([, to]) => to === fake.destination);
    expect(toSpeakers).toHaveLength(1);
    const [lastFilter] = toSpeakers[0] ?? [];
    expect(lastFilter).toMatchObject({ type: 'lowpass' });
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
