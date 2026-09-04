import { Router } from "express";

const router = Router();

// In-memory Chat storage & active bans
const chatMessages: any[] = [];
const activeBannedUserIds: Record<string, number> = {};
const activeBannedNicknames: Record<string, number> = {};
let sseClients: any[] = [];

// Check whether Ably is configured (disabled / removed in favor of free server-native SSE)
router.get("/ably-check", (req, res) => {
  res.json({
    configured: false
  });
});

// SSE Endpoint for server-native streaming (100% free, unlimited, no API keys required!)
router.get("/chat/sse", (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const client = { id: Math.random().toString(36), res };
  sseClients.push(client);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== client.id);
  });
});

// Broadcast router for chat rooms (saves history in Node memory and relays via SSE stream)
router.post("/chat/broadcast", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.type) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    // Update in-memory storage based on transaction types
    if (payload.type === 'chat_message') {
      if (chatMessages.length >= 100) chatMessages.shift();
      chatMessages.push(payload);
    } else if (payload.type === 'message_deleted') {
      const idx = chatMessages.findIndex(m => m.id === payload.messageId);
      if (idx !== -1) {
        if (payload.isPermanentlyRemoved) {
          chatMessages.splice(idx, 1);
        } else if (payload.isAdminDeleted) {
          chatMessages[idx].isAdminDeleted = true;
        } else {
          chatMessages[idx].isDeleted = true;
        }
      }
    } else if (payload.type === 'user_kick') {
      if (payload.kickEnd) {
        activeBannedNicknames[payload.nickname.toLowerCase()] = payload.kickEnd;
        if (payload.targetUserId) {
          activeBannedUserIds[payload.targetUserId] = payload.kickEnd;
        }
      }
    }

    // Broadcast via internal SSE stream (supports instant, zero-limit cost-free realtime)
    sseClients.forEach(c => {
      try {
        c.res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (e) {
        // clean up failed clients
      }
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error("Broadcast error:", err);
    res.status(500).json({ error: err.message || "Failed to broadcast event" });
  }
});

// Retrieve message history & current ban states from server cache
router.get("/chat/history", (req, res) => {
  res.json({
    messages: chatMessages,
    bannedNicknames: activeBannedNicknames,
    bannedUserIds: activeBannedUserIds
  });
});

export default router;
