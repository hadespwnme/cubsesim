import { useEffect, useMemo, useState } from 'react';
import CubeScene from './components/CubeScene.jsx';
import { createSolvedCube, isCubeSolved, moveCube } from './cube/cube.js';
import { parseAlgorithm, SUPPORTED_MOVES } from './cube/notation.js';
import {
  createTimerState,
  finishSolve,
  formatElapsedTime,
  getInspectionRemaining,
  startInspection,
  startSolving,
} from './cube/timer.js';

const FACE_MOVES = ['R', 'r', 'U', 'u', 'F', 'f', 'L', 'l', 'D', 'd', 'B', 'b'];
const EXTRA_MOVES = ['X', 'x', 'Y', 'y', 'Z', 'z', 'M', 'm', 'S', 's', 'E', 'e'];
const SCRAMBLE_MOVES = FACE_MOVES;

export default function App() {
  const [cube, setCube] = useState(() => createSolvedCube());
  const [algorithm, setAlgorithm] = useState('');
  const [activeMove, setActiveMove] = useState(null);
  const [moveQueue, setMoveQueue] = useState([]);
  const [formError, setFormError] = useState('');
  const [timer, setTimer] = useState(() => createTimerState());
  const [now, setNow] = useState(() => Date.now());
  const [pendingInspection, setPendingInspection] = useState(false);
  const supportedMoveSet = useMemo(() => new Set(SUPPORTED_MOVES), []);

  useEffect(() => {
    if (activeMove || moveQueue.length === 0) return;

    const [nextMove, ...remainingMoves] = moveQueue;
    setActiveMove({
      ...nextMove,
      startedAt: performance.now(),
    });
    setMoveQueue(remainingMoves);
  }, [activeMove, moveQueue]);

  useEffect(() => {
    function handleKeyDown(event) {
      const target = event.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (event.code === 'Space' && timer.phase === 'inspection') {
        event.preventDefault();
        const startedAt = Date.now();
        setNow(startedAt);
        setTimer((currentTimer) => startSolving(currentTimer, startedAt));
        return;
      }

      if (isTyping || !supportedMoveSet.has(event.key)) return;

      event.preventDefault();
      enqueueMoves(parseAlgorithm(event.key));
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [supportedMoveSet, timer.phase]);

  useEffect(() => {
    if (!pendingInspection || activeMove || moveQueue.length > 0) return;

    const startedAt = Date.now();
    setPendingInspection(false);
    setNow(startedAt);
    setTimer((currentTimer) => startInspection(currentTimer, startedAt));
  }, [activeMove, moveQueue.length, pendingInspection]);

  useEffect(() => {
    if (timer.phase === 'idle' || timer.phase === 'solved') return undefined;

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [timer.phase]);

  useEffect(() => {
    if (timer.phase !== 'inspection') return;
    if (getInspectionRemaining(timer, now) > 0) return;

    const startedAt = Date.now();
    setNow(startedAt);
    setTimer((currentTimer) => startSolving(currentTimer, startedAt));
  }, [now, timer]);

  useEffect(() => {
    if (timer.phase !== 'solving' || !isCubeSolved(cube)) return;

    setTimer((currentTimer) => finishSolve(currentTimer, Date.now()));
  }, [cube, timer.phase]);

  function enqueueMoves(moves) {
    if (moves.length === 0) return;

    setMoveQueue((currentQueue) => [...currentQueue, ...moves]);
    setFormError('');
  }

  function handleSubmit(event) {
    event.preventDefault();

    try {
      const moves = parseAlgorithm(algorithm);
      enqueueMoves(moves);
      setAlgorithm('');
    } catch (error) {
      setFormError(error.message);
    }
  }

  function handleMoveComplete(completedMove) {
    setCube((currentCube) => moveCube(currentCube, completedMove));
    setActiveMove(null);
  }

  function handleReset() {
    setCube(createSolvedCube());
    setActiveMove(null);
    setMoveQueue([]);
    setPendingInspection(false);
    setTimer(createTimerState());
    setNow(Date.now());
  }

  function handleScramble() {
    const moves = Array.from({ length: 25 }, () => {
      const notation =
        SCRAMBLE_MOVES[Math.floor(Math.random() * SCRAMBLE_MOVES.length)];
      return parseAlgorithm(notation)[0];
    });

    setCube(createSolvedCube());
    setActiveMove(null);
    setMoveQueue(moves);
    setPendingInspection(true);
    setTimer(createTimerState());
    setNow(Date.now());
  }

  return (
    <main className="app-shell">
      <section className="title-panel" aria-labelledby="page-title">
        <div>
          <h1 id="page-title">CubeSim</h1>
        </div>
      </section>

      <section className="play-layout">
        <div className="cube-stage" aria-label="Area Rubik 3D draggable">
          <CubeScene
            activeMove={activeMove}
            cube={cube}
            onMoveComplete={handleMoveComplete}
            onMoveRequest={(notation) => enqueueMoves(parseAlgorithm(notation))}
          />
          <div className="stage-badge">
            Drag rubik untuk turn. Drag di luar rubik untuk ubah view.
          </div>
        </div>

        <aside className="control-panel" aria-label="Kontrol Rubik">
          <form className="notation-form" onSubmit={handleSubmit}>
            <label htmlFor="notation-input">Input Notasi</label>
            <div className="input-row">
              <input
                autoComplete="off"
                id="notation-input"
                onChange={(event) => setAlgorithm(event.target.value)}
                placeholder="Contoh: RUrfxMse"
                value={algorithm}
              />
              <button type="submit">Jalankan</button>
            </div>
            <p className="helper">
              Kapital = clockwise. Huruf kecil = inverse.
            </p>
            {formError ? (
              <p className="form-error" role="alert">
                {formError}
              </p>
            ) : null}
          </form>

          <div className="button-group" aria-label="Face turn buttons">
            <h2>Face Turns</h2>
            <div className="move-grid">
              {FACE_MOVES.map((notation) => (
                <button
                  key={notation}
                  onClick={() => enqueueMoves(parseAlgorithm(notation))}
                  type="button"
                >
                  {notation}
                </button>
              ))}
            </div>
          </div>

          <div className="button-group" aria-label="Slice and cube rotation buttons">
            <h2>Slice / Cube</h2>
            <div className="move-grid">
              {EXTRA_MOVES.map((notation) => (
                <button
                  key={notation}
                  onClick={() => enqueueMoves(parseAlgorithm(notation))}
                  type="button"
                >
                  {notation}
                </button>
              ))}
            </div>
          </div>

          <div className="actions">
            <button onClick={handleScramble} type="button">
              Scramble
            </button>
            <button onClick={handleReset} type="button">
              Reset
            </button>
          </div>

          <section className="timer-panel" aria-live="polite">
            <h2>Timer</h2>
            <p className="timer-value">
              {timer.phase === 'inspection'
                ? getInspectionRemaining(timer, now)
                : formatElapsedTime(timer, now)}
            </p>
            <p className="timer-caption">
              {getTimerCaption(timer.phase, pendingInspection)}
            </p>
          </section>

        </aside>
      </section>
    </main>
  );
}

function getTimerCaption(phase, pendingInspection) {
  if (pendingInspection) return 'Scramble berjalan. Inspection mulai setelah selesai.';
  if (phase === 'inspection') return 'Inspection. Tekan Space untuk mulai.';
  if (phase === 'solving') return 'Timer berjalan sampai cube solved.';
  if (phase === 'solved') return 'Solved.';
  return 'Pencet Scramble untuk mulai inspection 15 detik.';
}
