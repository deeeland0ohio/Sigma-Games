const https = require('https');
https.get('https://cdn.jsdelivr.net/gh/genizy/bl/Build/BlockBlast1.1-8.loader.js', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log("STATUS:", res.statusCode); console.log("DATA:", data.substring(0, 200)); });
});
