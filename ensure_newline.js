const fs = require('fs');

// Lire le fichier
const filePath = 'c:/Users/paolo/OneDrive/Desktop/Paolo/LogoPro/canva-apps-sdk-starter-kit/src/VectorCanvas.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// S'assurer que le fichier se termine par une ligne vide
let correctedContent = content;
if (!correctedContent.endsWith('\n')) {
  correctedContent += '\n';
}

fs.writeFileSync(filePath, correctedContent);
console.log("Fichier corrigé avec une ligne vide à la fin.");
