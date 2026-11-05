/** A random selection must have an actual candidate, including after configuration changes. */
export function pickRandom<T>(values: readonly T[]): T {
  const value = values[Math.floor(Math.random() * values.length)];
  if (value === undefined) {
    throw new RangeError('随机选择至少需要一个有效候选值。');
  }
  return value;
}
