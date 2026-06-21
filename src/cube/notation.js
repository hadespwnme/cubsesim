export const SUPPORTED_MOVES = [
  'R',
  'r',
  'L',
  'l',
  'U',
  'u',
  'D',
  'd',
  'F',
  'f',
  'B',
  'b',
  'X',
  'x',
  'Y',
  'y',
  'Z',
  'z',
  'M',
  'm',
  'E',
  'e',
  'S',
  's',
];

const SUPPORTED_SET = new Set(SUPPORTED_MOVES);

export function parseAlgorithm(input) {
  const tokens = input.replace(/\s+/g, '').split('').filter(Boolean);
  const invalid = tokens.filter((token) => !SUPPORTED_SET.has(token));

  if (invalid.length > 0) {
    throw new Error(`Notasi tidak didukung: ${[...new Set(invalid)].join(', ')}`);
  }

  return tokens.map((notation) => ({
    base: notation.toUpperCase(),
    notation,
    turns: notation === notation.toUpperCase() ? 1 : -1,
  }));
}
