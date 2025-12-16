import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";

let io: SocketServer | null = null;

export const initializeWebSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join specific polyclinic room
    socket.on("join:polyclinic", (polyclinicId: string) => {
      socket.join(`polyclinic:${polyclinicId}`);
      console.log(`Client ${socket.id} joined polyclinic:${polyclinicId}`);
    });

    // Join queue display room (for TV displays)
    socket.on("join:display", () => {
      socket.join("queue:display");
      console.log(`Client ${socket.id} joined queue:display`);
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

// Broadcast queue update to specific polyclinic
export const broadcastQueueUpdate = (polyclinicId: string, data: any) => {
  if (io) {
    io.to(`polyclinic:${polyclinicId}`).emit("queue:update", data);
    io.to("queue:display").emit("queue:update", data);
  }
};

// Broadcast when a number is called
export const broadcastQueueCalled = (polyclinicId: string, data: any) => {
  if (io) {
    io.to(`polyclinic:${polyclinicId}`).emit("queue:called", data);
    io.to("queue:display").emit("queue:called", data);
  }
};
