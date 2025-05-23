import React, { createContext, useContext, useState } from "react";
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  Track,
  TrackPublication,
} from "livekit-client";
import { AccessToken } from "livekit-server-sdk";
import type { RoomState } from "../types/livekit";

interface LiveKitContextType {
  roomState: RoomState;
  connect: (url: string, token: string) => Promise<void>;
  autoConnect: () => Promise<void>;
  disconnect: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  retry: () => Promise<void>;
  error: string | null;
  isRetrying: boolean;
}

// LiveKit Configuration
const LIVEKIT_CONFIG = {
  apiKey: "APItrVwR79fsfN6",
  apiSecret: "0sbQLRiGbRSTBpAlKUJO7hdniYfGCCfANlv5rUMK8ib",
  projectName: "ugurdargun-w5ph6ze0",
  roomName: "test-room",
};

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
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const generateToken = async (): Promise<{ url: string; token: string }> => {
    // Generate a more unique username to avoid duplicates
    const timestamp = Date.now().toString(36); // Convert timestamp to base36 for shorter string

    // Use crypto.getRandomValues if available for better randomness
    let randomPart: string;
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      randomPart = array[0].toString(36);
    } else {
      randomPart = Math.floor(Math.random() * 999999).toString(36);
    }

    const username = `user_${timestamp}_${randomPart}`;

    console.log(`Generated unique username: ${username}`);

    const at = new AccessToken(
      LIVEKIT_CONFIG.apiKey,
      LIVEKIT_CONFIG.apiSecret,
      {
        identity: username,
      }
    );
    at.addGrant({ roomJoin: true, room: LIVEKIT_CONFIG.roomName });
    const token = await at.toJwt();
    const url = `wss://${LIVEKIT_CONFIG.projectName}.livekit.cloud`;

    return { url, token };
  };

  const autoConnect = async () => {
    if (roomState.isConnected) {
      return;
    }

    try {
      setError(null);
      setIsRetrying(true);

      const { url, token } = await generateToken();
      await connect(url, token);
    } catch (error) {
      console.error("Connection error:", error);
      if (error instanceof Error) {
        // Don't prevent app from starting if it's just a media permission issue
        if (
          error.message.includes("camera and microphone") ||
          error.message.includes("Permission denied") ||
          error.message.includes("NotAllowedError")
        ) {
          console.warn("Continuing without media permissions:", error.message);
          // Try to connect again without requiring media permissions
          try {
            const { url, token } = await generateToken();
            await connect(url, token);
            return; // Successfully connected without media permissions
          } catch (retryError) {
            // If retry fails, show a different error
            setError("Connected without camera/microphone access.");
          }
        } else {
          setError(error.message);
        }
      } else {
        setError("Failed to connect to the room. Please try again.");
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const retry = async () => {
    // Reset any existing connections
    if (roomState.isConnected) {
      disconnect();
    }
    // Wait a bit before retrying
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await autoConnect();
  };

  const connect = async (url: string, token: string) => {
    let room: Room | null = null;

    try {
      // Request media permissions but make both audio and video optional
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        // Stop the stream immediately as we'll get it again through LiveKit
        stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        // Log the error but continue without throwing
        console.warn("Media permissions not granted:", error);
        // Don't throw error, just continue without media access
      }

      // Create room with proper configuration
      room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Helper function to update participant state
      const updateParticipantState = (
        participant: any,
        isLocal: boolean = false
      ) => {
        setRoomState((prev) => {
          // Check if there are actual changes before updating
          const existingParticipant = prev.participants.find(
            (p) => p.id === participant.identity
          );
          const newVideoEnabled = participant.isCameraEnabled;
          const newAudioEnabled = participant.isMicrophoneEnabled;

          // If participant doesn't exist or values haven't changed, don't update
          if (
            existingParticipant &&
            existingParticipant.isVideoEnabled === newVideoEnabled &&
            existingParticipant.isAudioEnabled === newAudioEnabled &&
            (!isLocal ||
              (prev.isVideoEnabled === newVideoEnabled &&
                prev.isAudioEnabled === newAudioEnabled))
          ) {
            return prev; // No changes, return previous state
          }

          return {
            ...prev,
            participants: prev.participants.map((p) =>
              p.id === participant.identity
                ? {
                    ...p,
                    isVideoEnabled: newVideoEnabled,
                    isAudioEnabled: newAudioEnabled,
                  }
                : p
            ),
            // Also update global state for local participant
            ...(isLocal
              ? {
                  isVideoEnabled: newVideoEnabled,
                  isAudioEnabled: newAudioEnabled,
                }
              : {}),
          };
        });
      };

      // Set up event handlers
      room.on(
        RoomEvent.ParticipantConnected,
        (participant: RemoteParticipant) => {
          setRoomState((prev) => ({
            ...prev,
            participants: [
              ...prev.participants,
              {
                id: participant.identity,
                name: participant.identity,
                isLocal: false,
                participant,
                isVideoEnabled: participant.isCameraEnabled,
                isAudioEnabled: participant.isMicrophoneEnabled,
              },
            ],
          }));
        }
      );

      room.on(
        RoomEvent.ParticipantDisconnected,
        (participant: RemoteParticipant) => {
          setRoomState((prev) => ({
            ...prev,
            participants: prev.participants.filter(
              (p) => p.id !== participant.identity
            ),
          }));
        }
      );

      // Track mute/unmute events
      room.on(
        RoomEvent.TrackMuted,
        (publication: TrackPublication, participant: any) => {
          console.log(
            `Track muted: ${publication.kind} for participant ${participant.identity}`
          );
          updateParticipantState(participant, participant.isLocal);
        }
      );

      room.on(
        RoomEvent.TrackUnmuted,
        (publication: TrackPublication, participant: any) => {
          console.log(
            `Track unmuted: ${publication.kind} for participant ${participant.identity}`
          );
          updateParticipantState(participant, participant.isLocal);
        }
      );

      // Track published/unpublished events
      room.on(
        RoomEvent.TrackPublished,
        (publication: TrackPublication, participant: any) => {
          console.log(
            `Track published: ${publication.kind} for participant ${participant.identity}`
          );
          updateParticipantState(participant, participant.isLocal);
        }
      );

      room.on(
        RoomEvent.TrackUnpublished,
        (publication: TrackPublication, participant: any) => {
          console.log(
            `Track unpublished: ${publication.kind} for participant ${participant.identity}`
          );
          updateParticipantState(participant, participant.isLocal);
        }
      );

      // Local participant track events
      room.on(
        RoomEvent.LocalTrackPublished,
        (publication: TrackPublication, participant: any) => {
          console.log(`Local track published: ${publication.kind}`);
          updateParticipantState(participant, true);
        }
      );

      room.on(
        RoomEvent.LocalTrackUnpublished,
        (publication: TrackPublication, participant: any) => {
          console.log(`Local track unpublished: ${publication.kind}`);
          updateParticipantState(participant, true);
        }
      );

      room.on(
        RoomEvent.TrackSubscribed,
        (track, _publication, _participant) => {
          if (track.kind === Track.Kind.Audio) {
            console.log("Audio track subscribed:", track);
            // Let the browser handle audio playback automatically
            track.attach();
          }
        }
      );

      room.on(RoomEvent.Disconnected, () => {
        console.log("Disconnected from room");
        setRoomState({
          room: null,
          participants: [],
          isConnected: false,
          isVideoEnabled: true,
          isAudioEnabled: true,
        });
      });

      room.on(RoomEvent.MediaDevicesError, (error: Error) => {
        console.error("Media devices error:", error);
      });

      // Connect to the room
      await room.connect(url, token, {
        autoSubscribe: true,
      });

      // Try to enable microphone, but don't fail if not available
      try {
        await room.localParticipant.setMicrophoneEnabled(true);
      } catch (error) {
        console.warn("Could not enable microphone:", error);
        // Continue without microphone
      }

      // Enable camera by default
      try {
        await room.localParticipant.setCameraEnabled(true);
      } catch (error) {
        console.warn("Could not enable camera:", error);
      }

      const localParticipant = room.localParticipant;
      const remoteParticipants = Array.from(room.remoteParticipants.values());

      setRoomState((prev) => ({
        ...prev,
        room,
        isConnected: true,
        isVideoEnabled: localParticipant.isCameraEnabled, // Use actual state from LiveKit
        isAudioEnabled: localParticipant.isMicrophoneEnabled, // Use actual state from LiveKit
        participants: [
          {
            id: localParticipant.identity,
            name: localParticipant.identity,
            isLocal: true,
            participant: localParticipant,
            isVideoEnabled: localParticipant.isCameraEnabled, // Use actual state from LiveKit
            isAudioEnabled: localParticipant.isMicrophoneEnabled,
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
    } catch (error) {
      console.error("Failed to connect to room:", error);
      // Clean up any partial connection
      if (room) {
        room.disconnect();
      }
      setRoomState({
        room: null,
        participants: [],
        isConnected: false,
        isVideoEnabled: true,
        isAudioEnabled: true,
      });
      throw error; // Re-throw to handle in the component
    }
  };

  const disconnect = () => {
    if (roomState.room) {
      roomState.room.disconnect();
      setRoomState({
        room: null,
        participants: [],
        isConnected: false,
        isVideoEnabled: true,
        isAudioEnabled: true,
      });
    }
  };

  const toggleVideo = async () => {
    if (roomState.room) {
      const localParticipant = roomState.room.localParticipant;
      try {
        await localParticipant.setCameraEnabled(!roomState.isVideoEnabled);
        // State will be updated automatically via the event handlers
      } catch (error) {
        console.error("Failed to toggle video:", error);
      }
    }
  };

  const toggleAudio = async () => {
    if (roomState.room) {
      const localParticipant = roomState.room.localParticipant;
      try {
        await localParticipant.setMicrophoneEnabled(!roomState.isAudioEnabled);
        // State will be updated automatically via the event handlers
      } catch (error) {
        console.error("Failed to toggle audio:", error);
      }
    }
  };

  return (
    <LiveKitContext.Provider
      value={{
        roomState,
        connect,
        autoConnect,
        disconnect,
        toggleVideo,
        toggleAudio,
        retry,
        error,
        isRetrying,
      }}
    >
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
