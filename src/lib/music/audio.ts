/**
 * Small Web Audio synth for previewing chords. Framework-free: no React imports.
 * The AudioContext is created lazily on the first play, which must come from a user
 * gesture (browsers block audio that starts on its own).
 */
import type { GuitarVoicing } from './guitarVoicings';
import { voicingMidiNotes } from './guitarVoicings';
import type { Chord } from './notes';
import { pianoMidiNotes } from './pianoVoicing';

/** Delay between strings in a guitar strum, in seconds. */
export const STRUM_DELAY = 0.035;

export type ChordInstrument = 'guitar' | 'piano';

export interface ToneOptions {
  type: OscillatorType;
  gain: number;
  duration: number;
}

const GUITAR_TONE: ToneOptions = { type: 'sawtooth', gain: 0.07, duration: 2.2 };
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

  /** Strums the voicing's real pitches, low string first. */
  playGuitar(voicing: GuitarVoicing): void {
    this.playNotes(voicingMidiNotes(voicing), STRUM_DELAY, GUITAR_TONE);
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
    filter.frequency.value = tone.type === 'sawtooth' ? 2200 : 3000;

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
