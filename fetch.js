const https = require('https');
https.get('https://raw.githubusercontent.com/genizy/bl/main/Build/BlockBlast1.1-8.loader.js', (res) => {
  console.log("STATUS:", res.statusCode);
});
