import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { Send, MessageSquare, X, User as UserIcon, UserPlus } from 'lucide-react';
import { useThemeColors } from '../context/ThemeContext';

interface Message {
  id: string;
  text: string;
  senderName: string;
  createdAt: number;
}

export default function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const [nickname, setNickname] = useState<string | null>(localStorage.getItem('chat_nickname'));
  const [tempName, setTempName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const colors = useThemeColors();

  useEffect(() => {
    // Connect to the same host as the app
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('initial_messages', (msgs: Message[]) => {
      setMessages(msgs);
    });

    newSocket.on('new_message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleJoinChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    const name = tempName.trim();
    setNickname(name);
    localStorage.setItem('chat_nickname', name);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !nickname || !socket) return;

    const msg = {
      text: newMessage,
      senderName: nickname,
      createdAt: Date.now()
    };

    socket.emit('send_message', msg);
    setNewMessage('');
  };

  const handleLogout = () => {
    setNickname(null);
    localStorage.removeItem('chat_nickname');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`absolute bottom-16 right-0 w-80 md:w-96 h-[500px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden ${colors.shadow}`}
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <MessageSquare className={`w-5 h-5 ${colors.primaryText}`} />
                <span className="font-bold text-white tracking-tight uppercase">GLOBAL CHAT</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800"
            >
              {!nickname ? (
                <div className="flex flex-col items-center justify-center h-full space-y-6 text-center p-6">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-zinc-500" />
                  </div>
                  <div className="space-y-4 w-full">
                    <div className="space-y-1">
                      <p className="text-white font-bold tracking-tight uppercase">JOIN THE CHAT</p>
                      <p className="text-zinc-500 text-[10px] uppercase tracking-widest">ENTER A NICKNAME TO START</p>
                    </div>
                    
                    <form onSubmit={handleJoinChat} className="space-y-3">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        placeholder="YOUR NICKNAME..."
                        maxLength={20}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600 text-center uppercase font-mono"
                      />
                      <button
                        type="submit"
                        disabled={!tempName.trim()}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${colors.primaryBg} text-black hover:scale-[1.02] active:scale-95 disabled:opacity-50 uppercase`}
                      >
                        <UserPlus className="w-4 h-4" />
                        JOIN CHAT
                      </button>
                    </form>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-zinc-500 text-[10px] uppercase tracking-widest italic">NO MESSAGES YET...</div>
              ) : (
                messages.map((msg, idx) => (
                  <div 
                    key={msg.id || idx}
                    className={`flex flex-col ${msg.senderName === nickname ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {msg.senderName !== nickname && (
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          {msg.senderName}
                        </span>
                      )}
                    </div>
                    <div className={`
                      max-w-[85%] px-3 py-2 rounded-2xl text-sm break-words
                      ${msg.senderName === nickname 
                        ? `${colors.primaryBg} text-black rounded-tr-none` 
                        : 'bg-zinc-800 text-zinc-200 rounded-tl-none'}
                    `}>
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            {nickname && (
              <form 
                onSubmit={handleSendMessage}
                className="p-4 border-t border-zinc-800 bg-zinc-900/50 backdrop-blur-md flex gap-2"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="TYPE A MESSAGE..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-600 uppercase font-mono"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className={`p-2 rounded-xl transition-all ${colors.primaryBg} text-black disabled:opacity-50 disabled:grayscale hover:scale-105 active:scale-95`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            )}

            {/* Footer / User Info */}
            {nickname && (
              <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                    <UserIcon className="w-3 h-3 text-zinc-500" />
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate max-w-[150px]">
                    {nickname}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-[10px] font-bold text-zinc-500 hover:text-red-500 transition-colors uppercase tracking-widest"
                >
                  CHANGE NAME
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${colors.primaryBg} text-black ${colors.shadow}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
