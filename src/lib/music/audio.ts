/**
 * Small Web Audio synth for previewing chords. Framework-free: no React imports.
 * Guitar notes are physically modelled plucked strings (see pluckedString.ts) shaped by an
 * acoustic-body EQ; the piano is a soft triangle-wave tone.
 * The AudioContext is created lazily on the first play, which must come from a user
 * gesture (browsers block audio that starts on its own).
 */
import type { GuitarVoicing } from './guitarVoicings';
import { voicingMidiNotes } from './guitarVoicings';
import type { Chord } from './notes';
import { pianoMidiNotes } from './pianoVoicing';
import { renderPluckedString } from './pluckedString';

/** Delay between strings in a guitar strum, in seconds. */
export const STRUM_DELAY = 0.035;

export type ChordInstrument = 'guitar' | 'piano';

export interface ToneOptions {
  type: OscillatorType;
  gain: number;
  duration: number;
}

/** Length of each rendered guitar note, in seconds. */
export const GUITAR_NOTE_SECONDS = 3;
/** Level of each string in the strum; a little quieter towards the treble strings. */
const GUITAR_STRING_GAIN = 0.3;

/** Acoustic body EQ: low cut, warm body resonances, softened top end. */
const GUITAR_BODY: readonly {
  type: BiquadFilterType;
  frequency: number;
  q: number;
  gain: number;
}[] = [
  { type: 'highpass', frequency: 70, q: 0.7, gain: 0 },
  { type: 'peaking', frequency: 110, q: 1.2, gain: 5 },
  { type: 'peaking', frequency: 220, q: 1.5, gain: 3 },
  { type: 'peaking', frequency: 2800, q: 1, gain: -2 },
  { type: 'lowpass', frequency: 6500, q: 0.7, gain: 0 },
];

const PIANO_TONE: ToneOptions = { type: 'triangle', gain: 0.14, duration: 2.4 };

export const midiToFrequency = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

type AudioContextFactory = () => AudioContext | null;

interface WindowWithWebkitAudio {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

const createBrowserContext: AudioContextFactory = () => {
  const audioWindow = window as unknown as WindowWithWebkitAudio;
  const Context = audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
  return Context ? new Context() : null;
};

export class ChordPlayer {
  private context: AudioContext | null = null;
  private readonly createContext: AudioContextFactory;

  constructor(createContext: AudioContextFactory = createBrowserContext) {
    this.createContext = createContext;
  }

  /** True once the first play has created the AudioContext. */
  get isReady(): boolean {
    return this.context !== null;
  }

  /** Strums the voicing's real pitches as plucked strings, low string first. */
  playGuitar(voicing: GuitarVoicing): void {
    const context = this.ensureContext();
    if (!context) return;
    const body = this.createGuitarBody(context);
    const start = context.currentTime + 0.03;
    voicingMidiNotes(voicing).forEach((midi, index) => {
      const samples = renderPluckedString({
        sampleRate: context.sampleRate,
        frequency: midiToFrequency(midi),
        duration: GUITAR_NOTE_SECONDS,
      });
      const buffer = context.createBuffer(1, samples.length, context.sampleRate);
      buffer.getChannelData(0).set(samples);

      const source = context.createBufferSource();
      source.buffer = buffer;
      const level = context.createGain();
      level.gain.value = GUITAR_STRING_GAIN * (1 - index * 0.04);
      source.connect(level).connect(body);
      source.start(start + index * STRUM_DELAY);
    });
  }

  /** Root-position triad around C4 plus the root an octave lower, all at once. */
  playPiano(chord: Chord): void {
    this.playNotes(pianoMidiNotes(chord), 0, PIANO_TONE);
  }

  play(chord: Chord, instrument: ChordInstrument, voicing: GuitarVoicing): void {
    if (instrument === 'guitar') this.playGuitar(voicing);
    else this.playPiano(chord);
  }

  private ensureContext(): AudioContext | null {
    if (!this.context) {
      try {
        this.context = this.createContext();
      } catch {
        this.context = null;
      }
    }
    if (this.context?.state === 'suspended') void this.context.resume().catch(() => undefined);
    return this.context;
  }

  /** A chain of filters shared by all strings of one strum, ending at the speakers. */
  private createGuitarBody(context: AudioContext): AudioNode {
    const filters = GUITAR_BODY.map(({ type, frequency, q, gain }) => {
      const filter = context.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = frequency;
      filter.Q.value = q;
      filter.gain.value = gain;
      return filter;
    });
    filters.forEach((filter, index) => {
      filter.connect(filters[index + 1] ?? context.destination);
    });
    return filters[0] ?? context.destination;
  }

  private playNotes(midiNotes: readonly number[], stagger: number, tone: ToneOptions): void {
    const context = this.ensureContext();
    if (!context) return;
    const start = context.currentTime + 0.02;
    midiNotes.forEach((midi, index) => this.playTone(context, midi, start + index * stagger, tone));
  }

  private playTone(context: AudioContext, midi: number, at: number, tone: ToneOptions): void {
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();

    oscillator.type = tone.type;
    oscillator.frequency.value = midiToFrequency(midi);
    filter.type = 'lowpass';
    filter.frequency.value = 3000;

    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(tone.gain, at + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0008, at + tone.duration);

    oscillator.connect(filter).connect(envelope).connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + tone.duration + 0.05);
  }
}

/** Shared player for the app. */
export const chordPlayer = new ChordPlayer();
