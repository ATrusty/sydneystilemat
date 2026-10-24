import React, { useMemo, useState } from "react";
import { RotateCcw, PaintBucket, Eraser, Download, Grid2X2, Palette } from "lucide-react";

const PALETTE = [
  "#171717", "#ffffff", "#ef4444", "#f97316", "#facc15",
  "#22c55e", "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
  "#a16207", "#9ca3af"
];

function makeCells(rows, cols) {
  return Array.from({ length: rows * cols }, (_, i) => ({
    id: i,
    color: "#ffffff"
  }));
}

function hexPoints(cx, cy, radius) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 90);
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
  }).join(" ");
}

export default function App() {
  const [rows, setRows] = useState(15);
  const [cols, setCols] = useState(27);
  const [cells, setCells] = useState(() => makeCells(15, 27));
  const [color, setColor] = useState("#171717");
  const [history, setHistory] = useState([]);
  const [tool, setTool] = useState("paint");
  const [showGrid, setShowGrid] = useState(true);

  const radius = 14;
  const stepX = Math.sqrt(3) * radius;
  const stepY = 1.5 * radius;
  const padding = radius + 5;

  const hexes = useMemo(() => {
    const items = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cx = padding + col * stepX + (row % 2 ? stepX / 2 : 0);
        const cy = padding + row * stepY;
        items.push({ id: row * cols + col, cx, cy });
      }
    }
    return items;
  }, [rows, cols, padding, stepX, stepY]);

  const width = padding * 2 + (cols - 1) * stepX + stepX / 2;
  const height = padding * 2 + (rows - 1) * stepY + radius;

  function applyToCell(id) {
    setCells((current) => {
      const next = [...current];
      const target = tool === "erase" ? "#ffffff" : color;
      if (next[id]?.color === target) return current;
      setHistory((h) => [...h.slice(-39), current]);
      next[id] = { ...next[id], color: target };
      return next;
    });
  }

  function resizeGrid(nextRows, nextCols) {
    const next = makeCells(nextRows, nextCols);
    setCells((current) => {
      for (let i = 0; i < Math.min(current.length, next.length); i++) next[i] = current[i];
      return next;
    });
    setRows(nextRows);
    setCols(nextCols);
    setHistory([]);
  }

  function undo() {
    if (!history.length) return;
    setCells(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
  }

  function reset() {
    setHistory((h) => [...h.slice(-39), cells]);
    setCells(makeCells(rows, cols));
  }

  function fillAll() {
    setHistory((h) => [...h.slice(-39), cells]);
    setCells((current) => current.map((cell) => ({ ...cell, color: color })));
  }

  function exportPng() {
    const svg = document.querySelector("#artboard-svg");
    if (!svg) return;
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(Math.ceil(width)));
    clone.setAttribute("height", String(Math.ceil(height)));
    const source = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(width * 2);
      canvas.height = Math.ceil(height * 2);
      const ctx = canvas.getContext("2d");
      ctx.scale(2, 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.download = "hexagon-art.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">⬡</div>
        <div>
          <div className="eyebrow">PIXEL ART STUDIO</div>
          <h1>Hexa<span>.</span></h1>
        </div>
        <div className="topbar-spacer" />
        <div className="saved-label"><span className="status-dot" /> Autosaves in this session</div>
      </header>

      <section className="intro">
        <div>
          <p className="kicker">YOUR CANVAS, YOUR RULES</p>
          <h2>Make something <em>hex-traordinary.</em></h2>
          <p className="subtitle">Pick a color, click any hexagon, and make your own honeycomb pixel art.</p>
        </div>
        <div className="hex-decoration" aria-hidden="true">⬡</div>
      </section>

      <section className="workspace">
        <aside className="sidebar">
          <div className="panel-heading"><Palette size={16} /><span>COLOR & TOOLS</span></div>
          <label className="field-label" htmlFor="color-picker">Selected color</label>
          <div className="color-select">
            <input id="color-picker" aria-label="Choose paint color" type="color" value={color} onChange={(e) => { setColor(e.target.value); setTool("paint"); }} />
            <div className="color-value"><strong>{color.toUpperCase()}</strong><small>Click to change</small></div>
          </div>
          <div className="palette-grid">
            {PALETTE.map((swatch) => (
              <button key={swatch} aria-label={`Select ${swatch}`} title={swatch} className={`swatch ${color.toLowerCase() === swatch ? "selected" : ""}`} style={{ backgroundColor: swatch }} onClick={() => { setColor(swatch); setTool("paint"); }}>
                {color.toLowerCase() === swatch && <span>✓</span>}
              </button>
            ))}
          </div>

          <div className="section-divider" />
          <div className="field-label">Tools</div>
          <div className="tool-stack">
            <button className={`tool-button ${tool === "paint" ? "active" : ""}`} onClick={() => setTool("paint")}><span className="tool-icon"><Palette size={16} /></span><span><strong>Paint</strong><small>Color individual cells</small></span><kbd>B</kbd></button>
            <button className={`tool-button ${tool === "erase" ? "active" : ""}`} onClick={() => setTool("erase")}><span className="tool-icon"><Eraser size={16} /></span><span><strong>Eraser</strong><small>Return cells to white</small></span><kbd>E</kbd></button>
            <button className="tool-button" onClick={fillAll}><span className="tool-icon"><PaintBucket size={16} /></span><span><strong>Fill all</strong><small>Color the whole canvas</small></span></button>
          </div>

          <div className="section-divider" />
          <div className="panel-heading"><Grid2X2 size={16} /><span>CANVAS SETTINGS</span></div>
          <div className="range-row"><label htmlFor="rows">Rows</label><output>{rows}</output></div>
          <input id="rows" className="range" type="range" min="5" max="24" value={rows} onChange={(e) => resizeGrid(Number(e.target.value), cols)} />
          <div className="range-row"><label htmlFor="cols">Columns</label><output>{cols}</output></div>
          <input id="cols" className="range" type="range" min="8" max="36" value={cols} onChange={(e) => resizeGrid(rows, Number(e.target.value))} />
          <label className="toggle-row"><span>Show outlines</span><input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} /><span className="toggle" /></label>
          <div className="section-divider" />
          <button className="reset-button" onClick={reset}><RotateCcw size={15} /> Clear canvas</button>
        </aside>

        <section className="canvas-section">
          <div className="canvas-toolbar">
            <div><span className="live-dot" /><strong>Untitled artwork</strong><span className="canvas-meta">{rows} × {cols}</span></div>
            <div className="canvas-actions">
              <button className="icon-button" title="Undo last change" aria-label="Undo last change" disabled={!history.length} onClick={undo}><RotateCcw size={15} /></button>
              <button className="export-button" onClick={exportPng}><Download size={15} /> Export PNG</button>
            </div>
          </div>
          <div className="canvas-wrap">
            <div className="canvas-frame">
              <svg id="artboard-svg" className="artboard" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Clickable hexagon pixel art canvas" style={{ cursor: tool === "erase" ? "cell" : "crosshair" }}>
                <rect width={width} height={height} fill="#ffffff" />
                {hexes.map((hex) => {
                  const cell = cells[hex.id];
                  return (
                    <polygon
                      key={hex.id}
                      points={hexPoints(hex.cx, hex.cy, radius)}
                      fill={cell?.color ?? "#ffffff"}
                      stroke={showGrid ? "#202020" : "transparent"}
                      strokeWidth={showGrid ? 2.4 : 0}
                      strokeLinejoin="round"
                      className="hex-cell"
                      onClick={() => applyToCell(hex.id)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") applyToCell(hex.id); }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Hexagon ${hex.id + 1}, ${cell?.color ?? "#ffffff"}`}
                    />
                  );
                })}
              </svg>
            </div>
          </div>
          <footer className="canvas-footer">
            <span><span className="hint-key">CLICK</span> a hexagon to paint it</span>
            <span><span className="hint-key">UNDO</span> your last move</span>
            <span>{cells.filter((c) => c.color !== "#ffffff").length} colored cells</span>
          </footer>
        </section>
      </section>
      <footer className="page-footer"><span>HEXA STUDIO</span><span>Made for your next little masterpiece.</span></footer>
    </main>
  );
}