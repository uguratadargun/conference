import { Room, RemoteParticipant, LocalParticipant } from "livekit-client";

export interface Participant {
  id: string;
  name: string;
  isLocal: boolean;
  participant: LocalParticipant | RemoteParticipant;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

export interface RoomState {
  room: Room | null;
  participants: Participant[];
  isConnected: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}
