import { describe, expect, test } from 'vitest';
import {
  INSPECTION_SECONDS,
  createTimerState,
  finishSolve,
  formatElapsedTime,
  getInspectionRemaining,
  startInspection,
  startSolving,
} from './timer.js';

describe('speed timer state', () => {
  test('starts a 15 second inspection after scramble finishes', () => {
    const timer = startInspection(createTimerState(), 1_000);

    expect(timer).toMatchObject({
      phase: 'inspection',
      inspectionStartedAt: 1_000,
      solveStartedAt: null,
      solvedAt: null,
    });
    expect(getInspectionRemaining(timer, 1_000)).toBe(INSPECTION_SECONDS);
    expect(getInspectionRemaining(timer, 15_900)).toBe(1);
    expect(getInspectionRemaining(timer, 16_000)).toBe(0);
  });

  test('starts solve timer from space or inspection timeout', () => {
    const inspecting = startInspection(createTimerState(), 5_000);
    const solving = startSolving(inspecting, 9_000);

    expect(solving).toMatchObject({
      phase: 'solving',
      inspectionStartedAt: 5_000,
      solveStartedAt: 9_000,
      solvedAt: null,
    });
  });

  test('records solved time and formats elapsed time', () => {
    const solving = startSolving(startInspection(createTimerState(), 0), 15_000);
    const solved = finishSolve(solving, 78_456);

    expect(solved.phase).toBe('solved');
    expect(formatElapsedTime(solved, 78_456)).toBe('1:03.45');
  });
});
