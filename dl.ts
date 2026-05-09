import https from 'https';
import fs from 'fs';
https.get('https://cdn.jsdelivr.net/gh/luminsdk/script@latest/lumin.min.js', res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => fs.writeFileSync('lumin.js', d));
});
