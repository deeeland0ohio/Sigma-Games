import express from "express";
import { createServer as createViteServer } from "vite";
import compression from "compression";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  // Enable gzip compression for faster transfers
  app.use(compression());

  // Socket.io logic
  let messages: any[] = [];
  const users = new Map<string, { id: string, nickname: string, lastActive: number, isTyping: boolean, isOwner: boolean }>();
  const bannedUsers = new Map<string, number>(); // Map of IP address to ban end timestamp

  // Cleanup old messages every minute
  setInterval(() => {
    const oneHourAgo = Date.now() - 3600000;
    const initialLength = messages.length;
    messages = messages.filter(msg => msg.createdAt > oneHourAgo);
    if (messages.length !== initialLength) {
      users.forEach((u, sid) => {
        const clientSocket = io.sockets.sockets.get(sid);
        if (clientSocket) sendMessages(clientSocket);
      });
    }
    
    // Cleanup expired bans
    const now = Date.now();
    for (const [sid, banEnd] of bannedUsers.entries()) {
      if (now > banEnd) {
        bannedUsers.delete(sid);
      }
    }
  }, 60000);

  const broadcastUserList = () => {
    const userList = Array.from(users.values())
      .sort((a, b) => b.lastActive - a.lastActive);
    io.emit("user_list", userList);
  };

  // Function to send filtered messages based on user role
  const sendMessages = (targetSocket: any) => {
    const user = users.get(targetSocket.id);
    const filtered = messages.map(msg => {
      // If it's permanently removed by Sigma Dev (Hard Delete)
      if (msg.isPermanentlyRemoved) {
        return null; // Hidden for everyone, including the owner
      }

      // If it's soft deleted by Sigma Dev (Admin Soft Delete)
      if (msg.isAdminDeleted) {
        return { ...msg, text: `[DELETED BY Sigma Dev]`, isAdminDeleted: true, isPlaceholder: true };
      }
      
      // If it's deleted by the user (Soft Delete)
      if (msg.isDeleted) {
        if (user?.isOwner) {
          return { ...msg, text: `[DELETED BY USER]`, isSystemInfo: true };
        }
        return { ...msg, text: `[this message was deleted by ${msg.senderName}]`, isPlaceholder: true };
      }
      
      return msg;
    }).filter(Boolean);
    
    targetSocket.emit("initial_messages", filtered);
  };

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    
    // Send existing messages to the new user
    const oneHourAgo = Date.now() - 3600000;
    messages = messages.filter(msg => msg.createdAt > oneHourAgo);
    // Note: sendMessages will be called after join_chat to ensure role is known

    socket.on("join_chat", ({ nickname: requestedNickname, password }) => {
      const ip = socket.handshake.address;
      const banEnd = bannedUsers.get(ip);
      if (banEnd && Date.now() < banEnd) {
        socket.emit("banned", { message: "You are still banned", banEnd });
        return;
      }

      let finalNickname = requestedNickname;
      let isOwner = false;

      if (requestedNickname === "Sigma Dev") {
        if (password === "sigmarizzsigmaenigma") {
          isOwner = true;
          finalNickname = "Sigma Dev";
        } else {
          socket.emit("join_error", "Invalid password for Sigma Dev");
          return;
        }
      } else {
        let suffix = 1;
        const existingNicknames = Array.from(users.values()).map(u => u.nickname);
        while (existingNicknames.includes(finalNickname)) {
          finalNickname = `${requestedNickname}(${suffix})`;
          suffix++;
        }
      }

      users.set(socket.id, { 
        id: socket.id, 
        nickname: finalNickname, 
        lastActive: Date.now(),
        isTyping: false,
        isOwner
      });
      
      socket.emit("join_success", { nickname: finalNickname, isOwner });
      sendMessages(socket);
      broadcastUserList();
    });

    socket.on("send_message", (msg) => {
      const user = users.get(socket.id);
      if (!user) return;

      const messageWithId = { 
        ...msg, 
        id: Math.random().toString(36).substr(2, 9),
        senderName: user.nickname,
        senderId: socket.id,
        createdAt: Date.now()
      };
      
      messages.push(messageWithId);
      user.lastActive = Date.now();
      user.isTyping = false;
      
      // Broadcast to everyone, but handle deletion visibility per-client
      users.forEach((u, sid) => {
        const clientSocket = io.sockets.sockets.get(sid);
        if (clientSocket) sendMessages(clientSocket);
      });
      broadcastUserList();
    });

    socket.on("delete_message", ({ messageId, type }) => {
      const user = users.get(socket.id);
      if (!user) return;

      const msgIdx = messages.findIndex(m => m.id === messageId);
      if (msgIdx === -1) return;

      const msg = messages[msgIdx];
      
      if (type === 'permanent' && user.isOwner) {
        // Sigma Dev hard deletes permanently
        messages[msgIdx].isPermanentlyRemoved = true;
        messages[msgIdx].isDeleted = true;
      } else if (type === 'admin_soft' && user.isOwner) {
        // Sigma Dev soft deletes someone else's message
        messages[msgIdx].isAdminDeleted = true;
        messages[msgIdx].isDeleted = true;
      } else if (msg.senderId === socket.id) {
        // Regular user (or Sigma Dev) deletes their own message
        messages[msgIdx].isDeleted = true;
      }

      users.forEach((u, sid) => {
        const clientSocket = io.sockets.sockets.get(sid);
        if (clientSocket) sendMessages(clientSocket);
      });
    });

    socket.on("kick_user", (targetId) => {
      const user = users.get(socket.id);
      if (!user?.isOwner) return;

      console.log(`[ADMIN] Sigma Dev is kicking user with ID: ${targetId}`);
      
      const targetSocket = io.sockets.sockets.get(targetId);
      if (targetSocket) {
        if (targetSocket.id === socket.id) {
          console.log("[ADMIN] Prevented Sigma Dev from kicking themselves.");
          return;
        }
        targetSocket.emit("kicked", "You were kicked by the Owner, you may join back in");
        console.log(`[ADMIN] User ${targetId} has been kicked.`);
      } else {
        console.log(`[ADMIN] Could not find socket for ID: ${targetId}`);
      }
    });

    socket.on("kick_user_5m", (targetId) => {
      const user = users.get(socket.id);
      if (!user?.isOwner) return;

      console.log(`[ADMIN] Sigma Dev is kicking user with ID: ${targetId} for 5 minutes`);
      
      const targetSocket = io.sockets.sockets.get(targetId);
      if (targetSocket) {
        if (targetSocket.id === socket.id) {
          console.log("[ADMIN] Prevented Sigma Dev from kicking themselves.");
          return;
        }
        const kickEnd = Date.now() + 300000; // 5 minutes
        const ip = targetSocket.handshake.address;
        bannedUsers.set(ip, kickEnd);
        targetSocket.emit("kicked_5m", { message: "You were kicked by the Owner for 5 minutes", kickEnd });
        targetSocket.disconnect();
        console.log(`[ADMIN] User ${targetId} has been kicked.`);
      } else {
        console.log(`[ADMIN] Could not find socket for ID: ${targetId}`);
      }
    });

    socket.on("typing", (isTyping) => {
      const user = users.get(socket.id);
      if (user) {
        user.isTyping = isTyping;
        broadcastUserList();
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      users.delete(socket.id);
      broadcastUserList();
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Serve public directory directly for maximum speed on local games
  // This bypasses Vite's processing for large static HTML files
  app.use(express.static(path.join(process.cwd(), 'public')));

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
