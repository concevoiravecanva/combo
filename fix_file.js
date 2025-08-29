const fs = require('fs');

// Lire le fichier
const filePath = 'c:/Users/paolo/OneDrive/Desktop/Paolo/LogoPro/canva-apps-sdk-starter-kit/src/VectorCanvas.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Diviser en lignes
const lines = content.split('\n');

// Examiner les lignes autour de 1199
console.log("Lignes autour de 1199:");
for (let i = 1194; i < Math.min(lines.length, 1204); i++) {
    const line = lines[i];
    console.log(`Ligne ${i+1}: "${line}" (hex: ${Buffer.from(line).toString('hex')})`);
}

// Créer une version corrigée du fichier
const correctedContent = content.substring(0, content.lastIndexOf("export default VectorCanvas;") + "export default VectorCanvas;".length);
fs.writeFileSync(`${filePath}.fixed`, correctedContent);
console.log("Version corrigée écrite dans", `${filePath}.fixed`);
