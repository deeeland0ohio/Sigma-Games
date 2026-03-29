import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { Send, MessageSquare, User as UserIcon, UserPlus, LogOut, Trash2 } from 'lucide-react';
import { useThemeColors } from '../context/ThemeContext';
import PageLayout from '../components/PageLayout';

interface Message {
  id: string;
  text: string;
  senderName: string;
  senderId: string;
  createdAt: number;
  isDeleted?: boolean;
  isPlaceholder?: boolean;
  isSystemInfo?: boolean;
  isAdminDeleted?: boolean;
}

interface ChatUser {
  id: string;
  nickname: string;
  lastActive: number;
  isTyping: boolean;
  isOwner?: boolean;
}

export default function ChatPage() {
  const [nickname, setNickname] = useState<string | null>(localStorage.getItem('chat_nickname'));
  const [tempName, setTempName] = useState('');
  const [password, setPassword] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, messageId: string, userId: string, nickname: string } | null>(null);
  const [, setTick] = useState(0); // Used to force re-render for message filtering
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastEnterTime = useRef<number>(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const colors = useThemeColors();

  // Force re-render every minute to filter out old messages
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      secure: true,
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      const savedNickname = localStorage.getItem('chat_nickname');
      if (savedNickname) {
        newSocket.emit('join_chat', savedNickname);
      }
    });
    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on('initial_messages', (msgs: Message[]) => {
      setMessages(msgs);
    });

    newSocket.on('new_message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    newSocket.on('user_list', (userList: ChatUser[]) => {
      setUsers(userList);
    });

    newSocket.on('join_success', ({ nickname: finalNickname, isOwner: ownerStatus }: { nickname: string, isOwner: boolean }) => {
      setNickname(finalNickname);
      setIsOwner(ownerStatus);
      localStorage.setItem('chat_nickname', finalNickname);
      setError(null);
    });

    newSocket.on('join_error', (msg: string) => {
      setError(msg);
    });

    newSocket.on('kicked', (msg: string) => {
      alert(msg);
      setNickname(null);
      setIsOwner(false);
      localStorage.removeItem('chat_nickname');
    });

    // Handle browser online/offline status
    const handleOnline = () => setIsConnected(newSocket.connected);
    const handleOffline = () => setIsConnected(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);

    return () => {
      newSocket.close();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleJoinChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim() || !socket) return;
    socket.emit('join_chat', { nickname: tempName.trim(), password });
  };

  useEffect(() => {
    if (socket && nickname) {
      if (newMessage.trim().length > 0 && !isTyping) {
        setIsTyping(true);
        socket.emit('typing', true);
      } else if (newMessage.trim().length === 0 && isTyping) {
        setIsTyping(false);
        socket.emit('typing', false);
      }

      // Auto stop typing after 3 seconds of no input
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          socket.emit('typing', false);
        }
      }, 3000);
    }
  }, [newMessage, socket, nickname]);

  const handleSendMessage = (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !nickname || !socket) return;

    const msg = {
      text: newMessage.trim(),
      senderName: nickname,
    };

    socket.emit('send_message', msg);
    setNewMessage('');
  };

  const handleDeleteMessage = (messageId: string, isPermanent: boolean = false, isAdminSoft: boolean = false) => {
    if (socket) {
      let type = 'soft';
      if (isPermanent) type = 'permanent';
      else if (isAdminSoft) type = 'admin_soft';
      
      socket.emit('delete_message', { messageId, type });
    }
    setContextMenu(null);
  };

  const handleKickUser = (userId: string) => {
    if (socket && isOwner) {
      console.log(`[CLIENT] Emitting kick_user for ID: ${userId}`);
      socket.emit('kick_user', userId);
    }
    setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    if (isOwner) {
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        messageId: msg.id,
        userId: msg.senderId,
        nickname: msg.senderName
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const now = Date.now();
      const diff = now - lastEnterTime.current;
      
      if (diff < 500 && diff > 0) {
        // Double enter detected
        e.preventDefault();
        handleSendMessage();
      } else {
        // First enter or too slow, let it add a newline naturally
        lastEnterTime.current = now;
      }
    }
  };

  const handleLogout = () => {
    setNickname(null);
    localStorage.removeItem('chat_nickname');
  };

  // Client-side message expiration filter
  const filteredMessages = messages.filter(msg => {
    const oneHourAgo = Date.now() - 3600000;
    return msg.createdAt > oneHourAgo;
  });

  return (
    <PageLayout title="" maxWidth="full" showBack={false}>
      <div className="max-w-[95%] mx-auto transform scale-[0.85] origin-top">
        <div className={`w-full h-[calc(100vh-4rem)] flex flex-col bg-zinc-900/95 rounded-2xl overflow-hidden relative shadow-2xl border border-zinc-800/50`}>
        {/* Subtle theme glow background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradientFrom} ${colors.gradientTo} opacity-10 pointer-events-none`} />
        
        {/* Chat Header */}
        <div className="p-6 border-b border-zinc-800/30 flex items-center justify-between bg-zinc-900/40 relative z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${colors.primaryBg} text-black`}>
              <MessageSquare size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight uppercase">Global Chat</h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${isConnected ? 'text-zinc-500' : 'text-red-500'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </p>
                <div className="w-1 h-1 rounded-full bg-zinc-800"></div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                  {users.length} Online
                </p>
              </div>
            </div>
          </div>
          {nickname && (
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all text-xs font-bold uppercase tracking-widest"
            >
              <LogOut size={14} />
              Exit Session
            </button>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-row min-h-0 relative z-10 overflow-hidden">
          {!nickname ? (
            <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8 text-center">
              <div className="w-full max-w-sm flex flex-col items-center space-y-8">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 shadow-xl"
                >
                  <UserIcon size={40} className="text-zinc-500" />
                </motion.div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white tracking-tight uppercase">Enter a name</h3>
                </div>
                
                <form onSubmit={handleJoinChat} className="w-full space-y-4">
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      placeholder="ENTER NICKNAME..."
                      maxLength={20}
                      autoFocus
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-6 py-4 text-lg text-white focus:outline-none focus:border-zinc-500 transition-all placeholder:text-zinc-700 text-center font-mono tracking-widest"
                    />
                    
                    {tempName === "Sigma Dev" && (
                      <motion.input
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="ENTER OWNER PASSWORD..."
                        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-6 py-4 text-lg text-white focus:outline-none focus:border-zinc-500 transition-all placeholder:text-zinc-700 text-center font-mono tracking-widest"
                      />
                    )}
                  </div>

                  {error && (
                    <p className="text-red-500 text-xs font-bold uppercase tracking-widest animate-pulse">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={!tempName.trim()}
                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg transition-all ${colors.primaryBg} text-black hover:scale-[1.02] active:scale-95 disabled:opacity-50 uppercase tracking-tighter shadow-lg ${colors.shadow}`}
                  >
                    <UserPlus size={20} />
                    Join Chat!
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <>
              {/* Main Chat Content */}
              <div className="flex-1 flex flex-col min-h-0 border-r border-zinc-800/50">
                {/* Messages List */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800"
                >
                  {filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-30">
                      <MessageSquare size={48} className="text-zinc-500" />
                      <p className="text-zinc-500 text-xs uppercase tracking-[0.3em] font-bold">Waiting for transmissions...</p>
                    </div>
                  ) : (
                    filteredMessages.map((msg, idx) => (
                        <div 
                          key={msg.id || idx}
                          className={`flex flex-col group ${msg.senderName === nickname ? 'items-end' : 'items-start'}`}
                          onContextMenu={(e) => handleContextMenu(e, msg)}
                        >
                          {/* Name above message */}
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${msg.senderName === "Sigma Dev" ? 'animate-rainbow' : 'text-zinc-500'}`}>
                              {msg.senderName}
                            </span>
                            {msg.senderName === "Sigma Dev" && (
                              <span className="text-[10px] font-black uppercase tracking-tighter animate-rainbow">
                                (The Owner)
                              </span>
                            )}
                          </div>
                          
                          <div className={`flex items-center gap-2 max-w-[85%] ${msg.senderName === nickname ? 'flex-row-reverse' : 'flex-row'}`}>
                            <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              className={`
                                px-4 py-3 rounded-2xl text-sm md:text-base break-words whitespace-pre-wrap relative group/msg
                                ${msg.isPlaceholder ? 'italic opacity-50' : ''}
                                ${msg.isSystemInfo ? 'bg-red-900/20 border border-red-500/30 text-red-200 italic' : 
                                  msg.senderName === nickname 
                                  ? `${colors.primaryBg} text-black rounded-tr-none font-medium` 
                                  : 'bg-zinc-800/50 text-zinc-200 rounded-tl-none'}
                              `}
                            >
                              {msg.isAdminDeleted ? (
                                <div className="flex items-center gap-1">
                                  <span>[DELETED BY </span>
                                  <span className="animate-rainbow font-black">Sigma Dev</span>
                                  <span>]</span>
                                </div>
                              ) : msg.text}
                              
                              {/* Delete Button on Hover (Always Soft Delete) */}
                              {!msg.isPlaceholder && !msg.isSystemInfo && !msg.isAdminDeleted && msg.senderName === nickname && (
                                <button 
                                  onClick={() => handleDeleteMessage(msg.id, false)}
                                  className={`
                                    absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 p-1.5 
                                    rounded-lg bg-zinc-900/80 text-zinc-400 hover:text-red-500 hover:bg-zinc-800 
                                    transition-all shadow-xl backdrop-blur-sm border border-zinc-700/50
                                    ${msg.senderName === nickname ? '-left-10' : '-right-10'}
                                  `}
                                  title="Delete Message"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </motion.div>
                          </div>
                        </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="p-6 border-t border-zinc-800 bg-zinc-900/40">
                  <div className="flex gap-4">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="TYPE A MESSAGE..."
                      autoFocus
                      rows={2}
                      className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-zinc-500 transition-all placeholder:text-zinc-700 font-mono tracking-wider resize-none"
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!newMessage.trim()}
                      className={`px-8 rounded-xl transition-all ${colors.primaryBg} text-black disabled:opacity-50 disabled:grayscale hover:scale-105 active:scale-95 shadow-lg ${colors.shadow}`}
                    >
                      <Send size={24} />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between px-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      {nickname ? `Logged in as: ${nickname}` : 'Not logged in'}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                      Double Enter to Send
                    </span>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="w-48 md:w-64 bg-zinc-900/30 flex flex-col overflow-hidden border-l border-zinc-800/50">
                <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-900/20">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Online Users</h3>
                  <span className={`px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-bold ${colors.primary}`}>
                    {users.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <AnimatePresence>
                    {users.map((user) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ 
                          opacity: 1, 
                          x: 0,
                        }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-3 group"
                      >
                        <div className="relative">
                          <div className={`w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700 group-hover:border-zinc-600 transition-colors`}>
                            <UserIcon size={14} className={user.nickname === nickname ? colors.primary : "text-zinc-500"} />
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-zinc-950"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs font-bold truncate uppercase tracking-wider transition-all duration-300 ${user.isTyping ? 'text-white animate-pulse' : user.isOwner ? 'animate-rainbow' : user.nickname === nickname ? colors.primary : 'text-zinc-400'}`}>
                              {user.nickname} {user.nickname === nickname && "(YOU)"}
                            </p>
                            {user.isOwner && (
                              <span className="text-[8px] font-black animate-rainbow">(The Owner)</span>
                            )}
                          </div>
                          {user.isTyping && (
                            <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest animate-pulse">
                              Typing...
                            </p>
                          )}
                        </div>
                        {isOwner && user.id !== socket?.id && (
                          <button 
                            onClick={() => handleKickUser(user.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                            title="Kick User"
                          >
                            <LogOut size={12} />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sigma Dev Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ left: contextMenu.x, top: contextMenu.y }}
            className="fixed z-[100] w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/50">
              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em]">Admin Controls</p>
              <p className="text-[10px] font-bold text-white truncate">{contextMenu.nickname}</p>
            </div>
            <button
              onClick={() => handleDeleteMessage(contextMenu.messageId, false, true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-orange-400 hover:bg-orange-500/10 transition-all uppercase tracking-wider"
            >
              <Trash2 size={14} />
              Admin Delete
            </button>
            <button
              onClick={() => handleDeleteMessage(contextMenu.messageId, true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all uppercase tracking-wider"
            >
              <Trash2 size={14} />
              Admin Remove
            </button>
            {contextMenu.userId !== socket?.id && (
              <button
                onClick={() => handleKickUser(contextMenu.userId)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500/20 transition-all uppercase tracking-wider"
              >
                <LogOut size={14} />
                Kick User
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </PageLayout>
);
}
