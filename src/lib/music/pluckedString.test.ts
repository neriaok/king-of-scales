import { describe, expect, it } from 'vitest';
import { defaultDecaySeconds, renderPluckedString } from './pluckedString';

const SAMPLE_RATE = 44100;

/** Deterministic pseudo-random numbers so the tests are stable. */
const seeded = (seed = 1) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

/** Estimates the fundamental by finding the autocorrelation peak. */
const estimateFrequency = (samples: Float32Array, minHz: number, maxHz: number): number => {
  const start = Math.round(SAMPLE_RATE * 0.1);
  const window = samples.subarray(start, start + 4096);
  let bestLag = 0;
  let best = -Infinity;
  for (let lag = Math.floor(SAMPLE_RATE / maxHz); lag <= Math.ceil(SAMPLE_RATE / minHz); lag++) {
    let sum = 0;
    for (let i = 0; i + lag < window.length; i++) sum += (window[i] ?? 0) * (window[i + lag] ?? 0);
    if (sum > best) {
      best = sum;
      bestLag = lag;
    }
  }
  return SAMPLE_RATE / bestLag;
};

const rms = (samples: Float32Array): number =>
  Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);

describe('renderPluckedString', () => {
  it('renders the requested length, peaking at 0.9', () => {
    const samples = renderPluckedString({
      sampleRate: SAMPLE_RATE,
      frequency: 110,
      duration: 1,
      random: seeded(),
    });
    expect(samples).toHaveLength(SAMPLE_RATE);
    expect(Math.max(...samples.map(Math.abs))).toBeCloseTo(0.9, 5);
  });

  it.each([82.41, 110, 196, 329.63, 440])('is in tune at %f Hz (within 1%)', (frequency) => {
    const samples = renderPluckedString({
      sampleRate: SAMPLE_RATE,
      frequency,
      duration: 0.5,
      random: seeded(7),
    });
    const estimate = estimateFrequency(samples, frequency * 0.8, frequency * 1.25);
    expect(Math.abs(estimate - frequency) / frequency).toBeLessThan(0.01);
  });

  it('decays over time like a plucked string', () => {
    const samples = renderPluckedString({
      sampleRate: SAMPLE_RATE,
      frequency: 196,
      duration: 2,
      random: seeded(3),
    });
    const early = rms(samples.subarray(0, SAMPLE_RATE * 0.2));
    const late = rms(samples.subarray(SAMPLE_RATE * 1.5, SAMPLE_RATE * 1.7));
    expect(late).toBeLessThan(early * 0.5);
    expect(late).toBeGreaterThan(0);
  });

  it('ends silently to avoid a click', () => {
    const samples = renderPluckedString({
      sampleRate: SAMPLE_RATE,
      frequency: 110,
      duration: 0.5,
      random: seeded(),
    });
    expect(samples[samples.length - 1]).toBeCloseTo(0, 3);
  });

  it('lets low strings ring longer than high ones', () => {
    expect(defaultDecaySeconds(82)).toBeGreaterThan(defaultDecaySeconds(330));
    expect(defaultDecaySeconds(20)).toBe(4);
    expect(defaultDecaySeconds(2000)).toBe(1.4);
  });
});
