import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  LocalParticipant,
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
    const room = new Room();

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

    try {
      await room.connect(url, token);
      const localParticipant = room.localParticipant;

      setRoomState((prev) => ({
        ...prev,
        room,
        isConnected: true,
        participants: [
          {
            id: localParticipant.identity,
            name: localParticipant.identity,
            isLocal: true,
            participant: localParticipant,
            isVideoEnabled: localParticipant.isCameraEnabled,
            isAudioEnabled: localParticipant.isMicrophoneEnabled,
          },
        ],
      }));
    } catch (error) {
      console.error("Failed to connect to room:", error);
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

  const toggleAudio = () => {
    if (roomState.room) {
      const localParticipant = roomState.room.localParticipant;
      localParticipant.setMicrophoneEnabled(!roomState.isAudioEnabled);
      setRoomState((prev) => ({
        ...prev,
        isAudioEnabled: !prev.isAudioEnabled,
      }));
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
