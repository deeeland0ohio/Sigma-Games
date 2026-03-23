import https from 'https';

const urls = [
  'https://cdn.jsdelivr.net/gh/genizy/web-port@master/ultrakill/Build/ultrakill.data.unityweb.part1',
  'https://cdn.jsdelivr.net/gh/genizy/web-port@master/ultrakill/Build/ultrakill.data.unityweb.part2',
  'https://cdn.jsdelivr.net/gh/genizy/web-port@master/ultrakill/Build/ultrakill.data.unityweb.part3',
  'https://cdn.jsdelivr.net/gh/genizy/web-port@master/ultrakill/Build/ultrakill.data.unityweb.part4',
  'https://cdn.jsdelivr.net/gh/genizy/web-port@master/ultrakill/Build/ultrakill.wasm.unityweb.part1',
  'https://cdn.jsdelivr.net/gh/genizy/web-port@master/ultrakill/Build/ultrakill.wasm.unityweb.part2'
];

urls.forEach(url => {
  https.request(url, {method: 'HEAD'}, (res) => {
    console.log(`${url}: ${res.statusCode} - ${res.headers['content-length']} bytes`);
  }).end();
});