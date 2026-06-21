import { describe, expect, test } from 'vitest';
import { parseAlgorithm, SUPPORTED_MOVES } from './notation.js';

describe('notation parser', () => {
  test('supports face, whole-cube, and slice moves', () => {
    expect(SUPPORTED_MOVES).toEqual([
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
    ]);
  });

  test('parses uppercase notation as clockwise quarter turns', () => {
    expect(parseAlgorithm('R U F X M S E')).toEqual([
      { base: 'R', notation: 'R', turns: 1 },
      { base: 'U', notation: 'U', turns: 1 },
      { base: 'F', notation: 'F', turns: 1 },
      { base: 'X', notation: 'X', turns: 1 },
      { base: 'M', notation: 'M', turns: 1 },
      { base: 'S', notation: 'S', turns: 1 },
      { base: 'E', notation: 'E', turns: 1 },
    ]);
  });

  test('parses lowercase notation as inverse quarter turns', () => {
    expect(parseAlgorithm('r u f x m s e')).toEqual([
      { base: 'R', notation: 'r', turns: -1 },
      { base: 'U', notation: 'u', turns: -1 },
      { base: 'F', notation: 'f', turns: -1 },
      { base: 'X', notation: 'x', turns: -1 },
      { base: 'M', notation: 'm', turns: -1 },
      { base: 'S', notation: 's', turns: -1 },
      { base: 'E', notation: 'e', turns: -1 },
    ]);
  });

  test('rejects unsupported notation characters', () => {
    expect(() => parseAlgorithm("R Q R'")).toThrow(
      'Notasi tidak didukung: Q, \'',
    );
  });
});
