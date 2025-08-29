const fs = require('fs');

// Lire le fichier
const filePath = 'c:/Users/paolo/OneDrive/Desktop/Paolo/LogoPro/canva-apps-sdk-starter-kit/src/VectorCanvas.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Afficher les derniers caractères avec leur représentation hexadécimale
const lastChars = content.slice(-50);
console.log("Derniers 50 caractères:");
console.log(lastChars);
console.log("Représentation hexadécimale:");
console.log(Buffer.from(lastChars).toString('hex'));
