import React, { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import paper from "paper";

export type ShapeData = {
  id: string;
  type: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  size: number;
  paperItem?: any;
};

export interface VectorCanvasRef {
  addShape: (type: string, color: string, size: number, strokeColor?: string, x?: number, y?: number) => string;
  getShapesList: () => ShapeData[];
  clearCanvas?: () => void;
  deleteShape?: (id: string) => void;
  setHandlesVisibility?: (visible: boolean) => void;
  moveLayer?: (shapeId: string, dir: "up" | "down") => void;
  exportSVG?: () => string;
  changeShapeColor?: (id: string, color: string) => void;
  changeShapeProperty?: (id: string, prop: string, value: any) => void;
  undo?: () => boolean;
  selectShapes?: (ids: string[]) => void;
  toggleSelectShape?: (id: string) => void;
  getSelectedIds?: () => string[];
  getSelectedShapes?: () => ShapeData[];
  combineShapes?: (idA: string, idB: string, op: 'union' | 'subtract' | 'exclude' | 'intersect') => void;
  scaleShapes?: (ids: string[], factor: number) => void;
  getNormalizedShapePaths?: () => {
    viewBox: { top: number; left: number; width: number; height: number };
    paths: { d: string; fill: { color: string } }[];
    hasCompoundPaths?: boolean; // Indicateur pour forcer l'export SVG
  };
  rotateShape?: (id: string, angle: number) => void;
}

type Props = {
  width?: number;
  height?: number;
  onShapesChange?: () => void;
  onSelectionChange?: (shapes: ShapeData[]) => void;
  style?: React.CSSProperties;
};

const generateId = () => Math.random().toString(36).slice(2, 10);

function findMainLayer() {
  if (!paper.project) return null;
  return paper.project.layers.find((l: any) => l.name === "main");
}
function findHandlesLayer() {
  if (!paper.project) return null;
  return paper.project.layers.find((l: any) => l.name === "handles");
}

function regenerateAllHandles() {
  const main = findMainLayer();
  const handles = findHandlesLayer();
  if (!main || !handles) return;
  handles.removeChildren();
  main.children.forEach((c: any) => {
    if (c.data?.id) {
      createHandlesForItem(c, handles, "#007bff");
    }
  });
  handles.bringToFront();
  paper.view.update();
}

const VectorCanvas = forwardRef<VectorCanvasRef, Props>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const toolRef = useRef<any>(null);
  const selectedIdsRef = useRef<Set<string>>(new Set());
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const actionOpenRef = useRef(false);
  const preActionIndexRef = useRef<number | null>(null);
  const [handlesVisible, setHandlesVisibleState] = React.useState(true);

  // ---------- Helpers ----------
  function getShapesList(): ShapeData[] {
    const mainLayer = findMainLayer();
    if (!mainLayer) return [];
    return mainLayer.children
      .filter((c: any) => c.data?.id)
      .slice()
      .reverse()
      .map((c: any) => ({
        id: c.data.id,
        type: c.data.type,
        size: c.data.size,
        fillColor: c.data.fillColor || (c.fillColor ? c.fillColor.toCSS?.(true) : undefined),
        strokeColor: c.strokeColor ? c.strokeColor.toCSS?.(true) : undefined,
        strokeWidth: c.strokeWidth
      }));
  }
  function getSelectedIds(): string[] {
    return Array.from(selectedIdsRef.current);
  }
  function getSelectedShapes(): ShapeData[] {
    const all = getShapesList();
    return all.filter(s => selectedIdsRef.current.has(s.id));
  }
  function emitSelectionChange() {
    props.onSelectionChange?.(getSelectedShapes());
  }
  function selectShapes(ids: string[]) {
    selectedIdsRef.current = new Set(ids);
    emitSelectionChange();
    paper.view.update();
  }
  function toggleSelectShape(id: string) {
    if (selectedIdsRef.current.has(id)) selectedIdsRef.current.delete(id);
    else selectedIdsRef.current.add(id);
    emitSelectionChange();
    paper.view.update();
  }
  function selectOnly(item: any) {
    if (!item?.data?.id) return;
    selectedIdsRef.current = new Set([item.data.id]);
    emitSelectionChange();
  }
  function findShapeById(id: string) {
    const main = findMainLayer();
    if (!main) return null;
    return main.children.find((c: any) => c.data?.id === id) || null;
  }

  // ---------- History / Undo ----------
  function safeSnapshot(): string | null {
    if (!paper.project) return null;
    try {
      const handles = findHandlesLayer();
      const vis = handles?.visible;
      if (handles) handles.visible = false;
      const json = paper.project.exportJSON({ asString: true });
      if (handles) handles.visible = vis;
      return json;
    } catch {
      return null;
    }
  }

  function pushHistoryFromCurrentProject(force = false) {
    const snap = safeSnapshot();
    if (!snap) return;
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }
    const last = historyRef.current[historyRef.current.length - 1];
    if (!force && last === snap) return;
    historyRef.current.push(snap);
    if (historyRef.current.length > 100) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
  }

  function startUserAction() {
    if (actionOpenRef.current) return;
    actionOpenRef.current = true;
    pushHistoryFromCurrentProject(true);
    preActionIndexRef.current = historyIndexRef.current;
  }

  function endUserAction(changed: boolean) {
    if (!actionOpenRef.current) return;
    if (changed) {
      pushHistoryFromCurrentProject(false);
    } else {
      if (preActionIndexRef.current !== null) {
        const idx = preActionIndexRef.current;
        if (idx >= 0 && idx < historyRef.current.length) {
          historyRef.current.splice(idx, 1);
          historyIndexRef.current = Math.min(idx - 1, historyRef.current.length - 1);
        }
      }
    }
    actionOpenRef.current = false;
    preActionIndexRef.current = null;
  }

  function restoreSnapshot(json: string) {
    if (!paper.project) return;
    paper.project.clear();
    paper.project.importJSON(json);
    let main = findMainLayer();
    if (!main) {
      main = new paper.Layer();
      main.name = "main";
    }
    let handles = findHandlesLayer();
    if (!handles) {
      handles = new paper.Layer();
      handles.name = "handles";
    }
    regenerateAllHandles();
    emitSelectionChange();
    paper.view.update();
  }

  function undo(): boolean {
    if (actionOpenRef.current) {
      endUserAction(false);
    }
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      restoreSnapshot(historyRef.current[historyIndexRef.current]);
      return true;
    }
    return false;
  }

  // ---------- Shape ops ----------

  function addShape(type: string, color: string, size: number, strokeColor?: string, x?: number, y?: number): string {
    startUserAction();
    if (!canvasRef.current) return "";
    if (!paper.project) {
      try {
        paper.setup(canvasRef.current);
      } catch {
        return "";
      }
    }
    const mainLayer = findMainLayer();
    const handlesLayer = findHandlesLayer();
    if (!mainLayer || !handlesLayer) return "";

    const id = generateId();
    const s = size;
    const center = new paper.Point(
      typeof x === "number" ? x : paper.view.center.x,
      typeof y === "number" ? y : paper.view.center.y
    );

    let item: any;
    switch (type) {
      case "circle":
        item = new paper.Path.Circle(center, s / 2);
        break;
      case "square":
        item = new paper.Path.Rectangle({ point: [center.x - s / 2, center.y - s / 2], size: [s, s] });
        break;
      case "triangle":
        item = new paper.Path.RegularPolygon(center, 3, s / Math.sqrt(3));
        break;
      case "diamond":
        item = new paper.Path.RegularPolygon(center, 4, s / 2);
        item.rotate(45);
        break;
      case "pentagon":
        item = new paper.Path.RegularPolygon(center, 5, s / 2);
        break;
      case "hexagon":
        item = new paper.Path.RegularPolygon(center, 6, s / 2);
        break;
      case "heart": {
        const w = s * 0.55; 
        const h = s * 0.55; 
        const p = new paper.Path();

        for (let t = 0; t < Math.PI * 2; t += (Math.PI * 2) / 100) {
          const x = w * 16 * Math.pow(Math.sin(t), 3) / 16;
          const y = -h * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16;
          p.add(new paper.Point(x, y));
        }
        p.closed = true;
        p.smooth();
        p.position = center;
        item = p;
        break;
      }
      case "star": {
        const outer = s / 2;
        const inner = outer * 0.5;
        item = new paper.Path.Star(center, 5, inner, outer);
        break;
      }
      default:
        item = new paper.Path.Rectangle({ point: [center.x - s / 2, center.y - s / 2], size: [s, s] });
    }

    item.fillColor = new paper.Color(color);
    item.strokeColor = strokeColor ? new paper.Color(strokeColor) : null;

    item.data = { id, type, size: s, fillColor: color };

    mainLayer.addChild(item);
    createHandlesForPath(item, handlesLayer, "#007bff");
    handlesLayer.bringToFront();
    paper.view.update();
    props.onShapesChange?.();
    endUserAction(true);
    return id;
  }

  function deleteShape(id: string) {
    startUserAction();
    const main = findMainLayer();
    if (!main) return;
    const it = main.children.find((c: any) => c.data?.id === id);
    if (!it) return;
    removeHandlesForPath(id);
    it.remove();
    selectedIdsRef.current.delete(id);
    emitSelectionChange();
    purgeOrphanHandles();
    props.onShapesChange?.();
    endUserAction(true);
  }

  function clearCanvas() {
    startUserAction();
    const main = findMainLayer();
    const handles = findHandlesLayer();
    main?.removeChildren();
    handles?.removeChildren();
    selectedIdsRef.current.clear();
    emitSelectionChange();
    props.onShapesChange?.();
    endUserAction(true);
  }

  function setHandlesVisibility(visible: boolean) {
    setHandlesVisibleState(visible);
    const handles = findHandlesLayer();
    if (!handles) return;
    handles.visible = visible;
    if (visible && handles.children.length === 0) regenerateAllHandles();
    paper.view.update();
  }

  function moveLayer(shapeId: string, dir: "up" | "down") {
    startUserAction();
    const main = findMainLayer();
    if (!main) return;
    const idx = main.children.findIndex((c: any) => c.data?.id === shapeId);
    if (idx < 0) return;
    const ch = main.children[idx];
    if (dir === "up" && idx < main.children.length - 1) main.insertChild(idx + 1, ch);
    if (dir === "down" && idx > 0) main.insertChild(idx - 1, ch);
    paper.view.update();
    endUserAction(true);
  }

  function changeShapeColor(id: string, color: string) {
    startUserAction();
    const main = findMainLayer();
    if (!main) return;
    const it: any = main.children.find((c: any) => c.data?.id === id);
    if (!it) return;
    try {
      it.fillColor = new paper.Color(color);
      it.data.fillColor = color;
      regenerateAllHandles();
      paper.view.update();
      props.onShapesChange?.();
      endUserAction(true);
    } catch {}
  }

  function changeShapeProperty(id: string, prop: string, value: any) {
    startUserAction();
    const main = findMainLayer();
    if (!main) return;
    const it: any = main.children.find((c: any) => c.data?.id === id);
    if (!it) return;
    (it as any)[prop] = value;
    paper.view.update();
    endUserAction(true);
  }

  function exportSVG() {
    try {
      const handles = findHandlesLayer();
      const vis = handles?.visible;
      if (handles) handles.visible = false;
      const svg = paper.project.exportSVG({ asString: true });
      if (handles) handles.visible = vis;
      return svg;
    } catch {
      return "";
    }
  }

  function scaleShapes(ids: string[], factor: number) {
    startUserAction();
    const main = findMainLayer();
    if (!main) return;
    ids.forEach(id => {
      const it = main.children.find((c: any) => c.data?.id === id);
      it && it.scale(factor);
    });
    regenerateAllHandles();
    props.onShapesChange?.();
    paper.view.update();
    endUserAction(true);
  }

  function genId() {
    return 'shp_' + Math.random().toString(36).slice(2, 9);
  }


  function cloneChildPath(child: any, fillColor: string, id: string) {
    const np = new paper.Path();
    for (let si = 0; si < child.segments.length; si++) {
      const s = child.segments[si];
      np.add(new paper.Segment(
        s.point.clone(),
        s.handleIn ? s.handleIn.clone() : null,
        s.handleOut ? s.handleOut.clone() : null
      ));
    }
    np.closed = !!child.closed;
    try { np.fillColor = new paper.Color(fillColor); } catch {}
    try { if (child.strokeColor) np.strokeColor = child.strokeColor.clone(); } catch {}
    if (child.strokeWidth != null) np.strokeWidth = child.strokeWidth;
    np.data = {
      id,
      type: 'shape',
      fillColor,
      size: Math.max(np.bounds.width, np.bounds.height)
    };
    return np;
  }

  function isHole(child: any, siblings: any[]) {
    const center = child.bounds.center;
    return siblings.some(s => s !== child && s.contains(center));
  }

  function combineShapes(idA: string, idB: string, op: 'union' | 'subtract' | 'intersect' | 'exclude') {
    startUserAction();
    const a = findShapeById(idA);
    const b = findShapeById(idB);
    if (!a || !b) { endUserAction(false); return; }

    // CRITIQUE: Pour subtract, toujours faire "grand - petit"
    let A = a, B = b;
    if (op === 'subtract') {
      try {
        const getArea = (item: any) => {
          try {
            return Math.abs(item.area ?? (item.bounds?.width * item.bounds?.height) ?? 0);
          } catch { return 0; }
        };
        
        const areaA = getArea(a);
        const areaB = getArea(b);
        
        // Détecter l'inclusion totale
        const boundsAContainsB = a.bounds?.contains?.(b.bounds);
        const boundsBContainsA = b.bounds?.contains?.(a.bounds);
        
        if (boundsAContainsB && !boundsBContainsA) {
          A = a; B = b; // A contient B → A - B
        } else if (boundsBContainsA && !boundsAContainsB) {
          A = b; B = a; // B contient A → B - A
        } else if (areaA > areaB) {
          A = a; B = b; // Fallback: soustraire le plus petit du plus grand
        } else {
          A = b; B = a;
        }
      } catch (e) {
        console.error('Error in subtract reordering:', e);
      }
    }

    let result: any;
    try {
      switch (op) {
        case 'union':     result = A.unite(B); break;
        case 'subtract':  result = A.subtract(B); break;
        case 'intersect': result = A.intersect(B); break;
        case 'exclude':   result = A.exclude(B); break;
      }
    } catch {
      endUserAction(false);
      return;
    }
    if (!result) { endUserAction(false); return; }

    const fillColor = A.data?.fillColor || B.data?.fillColor || '#ff0000';

    const main = findMainLayer();
    const handlesLayer = findHandlesLayer();
    if (!main || !handlesLayer) { endUserAction(false); return; }

    if (A.data?.id) removeHandlesForPath(A.data.id);
    if (B.data?.id) removeHandlesForPath(B.data.id);

    try { A.remove(); } catch {}
    try { B.remove(); } catch {}

    const createdIds: string[] = [];
    const baseId = 'cmb_' + Math.random().toString(36).slice(2, 9);

    if (result instanceof paper.Path) {
      try { result.fillColor = new paper.Color(fillColor); } catch {}
      result.data = {
        id: baseId,
        type: 'shape',
        fillColor,
        size: Math.max(result.bounds.width, result.bounds.height)
      };
      main.addChild(result);
      createdIds.push(baseId);
    } else if (result instanceof paper.CompoundPath) {
      // TOUJOURS garder le CompoundPath pour subtract (préserve le trou dans l'éditeur)
      if (op === 'subtract') {
        result.fillColor = new paper.Color(fillColor);
        result.data = { 
          id: baseId, 
          type: 'shape', 
          fillColor, 
          size: Math.max(result.bounds.width, result.bounds.height),
          isCompound: true // Marqueur pour l'export
        };
        main.addChild(result);
        createdIds.push(baseId);
      } else {
        const children = result.children.slice();
        let visibleIdx = 0;
        children.forEach((child: any) => {
          if (!child.segments) return;
          if (op !== 'exclude' && isHole(child, children)) return;
          const childId = baseId + '_p' + visibleIdx++;
          const np = cloneChildPath(child, fillColor, childId);
          main.addChild(np);
          createdIds.push(childId);
        });
        try { result.remove(); } catch {}
      }
    } else if (result.children && result.children.length) {
      let idx = 0;
      result.children.forEach((ch: any) => {
        if (ch.segments) {
          const childId = baseId + '_g' + idx++;
          const np = cloneChildPath(ch, fillColor, childId);
          main.addChild(np);
          createdIds.push(childId);
        }
      });
      try { result.remove(); } catch {}
    } else {
      endUserAction(false);
      return;
    }

    if (!createdIds.length) {
      purgeOrphanHandles();
      paper.view.update();
      endUserAction(false);
      return;
    }

    regenerateAllHandles();
    purgeOrphanHandles();
    handlesLayer.bringToFront();

    selectShapes(createdIds);

    paper.view.update();
    props.onShapesChange?.();
    endUserAction(true);
  }

  function getNormalizedShapePaths() {
    const main = findMainLayer();
    if (!main) return { viewBox: { top: 0, left: 0, width: 0, height: 0 }, paths: [] as any[], hasCompoundPaths: false };

    const shapeItems: any[] = [];
    main.children.forEach((c: any) => { if (c.data?.id) shapeItems.push(c); });
    if (!shapeItems.length) {
      return { viewBox: { top: 0, left: 0, width: 0, height: 0 }, paths: [], hasCompoundPaths: false };
    }

    // Détecter si on a des CompoundPath (nécessite export SVG)
    const hasCompoundPaths = shapeItems.some(it => it.data?.isCompound === true);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    shapeItems.forEach(it => {
      const b = it.bounds;
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    });
    const width = maxX - minX || 1;
    const height = maxY - minY || 1;

    const paths: { d: string; fill: { color: string } }[] = [];

    function pushPath(node: SVGPathElement | null, color: string) {
      if (!node) return;
      let d = (node.getAttribute('d') || '').trim();
      if (!d) return;
      if (!/[zZ]$/.test(d)) d += ' Z';
      paths.push({ d, fill: { color } });
    }

    function exportSinglePath(p: any, color: string) {
      const clone = p.clone();
      clone.translate(new paper.Point(-minX, -minY));
      const node = clone.exportSVG({ asString: false }) as SVGPathElement;
      pushPath(node, color);
      clone.remove();
    }

    function exportItem(it: any) {
      const color = it.data?.fillColor || (it.fillColor ? it.fillColor.toCSS?.(true) : '#000000') || '#000000';

      if (it instanceof paper.CompoundPath) {
        const children = it.children.slice();
        children.forEach(child => {
          if (!child.segments) return;
          exportSinglePath(child, color);
        });
      } else if (it instanceof paper.Path) {
        exportSinglePath(it, color);
      } else if (it instanceof paper.Group) {
        it.children.forEach((ch: any) => exportItem(ch));
      }
    }

    for (const it of shapeItems) {
      exportItem(it);
      if (paths.length >= 120) break;
    }

    return { viewBox: { top: 0, left: 0, width, height }, paths, hasCompoundPaths };
  }

  // ---------- Init ----------
  useEffect(() => {
    if (!canvasRef.current) return;
    paper.setup(canvasRef.current);

    let main = findMainLayer();
    if (!main) {
      main = new paper.Layer();
      main.name = "main";
    }
    let handles = findHandlesLayer();
    if (!handles) {
      handles = new paper.Layer();
      handles.name = "handles";
    }
    main.activate();
    handles.bringToFront();
    regenerateAllHandles();
    if (historyRef.current.length === 0) {
      pushHistoryFromCurrentProject(); // snapshot initial
    }

    return () => {
      try {
        paper.project && paper.project.clear();
      } catch {}
    };
  }, []);

  useEffect(() => {
    if (!paper.view) return;
    const w = props.width || 300;
    const h = props.height || 240;
    if (canvasRef.current) {
      canvasRef.current.width = w;
      canvasRef.current.height = h;
    }
    paper.view.viewSize = new paper.Size(w, h);
    paper.view.update();
  }, [props.width, props.height]);

  // ---------- Drag & Bezier editing ----------
  useEffect(() => {
    if (!canvasRef.current || !paper.project) return;

    const tool = new paper.Tool();
    let isDragging = false;
    let draggedHandle: any = null;
    let draggedHandleType: string | null = null;
    let originalPath: any = null;
    let originalChildIdx: number | undefined = undefined;
    let originalSegIdx = -1;
    let draggedItemIds = new Set<string>();
    let initialDownPoint: any = null;
    let altPrimed = false;
    let somethingChanged = false;

    tool.onMouseDown = (event: any) => {
      const handlesLayer = findHandlesLayer();
      const hitHandle = handlesVisible ? handlesLayer?.hitTest?.(event.point, { fill: true, tolerance: 8 }) : null;

      // Si on clique sur une poignée de Bézier
      if (hitHandle?.item?.data) {
        draggedHandle = hitHandle.item;
        draggedHandleType = draggedHandle.data.type;
        const pathId = draggedHandle.data.pathId;
        originalSegIdx = draggedHandle.data.segIdx;
        originalChildIdx = draggedHandle.data.childIdx;

        originalPath = findMainLayer()?.children.find((c: any) => c.data?.id === pathId);

        // Obtenir le segment correct pour Path simple OU CompoundPath
        let target: any = null;
        if (originalPath?.segments) {
          target = originalPath;
        } else if (typeof originalChildIdx === 'number' && originalPath?.children?.[originalChildIdx]) {
          target = originalPath.children[originalChildIdx];
        }

        if (target && target.segments && target.segments[originalSegIdx]) {
          if (draggedHandleType === 'point' && event.modifiers.alt) {
            const seg = target.segments[originalSegIdx];
            if ((seg.handleIn?.isZero?.() || (seg.handleIn.x === 0 && seg.handleIn.y === 0)) &&
                (seg.handleOut?.isZero?.() || (seg.handleOut.x === 0 && seg.handleOut.y === 0))) {
              altPrimed = true;
            }
          }
          initialDownPoint = event.point.clone();
          isDragging = true;
          somethingChanged = false;
        }
        return; // Important : ne pas continuer si on a cliqué sur une poignée
      }

      // Sinon, on clique sur une forme
      const hitLayer = findMainLayer();
      const hitResult = hitLayer?.hitTest?.(event.point, {
        fill: true,
        stroke: true,
        tolerance: 8
      });
      const hit = hitResult?.item;
      
      // Pour CompoundPath, on doit remonter au parent
      let hitItem = hit;
      if (hitItem && !hitItem.data?.id && hitItem.parent?.data?.id) {
        hitItem = hitItem.parent;
      }

      if (hitItem && hitItem.data?.id) {
        const shapeId = hitItem.data.id;
        
        // Gestion de la sélection multiple avec modificateurs
        if (event.modifiers.shift || event.modifiers.meta || event.modifiers.control) {
          toggleSelectShape(shapeId);
        } else {
          // Si la forme cliquée n'est PAS déjà sélectionnée, la sélectionner seule
          if (!selectedIdsRef.current.has(shapeId)) {
            selectShapes([shapeId]);
          }
          // Sinon, on garde la sélection actuelle (permet de déplacer plusieurs formes)
        }
        
        // Préparer le déplacement de toutes les formes sélectionnées
        const selIds = new Set(getSelectedIds());
        draggedItemIds = selIds;
        isDragging = true;
        somethingChanged = false;
      }
    };

    tool.onMouseDrag = (event: any) => {
      if (!isDragging) return;

      if (!actionOpenRef.current) {
        startUserAction();
      }

      if (draggedHandle && draggedHandleType && originalPath && originalSegIdx >= 0) {
        // FIX CRITIQUE: Obtenir le segment correct pour Path simple OU CompoundPath
        let target: any = null;
        if (originalPath.segments) {
          target = originalPath;
        } else if (typeof originalChildIdx === 'number' && originalPath.children?.[originalChildIdx]) {
          target = originalPath.children[originalChildIdx];
        }

        const segment = target?.segments?.[originalSegIdx];
        if (!segment) return;

        try {
          if (draggedHandleType === "point") {
            if (altPrimed && initialDownPoint) {
              const vec = event.point.subtract(initialDownPoint);
              if (vec.length > 10) {
                segment.handleOut = vec.normalize(vec.length * 0.5);
                segment.handleIn = vec.normalize(-vec.length * 0.5);
                ensureSegmentHandleVisuals(originalPath, originalSegIdx, originalChildIdx);
                altPrimed = false;
              }
            }
            segment.point = segment.point.add(event.delta);
          } else if (draggedHandleType === "handleIn") {
            segment.handleIn = segment.handleIn.add(event.delta);
          } else if (draggedHandleType === "handleOut") {
            segment.handleOut = segment.handleOut.add(event.delta);
          }
          
          updateHandlesForSegment(originalPath, originalSegIdx, originalChildIdx);
          paper.view.update();
          somethingChanged = true;
        } catch (e) {
          console.error('Handle drag error:', e);
        }
      } else if (draggedItemIds.size > 0) {
        const main = findMainLayer();
        if (!main) return;
        main.children.forEach((c: any) => {
          if (c.data?.id && draggedItemIds.has(c.data.id)) {
            c.position = c.position.add(event.delta);
          }
        });
        regenerateAllHandles();
        paper.view.update();
        somethingChanged = true;
      }
    };

    tool.onMouseUp = () => {
      endUserAction(somethingChanged);
      isDragging = false;
      draggedHandle = null;
      draggedHandleType = null;
      originalPath = null;
      originalChildIdx = undefined;
      originalSegIdx = -1;
      draggedItemIds.clear();
      somethingChanged = false;
      altPrimed = false;
      initialDownPoint = null;
    };

    tool.activate();

    return () => {
      try {
        tool.remove();
      } catch {}
    };
  }, [handlesVisible, props]);

  function rotateShape(id: string, angle: number) {
    const item = (typeof findItemByDataId === 'function' ? findItemByDataId(id) : findShapeById(id));
    if (!item) return;

    const center = (item.bounds && item.bounds.center) ? item.bounds.center : (item.position || new paper.Point(0, 0));

    try {
      if (typeof item.rotate === 'function') {
        try {
          item.rotate(angle, center);
        } catch {
          item.rotate(angle);
        }
      } else if (item.segments) {
        const rad = (angle * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const rotatePoint = (pt: any) => {
          const p = pt.clone().subtract(center);
          return new paper.Point(p.x * cos - p.y * sin, p.x * sin + p.y * cos).add(center);
        };
        item.segments.forEach((seg: any) => {
          seg.point = rotatePoint(seg.point);
          if (seg.handleIn) seg.handleIn = rotatePoint(seg.point.add(seg.handleIn).subtract(seg.point)).subtract(seg.point).add(seg.point).subtract(seg.point); // no-op safe attempt
          if (seg.handleOut) seg.handleOut = rotatePoint(seg.point.add(seg.handleOut).subtract(seg.point)).subtract(seg.point).add(seg.point).subtract(seg.point); // safe no-op attempt
        });
      }
    } catch (err) {
      console.warn('rotateShape failed', err);
    }

    if (typeof regenerateAllHandles === 'function') regenerateAllHandles();
    props?.onShapesChange?.();
  }

  useImperativeHandle(ref, () => ({
    addShape,
    getShapesList,
    getSelectedIds,
    getSelectedShapes,
    clearCanvas,
    deleteShape,
    setHandlesVisibility,
    moveLayer,
    changeShapeColor,
    changeShapeProperty,
    selectShapes,
    toggleSelectShape,
    combineShapes,
    exportSVG,
    undo,
    scaleShapes,
    getNormalizedShapePaths,
    rotateShape,
  }));

  return (
    <>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Drawing area, use handles to adjust curves"
        tabIndex={0}
        width={props.width || 300}
        height={props.height || 240}
        style={{ ...props.style, touchAction: "none", pointerEvents: "auto", cursor: "default" }}
      />
    </>
  );
});

export default VectorCanvas;

// ----------------- HANDLE UTILITIES -----------------

// Nouvelle fonction qui gère Path ET CompoundPath
function createHandlesForItem(item: any, handlesLayer: any, color: string = "#007bff") {
  if (!item || !handlesLayer || !item.data?.id) return;
  removeHandlesForPath(item.data.id);
  
  if (item.segments) {
    // C'est un Path simple
    item.segments.forEach((seg: any, idx: number) => {
      createAnchorAndHandles(item, seg, idx, handlesLayer, color);
    });
  } else if (item.children) {
    // C'est un CompoundPath
    item.children.forEach((child: any, childIdx: number) => {
      if (child.segments) {
        child.segments.forEach((seg: any, segIdx: number) => {
          createAnchorAndHandlesForCompound(item, child, seg, childIdx, segIdx, handlesLayer, color);
        });
      }
    });
  }
  
  handlesLayer.bringToFront();
  paper.view.update();
}

function createHandlesForPath(path: any, handlesLayer: any, color: string = "#007bff") {
  if (!path || !handlesLayer || !path.segments || !path.data?.id) return;
  removeHandlesForPath(path.data.id);
  path.segments.forEach((seg: any, idx: number) => {
    createAnchorAndHandles(path, seg, idx, handlesLayer, color);
  });
  handlesLayer.bringToFront();
  paper.view.update();
}

function createAnchorAndHandles(path: any, seg: any, idx: number, handlesLayer: any, color: string) {
  const pt = new paper.Path.Circle(seg.point, 5);
  pt.fillColor = color;
  pt.strokeColor = "#fff";
  pt.strokeWidth = 2;
  pt.data = { pathId: path.data.id, segIdx: idx, type: "point" };
  handlesLayer.addChild(pt);

  if (seg.handleIn && (!seg.handleIn.isZero?.() && (seg.handleIn.x !== 0 || seg.handleIn.y !== 0))) {
    const hIn = new paper.Path.Circle(seg.point.add(seg.handleIn), 4);
    hIn.fillColor = color;
    hIn.strokeColor = "#fff";
    hIn.strokeWidth = 2;
    hIn.data = { pathId: path.data.id, segIdx: idx, type: "handleIn" };
    handlesLayer.addChild(hIn);
    const lineIn = new paper.Path.Line(seg.point, seg.point.add(seg.handleIn));
    lineIn.strokeColor = color;
    lineIn.strokeWidth = 1;
    lineIn.dashArray = [3, 2];
    lineIn.data = { pathId: path.data.id, segIdx: idx, type: "lineIn" };
    handlesLayer.addChild(lineIn);
  }

  if (seg.handleOut && (!seg.handleOut.isZero?.() && (seg.handleOut.x !== 0 || seg.handleOut.y !== 0))) {
    const hOut = new paper.Path.Circle(seg.point.add(seg.handleOut), 4);
    hOut.fillColor = color;
    hOut.strokeColor = "#fff";
    hOut.strokeWidth = 2;
    hOut.data = { pathId: path.data.id, segIdx: idx, type: "handleOut" };
    handlesLayer.addChild(hOut);
    const lineOut = new paper.Path.Line(seg.point, seg.point.add(seg.handleOut));
    lineOut.strokeColor = color;
    lineOut.strokeWidth = 1;
    lineOut.dashArray = [3, 2];
    lineOut.data = { pathId: path.data.id, segIdx: idx, type: "lineOut" };
    handlesLayer.addChild(lineOut);
  }
}

// Nouvelle fonction pour les segments de CompoundPath
function createAnchorAndHandlesForCompound(parent: any, child: any, seg: any, childIdx: number, segIdx: number, handlesLayer: any, color: string) {
  const pt = new paper.Path.Circle(seg.point, 5);
  pt.fillColor = color;
  pt.strokeColor = "#fff";
  pt.strokeWidth = 2;
  pt.data = { pathId: parent.data.id, childIdx, segIdx, type: "point" };
  handlesLayer.addChild(pt);

  if (seg.handleIn && (!seg.handleIn.isZero?.() && (seg.handleIn.x !== 0 || seg.handleIn.y !== 0))) {
    const hIn = new paper.Path.Circle(seg.point.add(seg.handleIn), 4);
    hIn.fillColor = color;
    hIn.strokeColor = "#fff";
    hIn.strokeWidth = 2;
    hIn.data = { pathId: parent.data.id, childIdx, segIdx, type: "handleIn" };
    handlesLayer.addChild(hIn);
    const lineIn = new paper.Path.Line(seg.point, seg.point.add(seg.handleIn));
    lineIn.strokeColor = color;
    lineIn.strokeWidth = 1;
    lineIn.dashArray = [3, 2];
    lineIn.data = { pathId: parent.data.id, childIdx, segIdx, type: "lineIn" };
    handlesLayer.addChild(lineIn);
  }

  if (seg.handleOut && (!seg.handleOut.isZero?.() && (seg.handleOut.x !== 0 || seg.handleOut.y !== 0))) {
    const hOut = new paper.Path.Circle(seg.point.add(seg.handleOut), 4);
    hOut.fillColor = color;
    hOut.strokeColor = "#fff";
    hOut.strokeWidth = 2;
    hOut.data = { pathId: parent.data.id, childIdx, segIdx, type: "handleOut" };
    handlesLayer.addChild(hOut);
    const lineOut = new paper.Path.Line(seg.point, seg.point.add(seg.handleOut));
    lineOut.strokeColor = color;
    lineOut.strokeWidth = 1;
    lineOut.dashArray = [3, 2];
    lineOut.data = { pathId: parent.data.id, childIdx, segIdx, type: "lineOut" };
    handlesLayer.addChild(lineOut);
  }
}

function ensureSegmentHandleVisuals(parentItem: any, segIdx: number, childIdx?: number) {
  const handles = findHandlesLayer();
  if (!handles) return;

  // Obtenir le bon target (Path ou enfant de CompoundPath)
  let target: any = null;
  if (parentItem.segments) {
    target = parentItem;
  } else if (typeof childIdx === 'number' && parentItem.children?.[childIdx]) {
    target = parentItem.children[childIdx];
  }
  
  if (!target) return;
  const seg = target.segments[segIdx];
  if (!seg) return;

  // Supprimer les anciens visuels pour ce segment
  handles.children
    .filter((h: any) => 
      h.data?.pathId === parentItem.data.id && 
      h.data.segIdx === segIdx && 
      h.data.childIdx === childIdx
    )
    .forEach((h: any) => h.remove());

  // Recréer les visuels
  if (typeof childIdx === 'number') {
    createAnchorAndHandlesForCompound(parentItem, target, seg, childIdx, segIdx, handles, "#007bff");
  } else {
    createAnchorAndHandles(parentItem, seg, segIdx, handles, "#007bff");
  }
}

function updateHandlesForSegment(parentItem: any, segIdx: number, childIdx?: number) {
  const handles = findHandlesLayer();
  if (!handles) return;

  // Obtenir le bon target
  let target: any = null;
  if (parentItem.segments) {
    target = parentItem;
  } else if (typeof childIdx === 'number' && parentItem.children?.[childIdx]) {
    target = parentItem.children[childIdx];
  }
  
  if (!target) return;
  const seg = target.segments[segIdx];
  if (!seg) return;
  
  const pathId = parentItem.data.id;
  const needIn = !!seg.handleIn && !(seg.handleIn.x === 0 && seg.handleIn.y === 0);
  const needOut = !!seg.handleOut && !(seg.handleOut.x === 0 && seg.handleOut.y === 0);

  // Mettre à jour les positions existantes
  handles.children
    .filter((h: any) => 
      h.data?.pathId === pathId && 
      h.data.segIdx === segIdx && 
      h.data.childIdx === childIdx
    )
    .forEach((h: any) => {
      switch (h.data.type) {
        case 'point':
          h.position = seg.point;
          break;
        case 'handleIn':
          if (needIn) h.position = seg.point.add(seg.handleIn);
          else h.remove();
          break;
        case 'lineIn':
          if (needIn) {
            h.firstSegment.point = seg.point;
            h.lastSegment.point = seg.point.add(seg.handleIn);
          } else h.remove();
          break;
        case 'handleOut':
          if (needOut) h.position = seg.point.add(seg.handleOut);
          else h.remove();
          break;
        case 'lineOut':
          if (needOut) {
            h.firstSegment.point = seg.point;
            h.lastSegment.point = seg.point.add(seg.handleOut);
          } else h.remove();
          break;
      }
    });

  // Créer les handles manquants
  const hasIn = handles.children.some((h: any) => 
    h.data?.pathId === pathId && 
    h.data.segIdx === segIdx && 
    h.data.childIdx === childIdx && 
    h.data.type === 'handleIn'
  );
  const hasOut = handles.children.some((h: any) => 
    h.data?.pathId === pathId && 
    h.data.segIdx === segIdx && 
    h.data.childIdx === childIdx && 
    h.data.type === 'handleOut'
  );

  if (needIn && !hasIn) {
    const hIn = new paper.Path.Circle(seg.point.add(seg.handleIn), 4);
    hIn.fillColor = "#007bff";
    hIn.strokeColor = "#fff";
    hIn.strokeWidth = 2;
    hIn.data = { pathId, childIdx, segIdx, type: 'handleIn' };
    handles.addChild(hIn);
    
    const lineIn = new paper.Path.Line(seg.point, seg.point.add(seg.handleIn));
    lineIn.strokeColor = "#007bff";
    lineIn.strokeWidth = 1;
    lineIn.dashArray = [3, 2];
    lineIn.data = { pathId, childIdx, segIdx, type: 'lineIn' };
    handles.addChild(lineIn);
  }

  if (needOut && !hasOut) {
    const hOut = new paper.Path.Circle(seg.point.add(seg.handleOut), 4);
    hOut.fillColor = "#007bff";
    hOut.strokeColor = "#fff";
    hOut.strokeWidth = 2;
    hOut.data = { pathId, childIdx, segIdx, type: 'handleOut' };
    handles.addChild(hOut);
    
    const lineOut = new paper.Path.Line(seg.point, seg.point.add(seg.handleOut));
    lineOut.strokeColor = "#007bff";
    lineOut.strokeWidth = 1;
    lineOut.dashArray = [3, 2];
    lineOut.data = { pathId, childIdx, segIdx, type: 'lineOut' };
    handles.addChild(lineOut);
  }

  handles.bringToFront();
  paper.view.update();
}

function removeHandlesForPath(pathId: string) {
  const handles = findHandlesLayer();
  if (!handles) return;
  handles.children.filter((c: any) => c.data?.pathId === pathId).forEach((c: any) => c.remove());
}

function purgeOrphanHandles() {
  const main = findMainLayer();
  const handles = findHandlesLayer();
  if (!main || !handles) return;
  const validIds = new Set<string>();
  main.children.forEach((c: any) => { if (c.data?.id) validIds.add(c.data.id); });
  handles.children.forEach((h: any) => {
    if (h.data?.pathId && !validIds.has(h.data.pathId)) h.remove();
  });
}
