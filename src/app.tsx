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
import { Title, Text, Button, Accordion, AccordionItem, Swatch, ColorSelector } from '@canva/app-ui-kit';
import { FormattedMessage, useIntl } from 'react-intl';
import { messages } from './i18n/messages';
import { ReloadIcon, UndoIcon, EyeIcon, XIcon, InfoIcon } from "@canva/app-ui-kit";
import { Rows, Columns, Column } from "@canva/app-ui-kit";
import {
  Exclude,
  Intersect,
  Subtract,
  Unite
} from "@phosphor-icons/react";
import { RotateIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '@canva/app-ui-kit';
import { PlusIcon, MinusIcon } from '@canva/app-ui-kit';
import HelpPage from './HelpPage';
import '@canva/app-ui-kit/styles.css';

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

const formatTypeLabel = (type: string): string => {
  const found = SHAPES.find(shape => shape.key === type)?.label;
  if (found) return found;
  if (!type) return type;
  return type.charAt(0).toUpperCase() + type.slice(1); // e.g., "shape" -> "Shape"
};

export default function App() {
  const canvasRef = useRef<VectorCanvasRef | null>(null);
  const [shapes, setShapes] = useState<ShapeData[]>([]);
  const [selected, setSelected] = useState<ShapeData[]>([]);
  const [pushing, setPushing] = useState(false);
  const [history, setHistory] = useState<ShapeData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [handlesVisible, setHandlesVisible] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false); 
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [colorSelectorOpenId, setColorSelectorOpenId] = useState<string | null>(null);
  const liveRef = useRef<HTMLDivElement|null>(null);
  const intl = useIntl();

  // Track last pointer type (mouse/touch/pen) and control programmatic selection
  const lastPointerTypeRef = useRef<'mouse' | 'touch' | 'pen' | 'unknown'>('unknown');
  const programmaticSelectGuardRef = useRef(false);
  const prevSelectionRef = useRef<ShapeData[]>([]);
  const deviceIsProbablyTouchRef = useRef(false); // coarse pointer / touch-capable

  // Helper to decide if current interaction should behave like touch
  const isTouchLikeNow = () => {
    const pt = lastPointerTypeRef.current;
    if (pt === 'touch' || pt === 'pen') return true;
    return deviceIsProbablyTouchRef.current;
  };

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
    // If we just set selection programmatically, accept it and exit.
    if (programmaticSelectGuardRef.current) {
      programmaticSelectGuardRef.current = false;
      setSelected(sel);
      prevSelectionRef.current = sel;
      if (sel.length === 0) announce(intl.formatMessage(messages.selection_none));
      else if (sel.length === 1) announce(intl.formatMessage(messages.selection_one));
      else announce(intl.formatMessage(messages.selection_many, { count: sel.length }));
      return;
    }

    // Mobile-friendly additive selection on canvas:
    // If last input was touch-like, and we had 1 selected, and user tapped a different one,
    // combine them into a two-item selection.
    const touchLike = isTouchLikeNow();
    const prev = prevSelectionRef.current;
    if (touchLike &&
        prev.length === 1 &&
        sel.length === 1 &&
        prev[0].id !== sel[0].id) {
      const twoIds = [prev[0].id, sel[0].id];
      programmaticSelectGuardRef.current = true;
      canvasRef.current?.selectShapes?.(twoIds);
      // Wait for the next onSelectionChange (guarded) to update state/announce.
      return;
    }

    // Default: accept selection as-is.
    setSelected(sel);
    prevSelectionRef.current = sel;
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
        setPushing(false);
        return;
      }

      console.log('Normalized paths:', norm);
      console.log('Has compound paths:', norm.hasCompoundPaths);

      // STRATÉGIE: Si CompoundPath détecté → utiliser SVG minimal fait à la main
      if (norm.hasCompoundPaths) {
        console.log('Using minimal SVG for compound paths');
        
        // Construire un SVG minimal et propre
        const width = Math.max(1, Math.round(norm.viewBox.width));
        const height = Math.max(1, Math.round(norm.viewBox.height));
        
        // Récupérer la couleur de la première forme (ou noir par défaut)
        const firstColor = shapes[0]?.fillColor || '#000000';
        
        // Concaténer tous les chemins en un seul path avec fill-rule evenodd
        const pathData = norm.paths.map((p: any) => {
          let d = p.d.trim();
          // S'assurer que le chemin est fermé
          if (!d.match(/[zZ]\s*$/)) d += ' Z';
          return d;
        }).join(' ');
        
        // SVG minimal sans attributs superflus
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <path d="${pathData}" fill="${firstColor}" fill-rule="evenodd"/>
</svg>`;
        
        console.log('Generated SVG:', svg);
        
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const dataUrl = await fileToDataURL(blob);
        
        await addElementAtPoint({
          type: 'image',
          mimeType: 'image/svg+xml',
          dataUrl,
          top: 60,
          left: 60,
          width: width,
          height: height
        });
        
        console.log('SVG added successfully');
        setPushing(false);
        return;
      }

      // Pour les formes normales (sans trous), essayer le format vectoriel natif
      if (norm.paths.length <= 30) {
        console.log('Using native vector format');
        try {
          await addElementAtPoint({
            type: 'shape',
            top: 60,
            left: 60,
            width: norm.viewBox.width,
            height: norm.viewBox.height,
            viewBox: norm.viewBox,
            paths: norm.paths.map((p: any) => ({
              d: p.d,
              fill: p.fill
            }))
          });
          console.log('Native vector added successfully');
          setPushing(false);
          return;
        } catch (error) {
          console.warn('Native vector failed, will try SVG fallback:', error);
        }
      }

      // Fallback SVG pour beaucoup de chemins
      console.log('Using SVG fallback (too many paths)');
      const svg = canvasRef.current?.exportSVG?.();
      if (!svg) {
        console.error('Failed to export SVG');
        setPushing(false);
        return;
      }
      
      let cleaned = svg
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
      
      console.log('SVG fallback added successfully');
    } catch (e) {
      console.error('Canva insertion failed:', e);
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

  function handleLayerButtonClick(
    e: React.MouseEvent,
    id: string
  ) {
    const isTouchLike = isTouchLikeNow();
    const multi = e.shiftKey || e.metaKey || e.ctrlKey || (isTouchLike && selected.length >= 1);
    const currentIds = selected.map((s) => s.id);

    if (!multi) {
      // single click: single selection
      canvasRef.current?.selectShapes?.([id]);
      return;
    }

    // click with Shift/Cmd/Ctrl: build a selection of up to 2
    if (currentIds.includes(id)) {
      // already selected: no change
      canvasRef.current?.selectShapes?.(currentIds);
      return;
    }

    let nextIds: string[] = [];
    if (currentIds.length === 0) {
      nextIds = [id];
    } else if (currentIds.length === 1) {
      nextIds = [currentIds[0], id];
    } else {
      // keep the most recent + the new one (max 2)
      nextIds = [currentIds[currentIds.length - 1], id];
    }

    canvasRef.current?.selectShapes?.(nextIds);
  }

  // Detect last pointer type globally (works for canvas taps too)
  useEffect(() => {
    const onPD = (ev: PointerEvent) => {
      const pt = ev.pointerType as 'mouse' | 'touch' | 'pen' | string;
      if (pt === 'mouse' || pt === 'touch' || pt === 'pen') {
        lastPointerTypeRef.current = pt;
      } else {
        lastPointerTypeRef.current = 'unknown';
      }
    };
    window.addEventListener('pointerdown', onPD, { passive: true });
    return () => window.removeEventListener('pointerdown', onPD);
  }, []);

  // Fallback detection for touch-capable/coarse pointers (covers environments where pointerType is unreliable)
  useEffect(() => {
    const updateCoarse = () => {
      try {
        const mql = window.matchMedia?.('(pointer: coarse)');
        const coarse = !!mql?.matches;
        const hasTouch = (navigator as any)?.maxTouchPoints > 0;
        deviceIsProbablyTouchRef.current = coarse || hasTouch;
      } catch {
        deviceIsProbablyTouchRef.current = (navigator as any)?.maxTouchPoints > 0;
      }
    };
    updateCoarse();
    // Optional: listen for changes (e.g., hybrid devices)
    const mql = window.matchMedia?.('(pointer: coarse)');
    const handler = () => updateCoarse();
    if (mql && 'addEventListener' in mql) mql.addEventListener('change', handler);
    return () => {
      if (mql && 'removeEventListener' in mql) mql.removeEventListener('change', handler);
    };
  }, []);

  useEffect(() => {
    refreshShapes();
    
  }, []);

  useEffect(() => {
    // When coming back from Help, repopulate the canvas if it’s empty.
    if (!showHelpPanel && canvasRef.current) {
      const current = canvasRef.current.getShapesList?.() || [];
      // Prefer the latest history snapshot, fallback to current shapes state
      const target = (history[historyIndex] && history[historyIndex].length > 0)
        ? history[historyIndex]
        : shapes;

      if (current.length === 0 && target.length > 0) {
        canvasRef.current.clearCanvas?.();
        target.forEach(s => {
          canvasRef.current?.addShape?.(s.type, s.fillColor || '#ff0000', 150);
        });
        refreshShapes(false); // update lists without pushing a new history entry
      }
    }
  }, [showHelpPanel, history, historyIndex, shapes]);

  return (
    showHelpPanel ? (
      <HelpPage onBack={() => setShowHelpPanel(false)} />
    ) : (
      <main
        role="main"
        aria-label="Vector editor"
        style={{
          width: '100%',
          // Let the document handle height so the page can scroll
          margin: 0,
          padding: 12,
          fontFamily: 'sans-serif',
          boxSizing: 'border-box',
          // Remove isolated scroll; enable full-page scrolling
          overflowX: 'hidden'
        }}
      >
        <div
          style={{
            maxWidth: 360,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            paddingBottom: 16,
            // overflowY: 'auto', // You can remove this line here
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            paddingRight: 4
          }}
        >
          {/* Tight group: toolbar + canvas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                margin: 0 // remove extra spacing
              }}
            >
              <Text
                variant="bold"
                style={{
                  fontSize: 15,
                  margin: 0, // ensure no default margin
                  color: 'var(--ui-kit-color-typography-primary)'
                }}
              >
                Preview
              </Text>
              <div style={{ display: 'flex', gap: 6 }}>
                <Button
                  ariaLabel="Clear all shapes"
                  tooltipLabel="Clear"
                  variant="tertiary"
                  size="small"
                  icon={ReloadIcon}
                  onClick={handleClear}
                />
                <Button
                  ariaLabel="Undo"
                  tooltipLabel="Undo"
                  variant="tertiary"
                  size="small"
                  icon={UndoIcon}
                  disabled={historyIndex <= 0}
                  onClick={handleUndo}
                />
                <Button
                  ariaLabel={handlesVisible ? 'Hide Bezier handles' : 'Show Bezier handles'}
                  tooltipLabel={handlesVisible ? 'Hide handles' : 'Show handles'}
                  variant="tertiary"
                  size="small"
                  icon={handlesVisible ? XIcon : EyeIcon}
                  onClick={toggleHandles}
                />
              </div>
            </div>

            <div
              style={{
                position: 'relative',
                border: '1px solid var(--ui-kit-color-action-secondary-border)',
                background: 'var(--ui-kit-color-action-secondary-bg)',
                borderRadius: 6,
                padding: 6,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                margin: 0, // rely on wrapper gap
                width: '100%',
                height: 240,
                boxSizing: 'border-box'
              }}
            >
              <VectorCanvas
                ref={canvasRef}
                width={320}
                height={240}
                style={{ width: 320, height: 240, display: 'block' }}
                onShapesChange={() => refreshShapes()}
                onSelectionChange={handleSelectionChange}
                aria-label="Vector drawing area"
              />
              {shapes.length === 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                  }}
                >
                  <Text size="small" tone="tertiary" style={{ textAlign: 'center' }}>
                    <FormattedMessage {...messages.empty_canvas_hint} />
                  </Text>
                </div>
              )}
            </div>
          </div>
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
                  transition: 'background .15s, border-color .15s, color .15s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--ui-kit-color-action-secondary-bg-hover)'; // ✅
                  e.currentTarget.style.borderColor = 'var(--ui-kit-color-action-secondary-border-hover)'; // ✅
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--ui-kit-color-action-secondary-bg)'; // ✅
                  e.currentTarget.style.borderColor = 'var(--ui-kit-color-action-secondary-border)'; // ✅
                }}
              >
                <s.Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              </button>
            ))}
          </div>
          {shapes.length > 0 && (
            <>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  marginBottom: 4,
                  marginTop: 12
                }}
              >
                Actions
              </div>
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
                <Button
                  alignment="center"
                  ariaLabel={intl.formatMessage(messages.boolean_union)}
                  variant="secondary"
                  stretch
                  icon={() => <Unite size={18} />}
                  disabled={!canCombine()}
                  onClick={() => handleCombine('union')}
                  style={{ fontSize: 13 }}
                >
                  <FormattedMessage {...messages.boolean_union} />
                </Button>
                <Button
                  alignment="center"
                  ariaLabel={intl.formatMessage(messages.boolean_subtract)}
                  variant="secondary"
                  stretch
                  icon={() => <Subtract size={18} />}
                  disabled={!canCombine()}
                  onClick={() => handleCombine('subtract')}
                  style={{ fontSize: 13 }}
                >
                  <FormattedMessage {...messages.boolean_subtract} />
                </Button>
                <Button
                  alignment="center"
                  ariaLabel={intl.formatMessage(messages.boolean_intersect)}
                  variant="secondary"
                  stretch
                  icon={() => <Intersect size={18} />}
                  disabled={!canCombine()}
                  onClick={() => handleCombine('intersect')}
                  style={{ fontSize: 13 }}
                >
                  <FormattedMessage {...messages.boolean_intersect} />
                </Button>
                <Button
                  alignment="center"
                  ariaLabel={intl.formatMessage(messages.boolean_exclude)}
                  variant="secondary"
                  stretch
                  icon={() => <Exclude size={18} />}
                  disabled={!canCombine()}
                  onClick={() => handleCombine('exclude')}
                  style={{ fontSize: 13 }}
                >
                  <FormattedMessage {...messages.boolean_exclude} />
                </Button>
              </div>
              <Text
                size="small"
                tone="tertiary"
                style={{
                  marginTop: 6,
                  marginBottom: 8,
                  color: 'var(--ui-kit-color-typography-tertiary)',
                  textAlign: 'center'
                }}
              >
                Select two shapes to apply an action
              </Text>
            </>
          )}
          {/* Layers panel inside Accordion */}
          {shapes.length > 0 && (
            <Accordion>
              <AccordionItem
                title={intl.formatMessage(messages.layers_heading)}
                isOpen={layersOpen}
                onToggle={() => setLayersOpen(open => !open)}
              >
                <div
                  id="layers-panel"
                  role="list"
                  aria-label="Layer list"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    border: '1px solid var(--ui-kit-color-action-secondary-border)', // ✅
                    padding: 6,
                    borderRadius: 6,
                    margin: 0
                  }}
                >
                  {shapes.map(s => {
                    const isSel = selected.some(sel => sel.id === s.id);
                    const ShapeIcon = SHAPES.find(shape => shape.key === s.type)?.Icon;

                    return (
                      <div key={s.id} style={{ width: '100%' }}>
                        <Button
                          alignment="center"
                          variant="secondary"
                          stretch
                          ariaLabel={`Select ${formatTypeLabel(s.type)}`}
                          selected={isSel}
                          icon={ShapeIcon ? () => (
                            <ShapeIcon
                              size={18}
                              strokeWidth={1.8}
                              aria-hidden="true"
                              style={{
                                color: isSel
                                  ? 'var(--ui-kit-color-primary)'
                                  : 'var(--ui-kit-color-typography-primary)'
                              }}
                            />
                          ) : undefined}
                          onClick={(e) => handleLayerButtonClick(e, s.id)}
                          style={{
                            fontWeight: 500,
                            fontSize: 13,
                            marginBottom: 2
                          }}
                        >
                          {formatTypeLabel(s.type)}
                        </Button>
                        {isSel && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0 10px 0', paddingLeft: 4 }}>
                            <ColorSelector
                              color={s.fillColor || '#ff0000'}
                              onChange={color => handleChangeLayerColor(s.id, color)}
                              triggerMode="swatch"
                              size="small"
                            />
                            {/* Layer controls as small tertiary icon buttons (with tooltips) */}
                            <Button
                              ariaLabel={intl.formatMessage(messages.tool_move_up)}
                              tooltipLabel={intl.formatMessage(messages.tool_move_up)}
                              icon={ArrowUpIcon}
                              size="small"
                              type="button"
                              variant="tertiary"
                              onClick={() => {
                                canvasRef.current?.moveLayer?.(s.id, 'up');
                                refreshShapes(false);
                                announce('Layer moved up');
                              }}
                            />
                            <Button
                              ariaLabel={intl.formatMessage(messages.tool_move_down)}
                              tooltipLabel={intl.formatMessage(messages.tool_move_down)}
                              icon={ArrowDownIcon}
                              size="small"
                              type="button"
                              variant="tertiary"
                              onClick={() => {
                                canvasRef.current?.moveLayer?.(s.id, 'down');
                                refreshShapes(false);
                                announce('Layer moved down');
                              }}
                            />
                            <Button
                              ariaLabel={intl.formatMessage(messages.tool_rotate)}
                              tooltipLabel={intl.formatMessage(messages.tool_rotate)}
                              icon={RotateIcon}
                              size="small"
                              type="button"
                              variant="tertiary"
                              onClick={() => {
                                canvasRef.current?.rotateShape?.(s.id, 10);
                                refreshShapes(false);
                                announce(intl.formatMessage(messages.rotate_announce));
                              }}
                            />
                            <Button
                              ariaLabel={intl.formatMessage(messages.tool_scale_up)}
                              tooltipLabel={intl.formatMessage(messages.tool_scale_up)}
                              icon={PlusIcon}
                              size="small"
                              type="button"
                              variant="tertiary"
                              onClick={() => {
                                canvasRef.current?.scaleShapes?.([s.id], 1.1);
                                refreshShapes(false);
                                announce('Scaled up');
                              }}
                            />
                            <Button
                              ariaLabel={intl.formatMessage(messages.tool_scale_down)}
                              tooltipLabel={intl.formatMessage(messages.tool_scale_down)}
                              icon={MinusIcon}
                              size="small"
                              type="button"
                              variant="tertiary"
                              onClick={() => {
                                canvasRef.current?.scaleShapes?.([s.id], 0.9);
                                refreshShapes(false);
                                announce('Scaled down');
                              }}
                            />
                            <Button
                              ariaLabel={intl.formatMessage(messages.tool_delete)}
                              tooltipLabel={intl.formatMessage(messages.tool_delete)}
                              icon={TrashIcon}
                              size="small"
                              type="button"
                              variant="tertiary"
                              onClick={() => {
                                canvasRef.current?.deleteShape?.(s.id);
                                refreshShapes();
                                announce('Shape deleted');
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </AccordionItem>
            </Accordion>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
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
            <Button
              alignment="center"
              ariaLabel="Help"
              variant="secondary"
              stretch
              icon={InfoIcon}
              onClick={() => setShowHelpPanel(true)}
            >
              Help
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
    )
  );
}

const shapeBtnStyle: React.CSSProperties = {
  aspectRatio: '1 / 1',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid var(--ui-kit-color-action-secondary-border)', // ✅
  background: 'var(--ui-kit-color-action-secondary-bg)', // ✅
  color: 'var(--ui-kit-color-action-secondary-fg)', // ✅
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
