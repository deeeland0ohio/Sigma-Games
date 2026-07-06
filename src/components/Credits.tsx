import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeColors } from '../context/ThemeContext';

export default function Credits() {
  const [isOpen, setIsOpen] = useState(false);
  const colors = useThemeColors();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`p-2 text-zinc-400 hover:${colors.secondary} hover:bg-zinc-800 rounded-lg transition-colors`}
        title="Show Credits"
      >
        <Info size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 bg-transparent"
          >
            <motion.div
              initial={{ scale: 0.9, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full relative shadow-2xl"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 tracking-tight">
                <Info className={colors.secondary} />
                Credits
              </h2>

              <div className="space-y-6">
                <div>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-300">
                      <span className="text-zinc-500">Games:</span> <span className={colors.textGradient || colors.primary}>
                        <a href="https://www.gn-math.dev/" target="_blank" rel="noopener noreferrer" className="hover:underline">GN-Math</a>,{' '}
                        <a href="https://docs.google.com/document/d/1_FmH3BlSBQI7FGgAQL59-ZPe8eCxs35wel6JUyVaG8Q/edit?tab=t.0" target="_blank" rel="noopener noreferrer" className="hover:underline">UGS</a>,{' '}
                        <a href="https://github.com/a456pur/seraph" target="_blank" rel="noopener noreferrer" className="hover:underline">Seraph</a>,{' '}
                        <a href="https://truffled.lol/" target="_blank" rel="noopener noreferrer" className="hover:underline">Truffled</a>,{' '}
                        <a href="https://3kh0.net/" target="_blank" rel="noopener noreferrer" className="hover:underline">3kh0</a>,{' '}
                        <a href="https://noahstutoring.academy/" target="_blank" rel="noopener noreferrer" className="hover:underline">Noah's Hub</a>,{' '}
                        <a href="https://dskjfoisjfsjio.github.io/" target="_blank" rel="noopener noreferrer" className="hover:underline">Alexr</a>, and{' '}
                        <a href="https://github.com/NOTAHACKER9999" target="_blank" rel="noopener noreferrer" className="hover:underline">Glitch</a>
                      </span>
                    </p>
                    <p className="text-zinc-300 mt-2">
                      <span className="text-zinc-500">Website:</span> <span className={colors.tertiary || colors.secondary}>All aspects of the website are my ideas, although it is coded by Gemini</span>
                    </p>
                    <p className="text-zinc-300 mt-2">
                      <span className="text-zinc-500">Inspiration:</span> <span className={colors.quaternary || 'text-orange-500'}><a href="https://noahstutoring.academy/" target="_blank" rel="noopener noreferrer" className="hover:underline">Noah's Tutoring Hub</a></span>
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className={`w-full mt-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-all ${colors.hoverShadow}`}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
