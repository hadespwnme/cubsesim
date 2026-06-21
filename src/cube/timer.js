export const INSPECTION_SECONDS = 15;

export function createTimerState() {
  return {
    phase: 'idle',
    inspectionStartedAt: null,
    solveStartedAt: null,
    solvedAt: null,
  };
}

export function startInspection(timer, now) {
  return {
    ...timer,
    phase: 'inspection',
    inspectionStartedAt: now,
    solveStartedAt: null,
    solvedAt: null,
  };
}

export function startSolving(timer, now) {
  return {
    ...timer,
    phase: 'solving',
    solveStartedAt: now,
    solvedAt: null,
  };
}

export function finishSolve(timer, now) {
  if (timer.phase !== 'solving') return timer;

  return {
    ...timer,
    phase: 'solved',
    solvedAt: now,
  };
}

export function getInspectionRemaining(timer, now) {
  if (timer.phase !== 'inspection' || timer.inspectionStartedAt === null) {
    return 0;
  }

  const elapsed = (now - timer.inspectionStartedAt) / 1000;
  return Math.max(0, Math.ceil(INSPECTION_SECONDS - elapsed));
}

export function formatElapsedTime(timer, now) {
  if (timer.solveStartedAt === null) return '0.00';

  const endTime = timer.solvedAt ?? now;
  const elapsedMs = Math.max(0, endTime - timer.solveStartedAt);
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((elapsedMs % 1000) / 10);

  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(
      centiseconds,
    ).padStart(2, '0')}`;
  }

  return `${seconds}.${String(centiseconds).padStart(2, '0')}`;
}
