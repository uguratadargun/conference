import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import { Room } from "livekit-client";
import type {
  RoomState,
  ErrorState,
  LiveKitContextType,
} from "../types/livekit";
import { ROOM_OPTIONS, CONNECTION_CONFIG, INTERVALS } from "../config/livekit";
import { generateToken } from "../utils/livekit-token";
import { initializeAudioContext } from "../utils/audio-utils";
import { setupRoomEventHandlers } from "../utils/room-event-handlers";
import { useDeviceManagement } from "../hooks/useDeviceManagement";
import { useAudioInteraction } from "../hooks/useAudioInteraction";

const LiveKitContext = createContext<LiveKitContextType | null>(null);

export const LiveKitProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [roomState, setRoomState] = useState<RoomState>({
    room: null,
    participants: [],
    isConnected: false,
    isVideoEnabled: true,
    isAudioEnabled: true,
  });
  const [error, setError] = useState<ErrorState | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [connectionState, setConnectionState] =
    useState<string>("disconnected");
  const [audioStartAttempted, setAudioStartAttempted] = useState(false);

  // Use device management hook
  const deviceManagement = useDeviceManagement(roomState.room);

  // Use audio interaction hook
  useAudioInteraction(
    roomState.room,
    audioStartAttempted,
    setAudioStartAttempted
  );

  // Memoized functions to prevent unnecessary re-renders
  const requestMediaPermissions = useCallback(async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.warn("Media permissions not granted:", error);
    }
  }, []);

  const initializeRoom = useCallback((): Room => {
    return new Room(ROOM_OPTIONS);
  }, []);

  const setupInitialParticipants = useCallback((room: Room): void => {
    const localParticipant = room.localParticipant;
    const remoteParticipants = Array.from(room.remoteParticipants.values());

    setRoomState((prev) => ({
      ...prev,
      room,
      isConnected: true,
      isVideoEnabled: false,
      isAudioEnabled: false,
      localConnectionQuality: localParticipant.connectionQuality,
      participants: [
        {
          id: localParticipant.identity,
          name: localParticipant.identity,
          isLocal: true,
          participant: localParticipant,
          isVideoEnabled: false,
          isAudioEnabled: false,
        },
        ...remoteParticipants.map((participant) => ({
          id: participant.identity,
          name: participant.identity,
          isLocal: false,
          participant,
          isVideoEnabled: participant.isCameraEnabled,
          isAudioEnabled: participant.isMicrophoneEnabled,
        })),
      ],
    }));
  }, []);

  const connect = useCallback(
    async (url: string, token: string): Promise<void> => {
      let room: Room | null = null;

      try {
        await requestMediaPermissions();
        room = initializeRoom();

        setupRoomEventHandlers(
          room,
          setRoomState,
          setError,
          setIsRetrying,
          setConnectionState,
          setAudioStartAttempted
        );

        await room.connect(url, token, CONNECTION_CONFIG);
        setupInitialParticipants(room);
      } catch (error) {
        console.error("Failed to connect to room:", error);
        if (room) {
          room.disconnect();
        }
        setConnectionState("disconnected");
        setRoomState({
          room: null,
          participants: [],
          isConnected: false,
          isVideoEnabled: true,
          isAudioEnabled: true,
        });
        throw error;
      }
    },
    [requestMediaPermissions, initializeRoom, setupInitialParticipants]
  );

  const autoConnect = useCallback(async (): Promise<void> => {
    if (roomState.isConnected) {
      return;
    }

    try {
      setError(null);
      setIsRetrying(true);
      setConnectionState("connecting");

      await initializeAudioContext();
      const { url, token } = await generateToken();
      await connect(url, token);
    } catch (error) {
      console.error("Connection error:", error);
      setConnectionState("disconnected");

      if (error instanceof Error) {
        if (
          error.message.includes("camera and microphone") ||
          error.message.includes("Permission denied") ||
          error.message.includes("NotAllowedError")
        ) {
          console.warn("Continuing without media permissions:", error.message);
          try {
            setConnectionState("connecting");
            const { url, token } = await generateToken();
            await connect(url, token);
            return;
          } catch (retryError) {
            setConnectionState("disconnected");
            setError({
              type: "connection",
              message: "Failed to connect to the room. Please try again.",
            });
          }
        } else {
          setError({ type: "connection", message: error.message });
        }
      } else {
        setError({
          type: "connection",
          message: "Failed to connect to the room. Please try again.",
        });
      }
    } finally {
      setIsRetrying(false);
    }
  }, [roomState.isConnected, connect]);

  const retry = useCallback(async (): Promise<void> => {
    if (roomState.isConnected) {
      disconnect();
    }
    await new Promise((resolve) => setTimeout(resolve, INTERVALS.RETRY_DELAY));
    await autoConnect();
  }, [roomState.isConnected, autoConnect]);

  const disconnect = useCallback((): void => {
    if (roomState.room) {
      roomState.room.disconnect();
      setConnectionState("disconnected");
      setRoomState({
        room: null,
        participants: [],
        isConnected: false,
        isVideoEnabled: true,
        isAudioEnabled: true,
      });
    }

    // Cleanup device management
    if (deviceManagement.cleanup) {
      deviceManagement.cleanup();
    }
  }, [roomState.room, deviceManagement]);

  const toggleVideo = useCallback(async (): Promise<void> => {
    if (roomState.room) {
      const localParticipant = roomState.room.localParticipant;
      try {
        await localParticipant.setCameraEnabled(!roomState.isVideoEnabled);
      } catch (error) {
        console.error("Failed to toggle video:", error);
      }
    }
  }, [roomState.room, roomState.isVideoEnabled]);

  const toggleAudio = useCallback(async (): Promise<void> => {
    if (roomState.room) {
      const localParticipant = roomState.room.localParticipant;
      try {
        await localParticipant.setMicrophoneEnabled(!roomState.isAudioEnabled);
      } catch (error) {
        console.error("Failed to toggle audio:", error);
      }
    }
  }, [roomState.room, roomState.isAudioEnabled]);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      roomState,
      connect,
      autoConnect,
      disconnect,
      toggleVideo,
      toggleAudio,
      retry,
      clearError,
      error,
      isRetrying,
      connectionState,
      ...deviceManagement,
    }),
    [
      roomState,
      connect,
      autoConnect,
      disconnect,
      toggleVideo,
      toggleAudio,
      retry,
      clearError,
      error,
      isRetrying,
      connectionState,
      deviceManagement,
    ]
  );

  return (
    <LiveKitContext.Provider value={contextValue}>
      {children}
    </LiveKitContext.Provider>
  );
};

export const useLiveKit = () => {
  const context = useContext(LiveKitContext);
  if (!context) {
    throw new Error("useLiveKit must be used within a LiveKitProvider");
  }
  return context;
};
