import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageSquare, User as UserIcon, LogOut, Trash2, X } from 'lucide-react';
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
  isPermanentlyRemoved?: boolean;
  os?: string;
}

interface ChatUser {
  id: string;
  nickname: string;
  lastActive: number;
  isTyping: boolean;
  isOwner?: boolean;
  os?: string;
}

const getOS = () => {
  const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
  if (userAgent.indexOf("Win") != -1) return "Windows";
  if (userAgent.indexOf("Mac") != -1) return "Mac";
  if (userAgent.indexOf("CrOS") != -1) return "Chromebook";
  if (userAgent.indexOf("Linux") != -1) return "Linux";
  return "Other";
};

// We use ntfy.sh, a free, public, permanent, high-scale Pub/Sub network over SSE/REST.
// This supports 100% free serverless real-time messaging, presence, deletion, and bans with zero database latency on Vercel and Cloud Run.
const NTFY_TOPIC_URL = 'https://ntfy.sh/sg_chat_unblocked_v5_9cd927ea_prod';

const publishEvent = async (payload: any) => {
  try {
    await fetch(NTFY_TOPIC_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Failed to publish real-time event:", err);
  }
};

export default function ChatPage() {
  const [userId, setUserId] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  
  const [inputNickname, setInputNickname] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(navigator.onLine);
  
  // Track online presence timestamps
  const [usersMap, setUsersMap] = useState<Record<string, ChatUser>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, messageId: string, userId: string, nickname: string } | null>(null);
  const [, setTick] = useState(0); // Force custom re-render for message expirations
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastEnterTime = useRef<number>(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const colors = useThemeColors();
  const [banTimeLeft, setBanTimeLeft] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startBanTimer = (end: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setBanTimeLeft(Math.floor((end - Date.now()) / 1000));
    intervalRef.current = setInterval(() => {
      const timeLeft = Math.floor((end - Date.now()) / 1000);
      if (timeLeft <= 0) {
        setBanTimeLeft(null);
        localStorage.removeItem('kick_end');
        if (intervalRef.current) clearInterval(intervalRef.current);
        window.location.reload();
      } else {
        setBanTimeLeft(timeLeft);
      }
    }, 1000);
  };

  // Initialize client userId
  useEffect(() => {
    let id = localStorage.getItem('chat_guest_id');
    if (!id) {
      id = 'u_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('chat_guest_id', id);
    }
    setUserId(id);

    const storedNickname = localStorage.getItem('chat_nickname');
    const storedIsOwner = localStorage.getItem('chat_is_owner') === 'true';
    if (storedNickname) {
      setNickname(storedNickname);
      setIsOwner(storedIsOwner);
    }

    const kickEnd = localStorage.getItem('kick_end');
    if (kickEnd) {
      const end = parseInt(kickEnd);
      if (Date.now() < end) {
        startBanTimer(end);
      } else {
        localStorage.removeItem('kick_end');
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Periodic client rendering ticks for the 2-hour filter helper
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync network status and custom window click listeners
  useEffect(() => {
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Dynamic Event Handling for incoming ntfy events
  const handleIncomingPayload = (payload: any) => {
    if (!payload || !payload.type) return;

    switch (payload.type) {
      case 'chat_message':
        setMessages(prev => {
          if (prev.some(m => m.id === payload.id)) return prev;
          const updated = [...prev, {
            id: payload.id,
            text: payload.text,
            senderName: payload.senderName,
            senderId: payload.senderId,
            createdAt: payload.createdAt,
            os: payload.os,
            isDeleted: payload.isDeleted,
            isPlaceholder: payload.isPlaceholder,
            isAdminDeleted: payload.isAdminDeleted,
            isPermanentlyRemoved: payload.isPermanentlyRemoved
          }];
          return updated.sort((a, b) => a.createdAt - b.createdAt);
        });
        break;

      case 'message_deleted':
        setMessages(prev => prev.map(m => {
          if (m.id === payload.messageId) {
            if (payload.isPermanentlyRemoved) {
              return { ...m, isDeleted: true, isPermanentlyRemoved: true };
            } else if (payload.isAdminDeleted) {
              return { ...m, isDeleted: true, isAdminDeleted: true, isPlaceholder: true };
            } else {
              return { ...m, isDeleted: true, isPlaceholder: true };
            }
          }
          return m;
        }));
        break;

      case 'user_presence':
        setUsersMap(prev => {
          const next = { ...prev };
          next[payload.id] = {
            id: payload.id,
            nickname: payload.nickname,
            lastActive: payload.lastActive || Date.now(),
            isTyping: payload.isTyping,
            isOwner: payload.isOwner,
            os: payload.os
          };
          return next;
        });
        break;

      case 'user_presence_offline':
        setUsersMap(prev => {
          const next = { ...prev };
          delete next[payload.id];
          return next;
        });
        break;

      case 'user_kick':
        const storedNickname = localStorage.getItem('chat_nickname');
        if (storedNickname && payload.nickname === storedNickname) {
          const kickEnd = payload.kickEnd || 0;
          if (Date.now() < kickEnd) {
            if (payload.kickType === '5m') {
              alert("You were kicked by the Owner for 5 minutes");
              localStorage.removeItem('chat_nickname');
              localStorage.removeItem('chat_is_owner');
              setNickname(null);
              setIsOwner(false);
              localStorage.setItem('kick_end', kickEnd.toString());
              startBanTimer(kickEnd);
            } else {
              alert("You were kicked by the Owner, you may join back in");
              localStorage.removeItem('chat_nickname');
              localStorage.removeItem('chat_is_owner');
              setNickname(null);
              setIsOwner(false);
            }
          }
        }
        break;

      default:
        break;
    }
  };

  // Real-time EventSource listener to ntfy.sh endpoint
  useEffect(() => {
    if (!userId) return;

    let active = true;
    let es: EventSource | null = null;

    const bootstrapAndConnect = async () => {
      setAuthLoading(true);
      try {
        // Fetch cached historic payloads from ntfy's cache via json query
        const res = await fetch(`${NTFY_TOPIC_URL}/json?poll=1`);
        if (res.ok) {
          const text = await res.text();
          const lines = text.trim().split('\n').filter(Boolean);
          
          const loadedMessages: Message[] = [];
          const loadedDeletedIds: Set<string> = new Set();
          const adminDeletedIds: Map<string, { type: 'soft' | 'hard' }> = new Map();

          for (const line of lines) {
            try {
              const raw = JSON.parse(line);
              if (raw.event === 'message') {
                const payload = JSON.parse(raw.message);
                if (payload.type === 'chat_message') {
                  loadedMessages.push({
                    id: payload.id,
                    text: payload.text,
                    senderName: payload.senderName,
                    senderId: payload.senderId,
                    createdAt: payload.createdAt,
                    os: payload.os,
                    isDeleted: payload.isDeleted,
                    isPlaceholder: payload.isPlaceholder,
                    isAdminDeleted: payload.isAdminDeleted,
                    isPermanentlyRemoved: payload.isPermanentlyRemoved
                  });
                } else if (payload.type === 'message_deleted') {
                  if (payload.isPermanentlyRemoved) {
                    adminDeletedIds.set(payload.messageId, { type: 'hard' });
                  } else if (payload.isAdminDeleted) {
                    adminDeletedIds.set(payload.messageId, { type: 'soft' });
                  } else {
                    loadedDeletedIds.add(payload.messageId);
                  }
                } else if (payload.type === 'user_presence') {
                  if (active) {
                    setUsersMap(prev => {
                      const next = { ...prev };
                      next[payload.id] = {
                        id: payload.id,
                        nickname: payload.nickname,
                        lastActive: payload.lastActive || Date.now(),
                        isTyping: payload.isTyping,
                        isOwner: payload.isOwner,
                        os: payload.os
                      };
                      return next;
                    });
                  }
                }
              }
            } catch (e) {
              // ignore safe line parse errors
            }
          }

          const finalMsgs = loadedMessages.map(msg => {
            const adminDel = adminDeletedIds.get(msg.id);
            if (adminDel?.type === 'hard') {
              return { ...msg, isDeleted: true, isPermanentlyRemoved: true };
            } else if (adminDel?.type === 'soft') {
              return { ...msg, isDeleted: true, isAdminDeleted: true, isPlaceholder: true };
            } else if (loadedDeletedIds.has(msg.id)) {
              return { ...msg, isDeleted: true, isPlaceholder: true };
            }
            return msg;
          });

          if (active) {
            finalMsgs.sort((a, b) => a.createdAt - b.createdAt);
            setMessages(finalMsgs);
          }
        }
      } catch (err) {
        console.error("Failed to bootstrap chat message cache:", err);
      } finally {
        if (active) setAuthLoading(false);
      }

      if (!active) return;

      // Connect to the real EventSource stream (using the exact /sse pathname)
      try {
        es = new EventSource(`${NTFY_TOPIC_URL}/sse`);

        es.onmessage = (event) => {
          if (!active) return;
          try {
            const raw = JSON.parse(event.data);
            if (raw.event === 'message') {
              const payload = JSON.parse(raw.message);
              handleIncomingPayload(payload);
            }
          } catch (e) {
            // ignore parsing error
          }
        };

        es.onerror = () => {
          // Native SSE automatically schedules dynamic reconnects
        };
      } catch (err) {
        console.error("Failed to initialize SSE EventSource connection:", err);
      }
    };

    bootstrapAndConnect();

    return () => {
      active = false;
      if (es) {
        es.close();
      }
    };
  }, [userId]);

  // Presence Heartbeat Loop
  useEffect(() => {
    if (!nickname || !userId) return;

    const broadcastPresence = () => {
      publishEvent({
        type: 'user_presence',
        id: userId,
        nickname,
        isTyping,
        isOwner,
        os: getOS(),
        lastActive: Date.now()
      });
    };

    broadcastPresence();
    const heartbeat = setInterval(broadcastPresence, 7000);

    return () => {
      clearInterval(heartbeat);
    };
  }, [nickname, userId, isTyping, isOwner]);

  // Broadcast offline presence on true unmount
  useEffect(() => {
    return () => {
      if (userId) {
        publishEvent({
          type: 'user_presence_offline',
          id: userId
        });
      }
    };
  }, [userId]);

  // Typing state tracking mechanism
  useEffect(() => {
    if (nickname) {
      if (newMessage.trim().length > 0 && !isTyping) {
        setIsTyping(true);
      } else if (newMessage.trim().length === 0 && isTyping) {
        setIsTyping(false);
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
        }
      }, 3000);
    }
  }, [newMessage, nickname, isTyping]);

  const handleJoinChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const trimmedNickname = inputNickname.trim();
    if (!trimmedNickname) {
      setError("Please enter a nickname.");
      return;
    }

    if (trimmedNickname.length > 25) {
      setError("Nickname must be 25 characters or less.");
      return;
    }

    const isSigmaDev = trimmedNickname.toLowerCase() === "sigma dev";
    if (isSigmaDev && inputPassword !== "sigmarizzsigmaenigma") {
      setError("Invalid password for Sigma Dev");
      return;
    }

    try {
      // Deconflict nicknames client-side
      let finalNickname = trimmedNickname;
      let suffix = 1;
      const existingNicknames = Object.values(usersMap)
        .filter(u => Date.now() - u.lastActive < 30000)
        .map(u => u.nickname.toLowerCase());
      
      if (existingNicknames.includes(finalNickname.toLowerCase())) {
        if (isSigmaDev) {
          finalNickname = "Sigma Dev";
        } else {
          while (existingNicknames.includes(finalNickname.toLowerCase() + (suffix > 1 ? `(${suffix})` : ''))) {
            suffix++;
          }
          finalNickname = `${trimmedNickname}(${suffix})`;
        }
      }

      localStorage.setItem('chat_nickname', finalNickname);
      localStorage.setItem('chat_is_owner', isSigmaDev ? 'true' : 'false');

      setNickname(finalNickname);
      setIsOwner(isSigmaDev);

      // Broadcast immediate presence
      if (userId) {
        publishEvent({
          type: 'user_presence',
          id: userId,
          nickname: finalNickname,
          isTyping: false,
          isOwner: isSigmaDev,
          os: getOS(),
          lastActive: Date.now()
        });
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to join chat: " + (err.message || String(err)));
    }
  };

  const handleSendMessage = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || !nickname || !userId) return;

    const msgId = Math.random().toString(36).substring(2, 15);
    try {
      await publishEvent({
        type: 'chat_message',
        id: msgId,
        text: trimmed,
        senderName: nickname,
        senderId: userId,
        createdAt: Date.now(),
        os: getOS()
      });
      setNewMessage('');
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleDeleteMessage = async (messageId: string, isPermanent: boolean = false, isAdminSoft: boolean = false) => {
    try {
      await publishEvent({
        type: 'message_deleted',
        messageId,
        isPermanentlyRemoved: isPermanent,
        isAdminDeleted: isAdminSoft
      });
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
    setContextMenu(null);
  };

  const handleKickUser = async (targetNickname: string, is5Minutes: boolean = false) => {
    if (!isOwner || !userId) return;
    const kickEnd = Date.now() + (is5Minutes ? 300000 : 5000);

    try {
      await publishEvent({
        type: 'user_kick',
        nickname: targetNickname,
        kickType: is5Minutes ? '5m' : 'soft',
        kickEnd,
        adminId: userId
      });
    } catch (err) {
      console.error("Failed to kick user:", err);
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
        e.preventDefault();
        handleSendMessage();
      } else {
        lastEnterTime.current = now;
      }
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('chat_nickname');
    localStorage.removeItem('chat_is_owner');
    setNickname(null);
    setIsOwner(false);
  };

  // Scroll to bottom helper
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Derived active users list from usersMap
  const users = Object.values(usersMap).filter(u => Date.now() - u.lastActive < 30000);

  // Client-side mapping & filter
  const mappedMessages = messages.map(msg => {
    if (msg.isPermanentlyRemoved) {
      return null;
    }
    if (msg.isAdminDeleted) {
      return { ...msg, text: `[DELETED BY Sigma Dev]`, isAdminDeleted: true, isPlaceholder: true };
    }
    if (msg.isDeleted) {
      return { ...msg, text: `[this message was deleted by ${msg.senderName}]`, isPlaceholder: true };
    }
    return msg;
  }).filter((msg): msg is Message => msg !== null);

  const filteredMessages = mappedMessages.filter(msg => {
    const twoHoursAgo = Date.now() - 7200000; // Filter messages older than 2 hours
    return msg.createdAt > twoHoursAgo;
  });


  return (
    <PageLayout title="" maxWidth="full" showBack={false}>
      <div className="max-w-[95%] mx-auto transform scale-[0.85] origin-top">
        <div className="w-full h-[calc(100vh-4rem)] flex flex-col bg-zinc-900/95 rounded-2xl overflow-hidden relative shadow-2xl border border-zinc-800/50">
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
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${isConnected ? 'text-zinc-500' : 'text-red-500'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </p>
                  <div className="w-1 h-1 rounded-full bg-zinc-800" />
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
                Sign Out
              </button>
            )}
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-row min-h-0 relative z-10 overflow-hidden">
            {authLoading ? (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <p className="text-zinc-500 text-xs tracking-[0.2em] font-bold uppercase animate-pulse">Initializing authentications...</p>
              </div>
            ) : !nickname ? (
              <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8 text-center">
                <form 
                  onSubmit={handleJoinChat}
                  className="w-full max-w-sm flex flex-col items-center space-y-8"
                >
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 shadow-xl"
                  >
                    <UserIcon size={40} className="text-zinc-500" />
                  </motion.div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white tracking-tight uppercase">Enter Chatroom</h3>
                  </div>
                  
                  <div className="w-full space-y-4">
                    <div className="space-y-4 text-left">
                      <div>
                        <input
                          type="text"
                          value={inputNickname}
                          onChange={(e) => setInputNickname(e.target.value)}
                          placeholder="CHOOSE A NICKNAME..."
                          maxLength={25}
                          autoFocus
                          className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-zinc-500 transition-all font-mono tracking-wider text-center"
                        />
                      </div>

                      <AnimatePresence>
                        {inputNickname.trim().toLowerCase() === "sigma dev" && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Enter Recon Password</label>
                            <input
                              type="password"
                              value={inputPassword}
                              onChange={(e) => setInputPassword(e.target.value)}
                              placeholder="PASSWORD..."
                              className="w-full bg-zinc-800/50 border border-zinc-800 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-red-500 transition-all font-mono tracking-wider text-center"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      type="submit"
                      disabled={banTimeLeft !== null || !inputNickname.trim()}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${colors.primaryBg} text-black hover:scale-[1.02] active:scale-95 disabled:opacity-50 uppercase tracking-tighter shadow-lg ${colors.shadow}`}
                      style={{ color: '#000000' }}
                    >
                      Join Chatroom
                    </button>
                    {banTimeLeft !== null && (
                      <p className="text-red-500 text-xs font-bold uppercase tracking-widest text-center mt-2">
                        You were kicked for {banTimeLeft} seconds
                      </p>
                    )}
                    {error && (
                      <p className="text-red-500 text-xs font-bold uppercase tracking-widest mt-2 max-w-xs mx-auto text-center animate-pulse">
                        {error}
                      </p>
                    )}
                  </div>
                </form>
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
                            <span className={`text-[10px] font-bold tracking-widest ${msg.senderName === "Sigma Dev" ? 'animate-rainbow' : 'text-zinc-500'}`}>
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
                              
                              {/* Delete Button on Hover */}
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
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-zinc-950" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-xs font-bold truncate tracking-wider transition-all duration-300 ${user.isTyping ? 'text-white animate-pulse' : user.isOwner ? 'animate-rainbow' : user.nickname === nickname ? colors.primary : 'text-zinc-400'}`}>
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
                          {isOwner && userId && user.id !== userId && (
                            <button 
                              onClick={() => handleKickUser(user.nickname)}
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
      </div>

      {/* Sigma Dev Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ left: contextMenu.x, top: contextMenu.y }}
            className="fixed z-[100] w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden py-2 cursor-move"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-start">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Admin Controls</p>
                <p className="text-base font-bold text-white truncate">{contextMenu.nickname}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setContextMenu(null); }} 
                className="text-zinc-500 hover:text-white transition-colors p-1 rounded-md hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>
            <button
              onClick={() => handleDeleteMessage(contextMenu.messageId, false, true)}
              className="w-full flex items-center gap-4 px-4 py-3 text-base font-bold text-orange-400 hover:bg-orange-500/10 transition-all uppercase tracking-wider"
            >
              <Trash2 size={20} />
              Admin Delete
            </button>
            <button
              onClick={() => handleDeleteMessage(contextMenu.messageId, true)}
              className="w-full flex items-center gap-4 px-4 py-3 text-base font-bold text-red-400 hover:bg-red-500/10 transition-all uppercase tracking-wider"
            >
              <Trash2 size={20} />
              Admin Remove
            </button>
            <button
              onClick={() => handleKickUser(contextMenu.nickname, false)}
              className="w-full flex items-center gap-4 px-4 py-3 text-base font-bold text-red-500 hover:bg-red-500/10 transition-all uppercase tracking-wider"
            >
              <LogOut size={20} />
              Kick User
            </button>
            <button
              onClick={() => handleKickUser(contextMenu.nickname, true)}
              className="w-full flex items-center gap-4 px-4 py-3 text-base font-bold text-red-600 hover:bg-red-500/10 transition-all uppercase tracking-wider"
            >
              <LogOut size={20} />
              Kick User (5m)
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </PageLayout>
  );
}
