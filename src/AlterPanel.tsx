import React from 'react';
import { ShapeData } from './VectorCanvas';
import { Button } from '@canva/app-ui-kit';

interface AlterPanelProps {
  selectedShapes: ShapeData[];
}

const AlterPanel: React.FC<AlterPanelProps> = ({ selectedShapes }) => {
  const t = (s: string) => s;

  const handleConvertToBezier = (type: 'points' | 'curves') => {
    if (selectedShapes.length === 1 && window.canvasRef) {
      window.canvasRef.convertToBezier(selectedShapes[0].id, type);
    }
  };

  const handleAddBezierPoint = () => {
    if (selectedShapes.length === 1 && selectedShapes[0].type === 'bezier' && window.canvasRef) {
      window.canvasRef.addBezierPoint(selectedShapes[0].id);
    }
  };

  const handleAddBezierCurve = () => {
    if (selectedShapes.length === 1 && selectedShapes[0].type === 'bezier' && window.canvasRef) {
      window.canvasRef.addBezierCurve(selectedShapes[0].id);
    }
  };

  const handleUndo = () => {
    if (window.canvasRef) {
      window.canvasRef.undo();
    }
  };

  return (
    <div style={{ padding: '12px' }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
        Modify shapes
      </h3>
      
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px 0' }}>
          Selected: {selectedShapes.length}
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
      </div>

      {selectedShapes.length === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {selectedShapes[0].type !== 'bezier' && (
            <>
              <Button
                variant="primary"
                onClick={() => handleConvertToBezier('points')}
                style={{ fontSize: '11px', padding: '6px 8px' }}
              >
                {t('Convert to Bezier (points)')}
              </Button>
              <Button
                variant="primary"
                onClick={() => handleConvertToBezier('curves')}
                style={{ fontSize: '11px', padding: '6px 8px' }}
              >
                {t('Convert to Bezier (curves)')}
              </Button>
            </>
          )}
          
          {selectedShapes[0].type === 'bezier' && (
            <>
              <Button
                variant="primary"
                onClick={handleAddBezierPoint}
                style={{ fontSize: '11px', padding: '6px 8px' }}
              >
                {t('Add point')}
              </Button>
              <Button
                variant="primary"
                onClick={handleAddBezierCurve}
                style={{ fontSize: '11px', padding: '6px 8px' }}
              >
                {t('Add curve')}
              </Button>
              <Button
                variant="secondary"
                onClick={handleUndo}
                style={{ fontSize: '11px', padding: '6px 8px' }}
              >
                {t('Undo')}
              </Button>
            </>
          )}
        </div>
      )}

      {selectedShapes.length !== 1 && (
        <p style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
          {t('Select a single shape to modify it')}
        </p>
      )}
    </div>
  );
};

export default AlterPanel;