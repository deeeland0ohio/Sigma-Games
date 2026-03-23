import https from 'https';
https.request('https://cdn.jsdelivr.net/gh/genizy/web-port@master/ultrakill/Build/ultrakill.data.unityweb.part1', {method: 'HEAD'}, (res) => {
  console.log(res.statusCode);
  console.log(res.headers['content-length']);
}).end();