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
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
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
                  <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">Development</h3>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                    <p className="text-zinc-300">
                      <span className="text-zinc-500">Games:</span> <span className={colors.primary}>GN-Math, UGS and Truffled</span>
                    </p>
                    <p className="text-zinc-300 mt-2">
                      <span className="text-zinc-500">Website:</span> <span className={colors.secondary}>All aspects of the website are my ideas, although it is coded by Gemini</span>
                    </p>
                    <p className="text-zinc-300 mt-2">
                      <span className="text-zinc-500">Inspiration:</span> <span className="text-orange-500">Noah's Tutoring Hub</span>
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
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
