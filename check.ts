import fs from 'fs';
const code = fs.readFileSync('lumin.js', 'utf8');
const lines = code.split('\n');
console.log(lines.find(l => l.toLowerCase().includes('lumin')));
