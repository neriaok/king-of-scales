/**
 * Plucked-string synthesis (Karplus–Strong with the Jaffe–Smith extensions).
 *
 * A short burst of noise is fed into a delay line one period long; every pass through the
 * loop averages neighbouring samples, which damps high harmonics faster than low ones —
 * exactly how a real string loses its brightness. The result sounds like a nylon/steel string
 * instead of an oscillator. Pure and framework-free, so it can be unit tested.
 */

export interface PluckOptions {
  sampleRate: number;
  /** Fundamental frequency in Hz. */
  frequency: number;
  /** Length of the rendered note in seconds. */
  duration: number;
  /** Time for the note to fall by 60 dB, in seconds. Lower strings ring longer. */
  decaySeconds?: number;
  /** Where the string is plucked, as a fraction of its length (0–0.5). ~0.13 is near the bridge. */
  pluckPosition?: number;
  /** 0–1: how bright the attack is. Lower is softer, like a thumb instead of a pick. */
  brightness?: number;
  /** Random source in [0, 1); injectable for deterministic tests. */
  random?: () => number;
}

/** Default ring time, longer for low notes, like a real acoustic guitar. */
export const defaultDecaySeconds = (frequency: number): number =>
  Math.min(4, Math.max(1.4, 4.2 - frequency / 180));

export const renderPluckedString = ({
  sampleRate,
  frequency,
  duration,
  decaySeconds = defaultDecaySeconds(frequency),
  pluckPosition = 0.13,
  brightness = 0.55,
  random = Math.random,
}: PluckOptions): Float32Array => {
  const length = Math.max(1, Math.round(sampleRate * duration));
  const output = new Float32Array(length);

  // Loop delay = N samples + 0.5 (averaging filter) + fractional allpass delay.
  const period = sampleRate / frequency;
  const delay = Math.max(2, Math.floor(period - 0.5 - 0.1));
  const fraction = period - delay - 0.5;
  const allpassCoefficient = (1 - fraction) / (1 + fraction);

  // Per-period loop gain so the note decays by 60 dB in `decaySeconds`.
  const loopGain = 10 ** (-3 / (decaySeconds * frequency));

  // Excitation: noise, softened by a one-pole low-pass, with a comb notch for pluck position.
  const excitation = new Float32Array(delay);
  let smoothed = 0;
  for (let i = 0; i < delay; i++) {
    const noise = random() * 2 - 1;
    smoothed += brightness * (noise - smoothed);
    excitation[i] = smoothed;
  }
  const combOffset = Math.max(1, Math.round(pluckPosition * delay));
  const plucked = excitation.map((value, i) => value - (excitation[i - combOffset] ?? 0));
  let mean = 0;
  plucked.forEach((value) => (mean += value / delay));

  const line = new Float32Array(delay);
  plucked.forEach((value, i) => (line[i] = value - mean));

  let index = 0;
  let previous = line[delay - 1] ?? 0;
  let allpassIn = 0;
  let allpassOut = 0;
  for (let n = 0; n < length; n++) {
    const current = line[index] ?? 0;
    output[n] = current;
    // Averaging low-pass, then fractional-delay allpass for accurate tuning.
    const averaged = loopGain * 0.5 * (current + previous);
    const tuned = allpassCoefficient * averaged + allpassIn - allpassCoefficient * allpassOut;
    allpassIn = averaged;
    allpassOut = tuned;
    previous = current;
    line[index] = tuned;
    index = (index + 1) % delay;
  }

  // Normalise and fade out the last 50 ms to avoid a click.
  let peak = 0;
  output.forEach((value) => (peak = Math.max(peak, Math.abs(value))));
  const scale = peak > 0 ? 0.9 / peak : 0;
  const fadeLength = Math.min(length, Math.round(sampleRate * 0.05));
  for (let n = 0; n < length; n++) {
    const fade = n >= length - fadeLength ? (length - n) / fadeLength : 1;
    output[n] = (output[n] ?? 0) * scale * fade;
  }
  return output;
};
