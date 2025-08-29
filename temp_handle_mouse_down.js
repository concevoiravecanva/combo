// Détecter les clics sur les formes ou les contrôles de Bézier
const handleMouseDown = (event: paper.ToolEvent) => {
  if (!selectionEnabledRef.current) return;

  const hitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 5
  };

  // Vérifier d'abord si on clique sur un contrôle de Bézier
  const controlHit = paper.project.hitTest(event.point, { 
    match: (item: paper.Item) => item.data && item.data.isSelectionVisual,
    tolerance: 8
  });

  if (controlHit && controlHit.item.data) {
    // Clic sur un contrôle de Bézier
    const { segmentIndex, type } = controlHit.item.data;
    
    // Trouver le chemin Bézier auquel appartient ce contrôle
    const bezierPath = paper.project.activeLayer.children.find(item => 
      item.data && 
      item.data.type === "bezier" && 
      selectedIdsRef.current.includes(item.data.id)
    ) as paper.Path;
    
    if (bezierPath && segmentIndex !== undefined) {
      // Sauvegarder l'état actuel des segments pour l'historique (avant modification)
      const currentSegments = bezierPath.segments.map(seg => seg.clone());
      if (bezierPath.data.history) {
        bezierPath.data.history.push(currentSegments);
      } else {
        bezierPath.data.history = [currentSegments];
      }
      
      // Limiter la taille de l'historique
      if (bezierPath.data.history.length > 20) {
        bezierPath.data.history.shift();
      }
      
      dragTypeRef.current = "bezierControl";
      selectedPointRef.current = bezierPath.segments[segmentIndex];
      
      if (type === "handleIn") {
        selectedHandleRef.current = selectedPointRef.current.handleIn;
        handleTypeRef.current = "in";
      } else if (type === "handleOut") {
        selectedHandleRef.current = selectedPointRef.current.handleOut;
        handleTypeRef.current = "out";
      } else {
        // C'est le point principal
        selectedHandleRef.current = null;
        handleTypeRef.current = null;
      }
      
      isDraggingRef.current = true;
    }
  } else {
    // Vérifier si on clique sur une forme
    const hitResult = paper.project.hitTest(event.point, hitOptions);
    
    if (hitResult && hitResult.item && hitResult.item.data && hitResult.item.data.id) {
      // Vérifier si la forme est déjà sélectionnée
      const isAlreadySelected = selectedIdsRef.current.includes(hitResult.item.data.id);
      
      // Si la touche Shift est enfoncée, ajouter à la sélection ou retirer
      if (event.modifiers.shift) {
        if (isAlreadySelected) {
          selectedIdsRef.current = selectedIdsRef.current.filter(id => id !== hitResult.item.data.id);
        } else {
          selectedIdsRef.current.push(hitResult.item.data.id);
        }
      } else if (!isAlreadySelected) {
        // Sinon, sélectionner uniquement cette forme
        selectedIdsRef.current = [hitResult.item.data.id];
      }
      
      // Mettre à jour l'affichage de la sélection
      updateSelectionVisuals();
      saveShapes();
      
      // Pour les éléments Bézier, nous avons déjà géré le drag dans la section précédente
      // Pour les autres types d'éléments (non-Bézier)
      dragItemRef.current = hitResult.item;
      dragOffsetRef.current = hitResult.item.position.subtract(event.point);
      isDraggingRef.current = true;
    }
    else {
      if (selectionEnabledRef.current) {
        deselectAll();
      }
    }
  }
};
