import React, { useState, useEffect, useRef } from 'react';
import { X, GripHorizontal, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { SettingsContent } from '../pages/Settings';

export default function SettingsOverlay() {
  const { 
    isSettingsOpen, 
    setIsSettingsOpen,
    settingsBoxSize: size,
    setSettingsBoxSize: setSize,
    settingsBoxPosition: position,
    setSettingsBoxPosition: setPosition
  } = useTheme();
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResize = (direction: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;
    const startPosX = position.x;
    const startPosY = position.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startPosX;
      let newY = startPosY;

      if (direction.includes('right')) newWidth = Math.max(300, startWidth + deltaX);
      if (direction.includes('bottom')) newHeight = Math.max(300, startHeight + deltaY);
      if (direction.includes('left')) {
        const possibleWidth = Math.max(300, startWidth - deltaX);
        if (possibleWidth !== 300 || startWidth !== 300) {
          newWidth = possibleWidth;
          newX = startPosX + (startWidth - newWidth);
        }
      }
      if (direction.includes('top')) {
        const possibleHeight = Math.max(300, startHeight - deltaY);
        if (possibleHeight !== 300 || startHeight !== 300) {
          newHeight = possibleHeight;
          newY = startPosY + (startHeight - newHeight);
        }
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    };

    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSettingsOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              left: position.x,
              top: position.y,
              width: size.width,
              height: size.height
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={isResizing ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto select-none"
            style={{ minWidth: 300, minHeight: 300 }}
          >
            {/* Drag Handle / Header */}
            <div 
              className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50 cursor-move active:cursor-grabbing"
              onMouseDown={(e) => {
                if ((e.target as HTMLElement).closest('button')) return;
                const startX = e.clientX - position.x;
                const startY = e.clientY - position.y;

                const onMouseMove = (moveEvent: MouseEvent) => {
                  setPosition({
                    x: moveEvent.clientX - startX,
                    y: moveEvent.clientY - startY
                  });
                };

                const onMouseUp = () => {
                  document.removeEventListener('mousemove', onMouseMove);
                  document.removeEventListener('mouseup', onMouseUp);
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
              }}
            >
              <div className="flex items-center gap-3">
                <GripHorizontal size={18} className="text-zinc-500" />
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">System Settings</h2>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 p-6 scrollbar-thin scrollbar-thumb-zinc-800 select-text overflow-auto flex-shrink-0 min-w-[300px]">
              <SettingsContent />
            </div>

            {/* Resize Handles */}
            <div className="absolute top-0 left-0 w-2 h-full cursor-ew-resize" onMouseDown={(e) => handleResize('left', e)} />
            <div className="absolute top-0 right-0 w-2 h-full cursor-ew-resize" onMouseDown={(e) => handleResize('right', e)} />
            <div className="absolute top-0 left-0 w-full h-2 cursor-ns-resize" onMouseDown={(e) => handleResize('top', e)} />
            <div className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize" onMouseDown={(e) => handleResize('bottom', e)} />
            
            {/* Corners */}
            <div className="absolute top-0 left-0 w-4 h-4 cursor-nwse-resize" onMouseDown={(e) => handleResize('topleft', e)} />
            <div className="absolute top-0 right-0 w-4 h-4 cursor-nesw-resize" onMouseDown={(e) => handleResize('topright', e)} />
            <div className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize" onMouseDown={(e) => handleResize('bottomleft', e)} />
            <div className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize" onMouseDown={(e) => handleResize('bottomright', e)} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
