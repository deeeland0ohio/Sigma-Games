const https = require('https');

https.get('https://raw.githack.com/ethanaobrien/emulatorjs/main/data/loader.js', (res) => {
  console.log('Status:', res.statusCode);
});
