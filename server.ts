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
  const messages = new Map<string, any[]>();
  const users = new Map<string, { id: string, nickname: string, lastActive: number, isTyping: boolean, isOwner: boolean, os: string }>();
  const bannedUsers = new Map<string, number>(); // Map of IP address to ban end timestamp

  // Cleanup old messages every minute
  setInterval(() => {
    const oneHourAgo = Date.now() - 3600000;
    messages.forEach((msgs, os) => {
      const initialLength = msgs.length;
      const filtered = msgs.filter((msg: any) => msg.createdAt > oneHourAgo);
      messages.set(os, filtered);
      
      if (filtered.length !== initialLength) {
        users.forEach((u, sid) => {
          if (u.os === os) {
            const clientSocket = io.sockets.sockets.get(sid);
            if (clientSocket) sendMessages(clientSocket);
          }
        });
      }
    });
    
    // Cleanup expired bans
    const now = Date.now();
    for (const [sid, banEnd] of bannedUsers.entries()) {
      if (now > banEnd) {
        bannedUsers.delete(sid);
      }
    }
  }, 60000);

  const broadcastUserList = (os: string) => {
    const userList = Array.from(users.values())
      .filter(u => u.os === os)
      .sort((a, b) => b.lastActive - a.lastActive);
    io.to(os).emit("user_list", userList);
  };

  // Function to send filtered messages based on user role
  const sendMessages = (targetSocket: any) => {
    const user = users.get(targetSocket.id);
    if (!user) return;
    const msgs = messages.get(user.os) || [];
    
    const filtered = msgs.map(msg => {
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
    // Note: sendMessages will be called after join_chat to ensure role is known

    socket.on("join_chat", ({ nickname: requestedNickname, password, os }) => {
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
        isOwner,
        os
      });
      
      socket.join(os);
      socket.emit("join_success", { nickname: finalNickname, isOwner });
      sendMessages(socket);
      broadcastUserList(os);
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
      
      const msgs = messages.get(user.os) || [];
      msgs.push(messageWithId);
      messages.set(user.os, msgs);
      
      user.lastActive = Date.now();
      user.isTyping = false;
      
      // Broadcast to everyone in the same room
      io.to(user.os).emit("new_message", messageWithId);
      broadcastUserList(user.os);
    });

    socket.on("delete_message", ({ messageId, type }) => {
      const user = users.get(socket.id);
      if (!user) return;

      const msgs = messages.get(user.os) || [];
      const msgIdx = msgs.findIndex(m => m.id === messageId);
      if (msgIdx === -1) return;

      const msg = msgs[msgIdx];
      
      if (type === 'permanent' && user.isOwner) {
        // Sigma Dev hard deletes permanently
        msgs[msgIdx].isPermanentlyRemoved = true;
        msgs[msgIdx].isDeleted = true;
      } else if (type === 'admin_soft' && user.isOwner) {
        // Sigma Dev soft deletes someone else's message
        msgs[msgIdx].isAdminDeleted = true;
        msgs[msgIdx].isDeleted = true;
      } else if (msg.senderName === user.nickname) {
        // Regular user (or Sigma Dev) deletes their own message
        msgs[msgIdx].isDeleted = true;
      }
      messages.set(user.os, msgs);

      // Update everyone in the room
      users.forEach((u, sid) => {
        if (u.os === user.os) {
          const clientSocket = io.sockets.sockets.get(sid);
          if (clientSocket) sendMessages(clientSocket);
        }
      });
    });

    socket.on("kick_user", (targetIdOrNickname) => {
      const user = users.get(socket.id);
      if (!user?.isOwner) return;

      console.log(`[ADMIN] Sigma Dev is kicking user: ${targetIdOrNickname}`);
      
      let targetSocketId = targetIdOrNickname;
      let targetSocket = io.sockets.sockets.get(targetSocketId);
      
      if (!targetSocket) {
        for (const [sid, u] of users.entries()) {
          if (u.nickname === targetIdOrNickname) {
            targetSocketId = sid;
            targetSocket = io.sockets.sockets.get(sid);
            break;
          }
        }
      }

      if (targetSocket) {
        if (targetSocket.id === socket.id) {
          console.log("[ADMIN] Prevented Sigma Dev from kicking themselves.");
          return;
        }
        targetSocket.emit("kicked", "You were kicked by the Owner, you may join back in");
        console.log(`[ADMIN] User ${targetSocketId} has been kicked.`);
      } else {
        console.log(`[ADMIN] Could not find socket for: ${targetIdOrNickname}`);
      }
    });

    socket.on("kick_user_5m", (targetIdOrNickname) => {
      const user = users.get(socket.id);
      if (!user?.isOwner) return;

      console.log(`[ADMIN] Sigma Dev is kicking user for 5 minutes: ${targetIdOrNickname}`);
      
      let targetSocketId = targetIdOrNickname;
      let targetSocket = io.sockets.sockets.get(targetSocketId);
      
      if (!targetSocket) {
        for (const [sid, u] of users.entries()) {
          if (u.nickname === targetIdOrNickname) {
            targetSocketId = sid;
            targetSocket = io.sockets.sockets.get(sid);
            break;
          }
        }
      }

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
        console.log(`[ADMIN] User ${targetSocketId} has been kicked.`);
      } else {
        console.log(`[ADMIN] Could not find socket for: ${targetIdOrNickname}`);
      }
    });

    socket.on("typing", (isTyping) => {
      const user = users.get(socket.id);
      if (user) {
        user.isTyping = isTyping;
        socket.to(user.os).emit("user_list", Array.from(users.values()).filter(u => u.os === user.os));
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      const user = users.get(socket.id);
      if (user) {
        users.delete(socket.id);
        broadcastUserList(user.os);
      }
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
