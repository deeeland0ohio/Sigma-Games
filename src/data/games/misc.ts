import { Zap, Ghost } from 'lucide-react';
import { Game } from '../../types';

export const solarSmash: Game = {
  id: 'solar-smash',
  title: 'Solar Smash',
  description: 'Planet destruction simulator.',
  icon: Zap,
  type: 'html',
  html: `<!-- Ultimate Game Stash file--> 
<!-- For the regularly updating doc go to https://docs.google.com/document/d/1_FmH3BlSBQI7FGgAQL59-ZPe8eCxs35wel6JUyVaG8Q/ -->

<!DOCTYPE html>
<html lang="en-us">

<head>
  <base href="https://cdn.jsdelivr.net/gh/bubbls/youtube-playables@c5eefc5c13316b94c58e63cb5270b99a13c88fea/solar-smash/">
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">

  <title>YT Game Wrapper WebGL Template</title>
  <link rel="stylesheet" href="TemplateData/style.css" nonce="we8ZPMAc10sjbMeA8f_pRw">
  <script src="https://cdn.jsdelivr.net/gh/bubbls/youtube-playables@main/ytgame.js" nonce="we8ZPMAc10sjbMeA8f_pRw"></script>
</head>

<body>
  <div id="unity-container" class="unity-desktop">
    <canvas id="unity-canvas" width=100% height=100% tabindex="-1"></canvas>
    <div id="unity-loading-bar">
      <div id="unity-logo"></div>
      <div id="unity-progress-bar-empty">
        <div id="unity-progress-bar-full"></div>
      </div>
    </div>
    <div id="unity-warning"> </div>
  </div>

  <script nonce="VdK5nAGpFKd9vu2JazSNaA">
    "use strict";
const DIST = 1,
    EXT = DIST ? ".min.js" : ".js";

function loadScript(e, r) {
    return loadScriptFromPath("lib/" + r + EXT)
}

function loadScriptFromPath(a) {
    return new Promise((r, e) => {
        if ("object" == typeof window) {
            let e = document.createElement("script");
            e.type = "text/javascript", e.src = a, e.onload = r, document.head.appendChild(e)
        } else "function" == typeof importScripts ? (importScripts(a), r()) : e()
    })
}

function currentScriptPath() {
    try {
        throw new Error("")
    } catch (e) {
        let r = e.stack,
            a = (-1 !== r.indexOf("@") ? r.split("@")[1].split("\\n") : r.split("(")[1].split(")"))[0];
        return a.substring(0, a.lastIndexOf("/")) + "/"
    }
}
let unrarMemoryFileLocation = null,
    g_on_loaded_cb = null,
    unrarReady = new Promise((e, r) => {
        g_on_loaded_cb = e
    });
class Unarchiver {
    static async load(e = null) {
        return e = e || ["zip", "rar", "tar", "gz", "xz", "bz2"], Promise.all(e.map(this._loadFormat))
    }
    static async _loadFormat(t) {
        if (!(t in Unarchiver.loadedFormats)) {
            let a = currentScriptPath();
            return Unarchiver.loadedFormats[t] = new Promise(async (e, r) => {
                switch (t) {
                    case "zip":
                        await loadScript(a, "jszip");
                        break;
                    case "rar":
                        unrarMemoryFileLocation = a + "lib/libunrar.js.mem", await loadScript(a, "libunrar"), await unrarReady;
                        break;
                    case "tar":
                        await loadScript(a, "libuntar");
                        break;
                    case "gz":
                        await loadScript(a, "pako_inflate");
                        break;
                    case "xz":
                        await loadScript(a, "xz");
                        break;
                    case "bz2":
                        await loadScript(a, "bz2");
                        break;
                    default:
                        throw new Error("Unknown archive format '" + t + "'.")
                }
                e()
            })
        }
        await Unarchiver.loadedFormats[t]
    }
    static open(r, l = null) {
        let o = this;
        return new Promise((i, e) => {
            let n = r.name;
            l = l || null;
            let s = new FileReader;
            s.onload = async () => {
                let e = s.result;
                o._isGzip(e) ? (await o._loadFormat("gz"), e = pako.inflate(e).buffer) : o._isXZ(e) ? (await o._loadFormat("xz"), e = toXZ(new Uint8Array(e), 0, 0, 0, 2 ** 28).buffer) : o._isBZ2(e) && (await o._loadFormat("bz2"), e = bz2.decompress(new Uint8Array(e)).buffer);
                let r = null,
                    a = [],
                    t = null;
                if (o._isRarFile(e)) t = "rar", await o._loadFormat(t), r = o._rarOpen(n, l, e), a = o._rarGetEntries(r);
                else if (o._isZipFile(e)) t = "zip", await o._loadFormat(t), r = await o._zipOpen(n, l, e), a = o._zipGetEntries(r);
                else {
                    if (!o._isTarFile(e)) throw new Error("The archive type is unknown");
                    t = "tar", await o._loadFormat(t), r = o._tarOpen(n, l, e), a = o._tarGetEntries(r)
                }
                a.sort((e, r) => e.name.localeCompare(r.name)), i({
                    file_name: n,
                    archive_type: t,
                    array_buffer: e,
                    entries: a,
                    handle: r
                })
            }, s.readAsArrayBuffer(r)
        })
    }
    static close(e) {
        e.file_name = null, e.archive_type = null, e.array_buffer = null, e.entries = null, e.handle = null
    }
    static _rarOpen(e, r, a) {
        return {
            file_name: e,
            array_buffer: a,
            password: r,
            rar_files: [{
                name: e,
                size: a.byteLength,
                type: "",
                content: new Uint8Array(a)
            }]
        }
    }
    static async _zipOpen(e, r, a) {
        return {
            file_name: e,
            array_buffer: a,
            password: r,
            zip: await JSZip.loadAsync(a)
        }
    }
    static _tarOpen(e, r, a) {
        return {
            file_name: e,
            array_buffer: a,
            password: r
        }
    }
    static _rarGetEntries(n) {
        return Object.entries(readRARFile(n.rar_files, n.password)).map(([, e]) => {
            let t = e.name,
                i = e.is_file;
            return {
                name: t,
                is_file: e.is_file,
                size_compressed: e.size_compressed,
                size_uncompressed: e.size_uncompressed,
                read: () => new Promise((r, a) => {
                    if (i) try {
                        readRARContent(n.rar_files, n.password, t, e => {
                            r(new File([e], t))
                        })
                    } catch (e) {
                        a(e)
                    } else r(null)
                })
            }
        })
    }
    static _zipGetEntries(e) {
        return Object.entries(e.zip.files).map(([, a]) => {
            let t = a.name,
                i = !a.dir;
            var e = a._data ? a._data.compressedSize : 0,
                r = a._data ? a._data.uncompressedSize : 0;
            return {
                name: t,
                is_file: i,
                size_compressed: e,
                size_uncompressed: r,
                read: () => new Promise(async (e, r) => {
                    e(i ? new File([await a.async("blob")], t) : null)
                })
            }
        })
    }
    static _tarGetEntries(s) {
        return tarGetEntries(s.file_name, s.array_buffer).map(t => {
            let i = t.name,
                n = t.is_file;
            var e = t.size;
            return {
                name: i,
                is_file: n,
                size_compressed: e,
                size_uncompressed: e,
                read: () => new Promise((e, r) => {
                    var a;
                    n ? (a = tarGetEntryData(t, s.array_buffer), e(new File([a.buffer], i))) : e(null)
                })
            }
        })
    }
    static _isRarFile(e) {
        if (e.byteLength < 8) return !1;
        e = new Uint8Array(e, 0, 8);
        return 82 == e[0] && (69 == e[1] && 126 == e[2] && 94 == e[3] || 97 == e[1] && 114 == e[2] && 33 == e[3] && 26 == e[4] && 7 == e[5] && (0 == e[6] || 1 == e[6] && 0 == e[7]))
    }
    static _isZipFile(e) {
        return this._checkHeader([80, 75, 3, 4], e)
    }
    static _isTarFile(e) {
        return this._checkHeader([117, 115, 116, 97, 114], e, 257, 512)
    }
    static _isGzip(e) {
        return this._checkHeader([31, 139, 8], e)
    }
    static _isBZ2(e) {
        return this._checkHeader([66, 90, 104], e)
    }
    static _isXZ(e) {
        return this._checkHeader([253, 55, 122, 88, 90, 0], e)
    }
    static _checkHeader(r, e, a = 0, t = null) {
        var i = a + r.length;
        if (e.byteLength < (t || i)) return !1;
        var n = new Uint8Array(e, a, i);
        for (let e = 0; e < r.length; ++e)
            if (n[e] != r[e]) return !1;
        return !0
    }
}
Unarchiver.loadedFormats = {};
  </script>
  <script nonce="VdK5nAGpFKd9vu2JazSNaA"> // Logic for Unity contianer
    var container = document.querySelector("#unity-container");
    var canvas = document.querySelector("#unity-canvas");
    var loadingBar = document.querySelector("#unity-loading-bar");
    var progressBarFull = document.querySelector("#unity-progress-bar-full");
    var fullscreenButton = document.querySelector("#unity-fullscreen-button");
    var fullscreenOverlayButton = document.querySelector("#unity-overlay-fullscreen-button");
    var quitcanvas = document.querySelector("#quit-canvas");
    var warningBanner = document.querySelector("#unity-warning");

    // For YT it is strongly encouraged that all warnings / errors show in
    // console and banners should be in game as needed to not confuse users.
    // 
    // If needed please uncomment section below to show a temporary message 
    // banner/ribbon for a few seconds, or a permanent error message on top 
    // of the canvas if type=='error'.
    function unityShowBanner(msg, type) {
      // function updateBannerVisibility() {
      //   warningBanner.style.display = warningBanner.children.length ? 'block' : 'none';
      // }
      // var div = document.createElement('div');
      // div.innerHTML = msg;
      // warningBanner.appendChild(div);
      // if (type == 'error') div.style = 'background: red; padding: 10px;';
      // else {
      //   if (type == 'warning') div.style = 'background: yellow; padding: 10px;';
      //   setTimeout(function() {
      //     warningBanner.removeChild(div);
      //     updateBannerVisibility();
      //   }, 5000);
      // }
      // updateBannerVisibility();
    }

    var buildUrl = "Build";
    var loaderUrl = buildUrl + "/Build.loader.js";
    var config = {
      dataUrl: buildUrl + "/Build.data",
      frameworkUrl: buildUrl + "/Build.framework.js",
        codeUrl: buildUrl + "/Build.wasm",
      streamingAssetsUrl: "StreamingAssets",
      companyName: "Paradyme Games",
      productName: "Live - Solar Smash YouTube",
      productVersion: "0.1.0",
      showBanner: unityShowBanner,
    };

    // By default, Unity keeps WebGL canvas render target size matched with
    // the DOM size of the canvas element (scaled by window.devicePixelRatio)
    // Set this to false if you want to decouple this synchronization from
    // happening inside the engine, and you would instead like to size up
    // the canvas DOM size and WebGL render target sizes yourself.
    // config.matchWebGLToCanvasSize = false;

    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      // Mobile device style: fill the whole browser client area with the game canvas:

      var meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes';
      document.getElementsByTagName('head')[0].appendChild(meta);
      container.className = "unity-mobile";
      canvas.className = "unity-mobile";

      // To lower canvas resolution on mobile devices to gain some
      // performance, uncomment the following line:
      //config.devicePixelRatio = 0.8;

    } else {
      // Desktop style: Render the game canvas in a window that can be maximized to fullscreen:
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    }

    loadingBar.style.display = "block";

    const subZipStr = '.zip';
    const subWASMStr = '.wasm';
    const subJSStr = '.js';
    const subDataStr = '.data';
    
    // loadResources is only used if you need load Zipped files for .wasm, or .data and need 
    // them to be decompressed. If the file is not zipped we bypass decompression step automatically,
    // however its best to not trigger this if you dont used compression. 
    // NOTE: GZip does not work ATM.  If this is needed Unarchiver will need to be updated.
    loadResources = (callback) => {
      // Check the Data Url first, followed by the WASM file
      var dataUrl = config.dataUrl;
      var shouldDecompress = true;
      // check if .zip already exists in the URL, if it doesnt check if a .zip file exists
      if (!dataUrl.includes(subZipStr)) {
        if (UrlExists(dataUrl + subZipStr)) {
          dataUrl = dataUrl + subZipStr;
        } else {
          shouldDecompress = false;
        }
      }

      if (shouldDecompress)
      {
        var blobTypeData = GetBlobType(dataUrl);
        DecompressFile(dataUrl, blobTypeData, (file) => {
          config.dataUrl = file;
          LoadWASM(callback);
        });
      }
      else
      {
        LoadWASM(callback);
      }
    }

    // Fetch/Load a file then call our callback 
    loadZipData = (url, callback) => {
      fetch(url)
        .then(response => response.blob())
        .then(blob => {
          callback(blob);
        });
    }

    function LoadWASM(callback)
    {
      // After Data file is checked decompress and check WASM file, followed by our callback
      var codeUrl = config.codeUrl;
      var shouldDecompress = true;

      // check if .zip already exists in the URL, if it doesnt check if a .zip file exists
      if (!codeUrl.includes(subZipStr)) {
        if (UrlExists(codeUrl + subZipStr)) {
          codeUrl = codeUrl + subZipStr;
        } else {
          shouldDecompress = false;
        }
      }

      // decompress if using a zip file, otherwise just load regular wasm file
      if (shouldDecompress) {
        // Decompress the file based on the type, WASM, JS, etc.
        // if you need more types please add a const above and modify the type logic below.
        var blobTypeWASM = GetBlobType(codeUrl);
        DecompressFile(codeUrl, blobTypeWASM, (file) => {
          config.codeUrl = file;
          callback();
        });
      } else {
        callback();
      }
    }

    function GetBlobType(urlToCheck) {
      // if you need more types please add a const above and modify the type logic below.
      // Note that octet-stream default is for .data files, JS and WASM have their own MIME types.
      var blobType = 'application/octet-stream';
      if (urlToCheck.includes(subWASMStr)){
        blobType = 'application/wasm';
      } else if (urlToCheck.includes(subJSStr)){
        blobType = 'text/javascript';
      } 
      return blobType;
    }

    // Check if URL / File exists
    function UrlExists(urlToCheck)
    {
        var httpReq = new XMLHttpRequest();
        httpReq.open('HEAD', urlToCheck, false);
        httpReq.send();
        return httpReq.status!=404;
    }

    // decompress files and call callback
    // TODO: test and potentially switch to Compression Streams API
    function DecompressFile(file, blobMimeType, callback) {
      let decompressedFile;

      loadZipData(file, (f) => {
        Unarchiver.open(f).then(async function (archive) {
          for (let entry of archive.entries) {
            if (entry.is_file) {
              let entryRead = await entry.read();
              let entryData = await entryRead.arrayBuffer();
              let dataBlob = new Blob([new Uint8Array(entryData)], { type: blobMimeType });
              decompressedFile = window.URL.createObjectURL(dataBlob);
            }
          }
          callback(decompressedFile);
        });
      });
    }

    var unityGameInstance = null;
    // Setup the Unity section once zip file is downloaded and decompressed
    function InitUnitySection() {
      var script = document.createElement("script");
      script.src = loaderUrl;
      script.onload = () => {
        createUnityInstance(canvas, config, (progress) => {
          progressBarFull.style.width = 100 * progress + "%";
          }).then((unityInstance) => {
            unityGameInstance = unityInstance;
            loadingBar.style.display = "none";
          }).catch((message) => {
            console.error(message);
          });
      };

      document.body.appendChild(script);
    }
const originalFetch = window.fetch;

window.fetch = function(input, options) {
    if (typeof input === 'string' && input.endsWith("AssetBundles/WebGL/planets")) {
        input = 'https://rawcdn.githack.com/bubbls/youtube-playables/c5eefc5c13316b94c58e63cb5270b99a13c88fea/solar-smash/StreamingAssets/AssetBundles/WebGL/planets';
        return originalFetch(input, options);
    } else if (typeof input === 'string' && input.endsWith("AssetBundles/WebGL/planets2")) {
        input = 'https://rawcdn.githack.com/bubbls/youtube-playables/c5eefc5c13316b94c58e63cb5270b99a13c88fea/solar-smash/StreamingAssets/AssetBundles/WebGL/planets2';
        return originalFetch(input, options);
    }

    return originalFetch(input, options);
};

    // Path 1: Use this path if no decompression of your .wasm, .data, .js files are needed
    //InitUnitySection();

    // Path 2: Use this path to Load resources (.wasm, .data) that are Zipped and need to be decompressed
    // if you dont use compresseion its best to comment out Path 1 and uncomment Path 2.
     loadResources(InitUnitySection);  // Uncomment this line to start Unity by loading zipped files
  </script>
</body>
</html>`,
  popularity: 83
};

export const theyreComing: Game = {
  id: 'drive-1',
  title: "They're Coming",
  description: 'Survive the endless waves.',
  icon: Ghost,
  type: 'html',
  html: `<!DOCTYPE html>

<html lang="en-us">
<head>
<meta charset="utf-8"/>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/awaiblecomponent/575@main/style.css"/>

<style>
        /* Убираем выделение по нажатию клавиш */
        canvas:focus {
            outline: none;
        }

        html, body {
            /* Убираем отступы */
            padding: 0;
            margin: 0;
            /* Отключаем скролл и лонгтап на IOS */
            overflow: hidden;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            -webkit-tap-highlight-color: rgba(0,0,0,0);
            /* Ставим высоту на 100% */
            height: 100%;
        }
    </style>
<!-- Additional head modules -->
</head>
<body class="dark">
<div id="unity-container" class="unity-desktop">
<canvas id="unity-canvas" tabindex="-1"></canvas>
</div>
<div id="loading-cover" style="display:none;">
<div id="unity-loading-bar">
<div id="unity-logo"><img src="https://cdn.jsdelivr.net/gh/awaiblecomponent/575@main/logo.png"/></div>
<div id="unity-progress-bar-empty" style="display: none;">
<div id="unity-progress-bar-full"></div>
</div>
<div class="spinner"></div>
</div>
</div>
<!-- Additional body modules -->
<script>
    const hideFullScreenButton = "";
    const buildUrl = "https://cdn.jsdelivr.net/gh/awaiblecomponent/575@main/Build";
    const loaderUrl = buildUrl + "/zombieshooterdone.loader.js";
    const config = {
        dataUrl: buildUrl + "/zombieshooterdone.data.br",
        frameworkUrl: buildUrl + "/zombieshooterdone.framework.js",
        streamingAssetsUrl: "StreamingAssets",
        companyName: "OnHitDev",
        productName: "They Are Coming",
        productVersion: "1.19"
    };

    const wasmParts = [
        \`\${buildUrl}/zombieshooterdone.wasm.br.part0\`,
        \`\${buildUrl}/zombieshooterdone.wasm.br.part1\`,
        \`\${buildUrl}/zombieshooterdone.wasm.br.part2\`,
        \`\${buildUrl}/zombieshooterdone.wasm.br.part3\`
    ];

    async function fetchAndMergeWasm() {
        const parts = await Promise.all(wasmParts.map(url =>
            fetch(url).then(r => {
                if (!r.ok) throw new Error(\`Failed to load \${url}\`);
                return r.arrayBuffer();
            })
        ));
        const totalLength = parts.reduce((sum, part) => sum + part.byteLength, 0);
        const merged = new Uint8Array(totalLength);
        let offset = 0;
        for (const part of parts) {
            merged.set(new Uint8Array(part), offset);
            offset += part.byteLength;
        }
        const blob = new Blob([merged], { type: "application/wasm+br" });
        return URL.createObjectURL(blob);
    }

fetchAndMergeWasm().then(blobUrl => {
    config.codeUrl = blobUrl;

    const script = document.createElement("script");
    script.src = loaderUrl;
    script.onload = () => {
        createUnityInstance(document.querySelector("#unity-canvas"), config, (progress) => {
            const loader = document.querySelector("#unity-loading-bar");
            if (loader) loader.style.width = \`\${progress * 100}%\`;
        }).then((unityInstance) => {
            myGameInstance = unityInstance;
            document.querySelector("#loading-cover").style.display = "none";
        }).catch((message) => {
            console.error("Unity yükleme hatası:", message);
        });
    };
    document.body.appendChild(script);
});

    

        const container = document.querySelector("#unity-container");
        const canvas = document.querySelector("#unity-canvas");
        const loadingCover = document.querySelector("#loading-cover");
        const progressBarEmpty = document.querySelector("#unity-progress-bar-empty");
        const progressBarFull = document.querySelector("#unity-progress-bar-full");
        const spinner = document.querySelector('.spinner');

        const canFullscreen = (function () {
            for (const key of [
                'exitFullscreen',
                'webkitExitFullscreen',
                'webkitCancelFullScreen',
                'mozCancelFullScreen',
                'msExitFullscreen',
            ]) {
                if (key in document) {
                    return true;
                }
            }
            return false;
        }());

        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
            container.className = "unity-mobile";
            
        }

        // Фоновое изображение при загрузке игры. При сборке билда код меняется взависимости от настроек проекта.
        
        loadingCover.style.background = "url('background.png') center / cover";

        loadingCover.style.display = "";

        // Выключаем появление меню при правом клике мыши
          document.addEventListener('contextmenu', event => event.preventDefault());

        function FocusGame() {
            window.focus();
            canvas.focus();
        }

        window.addEventListener('pointerdown', FocusGame);
        window.addEventListener('touchstart', FocusGame);

        let StartUnityInstance;
        let myGameInstance;
        let ysdk = null; // Yandex SDK pasif

        // 
        let environmentData = {
            language: "en",
            domain: "default_domain",
            deviceType: "desktop",
            isMobile: false,
            isDesktop: true,
            isTablet: false,
            isTV: false,
            appID: "default_app_id",
            browserLang: navigator.language || "en",
            payload: null,
            promptCanShow: false,
            reviewCanShow: false,
            platform: navigator.platform,
            browser: (function() {
                let userAgent = navigator.userAgent;
                if (userAgent.includes("YaBrowser")) return "Yandex";
                if (userAgent.includes("OPR") || userAgent.includes("Opera")) return "Opera";
                if (userAgent.includes("Firefox")) return "Firefox";
                if (userAgent.includes("MSIE") || userAgent.includes("Trident")) return "IE";
                if (userAgent.includes("Edge")) return "Edge";
                if (userAgent.includes("Chrome")) return "Chrome";
                if (userAgent.includes("Safari")) return "Safari";
                return "Other";
            })()
        };
        
        let cloudSaves = 'noData';
        let paymentsData = 'none';
        let playerData = 'noData'; // Varsayılan playerData tanımı
        let player = null;
        let payments = null;
        let initGame = false;
        let nowFullAdOpen = false;

        // 
        function GetPayments() { console.warn("GetPayments is not implemented"); return Promise.resolve("none"); }
        function SaveCloud() { console.warn("SaveCloud is not implemented"); }
        function LoadCloud() { console.warn("LoadCloud is not implemented"); return Promise.resolve("noData"); }
        function InitPlayer() { console.warn("InitPlayer is not implemented"); return Promise.resolve("noData"); }


        function FullAdShow() {
    try {
        // Prevent multiple fullscreen ads from opening simultaneously
        if (!nowFullAdOpen) {
            nowFullAdOpen = true;

            // If the game is initialized, notify Unity to open the fullscreen ad
            if (initGame) {
                myGameInstance.SendMessage("YandexGame", "OpenFullAd");
            }

            // Simulate ad duration (500ms) and then close it
            setTimeout(() => {
                nowFullAdOpen = false;
                if (initGame) {
                    myGameInstance.SendMessage("YandexGame", "CloseFullAd", "true");
                }
                FocusGame(); // Refocus the game after ad closes
            }, 500);
        }
    } catch (error) {
        // Silently handle any errors
    }
}


function RewardedShow(rewardId) {
    try {
        // Notify Unity to open the rewarded video with the given reward ID
        myGameInstance.SendMessage("YandexGame", "RewardVideo", rewardId);

        // After the ad, close it and refocus the game
        function closeRewardedAd() {
            myGameInstance.SendMessage("YandexGame", "CloseRewardVideo");
            FocusGame();
        }
        closeRewardedAd(); // Immediate closure for simplicity; in practice, this might be delayed or conditional
    } catch (error) {
        // Silently handle any errors
    }
}



        function StickyAdActivity() { console.warn("StickyAdActivity is not implemented"); }
        function Review() { console.warn("Review is not implemented"); }
        function PromptShow() { console.warn("PromptShow is not implemented"); }
        function InitLeaderboards() { console.warn("InitLeaderboards is not implemented"); }
        function GetLeaderboardScores() { console.warn("GetLeaderboardScores is not implemented"); }
        function SetLeaderboardScores() { console.warn("SetLeaderboardScores is not implemented"); }
        function ConsumePurchase() { console.warn("ConsumePurchase is not implemented"); }
        function ConsumePurchases() { console.warn("ConsumePurchases is not implemented"); } // 


        function InitGame() {
            try {
                console.log('Init Game Success');
                initGame = true;
                if (nowFullAdOpen === true && myGameInstance != null) {
                    myGameInstance.SendMessage('YandexGame', 'OpenFullAd');
                }
            } catch (error) {
                console.error("InitGame sırasında hata:", error);
            }
        }

        // 
        window.addEventListener("unhandledrejection", function(event) {
            console.warn("Hata es geçildi:", event.reason);
            event.preventDefault();
        });
    </script>
</body>
</html>`,
  popularity: 79
};

export const ironLung: Game = {
  id: 'iron-lung',
  title: 'Iron Lung',
  description: 'A short horror game set in a blood ocean.',
  icon: Ghost,
  type: 'html',
  html: `<!DOCTYPE html>
<html lang="en-us">

<head>
  <base href="https://cdn.jsdelivr.net/gh/web-ports/iron-lung@main/">
  <meta charset="utf-8">
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <title>IRON LUNG</title>
  <style>
    html,
    body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }

    #unity-canvas {
      width: 100%;
      height: 100%;
      background: #000000;
      display: block;
    }
    #loading-text {
  font-weight: bold;
  background: linear-gradient(
    270deg,
    #ff0000,
    #ff7f00,
    #ffff00,
    #00ff00,
    #0000ff,
    #4b0082,
    #8f00ff
  );
  background-size: 400% 400%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: rainbow 3s ease infinite;
}

@keyframes rainbow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

  </style>
</head>

<body>
  <div id="loading-text"
    style="color: white; font-size: 48px; font-family: cursive; text-align: center; margin-top: 20px;"> LOADING...
  </div>
  <canvas id="unity-canvas"></canvas>
  <script src="Build/built.loader.js"></script>
  <script>var loadingText = document.querySelector("#loading-text");
    let totalBytes = 0;
    let loadedBytes = 0;

    async function fetchWithProgress(url) {
      const response = await fetch(url);
      const reader = response.body.getReader();
      let chunks = [];
      let received = 0;
      while (true) {
        const {
          done,
          value
        } = await reader.read();
        if (done) break;
        received += value.length;
        loadedBytes += value.length;
        chunks.push(value);
        let mbDone = (loadedBytes / (1024 * 1024)).toFixed(2);
        let mbTotal = '60.7';
        loadingText.textContent = \`LOADING... \${mbDone} MB / \${mbTotal} MB\`;
      }
      let fullBuffer = new Uint8Array(received);
      let offset = 0;
      for (let chunk of chunks) {
        fullBuffer.set(chunk, offset);
        offset += chunk.length;
      }
      return fullBuffer.buffer;
    }
    async function mergeFiles(fileParts, cacheKey) {
      const buffers = await Promise.all(
        fileParts.map(part => fetchWithProgress(part))
      );
      const mergedBlob = new Blob(buffers);
      return URL.createObjectURL(mergedBlob);
    }

    function getParts(file, start, end) {
      let parts = [];
      for (let i = start; i <= end; i++) {
        parts.push(file + ".part" + i);
      }
      return parts;
    }
    (async () => {
      const [dataUrl, wasmUrl] = await Promise.all([
        mergeFiles(getParts("Build/built.data", 1, 2), "built.data"),
        mergeFiles(getParts("Build/built.wasm", 1, 2), "built.wasm"),
      ]);
      if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        var phoneScreenFixer = document.createElement('meta');
        phoneScreenFixer.name = 'viewport';
        phoneScreenFixer.content = 'width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes';
        document.getElementsByTagName('head')[0].appendChild(phoneScreenFixer);
      }

      var hugeCanvas = document.querySelector("#unity-canvas");

      createUnityInstance(hugeCanvas, {
        dataUrl: dataUrl,
        frameworkUrl: "Build/built.framework.js",
        codeUrl: wasmUrl,
        streamingAssetsUrl: "StreamingAssets",
        companyName: "98Corbins",
        productName: "Iron Lung",
        productVersion: "1.0",
      });
      loadingText.remove();
    })();
  </script>
</body>

</html>`,
  popularity: 85
};
