import {
  Room,
  RemoteParticipant,
  LocalParticipant,
  ConnectionQuality,
} from 'livekit-client';

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

export interface MediaDevice {
  deviceId: string;
  groupId: string;
  kind: string;
  label: string;
}

export interface ErrorState {
  type: 'connection' | 'general';
  message: string;
}

export interface DeviceState {
  audioInputs: MediaDevice[];
  videoInputs: MediaDevice[];
  audioOutputs: MediaDevice[];
}

export interface CurrentDevices {
  audioInput: string;
  videoInput: string;
  audioOutput: string;
}

export interface LiveKitContextType {
  roomState: RoomState;
  connect: (url: string, token: string) => Promise<void>;
  autoConnect: () => Promise<void>;
  disconnect: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  retry: () => Promise<void>;
  clearError: () => void;
  error: ErrorState | null;
  isRetrying: boolean;
  connectionState: string;
  getAvailableDevices: () => Promise<DeviceState>;
  changeAudioInput: (deviceId: string) => Promise<void>;
  changeVideoInput: (deviceId: string) => Promise<void>;
  changeAudioOutput: (deviceId: string) => Promise<void>;
  getCurrentDevices: () => Promise<CurrentDevices>;
}
