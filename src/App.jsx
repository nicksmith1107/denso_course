import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

/**
 * Tetris (React) - single-file game logic.
 * Controls:
 *  - Left/Right: Move
 *  - Down: Soft drop
 *  - Up or X: Rotate clockwise
 *  - Z: Rotate counter-clockwise
 *  - Space: Hard drop
 *  - P: Pause
 *  - R: Restart
 */

const COLS = 10;
const ROWS = 20;
const VISIBLE_ROWS = ROWS;
const HIDDEN_ROWS = 2; // spawn buffer
const TOTAL_ROWS = ROWS + HIDDEN_ROWS;

const EMPTY = 0;

// Tetromino definitions in 4x4 matrices
const TETROMINOES = {
  I: {
    id: 1,
    color: "#58d5ff",
    rotations: [
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
      ],
    ],
  },
  O: {
    id: 2,
    color: "#ffd45a",
    rotations: [
      [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
      ],
    ],
  },
  T: {
    id: 3,
    color: "#b38bff",
    rotations: [
      [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 0, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 0, 1, 1],
        [0, 0, 1, 0],
        [0, 0, 0, 0],
      ],
    ],
  },
  S: {
    id: 4,
    color: "#7dff9b",
    rotations: [
      [
        [0, 0, 0, 0],
        [0, 0, 1, 1],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 1, 1],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 0],
      ],
    ],
  },
  Z: {
    id: 5,
    color: "#ff6b6b",
    rotations: [
      [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 1],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 1],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
  },
  J: {
    id: 6,
    color: "#5a7dff",
    rotations: [
      [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 0, 0, 1],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
  },
  L: {
    id: 7,
    color: "#ffb35a",
    rotations: [
      [
        [0, 0, 0, 0],
        [0, 1, 1, 1],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 1],
        [0, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 1],
        [0, 0, 0, 0],
      ],
    ],
  },
};

const TYPES = Object.keys(TETROMINOES);

function makeBoard() {
  return Array.from({ length: TOTAL_ROWS }, () => Array(COLS).fill(EMPTY));
}

function mulberry32(seed) {
  // deterministic-ish RNG for consistent feel
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function newBag(rng) {
  // 7-bag randomizer
  const bag = [...TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function getDropMs(level) {
  // classic-ish speed curve
  const base = 800;
  const min = 70;
  const ms = Math.floor(base * Math.pow(0.85, level));
  return Math.max(min, ms);
}

function rotateIndex(idx, dir) {
  // dir: +1 clockwise, -1 counter-clockwise
  return (idx + (dir > 0 ? 1 : 3)) % 4;
}

function canPlace(board, piece, x, y, rot) {
  const shape = TETROMINOES[piece].rotations[rot];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!shape[r][c]) continue;
      const bx = x + c;
      const by = y + r;
      if (bx < 0 || bx >= COLS || by >= TOTAL_ROWS) return false;
      if (by >= 0 && board[by][bx] !== EMPTY) return false;
    }
  }
  return true;
}

function placePiece(board, piece, x, y, rot) {
  const out = board.map((row) => row.slice());
  const shape = TETROMINOES[piece].rotations[rot];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!shape[r][c]) continue;
      const bx = x + c;
      const by = y + r;
      if (by >= 0 && by < TOTAL_ROWS && bx >= 0 && bx < COLS) {
        out[by][bx] = TETROMINOES[piece].id;
      }
    }
  }
  return out;
}

function clearLines(board) {
  const kept = [];
  let cleared = 0;
  for (let r = 0; r < TOTAL_ROWS; r++) {
    if (board[r].every((v) => v !== EMPTY)) {
      cleared++;
    } else {
      kept.push(board[r]);
    }
  }
  while (kept.length < TOTAL_ROWS) kept.unshift(Array(COLS).fill(EMPTY));
  return { board: kept, cleared };
}

function calcScore(linesCleared, level) {
  // classic-ish: 40/100/300/1200
  const table = [0, 40, 100, 300, 1200];
  return (table[linesCleared] || 0) * (level + 1);
}

function ghostY(board, piece, x, y, rot) {
  let gy = y;
  while (canPlace(board, piece, x, gy + 1, rot)) gy++;
  return gy;
}

function formatInt(n) {
  return n.toLocaleString();
}

function MiniPreview({ piece }) {
  const grid = useMemo(() => {
    const m = Array.from({ length: 4 }, () => Array(4).fill(0));
    if (!piece) return m;
    const shape = TETROMINOES[piece].rotations[0];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) m[r][c] = shape[r][c] ? TETROMINOES[piece].id : 0;
    return m;
  }, [piece]);

  return (
    <div className="mini">
      {grid.map((row, r) => (
        <div className="miniRow" key={r}>
          {row.map((v, c) => (
            <div
              key={c}
              className="miniCell"
              style={{
                background: v ? ID_TO_COLOR[v] : "transparent",
                borderColor: v ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

const ID_TO_COLOR = Object.fromEntries(Object.values(TETROMINOES).map((t) => [t.id, t.color]));

export default function App() {
  const [seed] = useState(() => (Date.now() ^ (Math.random() * 1e9)) | 0);
  const rngRef = useRef(null);
  const bagRef = useRef([]);

  const [board, setBoard] = useState(() => makeBoard());
  const [active, setActive] = useState(() => ({
    type: "T",
    rot: 0,
    x: 3,
    y: -1,
  }));
  const [nextType, setNextType] = useState("I");

  const [running, setRunning] = useState(true);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(0);

  const dropTimerRef = useRef(null);
  const softDropRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function initRng() {
    rngRef.current = mulberry32(seed);
    bagRef.current = newBag(rngRef.current);
  }

  const pullNext = useCallback(() => {
    if (!rngRef.current) initRng();
    if (bagRef.current.length === 0) bagRef.current = newBag(rngRef.current);
    return bagRef.current.pop();
  }, [initRng]);

  const spawn = useCallback((fromNextType) => {
    const type = fromNextType ?? pullNext();
    const x = 3;
    const y = -1;
    const rot = 0;

    const ok = canPlace(board, type, x, y, rot);
    if (!ok) {
      setRunning(false);
      setPaused(false);
      setGameOver(true);
      return;
    }
    setActive({ type, x, y, rot });

    // update next
    const newNext = pullNext();
    setNextType(newNext);
  }, [board, pullNext]);

  function resetGame() {
    initRng();
    const freshBoard = makeBoard();
    setBoard(freshBoard);
    setScore(0);
    setLines(0);
    setLevel(0);
    setRunning(true);
    setPaused(false);
    setGameOver(false);

    // prime next
    const first = pullNext();
    const next = pullNext();
    setNextType(next);
    setActive({ type: first, rot: 0, x: 3, y: -1 });
  }

  // Initialize
  useEffect(() => {
    resetGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function tryMove(dx, dy) {
    setActive((a) => {
      const nx = a.x + dx;
      const ny = a.y + dy;
      if (canPlace(board, a.type, nx, ny, a.rot)) return { ...a, x: nx, y: ny };
      return a;
    });
  }

  function tryRotate(dir) {
    setActive((a) => {
      const nr = rotateIndex(a.rot, dir);
      // simple wall-kick-ish offsets
      const kicks = [
        { x: 0, y: 0 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
        { x: -2, y: 0 },
        { x: 2, y: 0 },
        { x: 0, y: -1 },
      ];
      for (const k of kicks) {
        const nx = a.x + k.x;
        const ny = a.y + k.y;
        if (canPlace(board, a.type, nx, ny, nr)) return { ...a, rot: nr, x: nx, y: ny };
      }
      return a;
    });
  }

  const lockPieceAndClear = useCallback(() => {
    const a = active;
    const merged = placePiece(board, a.type, a.x, a.y, a.rot);
    const { board: clearedBoard, cleared } = clearLines(merged);

    if (cleared > 0) {
      setScore((s) => s + calcScore(cleared, level));
      setLines((l) => l + cleared);
    }
    setBoard(clearedBoard);

    // level up every 10 lines
    const newLines = lines + cleared;
    const newLevel = Math.floor(newLines / 10);
    if (newLevel !== level) setLevel(newLevel);

    spawn(nextType);
  }, [active, board, level, lines, nextType, spawn]);

  const tickDown = useCallback(() => {
    if (!running || paused || gameOver) return;

    const a = active;
    if (canPlace(board, a.type, a.x, a.y + 1, a.rot)) {
      setActive((p) => ({ ...p, y: p.y + 1 }));
    } else {
      lockPieceAndClear();
    }
  }, [running, paused, gameOver, active, board, lockPieceAndClear]);

  function hardDrop() {
    if (!running || paused || gameOver) return;
    const a = active;
    const gy = ghostY(board, a.type, a.x, a.y, a.rot);
    const dist = Math.max(0, gy - a.y);
    if (dist > 0) setScore((s) => s + dist * 2); // reward hard drop
    setActive((p) => ({ ...p, y: gy }));
    // lock immediately
    setTimeout(() => {
      // ensure state updated before locking
      setActive((cur) => {
        // lock using current
        const merged = placePiece(board, cur.type, cur.x, cur.y, cur.rot);
        const { board: clearedBoard, cleared } = clearLines(merged);

        let add = 0;
        if (cleared > 0) add += calcScore(cleared, level);

        // update aggregates
        if (cleared > 0) {
          setScore((s) => s + add);
          setLines((l) => l + cleared);
        }
        setBoard(clearedBoard);

        const newLines = lines + cleared;
        const newLevel = Math.floor(newLines / 10);
        if (newLevel !== level) setLevel(newLevel);

        // spawn next
        setTimeout(() => spawn(nextType), 0);
        return cur;
      });
    }, 0);
  }

  function softDrop(on) {
    softDropRef.current = on;
  }

  // Drop timer
  useEffect(() => {
    if (!running || paused || gameOver) return;

    const base = getDropMs(level);
    const interval = setInterval(() => {
      // if soft dropping, tick faster and add score per step
      if (softDropRef.current) {
        // do a soft tick
        const a = active;
        if (canPlace(board, a.type, a.x, a.y + 1, a.rot)) {
          setActive((p) => ({ ...p, y: p.y + 1 }));
          setScore((s) => s + 1);
        } else {
          lockPieceAndClear();
        }
      } else {
        tickDown();
      }
       
    }, base);

    dropTimerRef.current = interval;
    return () => clearInterval(interval);
    // We intentionally include active/board to keep gameplay consistent.
  }, [running, paused, gameOver, level, active, board, lockPieceAndClear, tickDown]);

  // Keyboard
  useEffect(() => {
    function onKeyDown(e) {
      if (e.repeat) return;
      const k = e.key.toLowerCase();

      if (k === "p") setPaused((p) => !p);
      if (k === "r") resetGame();

      if (!running || paused || gameOver) return;

      if (k === "arrowleft") tryMove(-1, 0);
      else if (k === "arrowright") tryMove(1, 0);
      else if (k === "arrowdown") softDrop(true);
      else if (k === "arrowup" || k === "x") tryRotate(1);
      else if (k === "z") tryRotate(-1);
      else if (k === " ") {
        e.preventDefault();
        hardDrop();
      }
    }

    function onKeyUp(e) {
      const k = e.key.toLowerCase();
      if (k === "arrowdown") softDrop(false);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, paused, gameOver, board, active, level, lines, nextType]);

  // Render board with active + ghost overlay
  const renderGrid = useMemo(() => {
    const a = active;
    const gy = ghostY(board, a.type, a.x, a.y, a.rot);

    // start with board
    const grid = board.map((row) => row.slice());

    // ghost
    const ghostShape = TETROMINOES[a.type].rotations[a.rot];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!ghostShape[r][c]) continue;
        const bx = a.x + c;
        const by = gy + r;
        if (by >= 0 && by < TOTAL_ROWS && bx >= 0 && bx < COLS) {
          if (grid[by][bx] === EMPTY) grid[by][bx] = -TETROMINOES[a.type].id; // negative = ghost
        }
      }
    }

    // active piece
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!ghostShape[r][c]) continue;
        const bx = a.x + c;
        const by = a.y + r;
        if (by >= 0 && by < TOTAL_ROWS && bx >= 0 && bx < COLS) {
          grid[by][bx] = TETROMINOES[a.type].id;
        }
      }
    }

    // only visible rows
    return grid.slice(HIDDEN_ROWS);
  }, [board, active]);

  const status = gameOver ? "Game Over" : paused ? "Paused" : "Playing";

  return (
    <div className="wrap">
      <header className="header">
        <div>
          <h1>Tetris</h1>
          <div className="sub">Deployable on AWS Amplify (static hosting)</div>
        </div>
        <div className="pill">{status}</div>
      </header>

      <main className="main">
        <section className="game">
          <div className="board" role="application" aria-label="Tetris board">
            {renderGrid.map((row, r) => (
              <div className="row" key={r}>
                {row.map((v, c) => {
                  const abs = Math.abs(v);
                  const isGhost = v < 0;
                  return (
                    <div
                      key={c}
                      className="cell"
                      style={{
                        background: abs ? ID_TO_COLOR[abs] : "rgba(255,255,255,0.03)",
                        opacity: isGhost ? 0.22 : 1,
                        borderColor: abs ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mobileControls">
            <button onMouseDown={() => tryMove(-1, 0)} onTouchStart={() => tryMove(-1, 0)}>◀</button>
            <button onMouseDown={() => tryRotate(1)} onTouchStart={() => tryRotate(1)}>⟳</button>
            <button onMouseDown={() => tryMove(1, 0)} onTouchStart={() => tryMove(1, 0)}>▶</button>
            <button
              onMouseDown={() => softDrop(true)}
              onMouseUp={() => softDrop(false)}
              onMouseLeave={() => softDrop(false)}
              onTouchStart={() => softDrop(true)}
              onTouchEnd={() => softDrop(false)}
            >
              ▼
            </button>
            <button onMouseDown={hardDrop} onTouchStart={hardDrop}>⤓</button>
          </div>
        </section>

        <aside className="side">
          <div className="card">
            <div className="cardTitle">Next</div>
            <MiniPreview piece={nextType} />
          </div>

          <div className="card">
            <div className="stats">
              <div className="stat">
                <div className="label">Score</div>
                <div className="value">{formatInt(score)}</div>
              </div>
              <div className="stat">
                <div className="label">Lines</div>
                <div className="value">{formatInt(lines)}</div>
              </div>
              <div className="stat">
                <div className="label">Level</div>
                <div className="value">{formatInt(level)}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="cardTitle">Controls</div>
            <ul className="controls">
              <li><kbd>←</kbd><kbd>→</kbd> move</li>
              <li><kbd>↓</kbd> soft drop</li>
              <li><kbd>↑</kbd>/<kbd>X</kbd> rotate</li>
              <li><kbd>Z</kbd> rotate back</li>
              <li><kbd>Space</kbd> hard drop</li>
              <li><kbd>P</kbd> pause</li>
              <li><kbd>R</kbd> restart</li>
            </ul>
          </div>

          <div className="card actions">
            <button className="btn" onClick={() => setPaused((p) => !p)}>
              {paused ? "Resume (P)" : "Pause (P)"}
            </button>
            <button className="btn secondary" onClick={resetGame}>
              Restart (R)
            </button>
          </div>
        </aside>
      </main>

      <footer className="footer">
        Tip: on Amplify Hosting, this is just a static build (<code>npm run build</code>) served via CDN.
      </footer>
    </div>
  );
}