import React, { useRef } from 'react';
import { ShapeData } from './VectorCanvas';
import { Button } from '@canva/app-ui-kit';

interface AlterPanelProps {
  selectedShapes: ShapeData[];
}

const AlterPanel: React.FC<AlterPanelProps> = ({ selectedShapes }) => {
  const t = (s: string) => s;
  const statusRef = useRef<HTMLDivElement | null>(null);

  const announce = (msg: string) => {
    if (statusRef.current) {
      statusRef.current.textContent = msg;
      // force reflow if needed to retrigger announcement
      setTimeout(() => {
        if (statusRef.current) statusRef.current.textContent = msg;
      }, 30);
    }
  };

  const handleConvertToBezier = (type: 'points' | 'curves') => {
    if (selectedShapes.length === 1 && (window as any).canvasRef) {
      (window as any).canvasRef.convertToBezier(selectedShapes[0].id, type);
      announce(type === 'points'
        ? t('Converted to Bezier (points)')
        : t('Converted to Bezier (curves)')
      );
    }
  };

  const handleAddBezierPoint = () => {
    if (selectedShapes.length === 1 && selectedShapes[0].type === 'bezier' && (window as any).canvasRef) {
      (window as any).canvasRef.addBezierPoint(selectedShapes[0].id);
      announce(t('Point added'));
    }
  };

  const handleAddBezierCurve = () => {
    if (selectedShapes.length === 1 && selectedShapes[0].type === 'bezier' && (window as any).canvasRef) {
      (window as any).canvasRef.addBezierCurve(selectedShapes[0].id);
      announce(t('Curve added'));
    }
  };

  const handleUndo = () => {
    if ((window as any).canvasRef) {
      (window as any).canvasRef.undo();
      announce(t('Undo performed'));
    }
  };

  return (
    <section
      aria-labelledby="alterpanel-heading"
      style={{ padding: '12px' }}
    >
      <h2
        id="alterpanel-heading"
        style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}
      >
        {t('Modify shapes')}
      </h2>

      <div
        aria-live="polite"
        aria-atomic="true"
        style={{ fontSize: '12px', color: '#666', margin: '0 0 8px 0' }}
      >
        {t('Selected:')} {selectedShapes.length}
      </div>

      {selectedShapes.length > 0 && (
        <ul
          aria-label={t('Selected shapes')}
          style={{
            margin: '0 0 12px 0',
            padding: 0,
            listStyle: 'none',
            maxHeight: 120,
            overflowY: 'auto'
          }}
        >
          {selectedShapes.map(shape => (
            <li
              key={shape.id}
              style={{
                padding: '4px 8px',
                background: '#f0f0f0',
                borderRadius: 4,
                fontSize: 11,
                marginBottom: 4
              }}
            >
              <span aria-label={t(`Shape type ${shape.type}`)}>
                {shape.type}
              </span>
              {' – '}
              <code aria-hidden="true">{shape.id.slice(0, 6)}…</code>
            </li>
          ))}
        </ul>
      )}

      {selectedShapes.length === 1 && (
        <div
          role="group"
          aria-label={t('Bezier editing')}
          style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
        >
          {selectedShapes[0].type !== 'bezier' && (
            <>
              <Button
                type="button"
                variant="primary"
                aria-label={t('Convert to Bezier with straight points')}
                onClick={() => handleConvertToBezier('points')}
                style={{ fontSize: 11, padding: '6px 8px' }}
              >
                {t('Convert to Bezier (points)')}
              </Button>
              <Button
                type="button"
                variant="primary"
                aria-label={t('Convert to Bezier with smooth curves')}
                onClick={() => handleConvertToBezier('curves')}
                style={{ fontSize: 11, padding: '6px 8px' }}
              >
                {t('Convert to Bezier (curves)')}
              </Button>
            </>
          )}

          {selectedShapes[0].type === 'bezier' && (
            <>
              <Button
                type="button"
                variant="primary"
                aria-label={t('Add Bezier point')}
                onClick={handleAddBezierPoint}
                style={{ fontSize: 11, padding: '6px 8px' }}
              >
                {t('Add point')}
              </Button>
              <Button
                type="button"
                variant="primary"
                aria-label={t('Add Bezier curve')}
                onClick={handleAddBezierCurve}
                style={{ fontSize: 11, padding: '6px 8px' }}
              >
                {t('Add curve')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                aria-label={t('Undo last Bezier edit')}
                onClick={handleUndo}
                style={{ fontSize: 11, padding: '6px 8px' }}
              >
                {t('Undo')}
              </Button>
            </>
          )}
        </div>
      )}

      {selectedShapes.length !== 1 && (
        <p
          style={{ fontSize: 11, color: '#999', fontStyle: 'italic', marginTop: 8 }}
        >
          {t('Select a single shape to modify it')}
        </p>
      )}

      <div
        ref={statusRef}
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
    </section>
  );
};

export default AlterPanel;