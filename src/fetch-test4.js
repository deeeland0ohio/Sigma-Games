import https from 'https';

const url = 'https://cdn.jsdelivr.net/gh/genizy/web-port@main/ultrakill/Build/ultrakill.loader.js';

https.request(url, {method: 'HEAD'}, (res) => {
  console.log(`${url}: ${res.statusCode} - ${res.headers['content-length']} bytes`);
}).end();
