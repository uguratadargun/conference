import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  LocalParticipant,
  LocalTrack,
  Track,
} from "livekit-client";
import type { Participant, RoomState } from "../types/livekit";

interface LiveKitContextType {
  roomState: RoomState;
  connect: (url: string, token: string) => Promise<void>;
  disconnect: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
}

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

  const connect = async (url: string, token: string) => {
    let room: Room | null = null;

    try {
      // Request media permissions but make both audio and video optional
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
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

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          console.log("Audio track subscribed:", track);
          // Create and attach audio element
          const audioElement = new Audio();
          track.attach(audioElement);
          audioElement.play().catch(console.error);
        }
      });

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

      // Camera is disabled by default
      try {
        await room.localParticipant.setCameraEnabled(false);
      } catch (error) {
        console.warn("Could not control camera:", error);
      }

      const localParticipant = room.localParticipant;
      const remoteParticipants = Array.from(room.remoteParticipants.values());

      setRoomState((prev) => ({
        ...prev,
        room,
        isConnected: true,
        isVideoEnabled: false, // Set to false since we don't have a camera
        participants: [
          {
            id: localParticipant.identity,
            name: localParticipant.identity,
            isLocal: true,
            participant: localParticipant,
            isVideoEnabled: false, // Set to false since we don't have a camera
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

  const toggleVideo = () => {
    if (roomState.room) {
      const localParticipant = roomState.room.localParticipant;
      localParticipant.setCameraEnabled(!roomState.isVideoEnabled);
      setRoomState((prev) => ({
        ...prev,
        isVideoEnabled: !prev.isVideoEnabled,
      }));
    }
  };

  const toggleAudio = async () => {
    if (roomState.room) {
      const localParticipant = roomState.room.localParticipant;
      try {
        if (roomState.isAudioEnabled) {
          await localParticipant.setMicrophoneEnabled(false);
        } else {
          await localParticipant.setMicrophoneEnabled(true);
        }
        setRoomState((prev) => ({
          ...prev,
          isAudioEnabled: !prev.isAudioEnabled,
        }));
      } catch (error) {
        console.error("Failed to toggle audio:", error);
      }
    }
  };

  return (
    <LiveKitContext.Provider
      value={{ roomState, connect, disconnect, toggleVideo, toggleAudio }}
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
