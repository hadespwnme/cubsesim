import { describe, expect, test } from 'vitest';
import {
  isStickerEdge,
  notationFromCubeDrag,
} from './dragNotation.js';

describe('drag notation mapper', () => {
  test('maps front-face right column upward drag to R and downward drag to r', () => {
    expect(
      notationFromCubeDrag({
        face: 'F',
        position: { x: 1, y: 0, z: 1 },
        dragAxis: 'y',
        dragSign: 1,
      }),
    ).toBe('R');
    expect(
      notationFromCubeDrag({
        face: 'F',
        position: { x: 1, y: 0, z: 1 },
        dragAxis: 'y',
        dragSign: -1,
      }),
    ).toBe('r');
  });

  test('maps right face upward drag to R and downward drag to r', () => {
    expect(
      notationFromCubeDrag({
        face: 'R',
        position: { x: 1, y: 0, z: 0 },
        dragAxis: 'y',
        dragSign: 1,
      }),
    ).toBe('R');
    expect(
      notationFromCubeDrag({
        face: 'R',
        position: { x: 1, y: 0, z: 0 },
        dragAxis: 'y',
        dragSign: -1,
      }),
    ).toBe('r');
  });

  test('maps front-face middle column drags to M slice moves', () => {
    expect(
      notationFromCubeDrag({
        face: 'F',
        position: { x: 0, y: 0, z: 1 },
        dragAxis: 'y',
        dragSign: 1,
      }),
    ).toBe('m');
    expect(
      notationFromCubeDrag({
        face: 'F',
        position: { x: 0, y: 0, z: 1 },
        dragAxis: 'y',
        dragSign: -1,
      }),
    ).toBe('M');
  });

  test('maps front-face top row horizontal drags to U layer moves', () => {
    expect(
      notationFromCubeDrag({
        face: 'F',
        position: { x: 0, y: 1, z: 1 },
        dragAxis: 'x',
        dragSign: 1,
      }),
    ).toBe('u');
    expect(
      notationFromCubeDrag({
        face: 'F',
        position: { x: 0, y: 1, z: 1 },
        dragAxis: 'x',
        dragSign: -1,
      }),
    ).toBe('U');
  });

  test('maps top-face front row drags to F face moves', () => {
    expect(
      notationFromCubeDrag({
        face: 'U',
        position: { x: 0, y: 1, z: 1 },
        dragAxis: 'x',
        dragSign: 1,
      }),
    ).toBe('F');
    expect(
      notationFromCubeDrag({
        face: 'U',
        position: { x: 0, y: 1, z: 1 },
        dragAxis: 'x',
        dragSign: -1,
      }),
    ).toBe('f');
  });

  test('maps front center sticker horizontal drags to F face moves', () => {
    expect(
      notationFromCubeDrag({
        face: 'F',
        position: { x: 0, y: 0, z: 1 },
        dragAxis: 'x',
        dragSign: 1,
      }),
    ).toBe('F');
    expect(
      notationFromCubeDrag({
        face: 'F',
        position: { x: 0, y: 0, z: 1 },
        dragAxis: 'x',
        dragSign: -1,
      }),
    ).toBe('f');
  });

  test('maps middle z layer horizontal drags to S slice moves', () => {
    expect(
      notationFromCubeDrag({
        face: 'U',
        position: { x: 0, y: 1, z: 0 },
        dragAxis: 'x',
        dragSign: 1,
      }),
    ).toBe('S');
    expect(
      notationFromCubeDrag({
        face: 'U',
        position: { x: 0, y: 1, z: 0 },
        dragAxis: 'x',
        dragSign: -1,
      }),
    ).toBe('s');
  });

  test('treats sticker edges as view rotation zones', () => {
    expect(isStickerEdge({ x: 0.08, y: 0.5 })).toBe(true);
    expect(isStickerEdge({ x: 0.5, y: 0.94 })).toBe(true);
    expect(isStickerEdge({ x: 0.5, y: 0.5 })).toBe(false);
  });
});
