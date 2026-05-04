import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { games, allGamesList } from '../data/games';
import { useTheme, useThemeColors } from '../context/ThemeContext';
import PageLayout from '../components/PageLayout';
import GameCard from '../components/GameCard';
import { Play } from 'lucide-react';

const BOOT_LINES = [
  '</ SYSTEM STARTING',
  "</ WELCOME TO SIGMA GAMES.",
  '</ CONNECTING',
  '</ GAMES LOADING...',
  '</ READY TO PLAY...'
];

export default function Home() {
  const [bootSequence, setBootSequence] = useState<string[]>([]);
  const { runnerMode } = useTheme();
  const colors = useThemeColors();
  const [runnerCode, setRunnerCode] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {

    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < BOOT_LINES.length) {
        setBootSequence(prev => [...prev, BOOT_LINES[currentLine]]);
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const handleRunCode = () => {
    if (!runnerCode.trim() || runnerMode === 'none') return;
    
    const win = window.open('about:blank', '_blank');
    if (win) {
      (win as any).__RUNNER_CODE = runnerCode;
      if (runnerMode === 'html') {
        win.document.open();
        win.document.write(runnerCode);
        win.document.close();
      } else if (runnerMode === 'javascript') {
        win.document.open();
        if (runnerCode.trim().startsWith('<')) {
          let finalHtml = runnerCode;
          const scriptStr = `
            <script>
              (function() {
                const out = function(args, color) {
                  const msg = args.map(a => {
                    if (typeof a === 'object') {
                      try { return JSON.stringify(a); } catch(e) { return String(a); }
                    }
                    return String(a);
                  }).join(' ');
                  if (document.body) {
                    const div = document.createElement('div');
                    if (color) div.style.color = color;
                    div.style.fontFamily = 'monospace';
                    div.style.padding = '2px 0';
                    div.innerText = msg;
                    document.body.appendChild(div);
                  } else {
                    document.write('<div style="font-family:monospace;padding:2px 0;' + (color ? 'color:'+color : '') + '">' + msg + '</div>');
                  }
                };
                console.log = function(...args) { out(args); };
                console.warn = function(...args) { out(args, 'orange'); };
                console.info = function(...args) { out(args, '#8be9fd'); };
                console.error = function(...args) { out(args, 'red'); };
                console.clear = function() { if(document.body) document.body.innerHTML = ''; };
                window.onerror = function(msg) { out([msg], 'red'); };
              })();
            </script>
          `;
          if (/(<head>)/i.test(finalHtml)) {
            finalHtml = finalHtml.replace(/(<head>)/i, '$1' + scriptStr);
          } else if (/(<body>)/i.test(finalHtml)) {
            finalHtml = finalHtml.replace(/(<body>)/i, '$1' + scriptStr);
          } else if (/(<html>)/i.test(finalHtml)) {
            finalHtml = finalHtml.replace(/(<html>)/i, '$1' + scriptStr);
          } else {
            finalHtml = scriptStr + finalHtml;
          }
          win.document.write(finalHtml);
        } else {
          win.document.write(`
            <!DOCTYPE html>
            <html>
              <head><title>JS Runner</title></head>
              <body style="background: black; color: white; font-family: monospace; padding: 20px;">
                <script>
                  const out = function(args, color) {
                    const msg = args.map(a => {
                      if (typeof a === 'object') {
                        try { return JSON.stringify(a); } catch(e) { return String(a); }
                      }
                      return String(a);
                    }).join(' ');
                    const div = document.createElement('div');
                    if (color) div.style.color = color;
                    div.innerText = msg;
                    document.body.appendChild(div);
                  };
                  console.log = function(...args) { out(args); };
                  console.warn = function(...args) { out(args, 'orange'); };
                  console.info = function(...args) { out(args, '#8be9fd'); };
                  console.error = function(...args) { out(args, 'red'); };
                  console.clear = function() { document.body.innerHTML = ''; };
                  window.onerror = function(msg) {
                    console.error(msg);
                  };
                  try {
                    let result = eval(window.__RUNNER_CODE);
                    if (result !== undefined) {
                      const div = document.createElement('div');
                      div.style.color = 'gray';
                      div.innerText = '< ' + result;
                      document.body.appendChild(div);
                    }
                  } catch(e) {
                    console.error(e);
                  }
                </script>
              </body>
            </html>
          `);
        }
        win.document.close();
      } else if (runnerMode === 'python') {
        win.document.open();
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Python Runner</title>
              <script src="https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js"></script>
            </head>
            <body style="background: black; color: white; font-family: monospace; padding: 20px;">
              <div id="output">Loading Python Environment...<br></div>
              <script>
                async function main() {
                  let outDiv = document.getElementById('output');
                  try {
                    let pyodide = await loadPyodide({
                      stdout: (text) => {
                        outDiv.innerHTML += text + '<br>';
                      },
                      stderr: (text) => {
                        outDiv.innerHTML += '<span style="color:red">' + text + '</span><br>';
                      }
                    });
                    
                    pyodide.runPython(\`
import builtins
import js
import time

_original_sleep = time.sleep
def custom_sleep(secs):
    print(f"Warning: time.sleep({secs}) freezes the browser tab. In browser environments, prefer async/await if needed.")
    _original_sleep(secs)
time.sleep = custom_sleep

def custom_input(prompt=""):
    if prompt:
        print(prompt, end="")
    res = js.prompt(prompt)
    if res is None:
        raise EOFError("User cancelled input")
    print(res)
    return res
builtins.input = custom_input
                    \`);

                    outDiv.innerHTML = 'Running...<br><br>';
                    let result = await pyodide.runPythonAsync(window.__RUNNER_CODE);
                    if (result !== undefined) {
                      outDiv.innerHTML += '<br><span style="color:gray">&lt; ' + result + '</span>';
                    }
                  } catch(e) {
                    outDiv.innerHTML += '<span style="color:red">' + e + '</span>';
                  }
                }
                main();
              </script>
            </body>
          </html>
        `);
        win.document.close();
      }
    }
  };

  return (
    <PageLayout title="Home">
      <div className="space-y-24">
        {/* Terminal Boot Sequence */}
        <section 
          className={`bg-black border border-zinc-800 rounded-xl p-6 font-mono text-sm md:text-base shadow-2xl ${colors.shadow} ${runnerMode !== 'none' ? 'cursor-text' : ''}`}
          onClick={() => {
            if (runnerMode !== 'none' && bootSequence.length === BOOT_LINES.length) {
              inputRef.current?.focus();
            }
          }}
        >
          <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-4 text-zinc-500">
            <div className={`w-3 h-3 rounded-full ${colors.primaryBg}`}></div>
            <div className={`w-3 h-3 rounded-full ${colors.tertiaryBg || colors.secondaryBg}`}></div>
            <div className={`w-3 h-3 rounded-full ${colors.secondaryBg}`}></div>
            <span className="ml-2 text-xs uppercase tracking-widest text-zinc-500">ACCESSING SIGMA GAMES...</span>
          </div>
          <div className={`space-y-2 ${colors.terminalText} min-h-[140px]`}>
            {bootSequence.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                {line}
              </motion.div>
            ))}
            {bootSequence.length === BOOT_LINES.length && (
              <div className="flex items-start group relative mt-2">
                <span className="mr-2 mt-[2px]">&gt;</span>
                {runnerMode !== 'none' ? (
                  <div className="flex-1 flex flex-col items-end">
                    <textarea
                      ref={inputRef}
                      className="bg-transparent border-none outline-none w-full text-inherit shadow-none resize-none align-top overflow-hidden py-0 my-0 mt-[2px]"
                      rows={1}
                      style={{ minHeight: '24px' }}
                      value={runnerCode}
                      onChange={(e) => {
                        setRunnerCode(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleRunCode();
                        }
                      }}
                      placeholder={`Write ${runnerMode.toUpperCase()} code here... (Shift+Enter for new line)`}
                      spellCheck={false}
                    />
                    <AnimatePresence>
                      {runnerCode.trim() && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: -10 }}
                          onClick={handleRunCode}
                          className={`mt-4 p-2 px-6 ${colors.primaryBg} text-white rounded shadow-lg hover:brightness-110 flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider font-bold`}
                        >
                          <Play size={14} fill="currentColor" /> Run
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className={`w-2 h-5 ${colors.cursor}`}
                  />
                )}
              </div>
            )}
          </div>
        </section>

        {/* Games Grid */}
        <section id="games" className="space-y-8">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">OPTIONS</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {games.map((game) => (
              <GameCard 
                key={game.id} 
                game={game} 
                to={
                  game.id === 'all-games' ? '/all-games' : 
                  game.id === 'popular' ? '/popular' : 
                  game.id === 'favorites' ? '/favorites' : 
                  game.id === 'gn-math' ? '/gn-math' :
                  game.id === 'ugs' ? '/ugs' :
                  game.id === 'seraph' ? '/seraph' :
                  game.id === '3kh0' ? '/3kh0' :
                  game.id === 'noah' ? '/noah' :
                  game.id === 'lumin' ? '/lumin' :
                  undefined
                }
              />
            ))}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
