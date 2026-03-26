import https from 'https';
https.get('https://cdn.jsdelivr.net/gh/genizy/bl/Build/BlockBlast1.1-8.framework.js.unityweb', (res) => {
  console.log(res.headers);
});
