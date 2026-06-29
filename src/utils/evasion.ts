export function isEvasionActive(): boolean {
  return localStorage.getItem('lightspeed-evasion') === 'true';
}

export function launchEvasion(url: string, title: string): boolean {
  try {
    const win = window.open('about:blank', '_blank');
    if (win) {
      win.document.title = title || 'Sigma Games';
      const fav = win.document.createElement('link');
      fav.rel = 'icon';
      const savedIcon = localStorage.getItem('app-cloaking-icon');
      if (savedIcon) {
        fav.type = 'image/png';
        fav.href = savedIcon;
      } else {
        fav.type = 'image/svg+xml';
        fav.href = 'https://sigma-sigma-rizz.vercel.app/favicon.svg';
      }
      win.document.head.appendChild(fav);

      const iframe = win.document.createElement('iframe');
      iframe.src = url;
      iframe.style.position = 'fixed';
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.width = '100vw';
      iframe.style.height = '100vh';
      iframe.style.border = 'none';
      iframe.style.margin = '0';
      iframe.style.padding = '0';
      iframe.setAttribute('allow', 'autoplay; fullscreen; pointer-lock; keyboard-map');
      iframe.setAttribute('allowfullscreen', 'true');
      
      win.document.body.style.margin = '0';
      win.document.body.style.overflow = 'hidden';
      win.document.body.style.backgroundColor = '#000000';
      win.document.body.appendChild(iframe);
      return true;
    } else {
      alert("Popup blocked! Please allow popups for this site to use secure evasion launching.");
    }
  } catch (e) {
    console.error("Failed to launch evasion about:blank", e);
  }
  return false;
}
