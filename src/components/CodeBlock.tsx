import React, { useState } from 'react';
import { Copy, Check, Code2, Terminal } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code', err);
    }
  };

  const displayLang = (language || 'code').toLowerCase().replace('language-', '');

  return (
    <div className="my-3 rounded-xl border border-zinc-800 bg-[#0d1117] overflow-hidden shadow-xl text-left font-mono">
      {/* Code Window Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900/90 border-b border-zinc-800/80 select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          {displayLang === 'bash' || displayLang === 'sh' || displayLang === 'shell' ? (
            <Terminal size={13} className="text-emerald-400 ml-1" />
          ) : (
            <Code2 size={13} className="text-blue-400 ml-1" />
          )}
          <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
            {displayLang}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-zinc-300 hover:text-white text-[11px] font-sans font-medium transition-all cursor-pointer shadow-sm active:scale-95"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 text-[13px] leading-relaxed text-zinc-200">
        <pre className="font-mono m-0 p-0 whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
