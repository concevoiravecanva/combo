import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react";
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
  convertToPath?: () => void;
  clearCanvas?: () => void;
  deleteShape?: (id: string) => void;
  setHandlesVisibility?: (shapeId: string, visible: boolean) => void;
  moveLayer?: (shapeId: string, dir: "up" | "down") => void;
  exportSVG?: () => string;
  changeShapeColor?: (id: string, color: string) => void; // <- added
  changeShapeProperty?: (id: string, prop: string, value: any) => void;
  undo?: () => boolean;
}

type Props = {
  width?: number;
  height?: number;
  onShapesChange?: () => void;
  onSelectionChange?: (shapes: ShapeData[]) => void;
  style?: React.CSSProperties;
};

const generateId = () => Math.random().toString(36).slice(2, 10);

const VectorCanvas = forwardRef<VectorCanvasRef, Props>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    paper.setup(canvasRef.current);
    // ensure a layer exists
    if (!paper.project.activeLayer) paper.project.addLayer();
    paper.view.draw();
    return () => {
      try { paper.project.clear(); } catch (e) {}
    };
  }, []);

  const getShapesList = useCallback((): ShapeData[] => {
    if (!paper.project?.activeLayer) return [];
    const children = Array.from(paper.project.activeLayer.children);
    const topFirst = children.slice().reverse();
    return topFirst.map((item: any) => ({
      id: item.data?.id,
      type: item.data?.type || (item.className || "path").toLowerCase(),
      fillColor: item.fillColor?.toCSS?.() || item.fillColor?.toString?.() || undefined,
      strokeColor: item.strokeColor?.toCSS?.() || item.strokeColor?.toString?.() || undefined,
      strokeWidth: item.strokeWidth || undefined,
      size: Math.round(Math.max(item.bounds?.width || 0, item.bounds?.height || 0)),
      paperItem: item
    })).filter(s => !!s.id);
  }, []);

  // --- Helpers for custom handle markers (bigger, round, draggable) ---
  const _createHandlesForItem = useCallback((item: any) => {
    // remove existing
    if (!item) return;
    if (item.data?._handlesGroup) {
      try { item.data._handlesGroup.remove(); } catch (e) {}
      item.data._handlesGroup = undefined;
    }

    const group = new paper.Group();
    group.data = { ownerId: item.data?.id };

    const markerRadius = 5; // slightly bigger
    const markerStroke = '#333';
    const markerFill = '#fff';
    const lineStroke = '#9aa6b2';

    const addLine = (p1: paper.Point, p2: paper.Point) => {
      const line = new paper.Path.Line(p1, p2);
      line.strokeColor = lineStroke;
      line.strokeWidth = 1;
      line.data = { kind: 'handle-line' };
      group.addChild(line);
      return line;
    };

    const addMarker = (pos: paper.Point, data: any) => {
      const m = new paper.Path.Circle(pos, markerRadius);
      m.fillColor = markerFill;
      m.strokeColor = markerStroke;
      m.strokeWidth = 1;
      m.data = data;
      // drag behavior depends on data.type
      m.onMouseDrag = function (event: any) {
        // move marker visually
        this.position = this.position.add(event.delta);
        const owner: any = this.data.owner;
        const segIndex: number = this.data.segIndex;
        const seg = owner.segments[segIndex];
        if (!seg) return;
        if (this.data.type === 'segment') {
          // move point
          seg.point = seg.point.add(event.delta);
        } else if (this.data.type === 'handle-in') {
          // set handleIn relative to point
          const newHandle = this.position.subtract(seg.point);
          seg.handleIn = newHandle;
        } else if (this.data.type === 'handle-out') {
          const newHandle = this.position.subtract(seg.point);
          seg.handleOut = newHandle;
        }
        // update lines/markers positions after move
        _refreshHandlesForItem(owner);
        props.onShapesChange?.();
      };
      m.onMouseDown = function (ev: any) {
        // prevent parent selection
        ev.stop();
      };
      group.addChild(m);
      return m;
    };

    // create markers + lines for each segment
    try {
      item.segments.forEach((seg: any, i: number) => {
        const p = seg.point.clone();
        // segment marker (round)
        addMarker(p, { type: 'segment', owner: item, segIndex: i });

        // handle-in
        if (seg.handleIn && !seg.handleIn.isZero()) {
          const hInPos = p.add(seg.handleIn);
          addLine(p, hInPos);
          addMarker(hInPos, { type: 'handle-in', owner: item, segIndex: i });
        } else {
          // still create a smaller invisible handle for usability? skip to keep clean
        }

        // handle-out
        if (seg.handleOut && !seg.handleOut.isZero()) {
          const hOutPos = p.add(seg.handleOut);
          addLine(p, hOutPos);
          addMarker(hOutPos, { type: 'handle-out', owner: item, segIndex: i });
        }
      });
    } catch (e) {
      console.warn("createHandles error", e);
    }

    // keep group on top
    paper.project.activeLayer.addChild(group);
    item.data = item.data || {};
    item.data._handlesGroup = group;
    paper.view.update();
  }, [props]);

  const _refreshHandlesForItem = useCallback((item: any) => {
    if (!item || !item.data?._handlesGroup) return;
    const group: any = item.data._handlesGroup;
    // remove and recreate children for simplicity
    try {
      group.removeChildren();
    } catch (e) {}
    // rebuild like create but only for this item (reuse same logic)
    const markerRadius = 5;
    const markerStroke = '#333';
    const markerFill = '#fff';
    const lineStroke = '#9aa6b2';

    const addLine = (p1: paper.Point, p2: paper.Point) => {
      const line = new paper.Path.Line(p1, p2);
      line.strokeColor = lineStroke;
      line.strokeWidth = 1;
      line.data = { kind: 'handle-line' };
      group.addChild(line);
      return line;
    };

    const addMarker = (pos: paper.Point, data: any) => {
      const m = new paper.Path.Circle(pos, markerRadius);
      m.fillColor = markerFill;
      m.strokeColor = markerStroke;
      m.strokeWidth = 1;
      m.data = data;
      m.onMouseDrag = function (event: any) {
        this.position = this.position.add(event.delta);
        const owner: any = this.data.owner;
        const segIndex: number = this.data.segIndex;
        const seg = owner.segments[segIndex];
        if (!seg) return;
        if (this.data.type === 'segment') {
          seg.point = seg.point.add(event.delta);
        } else if (this.data.type === 'handle-in') {
          seg.handleIn = this.position.subtract(seg.point);
        } else if (this.data.type === 'handle-out') {
          seg.handleOut = this.position.subtract(seg.point);
        }
        _refreshHandlesForItem(owner);
        props.onShapesChange?.();
      };
      m.onMouseDown = function (ev: any) { ev.stop(); };
      group.addChild(m);
      return m;
    };

    try {
      item.segments.forEach((seg: any, i: number) => {
        const p = seg.point.clone();
        addMarker(p, { type: 'segment', owner: item, segIndex: i });

        if (seg.handleIn && !seg.handleIn.isZero()) {
          const hInPos = p.add(seg.handleIn);
          addLine(p, hInPos);
          addMarker(hInPos, { type: 'handle-in', owner: item, segIndex: i });
        }

        if (seg.handleOut && !seg.handleOut.isZero()) {
          const hOutPos = p.add(seg.handleOut);
          addLine(p, hOutPos);
          addMarker(hOutPos, { type: 'handle-out', owner: item, segIndex: i });
        }
      });
    } catch (e) {
      console.warn("refreshHandles error", e);
    }
    // ensure group stays on top
    try { paper.project.activeLayer.addChild(group); } catch (e) {}
    paper.view.update();
  }, [props, _createHandlesForItem]);

  const setHandlesVisibility = useCallback((shapeId: string, visible: boolean) => {
    if (!paper.project?.activeLayer) return;
    const item = paper.project.activeLayer.children.find((c: any) => c.data?.id === shapeId);
    if (!item) return;
    try {
      if (visible) {
        // create handles group if not present
        if (!item.data?._handlesGroup) {
          _createHandlesForItem(item);
        } else {
          _refreshHandlesForItem(item);
          // ensure visible
          try { item.data._handlesGroup.visible = true; } catch(e){}
        }
      } else {
        // hide/remove handles group
        if (item.data?._handlesGroup) {
          try { item.data._handlesGroup.remove(); } catch (e) {}
          item.data._handlesGroup = undefined;
        }
        // also clear paper's selection visual
        try {
          if (typeof item.fullySelected !== "undefined") item.fullySelected = false;
          else item.selected = false;
        } catch(e){}
      }
      paper.view.update();
      props.onShapesChange?.();
    } catch (e) {
      console.warn("setHandlesVisibility error", e);
    }
  }, [_createHandlesForItem, _refreshHandlesForItem, props]);

  // Ensure handles follow item geometry on any change - basic approach: listen to view.onFrame
  useEffect(() => {
    const onFrame = () => {
      try {
        // refresh all existing handle groups positions
        if (!paper.project?.activeLayer) return;
        paper.project.activeLayer.children.forEach((child: any) => {
          const grp = child.data?._handlesGroup;
          if (grp) {
            // rebuild to follow geometry
            _refreshHandlesForItem(child);
          }
        });
      } catch (e) {}
    };
    paper.view.onFrame = onFrame;
    return () => {
      try { paper.view.onFrame = null as any; } catch (e) {}
    };
  }, [_refreshHandlesForItem]);

  const addShape = useCallback((type: string, color: string, size: number, strokeColor?: string, x?: number, y?: number) => {
    if (!paper.project?.activeLayer) {
      console.warn("VectorCanvas.addShape: paper not ready");
      return "";
    }
    const id = generateId();
    const s = Math.max(4, Math.round(size || 50));
    const center = new paper.Point(typeof x === "number" ? x : (paper.view.center.x), typeof y === "number" ? y : (paper.view.center.y));
    let item: any = null;
    try {
      switch (type) {
        case "circle":
          item = new paper.Path.Circle(center, s / 2);
          break;
        case "triangle":
          item = new paper.Path.RegularPolygon(center, 3, s / Math.sqrt(3));
          break;
        case "diamond":
          item = new paper.Path.RegularPolygon(center, 4, s / Math.SQRT2);
          item.rotate(45);
          break;
        case "star": {
          const points: any[] = [];
          const cx = center.x;
          const cy = center.y;
          const R = s / 2;
          const r = R * 0.45;
          for (let i = 0; i < 5; i++) {
            points.push(new paper.Point(cx + R * Math.cos((Math.PI * 2 * i) / 5 - Math.PI / 2), cy + R * Math.sin((Math.PI * 2 * i) / 5 - Math.PI / 2)));
            points.push(new paper.Point(cx + r * Math.cos((Math.PI * 2 * i + Math.PI) / 5 - Math.PI / 2), cy + r * Math.sin((Math.PI * 2 * i + Math.PI) / 5 - Math.PI / 2)));
          }
          item = new paper.Path(points);
          item.closed = true;
          break;
        }
        case "square":
        default:
          item = new paper.Path.Rectangle({
            point: [center.x - s / 2, center.y - s / 2],
            size: [s, s]
          });
      }

      item.fillColor = color || "#ff0000";
      if (strokeColor) item.strokeColor = strokeColor;
      item.data = item.data || {};
      item.data.id = id;
      item.data.type = type;
      item.data.size = s;

      // Enable drag and drop for the shape
      item.onMouseDrag = function (event: any) {
        this.position = this.position.add(event.delta);
        // Update handles if they exist
        if (this.data._handlesGroup) {
          _refreshHandlesForItem(this);
        }
        props.onShapesChange?.();
      };
      
      item.onMouseUp = function () {
        props.onShapesChange?.();
      };

      paper.project.activeLayer.addChild(item);
      try { setHandlesVisibility(id, true); } catch(e) {}

      paper.view.update();
      props.onShapesChange?.();
      return id;
    } catch (e) {
      console.error("VectorCanvas.addShape error", e);
      return "";
    }
  }, [props, setHandlesVisibility, _refreshHandlesForItem]);

  const clearCanvas = useCallback(() => {
    try {
      if (paper.project) {
        paper.project.activeLayer.removeChildren();
        paper.view.update();
        props.onShapesChange?.();
      }
    } catch (e) { console.warn(e); }
  }, [props]);

  const moveLayer = useCallback((shapeId: string, dir: "up" | "down") => {
    if (!paper.project?.activeLayer) return;
    const children = Array.from(paper.project.activeLayer.children);
    const idx = children.findIndex(c => c.data?.id === shapeId);
    if (idx === -1) return;
    let targetIdx = dir === "up" ? idx + 1 : idx - 1;
    if (targetIdx < 0 || targetIdx >= children.length) return;
    const item = children[idx];
    item.remove();
    if (targetIdx >= paper.project.activeLayer.children.length) {
      paper.project.activeLayer.addChild(item);
    } else {
      paper.project.activeLayer.insertChild(targetIdx, item);
    }
    paper.view.update();
    props.onShapesChange?.();
  }, [props]);

  const deleteShape = useCallback((shapeId: string) => {
    if (!paper.project?.activeLayer) return;
    const item = paper.project.activeLayer.children.find((c: any) => c.data?.id === shapeId);
    if (!item) return;
    item.remove();
    paper.view.update();
    props.onShapesChange?.();
  }, [props]);

  // changeShapeColor implementation (exposed on ref)
  const changeShapeColor = useCallback((shapeId: string, color: string) => {
    if (!paper.project?.activeLayer) return;
    const item = paper.project.activeLayer.children.find((c: any) => c.data?.id === shapeId);
    if (!item) return;
    try {
      item.fillColor = color;
      item.data = item.data || {};
      item.data.fillColor = color;
      paper.view.update();
      props.onShapesChange?.();
    } catch (e) {
      console.warn("changeShapeColor error", e);
    }
  }, [props]);

  // change generic property (size, rotation, fillColor fallback)
  const changeShapeProperty = useCallback((shapeId: string, prop: string, value: any) => {
    if (!paper.project?.activeLayer) return;
    const item = paper.project.activeLayer.children.find((c: any) => c.data?.id === shapeId);
    if (!item) return;
    try {
      if (prop === "size") {
        const newSize = Number(value) || 1;
        const bbox = item.bounds;
        const current = Math.max(bbox.width || 1, bbox.height || 1);
        if (current > 0) {
          const ratio = newSize / current;
          item.scale(ratio, item.position);
          item.data.size = newSize;
        }
      } else if (prop === "rotation") {
        item.rotation = Number(value) || 0;
      } else if (prop === "fillColor" || prop === "color") {
        changeShapeColor(shapeId, String(value));
      } else {
        // fallback: set data[prop]
        item.data = item.data || {};
        item.data[prop] = value;
      }
      paper.view.update();
      props.onShapesChange?.();
    } catch (e) {
      console.warn("changeShapeProperty error", e);
    }
  }, [props, changeShapeColor]);

  // expose methods to parent
  useImperativeHandle(ref, () => ({
    addShape,
    getShapesList,
    convertToPath: undefined,
    exportSVG: () => {
      try {
        const svg = paper.project.exportSVG({ asString: true });
        return svg;
      } catch (e) {
        console.warn("exportSVG failed", e);
        return "";
      }
    },
    clearCanvas,
    deleteShape,
    setHandlesVisibility,
    moveLayer,
    changeShapeColor,        // <- ensure exposed
    changeShapeProperty,
    undo: undefined
  }), [addShape, getShapesList, clearCanvas, deleteShape, moveLayer, setHandlesVisibility, changeShapeColor, changeShapeProperty]);

  return (
    <canvas ref={canvasRef} width={props.width || 300} height={props.height || 240} style={props.style} />
  );
});

export default VectorCanvas;
