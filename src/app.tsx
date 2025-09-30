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
  RotateCw,      
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { addElementAtPoint } from '@canva/design'; 
import { Title, Text, Button } from '@canva/app-ui-kit';
import { FormattedMessage, useIntl } from 'react-intl';
import { messages } from './i18n/messages';
import { ReloadIcon, UndoIcon, EyeIcon, XIcon } from "@canva/app-ui-kit";
import { Rows, Columns, Column } from "@canva/app-ui-kit";

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
  const [handlesVisible, setHandlesVisible] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false); 
  const liveRef = useRef<HTMLDivElement|null>(null);
  const intl = useIntl();

  function announce(msg: string) {
    if (!liveRef.current) return;
    liveRef.current.textContent = '';
    requestAnimationFrame(() => {
      if (liveRef.current) liveRef.current.textContent = msg;
    });
  }

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
    if (sel.length === 0) announce(intl.formatMessage(messages.selection_none));
    else if (sel.length === 1) announce(intl.formatMessage(messages.selection_one));
    else announce(intl.formatMessage(messages.selection_many, { count: sel.length }));
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
    announce(intl.formatMessage(messages.color_change_announce));
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
    
        if (selected.length > 0 && canvasRef.current) {
          const scale = e.key === '/' ? 1.1 : 0.9;
          selected.forEach(s => {
            canvasRef.current?.scaleShapes?.([s.id], scale);
          });
          refreshShapes(false);
        }
      } else if (e.key === '[') {
        
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
    
  }, []);

  return (
    <main
      role="main"
      aria-label="Vector editor"
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
      {/* Toolbar and Preview label above canvas */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
          maxWidth: 320
        }}
      >
        <Text
          variant="bold"
          style={{
            fontSize: 15,
            color: 'var(--ui-kit-color-typography-primary)'
          }}
        >
          Preview
        </Text>
        <div style={{ display: 'flex', gap: 6 }}>
          {/* Clear */}
          <button
            type="button"
            onClick={handleClear}
            title="Clear"
            aria-label="Clear all shapes"
            style={{
              background: 'var(--ui-kit-color-tertiary)',
              border: 'none',
              borderRadius: 6,
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--ui-kit-color-tertiary-fore)'
            }}
          >
            <ReloadIcon size={18} aria-hidden="true" />
          </button>
          {/* Undo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            aria-disabled={historyIndex <= 0}
            title="Undo"
            aria-label="Undo"
            style={{
              background: 'var(--ui-kit-color-tertiary)',
              border: 'none',
              borderRadius: 6,
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer',
              color: 'var(--ui-kit-color-tertiary-fore)',
              opacity: historyIndex <= 0 ? 0.5 : 1
            }}
          >
            <UndoIcon size={18} aria-hidden="true" />
          </button>
          {/* Toggle handles */}
          <button
            type="button"
            aria-pressed={handlesVisible}
            onClick={toggleHandles}
            title={handlesVisible ? 'Hide handles' : 'Show handles'}
            aria-label={handlesVisible ? 'Hide Bezier handles' : 'Show Bezier handles'}
            style={{
              background: 'var(--ui-kit-color-tertiary)',
              border: 'none',
              borderRadius: 6,
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--ui-kit-color-tertiary-fore)'
            }}
          >
            {handlesVisible ? <EyeIcon size={18} aria-hidden="true" /> : <XIcon size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>
      {/* Canvas preview at the top */}
      <div
        style={{
          position: 'relative',
          border: '1px solid var(--ui-kit-color-border)',
          background: 'var(--ui-kit-color-surface)',
          borderRadius: 6,
          padding: 6,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 16,
          width: 320,
          height: 240
        }}
      >
        <VectorCanvas
          ref={canvasRef}
          width={320}
          height={240}
          style={{ width: 320, height: 240, display: 'block' }}
          onShapesChange={() => refreshShapes()}
          onSelectionChange={handleSelectionChange}
          aria-label="Zone de dessin vectoriel"
        />
        {/* Empty state message */}
        {shapes.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 320,
              height: 240,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            <Text
              size="small"
              tone="tertiary"
              style={{
                color: 'var(--ui-kit-color-typography-tertiary)',
                textAlign: 'center'
              }}
            >
              Click a shape below to add it to canvas
            </Text>
          </div>
        )}
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 360,
          height: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          paddingBottom: 16,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          paddingRight: 4
        }}
      >
        {/* Shapes label */}
        <Text
          variant="bold"
          style={{
            fontSize: 13,
            marginBottom: 4,
            color: 'var(--ui-kit-color-typography-primary)'
          }}
        >
          Shapes
        </Text>

        {/* Shape palette in two rows of four */}
        <div
          role="group"
          aria-label="Shape palette"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            marginBottom: 8
          }}
        >
          {SHAPES.map(s => (
            <button
              key={s.key}
              type="button"
              aria-label={`Add ${s.label}`}
              onClick={() => handleAddShape(s.key)}
              style={{
                ...shapeBtnStyle,
                transition: 'background .15s, border-color .15s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--ui-kit-color-secondary-hover)';
                e.currentTarget.style.borderColor = 'var(--ui-kit-color-secondary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--ui-kit-color-surface)';
                e.currentTarget.style.borderColor = 'var(--ui-kit-color-border)';
              }}
            >
              <s.Icon size={18} strokeWidth={1.8} aria-hidden="true" />
            </button>
          ))}
        </div>

        {/* Progressive disclosure: show combine actions only if shapes exist */}
        {shapes.length > 0 && (
          <div
            role="group"
            aria-label="Boolean operations"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
              width: '100%'
            }}
          >
            <button
              type="button"
              aria-disabled={!canCombine()}
              disabled={!canCombine()}
              onClick={() => handleCombine('union')}
              style={comboBtnStyle(!canCombine())}
            >
              <FormattedMessage {...messages.boolean_union} />
            </button>
            <button
              type="button"
              aria-disabled={!canCombine()}
              disabled={!canCombine()}
              onClick={() => handleCombine('subtract')}
              style={comboBtnStyle(!canCombine())}
            >
              <FormattedMessage {...messages.boolean_subtract} />
            </button>
            <button
              type="button"
              aria-disabled={!canCombine()}
              disabled={!canCombine()}
              onClick={() => handleCombine('intersect')}
              style={comboBtnStyle(!canCombine())}
            >
              <FormattedMessage {...messages.boolean_intersect} />
            </button>
            <button
              type="button"
              aria-disabled={!canCombine()}
              disabled={!canCombine()}
              onClick={() => handleCombine('exclude')}
              style={comboBtnStyle(!canCombine())}
            >
              <FormattedMessage {...messages.boolean_exclude} />
            </button>
          </div>
        )}

        {/* Progressive disclosure: show layers panel only if shapes exist */}
        {shapes.length > 0 && (
          <section aria-labelledby="layers-title">
            <div id="layers-title" style={{ fontWeight: 600, fontSize: 13 }}>
              <FormattedMessage {...messages.layers_heading} />
            </div>
            <ul
              id="layers-panel"
              role="list"
              aria-label="Liste des calques"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                maxHeight: 180,
                overflowY: 'auto',
                border: '1px solid #eee',
                padding: 6,
                borderRadius: 6,
                margin: 0,
                listStyle: 'none'
              }}
            >
              {shapes.map(s => {
                const isSel = selected.some(sel => sel.id === s.id);
                return (
                  <li
                    key={s.id}
                    role="listitem"
                    aria-selected={isSel}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        canvasRef.current?.selectShapes?.([s.id]);
                      }
                    }}
                    onClick={(e) => {
                      if (e.shiftKey) {
                        const alreadySelected = selected.map(sel => sel.id);
                        let nextIds = alreadySelected.includes(s.id)
                          ? alreadySelected.filter(id => id !== s.id)
                          : [...alreadySelected, s.id];
                        canvasRef.current?.selectShapes?.(nextIds);
                      } else {
                        canvasRef.current?.selectShapes?.([s.id]);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 6px',
                      border: '1px solid ' + (isSel ? 'var(--ui-kit-color-primary)' : 'var(--ui-kit-color-border)'),
                      background: isSel ? 'var(--ui-kit-color-primary-low)' : 'var(--ui-kit-color-surface)',
                      color: isSel ? 'var(--ui-kit-color-primary-fore)' : 'var(--ui-kit-color-typography-primary)',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
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
                    >
                      <input
                        id={`clr-${s.id}`}
                        aria-label={`Color of ${s.type}`}
                        type="color"
                        value={s.fillColor || '#ff0000'}
                        onChange={(e) => {
                          handleChangeLayerColor(s.id, e.target.value);
                          announce('Color changed');
                        }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          opacity: 0,
                          cursor: 'pointer'
                        }}
                      />
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: 'var(--ui-kit-color-typography-primary)'
                      }}
                    >
                      {s.type}
                    </span>

                    <div style={{ display: 'flex', gap: 2 }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); canvasRef.current?.moveLayer?.(s.id, 'up'); refreshShapes(false); announce('Layer moved up'); }}
                        title="Move up"
                        aria-label="Move layer up"
                        style={layerOrderBtnStyle}
                      >
                        <ArrowUp size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); canvasRef.current?.moveLayer?.(s.id, 'down'); refreshShapes(false); announce('Layer moved down'); }}
                        title="Move down"
                        aria-label="Move layer down"
                        style={layerOrderBtnStyle}
                      >
                        <ArrowDown size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          const rotateOnce = () => {
                            canvasRef.current?.rotateShape?.(s.id, 10);
                            refreshShapes(false);
                            announce(intl.formatMessage(messages.rotate_announce));
                          };
                          rotateOnce();
                          const intervalId = window.setInterval(rotateOnce, 120);
                          const stop = () => {
                            clearInterval(intervalId);
                            window.removeEventListener('mouseup', stop);
                            window.removeEventListener('touchend', stop);
                          };
                          window.addEventListener('mouseup', stop);
                          window.addEventListener('touchend', stop);
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          const rotateOnce = () => {
                            canvasRef.current?.rotateShape?.(s.id, 10);
                            refreshShapes(false);
                            announce(intl.formatMessage(messages.rotate_announce));
                          };
                          rotateOnce();
                          const intervalId = window.setInterval(rotateOnce, 120);
                          const stop = () => {
                            clearInterval(intervalId);
                            window.removeEventListener('touchend', stop);
                            window.removeEventListener('mouseup', stop);
                          };
                          window.addEventListener('touchend', stop);
                          window.addEventListener('mouseup', stop);
                        }}
                        title="Rotate right 10°"
                        aria-label="Rotate right 10 degrees"
                        style={layerOrderBtnStyle}
                      >
                        <RotateCw size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); canvasRef.current?.scaleShapes?.([s.id], 1.1); refreshShapes(false); announce('Scaled up'); }}
                        title="Scale up"
                        aria-label="Scale up 10 percent"
                        style={layerOrderBtnStyle}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); canvasRef.current?.scaleShapes?.([s.id], 0.9); refreshShapes(false); announce('Scaled down'); }}
                        title="Scale down"
                        aria-label="Scale down 10 percent"
                        style={layerOrderBtnStyle}
                      >
                        –
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        canvasRef.current?.deleteShape?.(s.id);
                        refreshShapes();
                        announce('Shape deleted');
                      }}
                      style={deleteBtnStyle}
                      title="Delete"
                      aria-label="Delete this shape"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* ...help section and live region remain always visible... */}
        <section
          aria-labelledby="help-shortcuts-heading"
          style={{
            marginTop: 16,
            border: '1px solid var(--ui-kit-color-border)',
            borderRadius: 6,
            background: 'var(--ui-kit-color-surface)',
            fontSize: 12,
            color: 'var(--ui-kit-color-typography-primary)',
            overflow: 'hidden',
            maxHeight: 220
          }}
        >
          <button
            type="button"
            id="help-shortcuts-button"
            onClick={() => setHelpOpen(o => !o)}
            aria-expanded={helpOpen}
            aria-controls="help-shortcuts-panel"
            style={{
              all: 'unset',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: '100%',
              cursor: 'pointer',
              padding: '8px 10px',
              fontWeight: 600,
              background: 'var(--ui-kit-color-surface)',
              color: 'var(--ui-kit-color-typography-primary)'
            }}
            title="Open help"
          >
            <span id="help-shortcuts-heading">
              <FormattedMessage {...messages.help_heading} />
            </span>
          </button>
          {helpOpen && (
            <div
              id="help-shortcuts-panel"
              role="region"
              aria-labelledby="help-shortcuts-heading"
              style={{
                padding: '8px 12px 28px',
                lineHeight: 1.4,
                maxHeight: 180,
                overflowY: 'auto',
                background: 'var(--ui-kit-color-surface)',
                color: 'var(--ui-kit-color-typography-primary)'
              }}
            >
              <div style={{ fontWeight: 600, margin: '4px 0 4px' }}>
                <FormattedMessage {...messages.help_how_title} />
              </div>
              <Text size="small" tone="tertiary" style={{ color: 'var(--ui-kit-color-typography-primary)' }}>
                Combo lets you create and edit vector shapes, combine your design to Canva.
              </Text>
              <br />
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
                <li><b>1–8</b>: Add palette shape</li>
                <li><b>Click / Shift+Click</b>: Select / multi-select</li>
                <li><b>/</b>: Scale +10% &nbsp;|&nbsp; <b>-</b>: Scale -10%</li>
                <li><b>[ / ]</b>: Move layer down / up</li>
                <li><b>Cmd/Ctrl+Z</b>: Undo</li>
              </ul>
              <div style={{ height: 12 }} />
            </div>
          )}
        </section>

        {/* Add to design button at the bottom */}
        <div style={{ marginTop: 24 }}>
          <Button
            alignment="center"
            ariaLabel="Add to design"
            variant="primary"
            stretch
            loading={pushing}
            disabled={shapes.length === 0 || pushing}
            onClick={handlePushToCanva}
          >
            Add to design
          </Button>
        </div>

        <div
          ref={liveRef}
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0 0 0 0)',
            border: 0
          }}
        />
      </div>
    </main>
  );
}

const shapeBtnStyle: React.CSSProperties = {
  aspectRatio: '1 / 1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid var(--ui-kit-color-border)',
  background: 'var(--ui-kit-color-surface)',
  borderRadius: 6,
  cursor: 'pointer',
  padding: 0
};

const comboBtnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: '8px 10px',
  fontSize: 12,
  border: '1px solid var(--ui-kit-color-border)',
  background: disabled ? 'var(--ui-kit-color-primary-disabled)' : 'var(--ui-kit-color-primary)',
  color: disabled ? 'var(--ui-kit-color-primary-fore-disabled)' : 'var(--ui-kit-color-primary-fore)',
  cursor: disabled ? 'default' : 'pointer',
  borderRadius: 6,
  boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
});

const iconBtnStyle = (disabled?: boolean): React.CSSProperties => ({
  height: 44,
  width: 44,
  borderRadius: 10,
  border: '1px solid var(--ui-kit-color-border)',
  background: 'var(--ui-kit-color-surface)',
  color: 'var(--ui-kit-color-typography-primary)',
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
  border: '1px solid var(--ui-kit-color-border)',
  background: 'var(--ui-kit-color-surface)',
  color: 'var(--ui-kit-color-typography-primary)',
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
  color: 'var(--ui-kit-color-critical)',
  cursor: 'pointer',
  fontSize: 14,
  lineHeight: 1,
  padding: 0,
  opacity: 1
};
