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
  };
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
    if (c.data?.id && c.segments) {
      createHandlesForPath(c, handles, "#007bff");
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
  function snapshotProject(): string {
    const handles = findHandlesLayer();
    const vis = handles?.visible;
    if (handles) handles.visible = false;
    const json = paper.project.exportJSON({ asString: true });
    if (handles) handles.visible = vis;
    return json;
  }
  function pushHistory() {
    if (!paper.project) return;
    const snap = snapshotProject();
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }
    historyRef.current.push(snap);
    if (historyRef.current.length > 50) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
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
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      restoreSnapshot(historyRef.current[historyIndexRef.current]);
      return true;
    }
    return false;
  }

  // ---------- Shape ops ----------
  function refreshSnapshot() {
    regenerateAllHandles();
    props.onShapesChange?.();
    pushHistory();
  }

  function addShape(type: string, color: string, size: number, strokeColor?: string, x?: number, y?: number): string {
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
        const w = s;
        const h = s;
        const p = new paper.Path();

        // Nouveau tracé pour un coeur plus naturel et symétrique
        // Point du bas (pointe)
        p.add(new paper.Segment(
          new paper.Point(0, 0.32 * h),
          new paper.Point(0.18 * w, 0.32 * h), // handle in
          new paper.Point(-0.18 * w, 0.32 * h) // handle out
        ));

        // Lobe droit
        p.add(new paper.Segment(
          new paper.Point(0.28 * w, -0.08 * h),
          new paper.Point(0.28 * w, 0.22 * h), // handle in
          new paper.Point(0.46 * w, -0.18 * h) // handle out
        ));

        // Haut droit
        p.add(new paper.Segment(
          new paper.Point(0, -0.28 * h),
          new paper.Point(0.46 * w, -0.28 * h), // handle in
          new paper.Point(-0.46 * w, -0.28 * h) // handle out
        ));

        // Lobe gauche
        p.add(new paper.Segment(
          new paper.Point(-0.28 * w, -0.08 * h),
          new paper.Point(-0.46 * w, -0.18 * h), // handle in
          new paper.Point(-0.28 * w, 0.22 * h)   // handle out
        ));

        p.closed = true;
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
    pushHistory();
    return id;
  }

  function deleteShape(id: string) {
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
    paper.view.update();
    pushHistory();
  }

  function clearCanvas() {
    const main = findMainLayer();
    const handles = findHandlesLayer();
    main?.removeChildren();
    handles?.removeChildren();
    selectedIdsRef.current.clear();
    emitSelectionChange();
    props.onShapesChange?.();
    paper.view.update();
    pushHistory();
  }

  function setHandlesVisibility(visible: boolean) {
    const handles = findHandlesLayer();
    if (!handles) return;
    handles.visible = visible;
    if (visible && handles.children.length === 0) regenerateAllHandles();
    paper.view.update();
  }

  function moveLayer(shapeId: string, dir: "up" | "down") {
    const main = findMainLayer();
    if (!main) return;
    const idx = main.children.findIndex((c: any) => c.data?.id === shapeId);
    if (idx < 0) return;
    const ch = main.children[idx];
    if (dir === "up" && idx < main.children.length - 1) main.insertChild(idx + 1, ch);
    if (dir === "down" && idx > 0) main.insertChild(idx - 1, ch);
    paper.view.update();
    pushHistory();
  }

  function changeShapeColor(id: string, color: string) {
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
      pushHistory();
    } catch {}
  }

  function changeShapeProperty(id: string, prop: string, value: any) {
    const main = findMainLayer();
    if (!main) return;
    const it: any = main.children.find((c: any) => c.data?.id === id);
    if (!it) return;
    (it as any)[prop] = value;
    paper.view.update();
    pushHistory();
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
    const main = findMainLayer();
    if (!main) return;
    ids.forEach(id => {
      const it = main.children.find((c: any) => c.data?.id === id);
      it && it.scale(factor);
    });
    regenerateAllHandles();
    props.onShapesChange?.();
    paper.view.update();
    pushHistory();
  }

  // UTIL: génère un id simple
  function genId() {
    return 'shp_' + Math.random().toString(36).slice(2, 9);
  }

  // PATCH: assure que le résultat des opérations booléennes garde un id
  function combineShapes(idA: string, idB: string, op: 'union' | 'subtract' | 'intersect' | 'exclude') {
    const a = findShapeById(idA);
    const b = findShapeById(idB);
    if (!a || !b) return;
    let result: any;
    try {
      switch (op) {
        case 'union':     result = a.unite(b); break;
        case 'subtract':  result = a.subtract(b); break;
        case 'intersect': result = a.intersect(b); break;
        case 'exclude':   result = a.exclude(b); break;
      }
    } catch { return; }
    if (!result) return;

    a.remove(); b.remove();

    // Normalise le résultat (compound ou path) pour qu'il soit détecté + exportable
    const newId = genId();
    result.data = {
      id: newId,
      type: 'shape',
      fillColor: a.data?.fillColor || b.data?.fillColor || '#ff0000'
    };
    result.fillColor = new paper.Color(result.data.fillColor);

    // Assure pas de winding bizarre (Paper gère déjà, mais on force clock wise outer)
    if (result instanceof paper.CompoundPath) {
      // Tri enfants pour que le plus grand contour (aire absolue max) soit premier
      result.children.sort((c1: any, c2: any) => Math.abs(c2.area) - Math.abs(c1.area));
    }

    selectShapes([newId]);
    refreshSnapshot();
  }

  // Remplace entièrement getNormalizedShapePaths pour corriger:
  // - Exclusion (XOR) : toutes les régions disjointes doivent être conservées (avant on perdait la moitié)
  // - Soustraction : les trous internes doivent être ignorés
  // - Un seul 'M' par path (une région = un path), jamais de multi-M
  function getNormalizedShapePaths() {
    const main = findMainLayer();
    if (!main) return { viewBox: { top: 0, left: 0, width: 0, height: 0 }, paths: [] as any[] };

    const shapeItems: any[] = [];
    main.children.forEach((c: any) => { if (c.data?.id) shapeItems.push(c); });
    if (!shapeItems.length) {
      return { viewBox: { top: 0, left: 0, width: 0, height: 0 }, paths: [] };
    }

    // BBox globale
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
      // Assure fermeture
      if (!/[zZ]$/.test(d)) d += ' Z';
      // Évite multi-M dans le même path: chaque node ici = une seule sous-forme
      paths.push({ d, fill: { color } });
    }

    function exportSinglePath(p: any, color: string) {
      const clone = p.clone();
      clone.translate(new paper.Point(-minX, -minY));
      const node = clone.exportSVG({ asString: false }) as SVGPathElement;
      pushPath(node, color);
      clone.remove();
    }

    function isHole(candidate: any, siblings: any[]) {
      // Un trou est contenu DANS un autre path (centre à l'intérieur) et ne doit pas être exporté.
      // Pour XOR (exclusion) les régions disjointes ne sont pas contenues -> gardées.
      const center = candidate.bounds.center;
      return siblings.some(s => s !== candidate && s.contains(center));
    }

    function exportItem(it: any) {
      const color = it.data?.fillColor || (it.fillColor ? it.fillColor.toCSS?.(true) : '#000000') || '#000000';

      if (it instanceof paper.CompoundPath) {
        const children = it.children.slice();
        // On conserve toutes les régions dont le centre n'est pas contenu dans une autre (donc pas des trous)
        children.forEach(child => {
          if (isHole(child, children)) return; // ignorer trou
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

    return { viewBox: { top: 0, left: 0, width, height }, paths };
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
    if (historyRef.current.length === 0) pushHistory();

    return () => {
      try {
        paper.project && paper.project.clear();
      } catch {}
    };
  }, []);

  // Update view size when props change
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

  // ---------- Drag & Bézier editing ----------
  useEffect(() => {
    if (!canvasRef.current || !paper.project) return;

    const tool = new paper.Tool();
    let isDragging = false;
    let draggedHandle: any = null;
    let draggedHandleType: string | null = null;
    let originalPath: any = null;
    let originalSegIdx = -1;
    let draggedItemIds = new Set<string>();
    let somethingChanged = false;

    // Pour création dynamique des poignées via ALT-drag
    let altPrimed = false;
    let initialDownPoint: paper.Point | null = null;

    function hitTestHandle(point: any) {
      return paper.project.hitTest(point, {
        tolerance: 10,
        fill: true,
        stroke: false,
        match: (hit: any) => {
          const d = hit?.item?.data;
          return !!d && (d.type === "point" || d.type === "handleIn" || d.type === "handleOut");
        }
      });
    }

    tool.onMouseDown = (event: any) => {
      initialDownPoint = event.point.clone();
      const hitHandle = hitTestHandle(event.point);

      if (hitHandle?.item?.data) {
        draggedHandle = hitHandle.item;
        draggedHandleType = draggedHandle.data.type;
        const pathId = draggedHandle.data.pathId;
        originalSegIdx = draggedHandle.data.segIdx;
        originalPath = findMainLayer()?.children.find((c: any) => c.data?.id === pathId);

        if (originalPath && originalPath.segments[originalSegIdx]) {
          // Si ALT et aucun handle, on attend le premier drag pour définir la direction
          if (draggedHandleType === 'point' && event.modifiers.alt) {
            const seg = originalPath.segments[originalSegIdx];
            if ((seg.handleIn?.isZero?.() || (seg.handleIn.x === 0 && seg.handleIn.y === 0)) &&
                (seg.handleOut?.isZero?.() || (seg.handleOut.x === 0 && seg.handleOut.y === 0))) {
              altPrimed = true;
            }
          }
          isDragging = true;
          somethingChanged = false;
          event.stop();
          return;
        }
      }

      const hit = paper.project.hitTest(event.point, {
        fill: true,
        stroke: true,
        segments: true,
        tolerance: 8
      });
      const shift = event.modifiers.shift;

      if (hit?.item) {
        const shapeItem = resolveShapeWithId(hit.item);
        if (shapeItem?.data?.id) {
          if (shift) toggleSelectShape(shapeItem.data.id);
            else if (!selectedIdsRef.current.has(shapeItem.data.id)) selectShapes([shapeItem.data.id]);
          draggedItemIds = new Set(selectedIdsRef.current);
          isDragging = true;
          somethingChanged = false;
          event.stop();
          return;
        }
      }

      selectShapes([]);
      isDragging = false;
    };

    tool.onMouseDrag = (event: any) => {
      if (!isDragging) return;

      if (draggedHandle && draggedHandleType && originalPath && originalSegIdx >= 0) {
        const segment = originalPath.segments[originalSegIdx];
        if (!segment) return;
        try {
          if (draggedHandleType === "point") {
            // Création initiale des poignées pendant ALT-drag (direction = mouvement)
            if (altPrimed && initialDownPoint) {
              const vec = event.point.subtract(initialDownPoint);
              if (vec.length > 10) { // Seuil minimal pour éviter création accidentelle
                segment.handleOut = vec.normalize(vec.length * 0.5);
                segment.handleIn = vec.normalize(-vec.length * 0.5);
                ensureSegmentHandleVisuals(originalPath, originalSegIdx);
                altPrimed = false;
              }
            }
            segment.point = segment.point.add(event.delta);
          } else if (draggedHandleType === "handleIn") {
            segment.handleIn = segment.handleIn.add(event.delta);
          } else if (draggedHandleType === "handleOut") {
            segment.handleOut = segment.handleOut.add(event.delta);
          }
          updateHandlesForSegment(originalPath, originalSegIdx);
          paper.view.update();
          somethingChanged = true;
        } catch (e) {
          console.error("Error during handle drag:", e);
        }
        return;
      }

      // Déplacement formes sélectionnées
      const delta = event.delta;
      const main = findMainLayer();
      if (!main) return;
      main.children.forEach((child: any) => {
        if (child.data?.id && draggedItemIds.has(child.data.id)) {
          child.position = child.position.add(delta);
          if (child.segments) {
            for (let i = 0; i < child.segments.length; i++) {
              updateHandlesForSegment(child, i);
            }
          }
          somethingChanged = true;
        }
      });
      paper.view.update();
    };

    tool.onMouseUp = () => {
      if (isDragging && somethingChanged) {
        purgeOrphanHandles();
        pushHistory();
        props.onShapesChange?.();
      }
      isDragging = false;
      draggedHandle = null;
      draggedHandleType = null;
      originalPath = null;
      originalSegIdx = -1;
      somethingChanged = false;
      altPrimed = false;
      initialDownPoint = null;
    };

    tool.activate();
    toolRef.current = tool;
    return () => {
      try { tool.remove(); } catch {}
      toolRef.current = null;
    };
  }, []);

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
    getNormalizedShapePaths
  }));

  return (
    <canvas
      ref={canvasRef}
      width={props.width || 300}
      height={props.height || 240}
      style={{ ...props.style, touchAction: "none", pointerEvents: "auto", cursor: "default" }}
    />
  );
});

export default VectorCanvas;

// ----------------- HANDLE UTILITIES -----------------
function createHandlesForPath(path: any, handlesLayer: any, color: string = "#007bff") {
  if (!path || !handlesLayer || !path.segments || !path.data?.id) return;
  removeHandlesForPath(path.data.id);
  path.segments.forEach((seg: any, idx: number) => {
    createAnchorAndHandles(path, seg, idx, handlesLayer, color);
  });
  handlesLayer.bringToFront();
  paper.view.update();
}

function createAnchorAndHandles(path:any, seg:any, idx:number, handlesLayer:any, color:string){
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

function ensureSegmentHandleVisuals(path:any, segIdx:number){
  const handles = findHandlesLayer();
  if(!handles) return;
  const seg = path.segments[segIdx];
  // recrée seulement ce segment (supprime d'abord)
  handles.children
    .filter((h:any)=>h.data?.pathId===path.data.id && h.data.segIdx===segIdx)
    .forEach((h:any)=>h.remove());
  createAnchorAndHandles(path, seg, segIdx, handles, "#007bff");
}

function updateHandlesForSegment(path:any, segIdx:number){
  const handles = findHandlesLayer();
  if(!handles) return;
  const seg = path.segments[segIdx];
  if(!seg) return;
  const pathId = path.data.id;

  const needIn = !!seg.handleIn && !(seg.handleIn.x === 0 && seg.handleIn.y === 0);
  const needOut = !!seg.handleOut && !(seg.handleOut.x === 0 && seg.handleOut.y === 0);

  handles.children
    .filter((h:any)=>h.data?.pathId===pathId && h.data.segIdx===segIdx)
    .forEach((h:any)=>{
      switch(h.data.type){
        case 'point':
          h.position = seg.point;
          break;
        case 'handleIn':
          if(needIn) h.position = seg.point.add(seg.handleIn); else h.remove();
          break;
        case 'lineIn':
          if(needIn){
            h.firstSegment.point = seg.point;
            h.lastSegment.point = seg.point.add(seg.handleIn);
          } else h.remove();
          break;
        case 'handleOut':
          if(needOut) h.position = seg.point.add(seg.handleOut); else h.remove();
          break;
        case 'lineOut':
          if(needOut){
            h.firstSegment.point = seg.point;
            h.lastSegment.point = seg.point.add(seg.handleOut);
          } else h.remove();
          break;
      }
    });

  // Créer manquants
  if(needIn){
    const hasIn = handles.children.some((h:any)=>h.data?.pathId===pathId && h.data.segIdx===segIdx && h.data.type==='handleIn');
    if(!hasIn){
      const hIn = new paper.Path.Circle(seg.point.add(seg.handleIn),4);
      hIn.fillColor="#007bff"; hIn.strokeColor="#fff"; hIn.strokeWidth=2;
      hIn.data={pathId, segIdx, type:'handleIn'};
      handles.addChild(hIn);
      const lineIn = new paper.Path.Line(seg.point, seg.point.add(seg.handleIn));
      lineIn.strokeColor="#007bff"; lineIn.strokeWidth=1; lineIn.dashArray=[3,2];
      lineIn.data={pathId, segIdx, type:'lineIn'};
      handles.addChild(lineIn);
    }
  }
  if(needOut){
    const hasOut = handles.children.some((h:any)=>h.data?.pathId===pathId && h.data.segIdx===segIdx && h.data.type==='handleOut');
    if(!hasOut){
      const hOut = new paper.Path.Circle(seg.point.add(seg.handleOut),4);
      hOut.fillColor="#007bff"; hOut.strokeColor="#fff"; hOut.strokeWidth=2;
      hOut.data={pathId, segIdx, type:'handleOut'};
      handles.addChild(hOut);
      const lineOut = new paper.Path.Line(seg.point, seg.point.add(seg.handleOut));
      lineOut.strokeColor="#007bff"; lineOut.strokeWidth=1; lineOut.dashArray=[3,2];
      lineOut.data={pathId, segIdx, type:'lineOut'};
      handles.addChild(lineOut);
    }
  }
  handles.bringToFront();
  paper.view.update();
}

function removeHandlesForPath(pathId: string) {
  const handles = findHandlesLayer();
  if (!handles) return;
  handles.children
    .filter((h: any) => h.data?.pathId === pathId)
    .forEach((h: any) => h.remove());
}

function purgeOrphanHandles() {
  const handles = findHandlesLayer();
  const main = findMainLayer();
  if (!handles || !main) return;
  const ids = new Set(main.children.filter((c: any) => c.data?.id).map((c: any) => c.data.id));
  handles.children
    .filter((h: any) => h.data?.pathId && !ids.has(h.data.pathId))
    .forEach((h: any) => h.remove());
}

// Ajouter cette fonction helper avant qu'elle ne soit utilisée
function resolveShapeWithId(item: any) {
  let current = item;
  // Remonte l'arbre des parents jusqu'à trouver un élément avec un id
  while (current && (!current.data || !current.data.id) && current.parent) {
    current = current.parent;
  }
  return current?.data?.id ? current : null;
}
