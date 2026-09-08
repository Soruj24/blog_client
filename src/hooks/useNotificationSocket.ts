"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { io, type Socket } from "socket.io-client";
import { useAppDispatch } from "@/src/store/hooks";
import { baseApi } from "@/src/store/api/baseApi";

let socket: Socket | null = null;

/** Socket.io client for real-time notifications. Falls back to polling if socket unavailable */
export function useNotificationSocket() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (status !== "authenticated" || !session?.backendToken) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
    const url =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (apiUrl ? apiUrl.replace(/\/api\/v1\/?$/, "") : "http://localhost:5000");
    // Avoid duplicate connections
    if (socket?.connected) return;

    socket = io(url, {
      auth: { token: session.backendToken },
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("[socket] connected", socket?.id);
    });

    socket.on("notification:new", () => {
      // Invalidate inbox to refetch unread count + list; polling remains fallback
      dispatch(baseApi.util.invalidateTags([{ type: "Notification", id: "LIST" }]));
    });

    socket.on("disconnect", () => {
      console.log("[socket] disconnected");
    });

    return () => {
      // Keep socket alive across page navigations; only disconnect on logout handled above
    };
  }, [status, session?.backendToken, dispatch]);

  useEffect(() => {
    return () => {
      // Cleanup only on unmount of provider (app close)
      // Not on every navigation
    };
  }, []);
}

export function disconnectNotificationSocket() {
  socket?.disconnect();
  socket = null;
}
