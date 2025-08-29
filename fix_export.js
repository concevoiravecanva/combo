const fs = require('fs');

// Lire le fichier
const filePath = 'c:/Users/paolo/OneDrive/Desktop/Paolo/LogoPro/canva-apps-sdk-starter-kit/src/VectorCanvas.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Identifier la partie problématique
const lines = content.split('\n');
const lastLines = lines.slice(-10);

console.log("Les 10 dernières lignes du fichier :");
lastLines.forEach((line, index) => {
  console.log(`${lines.length - 10 + index + 1}: "${line}"`);
});

// Créer une version corrigée avec un contenu clairement défini pour la fin du fichier
const correctedLines = [...lines];
const endingPosition = correctedLines.indexOf(correctedLines.find(line => line.includes('export default VectorCanvas')));

if (endingPosition !== -1) {
  // Conserver uniquement jusqu'à la ligne d'export incluse
  const validLines = correctedLines.slice(0, endingPosition + 1);
  // Assurons-nous que la ligne d'export est correcte
  validLines[endingPosition] = 'export default VectorCanvas;';
  
  fs.writeFileSync(`${filePath}`, validLines.join('\n'));
  console.log("Fichier corrigé et sauvegardé.");
} else {
  console.log("Ligne d'export non trouvée dans le fichier.");
}
