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
  const [bannedNicknames, setBannedNicknames] = useState<Record<string, number>>({});
  const [bannedUserIds, setBannedUserIds] = useState<Record<string, number>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, messageId: string, userId: string, nickname: string } | null>(null);
  const [, setTick] = useState(0); // Force custom re-render for message expirations
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastEnterTime = useRef<number>(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const colors = useThemeColors();

  // Initialize client userId
  useEffect(() => {
    let id = localStorage.getItem('chat_guest_id');
    if (!id) {
      id = 'u_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('chat_guest_id', id);
    }
    setUserId(id);

    // Chat is disabled, auto-login deactivated
    setNickname(null);
    setIsOwner(false);

    const kickEnd = localStorage.getItem('kick_end');
    if (kickEnd) {
      const end = parseInt(kickEnd);
      if (Date.now() < end) {
        setBannedUserIds(prev => ({
          ...prev,
          [id]: end
        }));
      } else {
        localStorage.removeItem('kick_end');
      }
    }
  }, []);

  // Real-time ticking for message expirations and ban countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
      // Clean up localStorage kick_end when expired
      const kickEnd = localStorage.getItem('kick_end');
      if (kickEnd && Date.now() >= parseInt(kickEnd)) {
        localStorage.removeItem('kick_end');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Automatic eviction if current user is banned
  useEffect(() => {
    if (!nickname || !userId) return;

    const activeIdKickEnd = bannedUserIds[userId];
    const isIdBanned = activeIdKickEnd ? Date.now() < activeIdKickEnd : false;

    const activeNickKickEnd = bannedNicknames[nickname.toLowerCase()];
    const isNickBanned = activeNickKickEnd ? Date.now() < activeNickKickEnd : false;

    if (isIdBanned || isNickBanned) {
      localStorage.removeItem('chat_nickname');
      localStorage.removeItem('chat_is_owner');
      setNickname(null);
      setIsOwner(false);
      setError("You are currently kicked from this chatroom.");
    }
  }, [nickname, userId, bannedUserIds, bannedNicknames]);

  // Automatically clear the kicked error string once the ban timer expires
  useEffect(() => {
    if (error === "You are currently kicked from this chatroom.") {
      const activeIdKickEnd = bannedUserIds[userId];
      const isIdBanned = activeIdKickEnd ? Date.now() < activeIdKickEnd : false;

      const activeNickKickEnd = bannedNicknames[inputNickname.trim().toLowerCase()];
      const isNickBanned = activeNickKickEnd ? Date.now() < activeNickKickEnd : false;

      if (!isIdBanned && !isNickBanned) {
        setError(null);
      }
    }
  }, [error, bannedUserIds, bannedNicknames, userId, inputNickname]);

  const lastEnforcedTimes = useRef<Record<string, number>>({});

  // Owner auto-enforcing active bans if a banned user reappears/re-sends presence heartbeat
  useEffect(() => {
    if (!isOwner || !userId) return;

    Object.values(usersMap).forEach(u => {
      if (u.id === userId) return;

      const bNick = bannedNicknames[u.nickname.toLowerCase()];
      const bId = bannedUserIds[u.id];

      const isNickBanned = bNick && Date.now() < bNick;
      const isIdBanned = bId && Date.now() < bId;

      if (isNickBanned || isIdBanned) {
        const remainingEnd = isIdBanned ? bId! : bNick!;
        const key = `${u.id}-${remainingEnd}`;
        const lastEnforced = lastEnforcedTimes.current[key] || 0;

        // Only re-enforce once every 15 seconds per unique ban to keep channel traffic low
        if (Date.now() - lastEnforced > 15000) {
          lastEnforcedTimes.current[key] = Date.now();
          publishEvent({
            type: 'user_kick',
            nickname: u.nickname,
            targetUserId: u.id,
            kickType: isIdBanned ? 'id_enforce' : 'nick_enforce',
            kickEnd: remainingEnd,
            adminId: userId
          });
        }
      }
    });
  }, [usersMap, bannedUserIds, bannedNicknames, isOwner, userId]);

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
        if (payload.kickEnd && Date.now() < payload.kickEnd) {
          setBannedNicknames(prev => ({
            ...prev,
            [payload.nickname.toLowerCase()]: payload.kickEnd
          }));
          if (payload.targetUserId) {
            setBannedUserIds(prev => ({
              ...prev,
              [payload.targetUserId]: payload.kickEnd
            }));
          }
        }

        const storedNickname = localStorage.getItem('chat_nickname');
        const isTargetNick = storedNickname && payload.nickname.toLowerCase() === storedNickname.toLowerCase();
        const isTargetUserId = userId && payload.targetUserId === userId;

        if (isTargetNick || isTargetUserId) {
          const kickEnd = payload.kickEnd || 0;
          if (Date.now() < kickEnd) {
            const isSoft = payload.kickType === 'soft';
            if (!isSoft) {
              let label = "5 minutes";
              if (payload.kickType === '1h') label = "1 hour";
              else if (payload.kickType === '24h') label = "24 hours";
              else if (payload.kickType === 'permanent') label = "permanently";
              else if (payload.kickType === 'nick_enforce' || payload.kickType === 'id_enforce') {
                const seconds = Math.max(0, Math.ceil((kickEnd - Date.now()) / 1000));
                if (seconds > 31536000) label = "permanently";
                else if (seconds > 86400) label = `${Math.ceil(seconds / 86400)} days`;
                else if (seconds > 3600) label = `${Math.ceil(seconds / 3600)} hours`;
                else label = `${Math.ceil(seconds / 60)} minutes`;
              }
              alert(`You were kicked by the Owner for ${label}`);
              localStorage.removeItem('chat_nickname');
              localStorage.removeItem('chat_is_owner');
              setNickname(null);
              setIsOwner(false);
              localStorage.setItem('kick_end', kickEnd.toString());
              setBannedUserIds(prev => ({
                ...prev,
                [userId]: kickEnd
              }));
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
        const res = await fetch(`${NTFY_TOPIC_URL}/json?poll=1`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const text = await res.text();
          const lines = text.trim().split('\n').filter(Boolean);
          
          const loadedMessages: Message[] = [];
          const loadedDeletedIds: Set<string> = new Set();
          const adminDeletedIds: Map<string, { type: 'soft' | 'hard' }> = new Map();
          const kicks: Record<string, number> = {};
          const bannedIds: Record<string, number> = {};

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
                } else if (payload.type === 'user_kick') {
                  if (payload.kickEnd && Date.now() < payload.kickEnd) {
                    kicks[payload.nickname.toLowerCase()] = payload.kickEnd;
                    if (payload.targetUserId) {
                      bannedIds[payload.targetUserId] = payload.kickEnd;
                    }
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
            setBannedNicknames(kicks);
            setBannedUserIds(bannedIds);
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
  const isTypingRef = useRef(isTyping);
  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);

  useEffect(() => {
    if (!nickname) return;

    const hasText = newMessage.trim().length > 0;
    
    if (hasText && !isTypingRef.current) {
      setIsTyping(true);
    } else if (!hasText && isTypingRef.current) {
      setIsTyping(false);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    if (hasText) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    }

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [newMessage, nickname]);

  const handleJoinChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("Chat is disabled right now, cuz every provider sucks and costs money >:(");
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

  const handleKickUser = async (targetNickname: string, kickDuration: 'soft' | '5m' | '1h' = 'soft') => {
    if (!isOwner || !userId) return;

    let duration = 5000; // soft kick: 5s
    if (kickDuration === '5m') {
      duration = 300000;
    } else if (kickDuration === '1h') {
      duration = 3600000;
    }

    const kickEnd = Date.now() + duration;

    const targetUser = Object.values(usersMap).find(u => u.nickname.toLowerCase() === targetNickname.toLowerCase());
    const targetUserId = targetUser ? targetUser.id : null;
    const targetMessageId = contextMenu?.messageId;

    try {
      if (kickDuration === '1h' && targetMessageId) {
        await handleDeleteMessage(targetMessageId, true, true);
      }

      await publishEvent({
        type: 'user_kick',
        nickname: targetNickname,
        targetUserId,
        kickType: kickDuration,
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
    if (userId) {
      publishEvent({
        type: 'user_presence_offline',
        id: userId
      });
    }
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
  }, [messages, nickname]);

  // Derived active users list from usersMap (excluding banned people who bypassed cache)
  const users = Object.values(usersMap)
    .filter(u => Date.now() - u.lastActive < 30000)
    .filter(u => {
      const bNick = bannedNicknames[u.nickname.toLowerCase()];
      const bId = bannedUserIds[u.id];
      const isBanned = (bNick && Date.now() < bNick) || (bId && Date.now() < bId);
      return !isBanned;
    });

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
    if (msg.createdAt <= twoHoursAgo) return false;

    // Filter out messages from any users who are currently banned locally
    const bNick = bannedNicknames[msg.senderName.toLowerCase()];
    const bId = bannedUserIds[msg.senderId];
    const isBanned = (bNick && Date.now() < bNick) || (bId && Date.now() < bId);
    return !isBanned;
  });

  const activeIdKickEnd = bannedUserIds[userId];
  const isIdBanned = activeIdKickEnd ? Date.now() < activeIdKickEnd : false;
  
  const activeNickKickEnd = bannedNicknames[inputNickname.trim().toLowerCase()];
  const isNickBanned = activeNickKickEnd ? Date.now() < activeNickKickEnd : false;

  const currentBanTimeLeft = isIdBanned 
    ? Math.max(0, Math.ceil((activeIdKickEnd - Date.now()) / 1000))
    : isNickBanned
    ? Math.max(0, Math.ceil((activeNickKickEnd - Date.now()) / 1000))
    : null;

  const formatBanTimeLeft = (seconds: number | null) => {
    if (seconds === null || seconds <= 0) return "";
    if (seconds >= 3600) {
      const h = Math.floor(seconds / 3600);
      const m = Math.ceil((seconds % 3600) / 60);
      if (m === 0 || m === 60) return `${h} hour${h > 1 ? 's' : ''}`;
      return `${h}h ${m}m`;
    }
    if (seconds >= 60) {
      const m = Math.ceil(seconds / 60);
      return `${m} minute${m > 1 ? 's' : ''}`;
    }
    return `${seconds} second${seconds > 1 ? 's' : ''}`;
  };

  const isJoinDisabled = isIdBanned || (isNickBanned && inputNickname.trim().toLowerCase() !== "") || !inputNickname.trim();


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
              <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8 text-center bg-zinc-950/40 backdrop-blur-sm">
                <div className="w-full max-w-md flex flex-col items-center space-y-6 bg-zinc-900/90 border border-red-500/30 p-8 rounded-2xl shadow-2xl relative z-20">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 rounded-full bg-red-950/40 border border-red-500/20 flex items-center justify-center shadow-lg"
                  >
                    <X size={32} className="text-red-500" />
                  </motion.div>
                  
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-red-500 tracking-tight uppercase">Chat Disabled</h3>
                    <p className="text-zinc-200 font-mono text-sm leading-relaxed max-w-sm mx-auto p-4 bg-zinc-950/60 rounded-xl border border-zinc-800">
                      Chat is disabled right now, cuz every provider sucks and costs money &gt;:(
                    </p>
                  </div>
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
              onClick={() => handleKickUser(contextMenu.nickname, 'soft')}
              className="w-full flex items-center gap-4 px-4 py-2 text-sm font-bold text-zinc-400 hover:bg-zinc-800 transition-all uppercase tracking-wider"
            >
              <LogOut size={16} />
              Soft Kick (Evict)
            </button>
            <button
              onClick={() => handleKickUser(contextMenu.nickname, '5m')}
              className="w-full flex items-center gap-4 px-4 py-2 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all uppercase tracking-wider"
            >
              <LogOut size={16} className="text-red-400" />
              Timeout (5 Mins)
            </button>
             <button
              onClick={() => handleKickUser(contextMenu.nickname, '1h')}
              className="w-full flex items-center gap-4 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all uppercase tracking-wider"
            >
              <LogOut size={16} className="text-red-500" />
              Ban (1 Hour)
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </PageLayout>
  );
}
