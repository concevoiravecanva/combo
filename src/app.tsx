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
  Expand,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { addElementAtPoint } from '@canva/design'; // <— AJOUT

type CombineOp = 'union' | 'subtract' | 'intersect' | 'exclude';

const SHAPES = [
  { key: 'circle', label: 'Cercle', Icon: IconCircle },
  { key: 'square', label: 'Carré', Icon: IconSquare },
  { key: 'triangle', label: 'Triangle', Icon: IconTriangle },
  { key: 'diamond', label: 'Losange', Icon: IconDiamond },
  { key: 'pentagon', label: 'Pentagone', Icon: IconPentagon },
  { key: 'hexagon', label: 'Hexagone', Icon: IconHexagon },
  { key: 'heart', label: 'Cœur', Icon: IconHeart },
  { key: 'star', label: 'Étoile', Icon: IconStar }
];

export default function App() {
  const canvasRef = useRef<VectorCanvasRef | null>(null);
  const [shapes, setShapes] = useState<ShapeData[]>([]);
  const [selected, setSelected] = useState<ShapeData[]>([]);
  const [pushing, setPushing] = useState(false);
  const [history, setHistory] = useState<ShapeData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [enlargeMode, setEnlargeMode] = useState(false);
  const [handlesVisible, setHandlesVisible] = useState(true);
  const [canvaReady, setCanvaReady] = useState(false);

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
      // Récupération paths normalisés
      const norm = (canvasRef.current as any)?.getNormalizedShapePaths?.();
      if (!norm?.paths?.length) {
        console.warn('Aucun path à envoyer');
        return;
      }

      // Si >30 paths on fusionne en une image (simpliste)
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

      // Ajout en tant que shape vectoriel
      await addElementAtPoint({
        type: 'shape',
        top: 60,
        left: 60,
        width: norm.viewBox.width,
        height: norm.viewBox.height,
        viewBox: norm.viewBox, // {top:0,left:0,width,height}
        paths: norm.paths
      });
    } catch (e) {
      console.error('Insertion Canva échouée', e);
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

  function toggleEnlargeMode() {
    setEnlargeMode(m => !m);
  }

  function toggleHandles() {
    const next = !handlesVisible;
    setHandlesVisible(next);
    canvasRef.current?.setHandlesVisibility?.(next);
  }

  function scaleSelected(factor: number) {
    if (!selected.length) return;
    canvasRef.current?.scaleShapes?.(selected.map(s => s.id), factor);
    refreshShapes(false);
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
        {/* Palette */}
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

        {/* Combinaisons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
          width: '100%'
        }}>
          <button disabled={!canCombine()} onClick={() => handleCombine('union')} style={comboBtnStyle(!canCombine())}>
            Union
          </button>
          <button disabled={!canCombine()} onClick={() => handleCombine('subtract')} style={comboBtnStyle(!canCombine())}>
            Soustraction
          </button>
          <button disabled={!canCombine()} onClick={() => handleCombine('intersect')} style={comboBtnStyle(!canCombine())}>
            Intersection
          </button>
            <button disabled={!canCombine()} onClick={() => handleCombine('exclude')} style={comboBtnStyle(!canCombine())}>
            Exclusion
          </button>
        </div>

        {/* Canvas */}
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
            title="Vider"
            disabled={enlargeMode}
            style={iconBtnStyle(enlargeMode, enlargeMode)}
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={handlePushToCanva}
            disabled={pushing || shapes.length === 0 || enlargeMode}
            title="Ajouter à Canva"
            style={iconBtnStyle(enlargeMode, pushing || shapes.length === 0 || enlargeMode)}
          >
            <Upload size={18} />
          </button>
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0 || enlargeMode}
            title="Undo"
            style={iconBtnStyle(enlargeMode, historyIndex <= 0 || enlargeMode)}
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={toggleEnlargeMode}
            title="Mode agrandir/rétrécir"
            style={{
              ...iconBtnStyle(false, false),
              background: enlargeMode ? '#0066ff' : '#fff',
              color: enlargeMode ? '#fff' : '#000',
              borderColor: enlargeMode ? '#0052cc' : '#ccc'
            }}
          >
            <Expand size={18} />
          </button>
          {enlargeMode && (
            <>
              <button
                onClick={() => scaleSelected(1.15)}
                title="Agrandir sélection"
                style={iconBtnStyle(false, !selected.length)}
                disabled={!selected.length}
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={() => scaleSelected(0.85)}
                title="Rétrécir sélection"
                style={iconBtnStyle(false, !selected.length)}
                disabled={!selected.length}
              >
                <ZoomOut size={18} />
              </button>
            </>
          )}
          <button
            onClick={toggleHandles}
            title={handlesVisible ? 'Masquer points Bézier' : 'Afficher points Bézier'}
            disabled={enlargeMode}
            style={iconBtnStyle(enlargeMode, enlargeMode)}
          >
            {handlesVisible ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>

        {/* Calques */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Calques</div>
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
                  {/* Sélecteur de couleur direct */}
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
                      // déclenche l'input caché
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
                        // Monter = vers l'avant (z-index supérieur)
                        canvasRef.current?.moveLayer?.(s.id, 'up');
                        refreshShapes(false);
                      }}
                      title="Monter"
                      style={layerOrderBtnStyle}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Descendre = vers l'arrière (z-index inférieur)
                        canvasRef.current?.moveLayer?.(s.id, 'down');
                        refreshShapes(false);
                      }}
                      title="Descendre"
                      style={layerOrderBtnStyle}
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      canvasRef.current?.deleteShape?.(s.id);
                      refreshShapes();
                    }}
                    style={deleteBtnStyle}
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            {shapes.length === 0 && <div style={{ fontSize: 11, color: '#777' }}>Aucune forme</div>}
          </div>
        </div>
        {!canvaReady && <div style={{fontSize:11,color:'#777'}}>En attente de Canva...</div>}
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

const iconBtnStyle = (_enlarge: boolean, disabled?: boolean): React.CSSProperties => ({
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
