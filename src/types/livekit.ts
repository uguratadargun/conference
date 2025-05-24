import { Room, RemoteParticipant, LocalParticipant, ConnectionQuality } from "livekit-client";

export interface Participant {
  id: string;
  name: string;
  isLocal: boolean;
  participant: LocalParticipant | RemoteParticipant;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isSpeaking?: boolean;
  lastUpdated?: number;
  streamState?: string;
  metadata?: string;
  hasConnectionIssues?: boolean;
  permissions?: any;
  canSpeak?: boolean;
  canPublish?: boolean;
}

export interface RoomState {
  room: Room | null;
  participants: Participant[];
  isConnected: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isReconnecting?: boolean;
  isRecording?: boolean;
  connectionState?: string;
  roomMetadata?: string;
  localConnectionQuality?: ConnectionQuality;
}
