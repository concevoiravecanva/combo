import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@canva/app-ui-kit';
import VectorCanvas, { VectorCanvasRef, ShapeData } from "./VectorCanvas";
import { addElementAtPoint } from "@canva/design";
import { Plus, Minus, Circle, Eye, EyeOff, Trash2, CloudUpload, RotateCcw, X } from 'lucide-react';


// petit composant réutilisable : panneau de combinaison (4 boutons)
function CombinePanel({
  onCombine,
  disabled
}: {
  onCombine: (op: 'union' | 'subtract' | 'exclude' | 'intersect') => void;
  disabled: boolean;
}) {
  const btnStyle: React.CSSProperties = {
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid #ddd',
    background: disabled ? '#f1f3f5' : '#007bff',
    color: disabled ? '#999' : '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 13,
    fontWeight: 600
  };
  // 2 colonnes x 2 lignes, texte (français)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12, alignItems: 'center', width: 320 }}>
      <button onClick={() => onCombine('union')} disabled={disabled} title="Additionner" style={btnStyle}>Additionner</button>
      <button onClick={() => onCombine('subtract')} disabled={disabled} title="Soustraire" style={btnStyle}>Soustraire</button>
      <button onClick={() => onCombine('exclude')} disabled={disabled} title="Exclure" style={btnStyle}>Exclure</button>
      <button onClick={() => onCombine('intersect')} disabled={disabled} title="Intersection" style={btnStyle}>Intersection</button>
    </div>
  );
}

// petit composant réutilisable : panneau d'actions (clear / add-to-canva / undo)
function AlterPanel({
  onClear,
  onAddToCanva,
  onUndo
}: {
  onClear: () => void;
  onAddToCanva: () => Promise<void> | void;
  onUndo: () => void;
}) {
  const iconBtn: React.CSSProperties = { width: 36, height: 36, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' };
  return (
    <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
      <Button variant="secondary" onClick={onClear} title="Vider le canvas" aria-label="Vider le canvas" style={iconBtn}><Trash2 size={16} /></Button>
      <Button variant="primary" onClick={onAddToCanva} title="Ajouter à Canva" aria-label="Ajouter à Canva" style={iconBtn}><CloudUpload size={16} /></Button>
      <Button variant="secondary" onClick={onUndo} title="Annuler (Undo)" aria-label="Annuler" style={iconBtn}><RotateCcw size={16} /></Button>
    </div>
  );
}

function App() {
  const canvasRef = useRef<VectorCanvasRef>(null);
  const [shapeSize, setShapeSize] = useState(50);
  const [selectedShapes, setSelectedShapes] = useState<ShapeData[]>([]);
  const [shapes, setShapes] = useState<ShapeData[]>([]);
  const [handlesVisible, setHandlesVisible] = useState<Record<string, boolean>>({});

  const palette = [
    { key: 'circle', label: 'Cercle', preview: <Circle size={20} /> },
    { key: 'square', label: 'Carré', preview: <div style={{ width: 16, height: 16, border: '2px solid #333' }} /> },
    { key: 'triangle', label: 'Triangle', preview: <div style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '14px solid #333' }} /> },
    { key: 'diamond', label: 'Losange', preview: <div style={{ width: 12, height: 12, border: '2px solid #333', transform: 'rotate(45deg)' }} /> },
    { key: 'star', label: 'Étoile', preview: <span style={{ fontSize: 16 }}>★</span> }
  ];

  const refreshShapes = useCallback(() => {
    if (!canvasRef.current) return;
    const list = canvasRef.current.getShapesList();
    setShapes(list);
  }, []);

  const handleAddFromPalette = (type: string) => {
    if (!canvasRef.current) {
      console.warn("canvasRef not ready");
      return;
    }
    const x = 150;
    const y = 100;

    if (typeof canvasRef.current.addShape !== "function") {
      console.warn("addShape not exposed on VectorCanvas");
      return;
    }

    const id = canvasRef.current.addShape(type, "#ff0000", shapeSize, undefined, x, y);
    canvasRef.current.convertToPath?.();
    // ensure handles state tracks new shape (visible by default)
    setHandlesVisible(prev => ({ ...prev, [id]: true }));

    setTimeout(() => {
      refreshShapes();
      const list = canvasRef.current?.getShapesList?.() || [];
      setShapes(list);
      const added = list.find((s) => s.id === id);
      if (added) {
        setSelectedShapes([added]);
        setShapeSize(added.size || shapeSize);
      } else {
        console.warn("Shape added but not found in getShapesList()", id, list);
      }
    }, 120);
  };

  const handleClearCanvas = () => {
    canvasRef.current?.clearCanvas();
    setShapes([]);
    setSelectedShapes([]);
    setHandlesVisible({});
  };

  const handleToggleHandles = (shapeId: string) => {
    const current = !!handlesVisible[shapeId];
    const next = !current;
    setHandlesVisible(prev => ({ ...prev, [shapeId]: next }));
    canvasRef.current?.setHandlesVisibility?.(shapeId, next);
  };

  // combine two selected shapes: operation = 'union' | 'subtract' | 'exclude' | 'intersect'
  const handleCombineShapes = (operation: 'union' | 'subtract' | 'exclude' | 'intersect') => {
    if (!canvasRef.current) return;
    if (selectedShapes.length !== 2) {
      console.warn("Sélectionner exactement 2 formes pour combiner");
      return;
    }
    const [a, b] = selectedShapes;
    if (typeof canvasRef.current.combineShapes === "function") {
      canvasRef.current.combineShapes(a.id, b.id, operation);
      // refresh and clear selection
      setTimeout(() => {
        refreshShapes();
        setSelectedShapes([]);
      }, 80);
    } else {
      console.warn("combineShapes non implémenté dans VectorCanvas");
    }
  };

  // cliquer sur un calque => sélectionner / désélectionner (support basique multi-select)
  const handleLayerClick = (shape: ShapeData, e: React.MouseEvent) => {
    const exists = selectedShapes.find(s => s.id === shape.id);
    // si utilisateur maintient Ctrl/Cmd, on bascule l'item dans la sélection
    if (e.metaKey || e.ctrlKey) {
      if (exists) {
        setSelectedShapes(prev => prev.filter(s => s.id !== shape.id));
      } else {
        // limiter à 2 éléments pour les opérations de combinaison
        setSelectedShapes(prev => (prev.length < 2 ? [...prev, shape] : prev));
      }
      return;
    }
    // sinon clic simple => sélection unique / désélection si déjà seul sélectionné
    if (exists && selectedShapes.length === 1) {
      setSelectedShapes([]);
    } else {
      setSelectedShapes([shape]);
    }
  };

  const getCurrentOrder = () => {
    return shapes.slice().reverse();
  };

  const handleSizeChange = (newSize: number) => {
    setShapeSize(newSize);
    if (selectedShapes.length === 1) {
      const id = selectedShapes[0].id;
      canvasRef.current?.changeShapeProperty?.(id, 'size', newSize);
      // update shapes list
      setTimeout(refreshShapes, 0);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto', fontFamily: 'Arial, sans-serif', overflowX: 'hidden' }}>
      {/* Palette scrollable */}
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        padding: '8px 4px',
        marginBottom: 12,
        background: '#f4f6f8',
        borderRadius: 6,
        border: '1px solid #e6e9ed'
      }}>
        {palette.map(p => (
          <button
            key={p.key}
            onClick={() => handleAddFromPalette(p.key)}
            title={`Ajouter ${p.label}`}
            style={{
              minWidth: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 6,
              padding: 6,
              cursor: 'pointer'
            }}
          >
            {p.preview}
          </button>
        ))}
      </div>

      {/* Ligne de combinaison : 4 boutons en 2x2 */}
      <CombinePanel onCombine={handleCombineShapes} disabled={selectedShapes.length !== 2} />

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Gauche : Editor Canvas */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Éditeur</div>
          <div style={{
            border: '1px solid #e6e9ed',
            borderRadius: 8,
            padding: 0,
            background: '#fff',
            width: 300,
            height: 240,
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}>
            <VectorCanvas
              ref={canvasRef}
              width={300}
              height={240}
              onShapesChange={() => { refreshShapes(); }}
              onSelectionChange={setSelectedShapes}
              style={{ width: "100%", height: "100%", display: 'block', background: '#ffffff' }}
            />
          </div>

          <AlterPanel 
            onClear={handleClearCanvas} 
            onAddToCanva={async () => { 
              const svg = canvasRef.current?.exportSVG?.(); 
              if (!svg) return; 
              try { 
                await addElementAtPoint({ type: 'svg', svg }, { x: 200, y: 200 }); 
              } catch(e){ 
                console.warn(e); 
              } 
            }} 
            onUndo={() => { 
              const ok = canvasRef.current?.undo?.(); 
              if (ok) setTimeout(() => refreshShapes(), 40); 
            }} 
          />

          {/* Liste des Calques sous les boutons */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Calques ({shapes.length})</div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {shapes.length === 0 && <div style={{ color: '#666' }}>Aucune forme</div>}
              {shapes.map((s) => {
                const currentOrder = getCurrentOrder();
                const orderIndex = currentOrder.findIndex(it => it.id === s.id);
                const isTop = orderIndex === 0;
                const isBottom = orderIndex === currentOrder.length - 1;
                const selected = selectedShapes.some(sel => sel.id === s.id);

                return (
                  <div
                    key={s.id}
                    onClick={(e) => handleLayerClick(s, e)}
                    role="button"
                    tabIndex={0}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 10,
                      border: '1px solid #eee',
                      borderRadius: 6,
                      marginBottom: 8,
                      background: selected ? '#e8f2ff' : '#fff',
                      borderColor: selected ? '#b6dbff' : '#eee',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <>
                        <input
                          type="color"
                          id={`color-${s.id}`}
                          value={s.fillColor && /^#([0-9A-F]{3}){1,2}$/i.test(s.fillColor) ? s.fillColor : '#ff0000'}
                          onChange={(e) => {
                            const color = e.target.value;
                            // update local preview immediately
                            setShapes(prev => prev.map(p => p.id === s.id ? { ...p, fillColor: color } : p));
                            // call the method on the ref (safe optional chaining)
                            canvasRef.current?.changeShapeColor?.(s.id, color);
                          }}
                          style={{ display: 'none' }}
                        />

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const el = document.getElementById(`color-${s.id}`) as HTMLInputElement | null;
                            el?.click();
                          }}
                          title="Changer la couleur"
                          aria-label="Changer la couleur"
                          style={{
                            width: 20,
                            height: 20,
                            padding: 0,
                            border: '1px solid #ddd',
                            borderRadius: '50%',
                            background: s.fillColor || '#ff0000',
                            cursor: 'pointer'
                          }}
                        />
                      </>
                      <div style={{ fontSize: 13 }}>
                        <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{s.type}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{s.size}px</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleHandles(s.id); }}
                        title={handlesVisible[s.id] ? "Cacher points" : "Afficher points"}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 6,
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#333'
                        }}
                      >
                        {handlesVisible[s.id] ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>

                      <div style={{ width: 6 }} />

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); canvasRef.current?.moveLayer(s.id, 'up'); }}
                          title="Monter"
                          disabled={isTop}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 6,
                            border: 'none',
                            background: isTop ? '#f1f3f5' : '#6c757d',
                            color: isTop ? '#bdbfc1' : '#fff',
                            cursor: isTop ? 'not-allowed' : 'pointer'
                          }}
                        >
                          ↑
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); canvasRef.current?.moveLayer(s.id, 'down'); }}
                          title="Descendre"
                          disabled={isBottom}
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 6,
                            border: 'none',
                            background: isBottom ? '#f1f3f5' : '#6c757d',
                            color: isBottom ? '#bdbfc1' : '#fff',
                            cursor: isBottom ? 'not-allowed' : 'pointer'
                          }}
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Droite : Propriétés + Calques */}
        <div style={{ flex: 1, minWidth: 200 }}>
          {/* Propriétés */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Propriétés</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <label htmlFor="size-input">Taille :</label>
              <input
                id="size-input"
                type="number"
                value={shapeSize}
                onChange={(e) => handleSizeChange(parseInt(e.target.value) || 50)}
                min="1"
                max="200"
                style={{
                  width: 60,
                  padding: '4px 6px',
                  border: '1px solid #ccc',
                  borderRadius: 4
                }}
              />
              <span style={{ fontSize: 12, color: '#666' }}>px</span>
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {selectedShapes.length > 0 ? `${selectedShapes.length} forme(s) sélectionnée(s)` : 'Aucune sélection'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;