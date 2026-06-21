import { describe, expect, test } from 'vitest';
import {
  createSolvedCube,
  getVisibleStickerColors,
  isCubeSolved,
  moveCube,
} from './cube.js';

describe('cube model', () => {
  test('starts with the requested opposite color pairs', () => {
    const cube = createSolvedCube();
    const colors = getVisibleStickerColors(cube);

    expect(colors).toMatchObject({
      U: 'yellow',
      D: 'white',
      F: 'green',
      B: 'blue',
      R: 'red',
      L: 'orange',
    });
  });

  test('four R turns return to solved state', () => {
    let cube = createSolvedCube();
    cube = moveCube(cube, { base: 'R', turns: 1 });
    cube = moveCube(cube, { base: 'R', turns: 1 });
    cube = moveCube(cube, { base: 'R', turns: 1 });
    cube = moveCube(cube, { base: 'R', turns: 1 });

    expect(cube).toEqual(createSolvedCube());
  });

  test('uppercase and lowercase moves cancel each other', () => {
    let cube = createSolvedCube();
    cube = moveCube(cube, { base: 'M', turns: 1 });
    cube = moveCube(cube, { base: 'M', turns: -1 });
    cube = moveCube(cube, { base: 'X', turns: 1 });
    cube = moveCube(cube, { base: 'X', turns: -1 });

    expect(cube).toEqual(createSolvedCube());
  });

  test('detects whether the cube is solved', () => {
    const solvedCube = createSolvedCube();
    const movedCube = moveCube(solvedCube, { base: 'R', turns: 1 });

    expect(isCubeSolved(solvedCube)).toBe(true);
    expect(isCubeSolved(movedCube)).toBe(false);
  });
});
