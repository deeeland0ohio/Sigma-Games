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

    // Write a loader page immediately to prevent popup blocking and show a pleasant loading experience
    win.document.open();
    win.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${savedTitle}</title>
        <link rel="icon" type="image/png" href="${savedIcon}" />
        <style>
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #000000;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .loader {
            text-align: center;
          }
          .spinner {
            border: 4px solid rgba(255, 255, 255, 0.1);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border-left-color: #06b6d4;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="loader">
          <div class="spinner"></div>
          <div>Loading game securely...</div>
        </div>
      </body>
      </html>
    `);
    win.document.close();

    // Fetch the HTML with cache-busting
    const fetchUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
    fetch(fetchUrl)
      .then(res => {
        if (res.ok) return res.text();
        throw new Error("HTTP " + res.status);
      })
      .then(fetchedHtml => {
        const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
        let html = fetchedHtml;
        const baseTag = `<base href="${baseUrl}">`;
        
        // Inject base tag
        if (!html.includes('<base ')) {
          if (html.includes('<head>')) {
            html = html.replace('<head>', `<head>${baseTag}`);
          } else if (html.includes('<html>')) {
            html = html.replace('<html>', `<html><head>${baseTag}</head>`);
          } else {
            html = baseTag + html;
          }
        }

        // Set custom title and favicon
        const titleTag = `<title>${savedTitle}</title>`;
        const iconTag = `<link rel="icon" type="image/png" href="${savedIcon}" />`;
        
        html = html.replace(/<title>[^]*?<\/title>/gi, '');
        if (html.includes('<head>')) {
          html = html.replace('<head>', `<head>${titleTag}${iconTag}`);
        } else {
          html = titleTag + iconTag + html;
        }

        win.document.open();
        win.document.write(html);
        win.document.close();
      })
      .catch(err => {
        console.warn("Evasion fetch failed, using iframe wrapper fallback:", err);
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
      });

    return true;
  } catch (e) {
    console.error("Failed to launch evasion about:blank", e);
  }
  return false;
}
