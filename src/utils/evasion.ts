export function isEvasionActive(): boolean {
  return localStorage.getItem('lightspeed-evasion') === 'true';
}

export function launchEvasion(url: string, title: string): boolean {
  try {
    const win = window.open('about:blank', '_blank');
    if (!win) {
      alert("Popup blocked! Please allow popups for this site to use secure evasion launching.");
      return false;
    }

    const savedTitle = localStorage.getItem('app-cloaking-title') || title || 'Sigma Games';
    const savedIcon = localStorage.getItem('app-cloaking-icon') || 'https://images.squarespace-cdn.com/content/v1/5aa8af1fc3c16a54bcbb0415/1564754301251-MJVM1PU59EMR6IK42DDO/LAUSD.png?format=2500w';

    // Resolve relative game URLs to absolute URLs so they can load correctly from about:blank
    let targetUrl = url;
    if (url.startsWith('./') || url.startsWith('/') || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      const a = document.createElement('a');
      a.href = url;
      targetUrl = a.href;
    }

    win.document.open();
    win.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${savedTitle}</title>
        <link id="dynamic-favicon" rel="icon" type="image/png" href="${savedIcon}" />
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #000000;
          }
          iframe {
            border: none;
            width: 100vw;
            height: 100vh;
            position: fixed;
            top: 0;
            left: 0;
            margin: 0;
            padding: 0;
          }
        </style>
      </head>
      <body>
        <iframe src="${targetUrl}" allow="autoplay; fullscreen; pointer-lock; keyboard-map" allowfullscreen="true"></iframe>
      </body>
      </html>
    `);
    win.document.close();

    return true;
  } catch (e) {
    console.error("Failed to launch evasion about:blank", e);
  }
  return false;
}
