const fs = require('fs');
const path = require('path');

const filePath = path.join('c:/Users/paolo/OneDrive/Desktop/Paolo/LogoPro/canva-apps-sdk-starter-kit/src', 'VectorCanvas.tsx');
const fileContents = fs.readFileSync(filePath, 'utf8');

const lines = fileContents.split('\n');

// Extraire les lignes autour de 868
const start = Math.max(0, 867 - 5);
const end = Math.min(lines.length - 1, 867 + 5);

console.log('Lignes autour de 868:');
for (let i = start; i <= end; i++) {
  const line = lines[i];
  const hex = Buffer.from(line).toString('hex');
  console.log(`Ligne ${i+1}: ${JSON.stringify(line)} (hex: ${hex})`);
}

// Créer une version corrigée
const fixedLine = "        if (selectionEnabledRef.current) {";
const correctedLines = [...lines];
correctedLines[867] = fixedLine;

// Écrire le fichier corrigé
fs.writeFileSync(filePath + '.fixed', correctedLines.join('\n'));
console.log('Fichier corrigé créé: ' + filePath + '.fixed');
