const fs = require('fs');
const path = require('path');

// Chemin du fichier
const filePath = path.resolve(__dirname, 'src', 'VectorCanvas.tsx');
// Lire le contenu du fichier
const content = fs.readFileSync(filePath, 'utf8');

// Trouver la position de la dernière occurrence de "export default VectorCanvas"
const exportPos = content.lastIndexOf('export default VectorCanvas');
if (exportPos !== -1) {
  // Créer un nouveau contenu qui s'arrête juste après l'export
  const newContent = content.slice(0, exportPos + 'export default VectorCanvas;'.length);
  // Écrire le nouveau contenu dans un fichier temporaire
  const tempPath = path.resolve(__dirname, 'src', 'VectorCanvas.tsx.new');
  fs.writeFileSync(tempPath, newContent);
  
  // Remplacer le fichier original
  fs.renameSync(tempPath, filePath);
  console.log('Fichier corrigé avec succès.');
} else {
  console.log('Export statement not found in file.');
}
