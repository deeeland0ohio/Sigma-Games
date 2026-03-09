const fs = require('fs');
const content = fs.readFileSync('src/data/games/misc.ts', 'utf-8');

const parts = content.split('export const ');

const imports1 = `import { Zap } from 'lucide-react';\nimport { Game } from '../../types';\n\n`;
const imports2 = `import { Ghost } from 'lucide-react';\nimport { Game } from '../../types';\n\n`;

fs.writeFileSync('src/data/games/solar-smash.ts', imports1 + 'export const ' + parts[1]);
fs.writeFileSync('src/data/games/theyre-coming.ts', imports2 + 'export const ' + parts[2]);
fs.writeFileSync('src/data/games/iron-lung.ts', imports2 + 'export const ' + parts[3]);
