import https from 'https';

const url = 'https://raw.githubusercontent.com/genizy/web-port/91a15811d3425da1ab824a0d9ed2c2d3a3ec90f1/ultrakill/Build/ultrakill.data.unityweb.part1';

https.request(url, {method: 'HEAD'}, (res) => {
  console.log(`${url}: ${res.statusCode} - ${res.headers['content-length']} bytes`);
}).end();
