import React, { useRef, useState, useEffect } from 'react';
import VectorCanvas, { VectorCanvasRef, ShapeData } from './VectorCanvas';
import {
  Circle as IconCircle,
  Square as IconSquare,
  Triangle as IconTriangle,
  Diamond as IconDiamond,
  Hexagon as IconHexagon,
  Pentagon as IconPentagon,
  Heart as IconHeart,
  Star as IconStar,
  Trash2,
  Upload,
  RotateCcw,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { addElementAtPoint } from '@canva/design'; // Added import

type CombineOp = 'union' | 'subtract' | 'intersect' | 'exclude';

const SHAPES = [
  { key: 'circle', label: 'Circle', Icon: IconCircle },
  { key: 'square', label: 'Square', Icon: IconSquare },
  { key: 'triangle', label: 'Triangle', Icon: IconTriangle },
  { key: 'diamond', label: 'Diamond', Icon: IconDiamond },
  { key: 'pentagon', label: 'Pentagon', Icon: IconPentagon },
  { key: 'hexagon', label: 'Hexagon', Icon: IconHexagon },
  { key: 'heart', label: 'Heart', Icon: IconHeart },
  { key: 'star', label: 'Star', Icon: IconStar }
];

export default function App() {
  const canvasRef = useRef<VectorCanvasRef | null>(null);
  const [shapes, setShapes] = useState<ShapeData[]>([]);
  const [selected, setSelected] = useState<ShapeData[]>([]);
  const [pushing, setPushing] = useState(false);
  const [history, setHistory] = useState<ShapeData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  // const [enlargeMode, setEnlargeMode] = useState(false); // removed
  const [handlesVisible, setHandlesVisible] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false); // Add this state

  function refreshShapes(pushHistory = true) {
    const list = canvasRef.current?.getShapesList?.() || [];
    setShapes(list);
    if (pushHistory) {
      const snapshot = list.map(s => ({ ...s }));
      const next = history.slice(0, historyIndex + 1);
      next.push(snapshot);
      setHistory(next);
      setHistoryIndex(next.length - 1);
    }
  }

  function handleSelectionChange(sel: ShapeData[]) {
    setSelected(sel);
  }

  function handleAddShape(type: string) {
    canvasRef.current?.addShape?.(type, '#ff0000', 150);
    refreshShapes();
  }

  function canCombine() {
    return selected.length === 2;
  }

  function handleCombine(op: CombineOp) {
    if (!canCombine()) return;
    const [a, b] = selected;
    canvasRef.current?.combineShapes?.(a.id, b.id, op);
    setTimeout(() => {
      const list = canvasRef.current?.getShapesList?.() || [];
      setShapes(list);
      const selIds = canvasRef.current?.getSelectedIds?.() || [];
      setSelected(list.filter(s => selIds.includes(s.id)));
      refreshShapes();
    }, 0);
  }

  function handleClear() {
    canvasRef.current?.clearCanvas?.();
    setSelected([]);
    refreshShapes();
  }

  function handleChangeLayerColor(id: string, color: string) {
    canvasRef.current?.changeShapeColor?.(id, color);
    refreshShapes(false);
  }

  function handleUndo() {
    if (historyIndex <= 0) return;
    const prevIndex = historyIndex - 1;
    const prev = history[prevIndex];
    canvasRef.current?.clearCanvas?.();
    prev.forEach(s => {
      canvasRef.current?.addShape?.(s.type, s.fillColor || '#ff0000', 150);
    });
    setHistoryIndex(prevIndex);
    const list = canvasRef.current?.getShapesList?.() || [];
    setShapes(list);
    setSelected([]);
  }

  async function handlePushToCanva() {
    if (pushing || shapes.length === 0) return;
    setPushing(true);
    try {
      const norm = (canvasRef.current as any)?.getNormalizedShapePaths?.();
      if (!norm?.paths?.length) {
        console.warn('No paths to send');
        return;
      }

      if (norm.paths.length > 30) {
        const svg = canvasRef.current?.exportSVG?.();
        if (!svg) return;
        const cleaned = svg
          .replace(/<\?xml.*?\?>/g, '')
          .replace(/<!DOCTYPE[\s\S]*?>/g, '')
          .trim();
        const blob = new Blob([cleaned], { type: 'image/svg+xml' });
        const dataUrl = await fileToDataURL(blob);
        await addElementAtPoint({
          type: 'image',
          mimeType: 'image/svg+xml',
          dataUrl,
          top: 60,
          left: 60,
          width: norm.viewBox.width || 200,
          height: norm.viewBox.height || 200
        });
        return;
      }

      await addElementAtPoint({
        type: 'shape',
        top: 60,
        left: 60,
        width: norm.viewBox.width,
        height: norm.viewBox.height,
        viewBox: norm.viewBox,
        paths: norm.paths
      });
    } catch (e) {
      console.error('Canva insertion failed', e);
    } finally {
      setPushing(false);
    }
  }

  function fileToDataURL(blob: Blob) {
    return new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = () => rej(fr.error);
      fr.readAsDataURL(blob);
    });
  }

  function toggleHandles() {
    const next = !handlesVisible;
    setHandlesVisible(next);
    canvasRef.current?.setHandlesVisibility?.(next);
  }

  // Keyboard shortcuts handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;
      if (e.key === 'Enter') {
        handlePushToCanva();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        handleClear();
      } else if (e.key === 'Escape') {
        setSelected([]);
      } else if (/^[1-8]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (SHAPES[idx]) handleAddShape(SHAPES[idx].key);
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // Nudge selection
        if (selected.length > 0 && canvasRef.current) {
          const dx = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
          const dy = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
          const step = e.shiftKey ? 10 : 1;
          selected.forEach(s => {
            canvasRef.current?.nudgeShape?.(s.id, dx * step, dy * step);
          });
          refreshShapes(false);
        }
      } else if (e.key === '/' || e.key === '-') {
        // Scale selection
        if (selected.length > 0 && canvasRef.current) {
          const scale = e.key === '/' ? 1.1 : 0.9;
          selected.forEach(s => {
            canvasRef.current?.scaleShapes?.([s.id], scale);
          });
          refreshShapes(false);
        }
      } else if (e.key === '[') {
        // Move layer down
        if (selected.length > 0 && canvasRef.current) {
          selected.forEach(s => {
            canvasRef.current?.moveLayer?.(s.id, 'down');
          });
          refreshShapes(false);
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, shapes, handlesVisible, pushing, historyIndex]);

  useEffect(() => {
    refreshShapes();
    // eslint-disable-next-line
  }, []);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        margin: 0,
        padding: 12,
        fontFamily: 'sans-serif',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          height: '100vh',           // <--- Change from '100%' to '100vh'
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          overflowY: 'scroll',       // <--- Use 'scroll' for always visible scrollbar
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          paddingRight: 4
        }}
      >
        {/* Shape palette */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {SHAPES.map(s => (
            <button
              key={s.key}
              onClick={() => handleAddShape(s.key)}
              title={s.label}
              style={shapeBtnStyle}
            >
              <s.Icon size={18} strokeWidth={1.8} />
            </button>
          ))}
        </div>

        {/* Boolean combinations */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
            width: '100%'
          }}
        >
          <button disabled={!canCombine()} onClick={() => handleCombine('union')} style={comboBtnStyle(!canCombine())}>
            Union
          </button>
          <button disabled={!canCombine()} onClick={() => handleCombine('subtract')} style={comboBtnStyle(!canCombine())}>
            Subtract
          </button>
          <button disabled={!canCombine()} onClick={() => handleCombine('intersect')} style={comboBtnStyle(!canCombine())}>
            Intersect
          </button>
          <button disabled={!canCombine()} onClick={() => handleCombine('exclude')} style={comboBtnStyle(!canCombine())}>
            Exclude
          </button>
        </div>

        {/* Canvas container */}
        <div
          style={{
            border: '1px solid #ccc',
            background: '#fff',
            borderRadius: 6,
            padding: 6,
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <VectorCanvas
            ref={canvasRef}
            width={320}
            height={240}
            style={{ width: 320, height: 240, display: 'block' }}
            onShapesChange={() => refreshShapes()}
            onSelectionChange={handleSelectionChange}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={handleClear}
            title="Clear"
            style={iconBtnStyle(false)}
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={handlePushToCanva}
            disabled={pushing || shapes.length === 0}
            title="Add to Canva"
            style={iconBtnStyle(pushing || shapes.length === 0)}
          >
            <Upload size={18} />
          </button>
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Undo"
            style={iconBtnStyle(historyIndex <= 0)}
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={toggleHandles}
            title={handlesVisible ? 'Hide Bezier handles' : 'Show Bezier handles'}
            style={iconBtnStyle(false)}
          >
            {handlesVisible ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>

        {/* Layers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Layers</div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              maxHeight: 180,
              overflowY: 'auto',
              border: '1px solid #eee',
              padding: 6,
              borderRadius: 6
            }}
          >
            {shapes.map(s => {
              const isSel = selected.some(sel => sel.id === s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => canvasRef.current?.selectShapes?.([s.id])}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 6px',
                    border: '1px solid ' + (isSel ? '#4d8dff' : '#ddd'),
                    background: isSel ? '#ddeaff' : '#fafafa',
                    borderRadius: 4,
                    cursor: 'pointer',
                    transition: 'background .15s, border-color .15s'
                  }}
                >
                  {/* Direct color selector */}
                  <div
                    style={{
                      position: 'relative',
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: '1px solid #444',
                      background: s.fillColor || '#ff0000',
                      flex: '0 0 18px'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Trigger hidden color input
                      const inp = document.getElementById(`clr-${s.id}`) as HTMLInputElement | null;
                      inp?.click();
                    }}
                  >
                    <input
                      id={`clr-${s.id}`}
                      type="color"
                      value={s.fillColor || '#ff0000'}
                      onChange={(e) => {
                        handleChangeLayerColor(s.id, e.target.value);
                      }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0,
                        cursor: 'pointer'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <span style={{ fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.type}
                  </span>

                  <div style={{ display: 'flex', gap: 2 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        canvasRef.current?.moveLayer?.(s.id, 'up');
                        refreshShapes(false);
                      }}
                      title="Move up"
                      style={layerOrderBtnStyle}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        canvasRef.current?.moveLayer?.(s.id, 'down');
                        refreshShapes(false);
                      }}
                      title="Move down"
                      style={layerOrderBtnStyle}
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        canvasRef.current?.scaleShapes?.([s.id], 1.1);
                        refreshShapes(false);
                      }}
                      title="Scale +10%"
                      style={layerOrderBtnStyle}
                    >
                      +
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        canvasRef.current?.scaleShapes?.([s.id], 0.9);
                        refreshShapes(false);
                      }}
                      title="Scale -10%"
                      style={layerOrderBtnStyle}
                    >
                      –
                    </button>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      canvasRef.current?.deleteShape?.(s.id);
                      refreshShapes();
                    }}
                    style={deleteBtnStyle}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            {shapes.length === 0 && <div style={{ fontSize: 11, color: '#777' }}>No shapes</div>}
          </div>
        </div>

        {/* Help / Shortcuts collapsible */}
        <div
          style={{
            marginTop: 16,
            border: '1px solid #eee',
            borderRadius: 6,
            background: '#fafafa',
            fontSize: 12,
            color: '#444',
            overflow: 'hidden',
            maxHeight: 220, // Limit height for scroll
          }}
        >
          <button
            type="button"
            onClick={() => setHelpOpen(o => !o)}
            aria-expanded={helpOpen}
            style={{
              all: 'unset',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              cursor: 'pointer',
              padding: '8px 10px',
              fontWeight: 600,
              background: helpOpen ? '#f2f2f2' : '#fafafa'
            }}
            title="Toggle help panel"
          >
            <span>Help / Shortcuts</span>
          </button>
          {helpOpen && (
            <div
              style={{
                padding: '8px 12px',
                lineHeight: 1.4,
                maxHeight: 180, // Height for scrollable content
                overflowY: 'auto'
              }}
            >
              <div style={{ fontWeight: 600, margin: '4px 0 4px' }}>How the app works</div>
              <p style={{ margin: '0 0 10px 0' }}>
                <b>Combo</b> lets you create and edit vector shapes, combine them using boolean operations, and send your design to Canva.
                <br /><br />
                <b>How to use:</b>
                <ul style={{ margin: '8px 0 10px 0', paddingLeft: 16 }}>
                  <li><b>Add shapes:</b> Use the shape palette at the top to add new shapes to the canvas.</li>
                  <li><b>Select shapes:</b> Click a shape in the canvas or in the layers panel to select it. Hold <b>Shift</b> to select multiple shapes.</li>
                  <li><b>Combine shapes:</b> Select two shapes and use the Union, Subtract, Intersect, or Exclude buttons to combine them.</li>
                  <li><b>Edit layers:</b> Use the layers panel to change color, reorder, scale, or delete shapes.</li>
                  <li><b>Bezier handles:</b> Toggle Bezier handles with the eye button to adjust curves.</li>
                  <li><b>Undo:</b> Use the Undo button to revert your last change.</li>
                  <li><b>Clear:</b> Use the Trash button to remove all shapes from the canvas.</li>
                  <li><b>Push to Canva:</b> Use the Upload button or press <b>Enter</b> to send your design to Canva.</li>
                </ul>
              </p>
              <div style={{ fontWeight: 600, margin: '4px 0 4px' }}>Button explanations</div>
              <ul style={{ margin: '0 0 10px 0', paddingLeft: 16 }}>
                <li><b>Shape palette</b>: Add a new shape to the canvas.</li>
                <li><b>Union / Subtract / Intersect / Exclude</b>: Combine two selected shapes using boolean operations.</li>
                <li><b>Trash</b>: Clears all shapes from the canvas.</li>
                <li><b>Upload</b>: Pushes your current design to Canva.</li>
                <li><b>Undo</b>: Reverts the last change you made.</li>
                <li><b>Eye</b>: Shows or hides Bezier handles for editing curves.</li>
                <li><b>Layers panel</b>: 
                  <ul style={{ margin: '4px 0 0', paddingLeft: 14 }}>
                    <li><b>Color dot</b>: Change the fill color of a shape.</li>
                    <li><b>Up / Down arrows</b>: Move the layer up or down in the stack.</li>
                    <li><b>+</b> / <b>–</b>: Scale the shape up or down by 10%.</li>
                    <li><b>✕</b>: Delete the shape from the canvas.</li>
                  </ul>
                </li>
              </ul>
              <div style={{ fontWeight: 600, margin: '4px 0 4px' }}>Shortcuts</div>
              <ul style={{ margin: '0 0 8px', paddingLeft: 16 }}>
                <li><b>Enter</b>: Push shapes to Canva</li>
                <li><b>Delete / Backspace</b>: Delete selection</li>
                <li><b>Esc</b>: Clear selection</li>
                <li><b>1–8</b>: Add palette shape</li>
                <li><b>Click / Shift+Click</b>: Select / multi-select</li>
                <li><b>/</b>: Scale +10% &nbsp;|&nbsp; <b>-</b>: Scale -10%</li>
                <li><b>[ / ]</b>: Move layer down / up</li>
                <li><b>Cmd/Ctrl+Z</b>: Undo</li>
              </ul>
              <div style={{ height: 12 }} /> {/* Ligne vide pour le padding bas */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const shapeBtnStyle: React.CSSProperties = {
  aspectRatio: '1 / 1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #D0D0D0',
  background: '#FFFFFF',
  borderRadius: 6,
  cursor: 'pointer',
  padding: 0
};

const comboBtnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '8px 10px',
  fontSize: 12,
  border: '1px solid #ccc',
  background: disabled ? '#f0f0f0' : '#fff',
  cursor: disabled ? 'default' : 'pointer',
  borderRadius: 6,
  boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
});

const iconBtnStyle = (disabled?: boolean): React.CSSProperties => ({
  height: 44,
  width: 44,
  borderRadius: 10,
  border: '1px solid #ccc',
  background: '#fff',
  fontSize: 18,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: disabled ? 'not-allowed' : 'pointer',
  boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
  padding: 0,
  opacity: disabled ? 0.5 : 1,
  transition: 'background .15s, color .15s, border-color .15s'
});

const layerOrderBtnStyle = {
  border: '1px solid #ccc',
  background: '#fff',
  padding: 2,
  borderRadius: 4,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 22,
  width: 22
};

const deleteBtnStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: '#c00',
  cursor: 'pointer',
  fontSize: 14,
  lineHeight: 1,
  padding: 0,
  opacity: 1
};
