import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import type { Server as HttpServer } from "node:http";
import { env } from "../config/env.js";

let io: Server | null = null;

export function initializeSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [...env.WEB_ORIGINS, env.MOBILE_ORIGIN],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token ?? socket.handshake.query?.token;
    if (!token) return next(new Error("AUTH_REQUIRED"));
    try {
      const decoded = jwt.verify(token as string, env.JWT_ACCESS_SECRET) as {
        sub: string;
        roles: string[];
      };
      (socket as any).userId = decoded.sub;
      (socket as any).roles = decoded.roles;
      next();
    } catch {
      next(new Error("AUTH_INVALID"));
    }
  });

  io.on("connection", (socket) => {
    const userId = (socket as any).userId as string;

    socket.join(`user:${userId}`);

    socket.on("learning:progress", (event) => {
      socket.broadcast.emit("learning:progress", event);
    });

    socket.on("join:school", (schoolId: string) => socket.join(`school:${schoolId}`));
    socket.on("join:class", (classId: string) => socket.join(`class:${classId}`));
    socket.on("join:course", (courseId: string) => socket.join(`course:${courseId}`));
    socket.on("leave:school", (schoolId: string) => socket.leave(`school:${schoolId}`));
    socket.on("leave:class", (classId: string) => socket.leave(`class:${classId}`));
    socket.on("leave:course", (courseId: string) => socket.leave(`course:${courseId}`));
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}
