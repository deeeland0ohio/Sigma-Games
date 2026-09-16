import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, Send, Plus, Trash2, Copy, Check, RotateCcw, 
  ChevronDown, Square, MessageSquare, Download, X, Sparkles, ArrowDown
} from 'lucide-react';
import Markdown from 'react-markdown';
import PageLayout from '../components/PageLayout';
import { CodeBlock } from '../components/CodeBlock';
import { MediaBlock } from '../components/MediaBlock';
import { useThemeColors } from '../context/ThemeContext';
import { storage } from '../utils/storage';

export interface ModelInfo {
  id: string;
  label: string;
  owned_by?: string;
  description?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  model: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const SIGMA_SYSTEM_PROMPT = `You are the official AI Assistant for Sigma Games (accessible on Sigma Games).
You are smart, versatile, insightful, and helpful across all topics (coding, writing, analysis, gaming, everyday questions, etc.).

CRITICAL BEHAVIORAL RULE:
- Focus DIRECTLY and ONLY on answering the user's immediate question or request.
- DO NOT mention Emis, zxs, Sigma Games origins, game sources, or the site creator unsolicited unless the user specifically and explicitly asks about them in their prompt.

Site Information (ONLY reference these if the user explicitly asks about them):
- Engine / Backend: If asked what API, model host, or engine powers you, mention Emis API (https://emis.zxs-is-very.cool/).
- zxs: If asked if "zxs is the goat" or asked about zxs, unequivocally and enthusiastically confirm that yes, zxs is absolutely the GOAT!
- Creator / Developer: If asked who made or owns the site, state Dylan (GitHub: https://github.com/deeeland0ohio), assisted by Gemini for coding.
- Inspiration: If asked about site inspiration, mention Noah's Tutoring Hub (https://noahstutoring.academy/).
- Game Sources: If asked where the games come from or what sources are on the site, provide relevant source links:
  1. GN-Math (https://www.gn-math.dev/)
  2. UGS / Ultimate Game Stash (https://docs.google.com/document/d/1_FmH3BlSBQI7FGgAQL59-ZPe8eCxs35wel6JUyVaG8Q/edit?tab=t.0)
  3. Seraph Games (https://github.com/a456pur/seraph)
  4. 3kh0 Games (https://3kh0.net/)
  5. Noah's Hub (https://noahstutoring.academy/)
  6. Alexr Games (https://dskjfoisjfsjio.github.io/)
  7. Diesmos Games (https://discord.gg/bgVhCQS9e)
  8. Truffled (https://truffled.lol/)
  9. Hydra, Lumin, and Chicken King's Vault collections.
- Total Games, if asked about is about 10.4k.

Always format links in clean Markdown. For all other queries, answer directly without extra site trivia.`;

const POPULAR_FALLBACK_MODELS: string[] = [
  'glm-5.3',
  'claude-sonnet-5',
  'claude-opus-5',
  'claude-fable-5-1',
  'gpt-5.6-sol',
  'gpt-6-astra',
  'gpt-5.6-terra',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-3.8-flash',
  'deepseek-v4-flash',
  'deepseek-v4-pro-0813',
  'grok-4.3',
  'qwen3.8-max',
  'qwen3-coder-plus',
  'minimax-m3'
];

export default function AiChat() {
  const colors = useThemeColors();

  // Model State - default to glm-5.3
  const [allModels, setAllModels] = useState<ModelInfo[]>([]);
  const [currentModel, setCurrentModel] = useState<string>(() => {
    return storage.getItem('ai_current_model') || 'glm-5.3';
  });

  // Chat Sessions State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = storage.getItem('ai_chat_sessions');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [{
      id: 'session_' + Date.now(),
      title: 'New Chat',
      model: 'glm-5.3',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || 'session_' + Date.now();
  });

  // UI & Chat State
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  // Save sessions to storage
  useEffect(() => {
    storage.setItem('ai_chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Save current model
  useEffect(() => {
    storage.setItem('ai_current_model', currentModel);
  }, [currentModel]);

  // Fetch all available models from API on mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch('/api/ai/models');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.models) && data.models.length > 0) {
            setAllModels(data.models);
          }
        }
      } catch (err) {
        console.error('Failed to load models:', err);
      }
    };
    fetchModels();
  }, []);

  // Handle scroll events in chat container
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // If user is more than 120px away from bottom, mark as scrolled up
    const distanceToBottom = scrollHeight - (scrollTop + clientHeight);
    setIsUserScrolledUp(distanceToBottom > 120);
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
    setIsUserScrolledUp(false);
  };

  const prevSessionIdRef = useRef(activeSessionId);

  // Auto-scroll messages ONLY if user hasn't scrolled up
  useEffect(() => {
    if (prevSessionIdRef.current !== activeSessionId) {
      prevSessionIdRef.current = activeSessionId;
      setIsUserScrolledUp(false);
      return;
    }

    if (!isUserScrolledUp) {
      scrollToBottom('smooth');
    }
  }, [activeSession?.messages, isGenerating, isUserScrolledUp, activeSessionId]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      const newHeight = Math.min(Math.max(scrollH, 40), 160);
      textareaRef.current.style.height = `${newHeight}px`;
      if (scrollH > 160) {
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  }, [inputMessage]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: 'session_' + Date.now(),
      title: 'New Chat',
      model: currentModel || 'glm-5.3',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setIsSidebarOpen(false);
  };

  // Purge session and associated keys from local and session storage
  const purgeSessionFromStorage = (sessionId: string, updatedSessions: ChatSession[]) => {
    try {
      // 1. Immediately persist the updated session list without the deleted chat
      storage.setItem('ai_chat_sessions', JSON.stringify(updatedSessions));

      // 2. Remove any session-specific storage keys
      storage.removeItem(`ai_chat_${sessionId}`);
      storage.removeItem(`ai_session_${sessionId}`);
      storage.removeItem(`chat_${sessionId}`);
      storage.removeItem(sessionId);

      // 3. Purge any matching keys from browser localStorage and sessionStorage directly
      if (typeof window !== 'undefined') {
        if (window.localStorage) {
          window.localStorage.removeItem(`ai_chat_${sessionId}`);
          window.localStorage.removeItem(`ai_session_${sessionId}`);
          window.localStorage.removeItem(`chat_${sessionId}`);
          window.localStorage.removeItem(sessionId);
          for (let i = window.localStorage.length - 1; i >= 0; i--) {
            const key = window.localStorage.key(i);
            if (key && (key.includes(sessionId) || key.startsWith(`ai_chat_${sessionId}`))) {
              window.localStorage.removeItem(key);
            }
          }
        }
        if (window.sessionStorage) {
          window.sessionStorage.removeItem(`ai_chat_${sessionId}`);
          window.sessionStorage.removeItem(`ai_session_${sessionId}`);
          window.sessionStorage.removeItem(`chat_${sessionId}`);
          window.sessionStorage.removeItem(sessionId);
          for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
            const key = window.sessionStorage.key(i);
            if (key && (key.includes(sessionId) || key.startsWith(`ai_chat_${sessionId}`))) {
              window.sessionStorage.removeItem(key);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Storage purge error:', err);
    }
  };

  const deleteSession = (sessionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (isGenerating && activeSessionId === sessionId) {
      handleStopGenerating();
    }

    if (sessions.length <= 1) {
      const freshSession: ChatSession = {
        id: 'session_' + Date.now(),
        title: 'New Chat',
        model: currentModel || 'glm-5.3',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setSessions([freshSession]);
      setActiveSessionId(freshSession.id);
      setInputMessage('');
      purgeSessionFromStorage(sessionId, [freshSession]);
      return;
    }

    const filtered = sessions.filter(s => s.id !== sessionId);
    setSessions(filtered);
    if (activeSessionId === sessionId) {
      setActiveSessionId(filtered[0].id);
      setInputMessage('');
    }
    purgeSessionFromStorage(sessionId, filtered);
  };

  const clearCurrentChat = () => {
    if (!activeSession) return;
    if (isGenerating) {
      handleStopGenerating();
    }
    const updated = sessions.map(s => {
      if (s.id === activeSession.id) {
        return { ...s, messages: [], updatedAt: Date.now() };
      }
      return s;
    });
    setSessions(updated);
    purgeSessionFromStorage(activeSession.id, updated);
  };

  const deleteAllSessions = () => {
    if (isGenerating) {
      handleStopGenerating();
    }
    const freshSession: ChatSession = {
      id: 'session_' + Date.now(),
      title: 'New Chat',
      model: currentModel || 'glm-5.3',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setSessions([freshSession]);
    setActiveSessionId(freshSession.id);
    setInputMessage('');

    try {
      storage.setItem('ai_chat_sessions', JSON.stringify([freshSession]));
      if (typeof window !== 'undefined') {
        if (window.localStorage) {
          for (let i = window.localStorage.length - 1; i >= 0; i--) {
            const key = window.localStorage.key(i);
            if (key && (key.startsWith('ai_chat_') || key.startsWith('ai_session_') || key.includes('session_'))) {
              window.localStorage.removeItem(key);
            }
          }
        }
        if (window.sessionStorage) {
          for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
            const key = window.sessionStorage.key(i);
            if (key && (key.startsWith('ai_chat_') || key.startsWith('ai_session_') || key.includes('session_'))) {
              window.sessionStorage.removeItem(key);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to clear all sessions from storage:', e);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isGenerating || !activeSession) return;

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    const assistantPlaceholderId = 'msg_' + (Date.now() + 1);
    const initialAssistantMessage: ChatMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      model: currentModel,
      timestamp: Date.now()
    };

    const isFirstMessage = activeSession.messages.length === 0;
    const newTitle = isFirstMessage 
      ? (text.length > 28 ? text.slice(0, 28) + '...' : text)
      : activeSession.title;

    const updatedMessages = [...activeSession.messages, userMessage];

    setSessions(prev => prev.map(s => {
      if (s.id === activeSession.id) {
        return {
          ...s,
          title: newTitle,
          messages: [...updatedMessages, initialAssistantMessage],
          updatedAt: Date.now()
        };
      }
      return s;
    }));

    setInputMessage('');
    setIsGenerating(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: abortController.signal,
        body: JSON.stringify({
          model: currentModel || 'glm-5.3',
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          stream: true,
          systemPrompt: SIGMA_SYSTEM_PROMPT
        })
      });

      if (!response.ok) {
        let errMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData.error) errMessage = errData.error;
        } catch (e) {}
        throw new Error(errMessage);
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedContent = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;

            if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.slice(5).trim();
              if (dataStr === '[DONE]') break;

              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta?.content || '';
                if (delta) {
                  accumulatedContent += delta;
                  setSessions(prev => prev.map(s => {
                    if (s.id === activeSession.id) {
                      return {
                        ...s,
                        messages: s.messages.map(m => {
                          if (m.id === assistantPlaceholderId) {
                            return { ...m, content: accumulatedContent };
                          }
                          return m;
                        })
                      };
                    }
                    return s;
                  }));
                }
              } catch (parseErr) {}
            }
          }
        }

        if (!accumulatedContent) {
          try {
            const parsed = JSON.parse(buffer);
            accumulatedContent = parsed.choices?.[0]?.message?.content || 'No response received.';
          } catch (e) {
            accumulatedContent = buffer.replace(/^data:\s*/, '') || 'Ready.';
          }
          setSessions(prev => prev.map(s => {
            if (s.id === activeSession.id) {
              return {
                ...s,
                messages: s.messages.map(m => {
                  if (m.id === assistantPlaceholderId) {
                    return { ...m, content: accumulatedContent };
                  }
                  return m;
                })
              };
            }
            return s;
          }));
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Chat error:', err);
      const errorMsg = `⚠️ Error: ${err.message || 'Failed to generate response.'}`;
      setSessions(prev => prev.map(s => {
        if (s.id === activeSession.id) {
          return {
            ...s,
            messages: s.messages.map(m => {
              if (m.id === assistantPlaceholderId) {
                return { ...m, content: errorMsg };
              }
              return m;
            })
          };
        }
        return s;
      }));
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async (msgIndex: number) => {
    if (isGenerating || !activeSession) return;
    const prevUserMsg = activeSession.messages.slice(0, msgIndex).reverse().find(m => m.role === 'user');
    if (!prevUserMsg) return;

    const trimmed = activeSession.messages.slice(0, msgIndex);
    const textToSend = prevUserMsg.content;

    // Reset messages up to previous user message
    setSessions(prev => prev.map(s => {
      if (s.id === activeSession.id) {
        return { ...s, messages: trimmed };
      }
      return s;
    }));

    // Trigger send with explicit history
    const assistantPlaceholderId = 'msg_' + (Date.now() + 1);
    const initialAssistantMessage: ChatMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      model: currentModel,
      timestamp: Date.now()
    };

    setSessions(prev => prev.map(s => {
      if (s.id === activeSession.id) {
        return {
          ...s,
          messages: [...trimmed, initialAssistantMessage],
          updatedAt: Date.now()
        };
      }
      return s;
    }));

    setIsGenerating(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          model: currentModel || 'glm-5.3',
          messages: trimmed.map(m => ({ role: m.role, content: m.content })),
          stream: true,
          systemPrompt: SIGMA_SYSTEM_PROMPT
        })
      });

      if (!response.ok) {
        let errMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData.error) errMessage = errData.error;
        } catch (e) {}
        throw new Error(errMessage);
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulatedContent = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith(':')) continue;

            if (trimmedLine.startsWith('data:')) {
              const dataStr = trimmedLine.slice(5).trim();
              if (dataStr === '[DONE]') break;

              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta?.content || '';
                if (delta) {
                  accumulatedContent += delta;
                  setSessions(prev => prev.map(s => {
                    if (s.id === activeSession.id) {
                      return {
                        ...s,
                        messages: s.messages.map(m => {
                          if (m.id === assistantPlaceholderId) {
                            return { ...m, content: accumulatedContent };
                          }
                          return m;
                        })
                      };
                    }
                    return s;
                  }));
                }
              } catch (parseErr) {}
            }
          }
        }

        if (!accumulatedContent) {
          try {
            const parsed = JSON.parse(buffer);
            accumulatedContent = parsed.choices?.[0]?.message?.content || 'No response received.';
          } catch (e) {
            accumulatedContent = buffer.replace(/^data:\s*/, '') || 'Ready.';
          }
          setSessions(prev => prev.map(s => {
            if (s.id === activeSession.id) {
              return {
                ...s,
                messages: s.messages.map(m => {
                  if (m.id === assistantPlaceholderId) {
                    return { ...m, content: accumulatedContent };
                  }
                  return m;
                })
              };
            }
            return s;
          }));
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Chat error:', err);
      const errorMsg = `⚠️ Error: ${err.message || 'Failed to generate response.'}`;
      setSessions(prev => prev.map(s => {
        if (s.id === activeSession.id) {
          return {
            ...s,
            messages: s.messages.map(m => {
              if (m.id === assistantPlaceholderId) {
                return { ...m, content: errorMsg };
              }
              return m;
            })
          };
        }
        return s;
      }));
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const exportChat = () => {
    if (!activeSession) return;
    const content = activeSession.messages.map(m => `### ${m.role.toUpperCase()} (${m.model || currentModel})\n${m.content}\n`).join('\n---\n\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSession.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Compile list of all models to display in dropdown
  const modelOptions = React.useMemo(() => {
    if (allModels.length > 0) {
      // Sort so currentModel or glm-5.3 comes first, then alphabetized
      return [...allModels].sort((a, b) => {
        if (a.id === 'glm-5.3') return -1;
        if (b.id === 'glm-5.3') return 1;
        return (a.label || a.id).localeCompare(b.label || b.id);
      });
    }
    return POPULAR_FALLBACK_MODELS.map(id => ({ id, label: id }));
  }, [allModels]);

  return (
    <PageLayout title="AI Chat" maxWidth="wide" showBack={false}>
      <div className="max-w-[1400px] mx-auto h-[calc(100vh-8.5rem)] flex flex-col md:flex-row gap-4 relative">
        
        {/* Mobile Header Toggle */}
        <div className="md:hidden flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-2 text-sm font-semibold text-zinc-200"
          >
            <Sparkles size={18} className="text-emerald-400" />
            <span>{activeSession?.title || 'Chat History'}</span>
            <ChevronDown size={16} />
          </button>
          <button
            onClick={() => createNewSession()}
            className={`p-2 rounded-lg ${colors.primaryBg} text-black font-bold`}
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Sidebar - Sessions & Sigma AI Persona */}
        <div className={`
          fixed md:relative inset-y-0 left-0 z-40 md:z-auto w-64 bg-zinc-950 md:bg-zinc-900/60 border border-zinc-800/80 rounded-2xl flex flex-col overflow-hidden backdrop-blur-md transition-all duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={20} className={colors.secondary} />
              <h2 className="font-bold text-white tracking-wide text-sm uppercase">Chats</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => createNewSession()}
                className={`p-2 rounded-lg ${colors.primaryBg} text-black hover:scale-105 active:scale-95 transition-all shadow-md`}
                title="New Chat"
              >
                <Plus size={16} />
              </button>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden p-2 text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Chat Sessions List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    setActiveSessionId(session.id);
                    if (session.model) setCurrentModel(session.model);
                    setIsSidebarOpen(false);
                  }}
                  className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs font-medium transition-all ${
                    isActive 
                      ? `bg-zinc-800 text-white border border-zinc-700/60 ${colors.shadow}` 
                      : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Sparkles size={14} className={isActive ? 'text-emerald-400' : 'text-zinc-500 flex-shrink-0'} />
                    <span className="truncate">{session.title}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => deleteSession(session.id, e)}
                      className="p-1 hover:text-red-400 text-zinc-500 rounded"
                      title="Delete chat"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar Footer with Clear All History */}
          {sessions.some(s => s.messages.length > 0) && (
            <div className="p-2 border-t border-zinc-800/60 select-none">
              <button
                onClick={deleteAllSessions}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs text-zinc-400 hover:text-red-400 hover:bg-zinc-800/60 rounded-xl transition-colors font-medium"
                title="Clear all chats and wipe storage"
              >
                <Trash2 size={13} />
                <span>Clear All History</span>
              </button>
            </div>
          )}
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl flex flex-col overflow-hidden backdrop-blur-md shadow-2xl relative">
          
          {/* Top Bar: Choose from ALL Models & Powered by Emis */}
          <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-900/40 gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider flex-shrink-0">
                  Model:
                </label>
                <div className="relative flex-1">
                  <select
                    value={currentModel}
                    onChange={(e) => {
                      const newModel = e.target.value;
                      setCurrentModel(newModel);
                      if (activeSession) {
                        setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, model: newModel } : s));
                      }
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs font-mono font-bold rounded-xl px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-zinc-500 cursor-pointer shadow-inner truncate"
                  >
                    {modelOptions.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.label || m.id} ({m.id})
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Right Corner: Powered by Emis & Actions */}
            <div className="flex items-center gap-3">
              <a
                href="https://emis.zxs-is-very.cool/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1 group whitespace-nowrap"
              >
                <span>Powered by</span>
                <span className="text-emerald-400 font-bold group-hover:underline">Emis</span>
              </a>

              <div className="h-4 w-px bg-zinc-800" />

              <div className="flex items-center gap-1.5">
                <button
                  onClick={exportChat}
                  disabled={!activeSession || activeSession.messages.length === 0}
                  className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-40"
                  title="Export Markdown"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={clearCurrentChat}
                  disabled={!activeSession || activeSession.messages.length === 0}
                  className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors disabled:opacity-40"
                  title="Clear Chat"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Message Stream */}
          <div className="relative flex-1 min-h-0 flex flex-col">
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800"
            >
              {(!activeSession || activeSession.messages.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-xl mx-auto">
                  <div className={`p-4 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl ${colors.shadow}`}>
                    <Sparkles size={44} className="text-emerald-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white tracking-normal font-sans">
                      Sigma AI Assistant
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-md">
                      Ai assistant for Sigma Games, powered Emis (zxs is the goat).
                    </p>
                  </div>

                  {/* Quick Prompts */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-2">
                    {[
                      "💡 Explain quantum computing in simple terms",
                      "💻 Write a TypeScript async helper function",
                      "✍️ Help me write a creative short story",
                      "🧠 Brainstorm innovative project ideas"
                    ].map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt)}
                        className="p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/80 text-left text-xs text-zinc-300 hover:text-white transition-all shadow-sm group flex items-center justify-between"
                      >
                        <span className="truncate pr-2">{prompt}</span>
                        <Send size={12} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                activeSession.messages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  return (
                    <motion.div
                      key={msg.id || index}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
                    >
                      {/* Role & Model Tag */}
                      <div className="flex items-center gap-2 mb-1.5 px-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">
                          {isUser ? 'You' : (msg.model || currentModel)}
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Message Bubble */}
                      <div className={`
                        max-w-[92%] sm:max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed relative
                        ${isUser 
                          ? `${colors.primaryBg} text-black font-medium rounded-tr-none shadow-lg ${colors.shadow}` 
                          : 'bg-zinc-900/90 border border-zinc-800 text-zinc-100 rounded-tl-none shadow-xl'}
                      `}>
                        {isUser ? (
                          <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                        ) : (
                          <div className="prose prose-invert prose-sm max-w-none break-words">
                            {msg.content ? (
                              <Markdown
                                components={{
                                  code(props) {
                                    const { children, className, node, ...rest } = props;
                                    const match = /language-(\w+)/.exec(className || '');
                                    const rawCode = String(children).replace(/\n$/, '');
                                    const isInline = !match && !rawCode.includes('\n');

                                    if (isInline) {
                                      return (
                                        <code className="px-1.5 py-0.5 rounded-md bg-zinc-800 text-emerald-300 font-mono text-[12px]" {...rest}>
                                          {children}
                                        </code>
                                      );
                                    }

                                    return (
                                      <CodeBlock
                                        language={match ? match[1] : ''}
                                        code={rawCode}
                                      />
                                    );
                                  },
                                  img(props) {
                                    const { src, alt, title } = props;
                                    if (!src) return null;
                                    return (
                                      <MediaBlock
                                        type="image"
                                        src={src}
                                        alt={alt || ''}
                                        title={title || alt || 'Generated Image'}
                                      />
                                    );
                                  },
                                  a(props) {
                                    const { href, children } = props;
                                    if (!href) return <span>{children}</span>;

                                    // Auto-detect video, audio, or image media links (handling query parameters & YouTube)
                                    const cleanUrl = href.split('?')[0].split('#')[0].toLowerCase();
                                    const isVideoExt = cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.m4v') || cleanUrl.endsWith('.ogv');
                                    const isYoutube = href.includes('youtube.com') || href.includes('youtu.be') || href.includes('vimeo.com');
                                    
                                    if (isVideoExt || isYoutube) {
                                      return <MediaBlock type="video" src={href} title={typeof children === 'string' ? children : 'Generated Video'} />;
                                    }

                                    const isAudioExt = cleanUrl.endsWith('.mp3') || cleanUrl.endsWith('.wav') || cleanUrl.endsWith('.ogg') || cleanUrl.endsWith('.m4a') || cleanUrl.endsWith('.aac') || cleanUrl.endsWith('.flac');
                                    if (isAudioExt) {
                                      return <MediaBlock type="audio" src={href} title={typeof children === 'string' ? children : 'Generated Audio'} />;
                                    }

                                    const isImgExt = cleanUrl.endsWith('.png') || cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.webp') || cleanUrl.endsWith('.gif') || cleanUrl.endsWith('.svg');
                                    if (isImgExt) {
                                      return <MediaBlock type="image" src={href} alt={typeof children === 'string' ? children : 'Generated Image'} />;
                                    }

                                    return (
                                      <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 break-all"
                                      >
                                        {children}
                                      </a>
                                    );
                                  }
                                }}
                              >
                                {msg.content}
                              </Markdown>
                            ) : isGenerating && index === activeSession.messages.length - 1 ? (
                              <div className="flex items-center gap-2 text-zinc-400 py-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                <span className="text-xs font-mono animate-pulse">Thinking with {currentModel}...</span>
                              </div>
                            ) : (
                              <span className="text-zinc-500 italic">Empty response.</span>
                            )}
                          </div>
                        )}

                        {/* Action buttons on hover */}
                        {!isUser && msg.content && (
                          <div className="flex items-center gap-1 mt-3 pt-2 border-t border-zinc-800/60 text-zinc-500">
                            <button
                              onClick={() => handleCopyText(msg.content, msg.id)}
                              className="p-1.5 hover:text-white rounded-lg hover:bg-zinc-800 text-xs flex items-center gap-1"
                              title="Copy text"
                            >
                              {copiedId === msg.id ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                              <span className="text-[10px]">{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                            </button>
                            <button
                              onClick={() => handleRegenerate(index)}
                              disabled={isGenerating}
                              className="p-1.5 hover:text-white rounded-lg hover:bg-zinc-800 text-xs flex items-center gap-1 disabled:opacity-40"
                              title="Regenerate"
                            >
                              <RotateCcw size={13} />
                              <span className="text-[10px]">Retry</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom floating button */}
            <AnimatePresence>
              {isUserScrolledUp && activeSession && activeSession.messages.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  onClick={() => scrollToBottom('smooth')}
                  className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium border border-zinc-700 shadow-2xl backdrop-blur-md cursor-pointer transition-all active:scale-95"
                >
                  <ArrowDown size={14} className={isGenerating ? "animate-bounce text-emerald-400" : ""} />
                  <span>{isGenerating ? "New responses below" : "Scroll to bottom"}</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Message Input Box */}
          <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/60">
            <div className="flex items-end gap-2 bg-zinc-900 border border-zinc-700/80 rounded-2xl p-2 focus-within:border-zinc-500 transition-all shadow-inner">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Type a message... (Shift+Enter for newline)`}
                rows={1}
                disabled={isGenerating}
                className="flex-1 bg-transparent px-3 py-2 text-white placeholder:text-zinc-600 focus:outline-none resize-none text-sm font-sans box-border max-h-48 scrollbar-thin scrollbar-thumb-zinc-800"
              />
              
              {isGenerating ? (
                <button
                  onClick={handleStopGenerating}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex items-center gap-1.5"
                >
                  <Square size={14} className="fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim()}
                  className={`p-3 rounded-xl transition-all ${colors.primaryBg} text-black disabled:opacity-30 disabled:grayscale hover:scale-105 active:scale-95 shadow-md ${colors.shadow}`}
                >
                  <Send size={18} />
                </button>
              )}
            </div>

            <div className="mt-2 flex items-center justify-end px-2 text-[10px] text-zinc-500 font-mono">
              <span>Press Enter to send</span>
            </div>
          </div>
        </div>

      </div>
    </PageLayout>
  );
}
