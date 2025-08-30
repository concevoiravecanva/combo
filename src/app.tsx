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
  // removed canvaReady state (unused after removal of waiting message)

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
          height: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          overflowY: 'auto',
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
        {/* Removed "Waiting for Canva..." */}
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
