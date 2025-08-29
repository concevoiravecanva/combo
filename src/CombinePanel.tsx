import React from 'react';
import { ShapeData } from './VectorCanvas';
import { Button } from '@canva/app-ui-kit';

interface CombinePanelProps {
  selectedShapes: ShapeData[];
  selectShape: (id: string) => void;
  toggleShapeSelection: (id: string) => void;
  deselectAll: () => void;
  combineShapes: (id1: string, id2: string, operation: "unite" | "subtract" | "intersect") => void;
  shapes: ShapeData[];
}

const CombinePanel: React.FC<CombinePanelProps> = ({
  selectedShapes,
  selectShape,
  toggleShapeSelection,
  deselectAll,
  combineShapes,
  shapes
}) => {
  const t = (s: string) => s;

  const handleCombine = (operation: "unite" | "subtract" | "intersect") => {
    if (selectedShapes.length >= 2) {
      combineShapes(selectedShapes[0].id, selectedShapes[1].id, operation);
    }
  };

  return (
    <div style={{ padding: '12px' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
        {t('Combiner les formes')}
      </h3>
      
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px 0' }}>
          {t(`Sélectionnées: ${selectedShapes.length}/2`)}
        </p>
        
        {selectedShapes.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            {selectedShapes.map((shape) => (
              <div
                key={shape.id}
                style={{
                  padding: '4px 8px',
                  background: '#f0f0f0',
                  borderRadius: '4px',
                  fontSize: '11px',
                  marginBottom: '2px'
                }}
              >
                {shape.type} - {shape.id.slice(0, 6)}...
              </div>
            ))}
          </div>
        )}
        
        <Button
          variant="secondary"
          onClick={deselectAll}
          disabled={selectedShapes.length === 0}
          style={{ fontSize: '11px', padding: '4px 8px' }}
        >
          {t('Tout désélectionner')}
        </Button>
      </div>

      {selectedShapes.length >= 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Button
            variant="primary"
            onClick={() => handleCombine('unite')}
            style={{ fontSize: '11px', padding: '6px 8px' }}
          >
            {t('Unir')}
          </Button>
          <Button
            variant="primary"
            onClick={() => handleCombine('subtract')}
            style={{ fontSize: '11px', padding: '6px 8px' }}
          >
            {t('Soustraire')}
          </Button>
          <Button
            variant="primary"
            onClick={() => handleCombine('intersect')}
            style={{ fontSize: '11px', padding: '6px 8px' }}
          >
            {t('Intersection')}
          </Button>
        </div>
      )}

      {selectedShapes.length < 2 && (
        <p style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
          {t('Sélectionnez au moins 2 formes pour les combiner')}
        </p>
      )}
    </div>
  );
};

export default CombinePanel;