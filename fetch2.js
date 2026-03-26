import https from 'https';
https.get('https://cdn.jsdelivr.net/gh/genizy/bl/Build/BlockBlast1.1-8.loader.js', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log(res.statusCode, data));
});
