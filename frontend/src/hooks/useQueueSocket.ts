"use client";

import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { QueueState, QueueDisplayItem } from "@/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

export function useQueueSocket(polyclinicId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(WS_URL);

    newSocket.on("connect", () => {
      setConnected(true);
      if (polyclinicId) {
        newSocket.emit("join:polyclinic", polyclinicId);
      }
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
    });

    newSocket.on("queue:update", (data: QueueState) => {
      setQueueState(data);
    });

    newSocket.on("queue:called", (data: any) => {
      // Play sound or show notification
      console.log("Queue called:", data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [polyclinicId]);

  const joinPolyclinic = useCallback(
    (id: string) => {
      if (socket) {
        socket.emit("join:polyclinic", id);
      }
    },
    [socket]
  );

  return { socket, queueState, connected, joinPolyclinic };
}

export function useQueueDisplay() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [displayData, setDisplayData] = useState<QueueDisplayItem[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(WS_URL);

    newSocket.on("connect", () => {
      setConnected(true);
      newSocket.emit("join:display");
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
    });

    newSocket.on("queue:update", () => {
      // Refresh display data when queue updates
      fetch(`${WS_URL}/api/queue/display`)
        .then((res) => res.json())
        .then(setDisplayData)
        .catch(console.error);
    });

    newSocket.on("queue:called", (data: any) => {
      // Could trigger audio announcement here
      console.log("Called:", data);
    });

    // Initial fetch
    fetch(`${WS_URL}/api/queue/display`)
      .then((res) => res.json())
      .then(setDisplayData)
      .catch(console.error);

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, displayData, connected };
}
