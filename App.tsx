import React, { useEffect, useRef, useState } from "react";

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
type Point = { x: number; y: number };
type PadPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

type Skin = "classic" | "aurora";

const GRID_SIZE = 20;
const CELL_SIZE = 24;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

const REDEEM_CODES: Record<string, { type: "points" | "skin"; amount?: number; skin?: Skin }> = {
  "300POINTS": { type: "points", amount: 300 },
  "620POINTS": { type: "points", amount: 620 },
  "AURORA-SECRET": { type: "skin", skin: "aurora" },
};

const PAD_POSITIONS: Record<PadPosition, { top?: number; bottom?: number; left?: number; right?: number }> = {
  "top-left": { top: 24, left: 24 },
  "top-right": { top: 24, right: 24 },
  "bottom-left": { bottom: 24, left: 24 },
  "bottom-right": { bottom: 24, right: 24 },
};

const SKIN_COLORS: Record<Skin, { head: string; body: string; glow: string; border: string }> = {
  classic: {
    head: "#4ade80",
    body: "#22c55e",
    glow: "rgba(74, 222, 128, 0.5)",
    border: "#dc2626",
  },
  aurora: {
    head: "#a5f3fc",
    body: "#8b5cf6",
    glow: "rgba(125, 211, 252, 0.8)",
    border: "#38bdf8",
  },
};

function getRandomFood(snake: Point[]): Point {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  const cells: Point[] = [];

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        cells.push({ x, y });
      }
    }
  }

  return cells[Math.floor(Math.random() * cells.length)] ?? { x: 0, y: 0 };
}

export default function App() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>(() => getRandomFood(INITIAL_SNAKE));
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [speed, setSpeed] = useState(170);
  const [score, setScore] = useState(0);
  const [bank, setBank] = useState(0);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showPad, setShowPad] = useState(true);
  const [padPosition, setPadPosition] = useState<PadPosition>("bottom-right");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [redeemInput, setRedeemInput] = useState("");
  const [redeemMessage, setRedeemMessage] = useState("Use a code to earn points or unlock the Aurora skin.");
  const [unlockedSkins, setUnlockedSkins] = useState<Skin[]>(["classic"]);
  const [selectedSkin, setSelectedSkin] = useState<Skin>("classic");

  const directionRef = useRef<Direction>("RIGHT");
  const foodRef = useRef(food);

  useEffect(() => {
    foodRef.current = food;
  }, [food]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(getRandomFood(INITIAL_SNAKE));
    setDirection("RIGHT");
    directionRef.current = "RIGHT";
    setScore(0);
    setGameOver(false);
    setStarted(false);
    setSpeed(170);
  };

  const applySkin = (skin: Skin) => {
    if (!unlockedSkins.includes(skin)) return;
    setSelectedSkin(skin);
  };

  const handleRedeemCode = () => {
    const code = redeemInput.trim().toUpperCase();

    if (!code) {
      setRedeemMessage("Enter a redeem code first.");
      return;
    }

    const reward = REDEEM_CODES[code];

    if (!reward) {
      setRedeemMessage("Invalid code. Try one of the listed rewards.");
      return;
    }

    if (reward.type === "points") {
      const amount = reward.amount ?? 0;
      setBank((prev) => prev + amount);
      setRedeemMessage(`Redeemed! +${amount} points added to your bank.`);
    }

    if (reward.type === "skin") {
      if (unlockedSkins.includes(reward.skin ?? "classic")) {
        setRedeemMessage("Aurora skin is already unlocked.");
      } else {
        setUnlockedSkins((prev) => [...prev, reward.skin ?? "aurora"]);
        setSelectedSkin(reward.skin ?? "aurora");
        setRedeemMessage("Secret Aurora skin unlocked! You now have access to it.");
      }
    }

    setRedeemInput("");
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (key === "w" || key === "arrowup") {
        if (directionRef.current !== "DOWN") {
          directionRef.current = "UP";
          setDirection("UP");
        }
      }

      if (key === "s" || key === "arrowdown") {
        if (directionRef.current !== "UP") {
          directionRef.current = "DOWN";
          setDirection("DOWN");
        }
      }

      if (key === "a" || key === "arrowleft") {
        if (directionRef.current !== "RIGHT") {
          directionRef.current = "LEFT";
          setDirection("LEFT");
        }
      }

      if (key === "d" || key === "arrowright") {
        if (directionRef.current !== "LEFT") {
          directionRef.current = "RIGHT";
          setDirection("RIGHT");
        }
      }

      setStarted(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!started || gameOver) return;

    const tick = setInterval(() => {
      setSnake((currentSnake) => {
        const head = currentSnake[0];
        const nextHead = { ...head };

        if (directionRef.current === "UP") nextHead.y -= 1;
        if (directionRef.current === "DOWN") nextHead.y += 1;
        if (directionRef.current === "LEFT") nextHead.x -= 1;
        if (directionRef.current === "RIGHT") nextHead.x += 1;

        const hitsWall =
          nextHead.x < 0 ||
          nextHead.y < 0 ||
          nextHead.x >= GRID_SIZE ||
          nextHead.y >= GRID_SIZE;

        const hitsSelf = currentSnake.some(
          (segment) => segment.x === nextHead.x && segment.y === nextHead.y
        );

        if (hitsWall || hitsSelf) {
          setGameOver(true);
          return currentSnake;
        }

        const nextSnake = [nextHead, ...currentSnake];

        if (nextHead.x === foodRef.current.x && nextHead.y === foodRef.current.y) {
          const newFood = getRandomFood(nextSnake);
          setFood(newFood);
          setScore((prev) => prev + 10);
          setSpeed((prev) => Math.max(100, prev - 2));
          return nextSnake;
        }

        return nextSnake.slice(0, -1);
      });
    }, speed);

    return () => clearInterval(tick);
  }, [started, gameOver, speed]);

  const snakeColor = SKIN_COLORS[selectedSkin];

  const cells = [] as Array<{ x: number; y: number; isHead: boolean; isBody: boolean; isFood: boolean }>;
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const isHead = snake[0]?.x === x && snake[0]?.y === y;
      const isBody = snake.some((segment, index) => index > 0 && segment.x === x && segment.y === y);
      const isFood = food.x === x && food.y === y;
      cells.push({ x, y, isHead, isBody, isFood });
    }
  }

  const padStyle = PAD_POSITIONS[padPosition];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, rgba(168, 85, 247, 0.2), rgba(2, 6, 23, 0.95) 30%, rgba(2, 6, 23, 1) 100%)",
        padding: 24,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          background: "rgba(15, 23, 42, 0.82)",
          border: "3px solid rgba(148, 163, 184, 0.35)",
          borderRadius: 28,
          boxShadow: "0 0 0 2px rgba(255,255,255,0.06), 0 18px 60px rgba(0,0,0,0.45)",
          padding: 18,
          backdropFilter: "blur(8px)",
          display: "inline-block",
        }}
      >
        <div
          style={{
            width: GRID_SIZE * CELL_SIZE + 10,
            height: GRID_SIZE * CELL_SIZE + 10,
            background: "#0f172a",
            border: `4px solid ${snakeColor.border}`,
            boxShadow: `0 0 14px ${snakeColor.glow}`,
            borderRadius: 10,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {cells.map((cell, index) => (
            <div
              key={`${cell.x}-${cell.y}-${index}`}
              style={{
                position: "absolute",
                left: cell.x * CELL_SIZE,
                top: cell.y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
                background: (cell.x + cell.y) % 2 === 0 ? "rgba(15, 23, 42, 0.9)" : "rgba(15, 23, 42, 0.75)",
                border: "1px solid rgba(148, 163, 184, 0.05)",
                boxSizing: "border-box",
              }}
            >
              {cell.isFood && (
                <div
                  style={{
                    position: "absolute",
                    inset: 5,
                    borderRadius: "50%",
                    background: "#f97316",
                    boxShadow: "0 0 10px rgba(249, 115, 22, 0.8)",
                  }}
                />
              )}

              {cell.isBody && (
                <div
                  style={{
                    position: "absolute",
                    inset: 2,
                    borderRadius: 6,
                    background: snakeColor.body,
                    boxShadow: `0 0 10px ${snakeColor.glow}`,
                  }}
                />
              )}

              {cell.isHead && (
                <div
                  style={{
                    position: "absolute",
                    inset: 2,
                    borderRadius: 6,
                    background: snakeColor.head,
                    boxShadow: `0 0 12px ${snakeColor.glow}`,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#111827",
                      left: 6,
                      top: 6,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "#111827",
                      right: 6,
                      top: 6,
                    }}
                  />
                </div>
              )}
            </div>
          ))}

          {gameOver && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(15, 23, 42, 0.8)",
                color: "#f8fafc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                fontWeight: 700,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>Game Over</div>
              <button
                onClick={resetGame}
                style={{
                  marginTop: 14,
                  background: "linear-gradient(135deg, #7c3aed, #22d3ee)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: "10px 16px",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          position: "fixed",
          top: 18,
          right: 18,
          zIndex: 5,
          color: "#e2e8f0",
          fontWeight: 700,
          pointerEvents: "none",
        }}
      >
        <button
          onClick={() => setSettingsOpen(true)}
          style={{
            pointerEvents: "auto",
            border: "none",
            borderRadius: 12,
            padding: "8px 12px",
            fontWeight: 700,
            background: "rgba(148, 163, 184, 0.2)",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Settings
        </button>
      </div>

      {showPad && (
        <div
          style={{
            position: "fixed",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            zIndex: 30,
            ...padStyle,
          }}
        >
          <button
            onClick={() => {
              setStarted(true);
              if (directionRef.current !== "DOWN") {
                directionRef.current = "UP";
                setDirection("UP");
              }
            }}
            aria-label="Move up"
            style={{
              width: 56,
              height: 56,
              border: "2px solid rgba(0,0,0,0.3)",
              borderRadius: 12,
              fontSize: 24,
              background: "linear-gradient(135deg, #4ade80, #22c55e)",
              color: "#111827",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            ↑
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                setStarted(true);
                if (directionRef.current !== "RIGHT") {
                  directionRef.current = "LEFT";
                  setDirection("LEFT");
                }
              }}
              aria-label="Move left"
              style={{
                width: 56,
                height: 56,
                border: "2px solid rgba(0,0,0,0.3)",
                borderRadius: 12,
                fontSize: 24,
                background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
                color: "#fff",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              ←
            </button>
            <button
              onClick={() => {
                setStarted(true);
                if (directionRef.current !== "UP") {
                  directionRef.current = "DOWN";
                  setDirection("DOWN");
                }
              }}
              aria-label="Move down"
              style={{
                width: 56,
                height: 56,
                border: "2px solid rgba(0,0,0,0.3)",
                borderRadius: 12,
                fontSize: 24,
                background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                color: "#111827",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              ↓
            </button>
            <button
              onClick={() => {
                setStarted(true);
                if (directionRef.current !== "LEFT") {
                  directionRef.current = "RIGHT";
                  setDirection("RIGHT");
                }
              }}
              aria-label="Move right"
              style={{
                width: 56,
                height: 56,
                border: "2px solid rgba(0,0,0,0.3)",
                borderRadius: 12,
                fontSize: 24,
                background: "linear-gradient(135deg, #f472b6, #ec4899)",
                color: "#fff",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              →
            </button>
          </div>
        </div>
      )}

      {settingsOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 6, 23, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 40,
            padding: 20,
          }}
          onClick={() => setSettingsOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 460,
              background: "rgba(15, 23, 42, 0.96)",
              border: "1px solid rgba(148, 163, 184, 0.25)",
              borderRadius: 20,
              padding: 20,
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
              color: "#f8fafc",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 28 }}>Settings</h3>
              <button
                onClick={() => setSettingsOpen(false)}
                style={{
                  border: "none",
                  background: "rgba(148, 163, 184, 0.15)",
                  color: "#fff",
                  borderRadius: 10,
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ marginBottom: 10, fontWeight: 700 }}>Controls</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span>Show on-screen pad</span>
                <button
                  onClick={() => setShowPad((prev) => !prev)}
                  style={{
                    width: 52,
                    height: 28,
                    borderRadius: 999,
                    border: "none",
                    background: showPad ? "#22c55e" : "#475569",
                    cursor: "pointer",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: showPad ? 26 : 4,
                      top: 4,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: "#fff",
                      transition: "left 0.2s ease",
                    }}
                  />
                </button>
              </div>

              <div style={{ marginBottom: 10, fontWeight: 700 }}>Pad position</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                {(["top-left", "top-right", "bottom-left", "bottom-right"] as PadPosition[]).map((position) => (
                  <button
                    key={position}
                    onClick={() => setPadPosition(position)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: position === padPosition ? "2px solid #38bdf8" : "1px solid rgba(255,255,255,0.18)",
                      background: position === padPosition ? "rgba(56, 189, 248, 0.2)" : "rgba(148, 163, 184, 0.12)",
                      color: "#f8fafc",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {position.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ marginBottom: 10, fontWeight: 700 }}>Redeem code</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={redeemInput}
                  onChange={(event) => setRedeemInput(event.target.value)}
                  placeholder="Enter code"
                  style={{
                    flex: 1,
                    background: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    color: "#f8fafc",
                    outline: "none",
                  }}
                />
                <button
                  onClick={handleRedeemCode}
                  style={{
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 16px",
                    background: "linear-gradient(135deg, #7c3aed, #22d3ee)",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Redeem
                </button>
              </div>

              <div style={{ marginTop: 12, color: "#cbd5e1", minHeight: 22 }}>{redeemMessage}</div>

              <div style={{ marginTop: 14, color: "#cbd5e1", lineHeight: 1.8 }}>
                <div>Codes:</div>
                <div><strong>300POINTS</strong> = +300 points</div>
                <div><strong>620POINTS</strong> = +620 points</div>
                <div><strong>AURORA-SECRET</strong> = unlock the secret Aurora skin</div>
              </div>
            </div>

            <div>
              <div style={{ marginBottom: 10, fontWeight: 700 }}>Skins</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {([
                  { id: "classic", label: "Classic" },
                  { id: "aurora", label: "Aurora" },
                ] as Array<{ id: Skin; label: string }>).map((skin) => {
                  const unlocked = unlockedSkins.includes(skin.id);
                  const selected = selectedSkin === skin.id;
                  return (
                    <button
                      key={skin.id}
                      onClick={() => applySkin(skin.id)}
                      disabled={!unlocked}
                      style={{
                        width: 128,
                        padding: 12,
                        borderRadius: 12,
                        border: selected ? "2px solid #38bdf8" : "1px solid rgba(255,255,255,0.12)",
                        background: unlocked
                          ? skin.id === "aurora"
                            ? "linear-gradient(135deg, rgba(125, 211, 252, 0.4), rgba(168, 85, 247, 0.4))"
                            : "rgba(59, 130, 246, 0.18)"
                          : "rgba(30, 41, 59, 0.7)",
                        color: "#f8fafc",
                        opacity: unlocked ? 1 : 0.6,
                        cursor: unlocked ? "pointer" : "not-allowed",
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{skin.label}</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: "#cbd5e1" }}>
                        {unlocked ? "Unlocked" : "Locked"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
