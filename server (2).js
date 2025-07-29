import http from "http";
import { Server as SocketServer } from "socket.io";
import app from "./app.js";

const server = http.createServer(app);
const io = new SocketServer(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  socket.on("join", userId => { socket.join(`user:${userId}`); });
});

export function notifyUser(userId, event) {
  io.to(`user:${userId}`).emit("alert", event);
}

export default server;