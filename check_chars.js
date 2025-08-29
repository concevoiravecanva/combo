const fs = require('fs');

// Lire le fichier
const filePath = 'c:/Users/paolo/OneDrive/Desktop/Paolo/LogoPro/canva-apps-sdk-starter-kit/src/VectorCanvas.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Diviser en lignes
const lines = content.split('\n');

// Examiner les lignes autour de 1199
console.log("Examen des lignes autour de 1199:");
for (let i = 1195; i <= 1202 && i < lines.length; i++) {
    const line = lines[i];
    console.log(`Ligne ${i+1}: "${line}"`);
    console.log(`Caractères (hex): ${Buffer.from(line).toString('hex')}`);
}

// Créer une version corrigée du fichier
const correctedLines = [...lines];
// Assurons-nous que la ligne d'export est correcte et sans caractères invisibles
correctedLines[1198] = "export default VectorCanvas;";

// Si le fichier se termine par des lignes vides ou des espaces supplémentaires, les supprimer
while (correctedLines.length > 0 && correctedLines[correctedLines.length - 1].trim() === '') {
    correctedLines.pop();
}

// Écrire la version corrigée
fs.writeFileSync(`${filePath}.fixed`, correctedLines.join('\n'));
console.log("Version corrigée écrite dans", `${filePath}.fixed`);
