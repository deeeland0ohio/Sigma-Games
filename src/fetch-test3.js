import https from 'https';

const url = 'https://raw.githubusercontent.com/genizy/web-port/master/ultrakill/Build/ultrakill.data.unityweb.part1';

https.request(url, {method: 'HEAD'}, (res) => {
  console.log(`${url}: ${res.statusCode} - ${res.headers['content-length']} bytes`);
}).end();