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

interface MediaDevice {
  deviceId: string;
  groupId: string;
  kind: string;
  label: string;
}

interface ErrorState {
  type: 'connection' | 'general';
  message: string;
}

interface LiveKitContextType {
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
  // Device management
  getAvailableDevices: () => Promise<{
    audioInputs: MediaDevice[];
    videoInputs: MediaDevice[];
    audioOutputs: MediaDevice[];
  }>;
  changeAudioInput: (deviceId: string) => Promise<void>;
  changeVideoInput: (deviceId: string) => Promise<void>;
  changeAudioOutput: (deviceId: string) => Promise<void>;
  getCurrentDevices: () => Promise<{
    audioInput: string;
    videoInput: string;
    audioOutput: string;
  }>;
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
  const [error, setError] = useState<ErrorState | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [audioStartAttempted, setAudioStartAttempted] = useState(false);

  // Function to try starting audio automatically
  const tryStartAudio = async () => {
    if (!roomState.room || audioStartAttempted) return;
    
    try {
      await roomState.room.startAudio();
      console.log('Audio automatically started on user interaction');
      setAudioStartAttempted(true);
    } catch (error) {
      console.log('Audio could not be started automatically:', error);
    }
  };

  // Set up global click listener for auto audio start
  React.useEffect(() => {
    if (roomState.room && !audioStartAttempted) {
      const handleUserInteraction = () => {
        tryStartAudio();
        // Remove listeners after first attempt
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
      };

      document.addEventListener('click', handleUserInteraction);
      document.addEventListener('keydown', handleUserInteraction);
      document.addEventListener('touchstart', handleUserInteraction);

      return () => {
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
      };
    }
  }, [roomState.room, audioStartAttempted]);

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
      setConnectionState('connecting');

      // Initialize audio context early to avoid audio policy issues
      try {
        if (typeof window !== 'undefined' && window.AudioContext) {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          if (audioContext.state === 'suspended') {
            // Audio context is suspended, will be resumed on user interaction
            const resumeAudio = () => {
              audioContext.resume().then(() => {
                console.log('Audio context resumed');
                document.removeEventListener('click', resumeAudio);
                document.removeEventListener('keydown', resumeAudio);
              });
            };
            document.addEventListener('click', resumeAudio, { once: true });
            document.addEventListener('keydown', resumeAudio, { once: true });
          }
        }
      } catch (audioError) {
        console.warn('Audio context initialization failed:', audioError);
      }

      const { url, token } = await generateToken();
      await connect(url, token);
    } catch (error) {
      console.error("Connection error:", error);
      setConnectionState('disconnected');
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
            setConnectionState('connecting');
            const { url, token } = await generateToken();
            await connect(url, token);
            // Don't set an error for successful connection without media permissions
            // The connection success will be handled by the Connected event
            return;
          } catch (retryError) {
            // If retry fails, show a proper error
            setConnectionState('disconnected');
            setError({ type: 'connection', message: "Failed to connect to the room. Please try again." });
          }
        } else {
          setError({ type: 'connection', message: error.message });
        }
      } else {
        setError({ type: 'connection', message: "Failed to connect to the room. Please try again." });
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
        (track, _publication, participant) => {
          console.log(`✅ Track subscribed: ${track.kind} from ${participant.identity}`);
          
          // Update participant state to reflect new track subscription
          setRoomState((prev) => ({
            ...prev,
            participants: prev.participants.map((p) =>
              p.id === participant.identity
                ? { 
                    ...p, 
                    isVideoEnabled: participant.isCameraEnabled,
                    isAudioEnabled: participant.isMicrophoneEnabled,
                    lastUpdated: Date.now()
                  }
                : p
            )
          }));
        }
      );

      room.on(
        RoomEvent.TrackUnsubscribed,
        (track, _publication, participant) => {
          console.log(
            `Track unsubscribed: ${track.kind} for participant ${participant.identity}`
          );
          
          if (track.kind === Track.Kind.Audio) {
            // Let LiveKit handle cleanup
            track.detach();
          } else if (track.kind === Track.Kind.Video) {
            // Force a state update to trigger re-render of video components
            updateParticipantState(participant, participant.isLocal);
          }
        }
      );

      // Handle audio playback status changes
      room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
        console.log('Audio playback status changed. Can play audio:', room?.canPlaybackAudio);
        if (room && !room.canPlaybackAudio) {
          console.warn('Audio playback is blocked. User interaction required.');
          // The audio will be enabled when user toggles microphone
        }
      });

      // Handle reconnection attempts
      room.on(RoomEvent.Reconnecting, () => {
        setError({ type: 'connection', message: 'Connection lost, reconnecting...' });
        setIsRetrying(true);
        
        setRoomState((prev) => ({
          ...prev,
          isReconnecting: true
        }));
      });

      // Handle successful reconnection
      room.on(RoomEvent.Reconnected, () => {
        setError(null);
        setIsRetrying(false);
        
        setRoomState((prev) => ({
          ...prev,
          isReconnecting: false
        }));
      });

      // Handle initial connection established
      room.on(RoomEvent.Connected, () => {
        setError(null);
        setIsRetrying(false);
        
        setRoomState((prev) => ({
          ...prev,
          isConnected: true,
          isReconnecting: false
        }));
      });

      // Handle participant permission changes
      room.on(RoomEvent.ParticipantPermissionsChanged, (_prevPermissions: any, participant: any) => {
        // Update participant state with new permissions
        setRoomState((prev) => ({
          ...prev,
          participants: prev.participants.map((p) =>
            p.id === participant.identity
              ? { ...p, permissions: participant.permissions }
              : p
          )
        }));
      });

      // Data channel buffer status monitoring
      room.on(RoomEvent.DCBufferStatusChanged, (isLow: boolean, _kind: any) => {
        // This can be used to monitor data channel health
        console.log(`Data channel buffer ${isLow ? 'low' : 'normal'}`);
      });

      // Handle encryption state changes (if using E2EE)
      room.on(RoomEvent.EncryptionError, (error: Error) => {
        console.error('Encryption error:', error);
        setError({ type: 'general', message: 'Encryption error occurred. Please reconnect.' });
      });

      // Handle when participant changes their name/metadata
      room.on(RoomEvent.ParticipantNameChanged, (name: string, participant: any) => {
        setRoomState((prev) => ({
          ...prev,
          participants: prev.participants.map((p) =>
            p.id === participant.identity
              ? { ...p, name: name || participant.identity }
              : p
          )
        }));
      });

      // Handle active speakers for speaking indicators
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const activeSpeakerIds = speakers.map(p => p.identity);
        
        setRoomState((prev) => ({
          ...prev,
          participants: prev.participants.map((p) => ({
            ...p,
            isSpeaking: activeSpeakerIds.includes(p.id),
            lastUpdated: Date.now()
          }))
        }));
      });

      // Connection quality monitoring (only for local participant)
      room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
        // Only track local participant's connection quality
        if (participant.isLocal) {
          console.log(`🔄 Connection quality changed for local participant: ${quality}`);
          setRoomState((prev) => ({
            ...prev,
            localConnectionQuality: quality,
          }));
        }
      });

      // Track stream state changes (bandwidth-related)
      room.on(RoomEvent.TrackStreamStateChanged, (_pub, streamState, participant) => {
        // Update participant state with stream quality info
        setRoomState((prev) => ({
          ...prev,
          participants: prev.participants.map((p) =>
            p.id === participant.identity
              ? { ...p, streamState: streamState }
              : p
          )
        }));
      });

      // Participant metadata changes
      room.on(RoomEvent.ParticipantMetadataChanged, (_prevMetadata, participant) => {
        // Update participant state with new metadata
        setRoomState((prev) => ({
          ...prev,
          participants: prev.participants.map((p) =>
            p.id === participant.identity
              ? { ...p, metadata: participant.metadata }
              : p
          )
        }));
      });

      // Room-level metadata changes
      room.on(RoomEvent.RoomMetadataChanged, (metadata) => {
        // Update room state with new metadata
        setRoomState((prev) => ({
          ...prev,
          roomMetadata: metadata
        }));
      });

      // Recording status changes
      room.on(RoomEvent.RecordingStatusChanged, (isRecording) => {
        // Update state to show recording indicator in UI
        setRoomState((prev) => ({
          ...prev,
          isRecording: isRecording
        }));
      });

      // Track subscription failures
      room.on(RoomEvent.TrackSubscriptionFailed, (_trackSid, participant) => {
        // Show error notification to user
        setError({ type: 'general', message: `Failed to load media from ${participant.identity}. Connection may be unstable.` });
        
        // Update participant state to show connection issues
        setRoomState((prev) => ({
          ...prev,
          participants: prev.participants.map((p) =>
            p.id === participant.identity
              ? { ...p, hasConnectionIssues: true }
              : p
          )
        }));
      });

      // Connection state changes
      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        // Update connection state for UI indicators
        setConnectionState(state);
        setRoomState((prev) => ({
          ...prev,
          connectionState: state
        }));
        
        // Handle different connection states - only show errors for actual failures
        if (state === 'disconnected') {
          setError({ type: 'connection', message: 'Connection lost' });
        } else if (state === 'connecting') {
          // Don't show connecting as an error - this is normal connection flow
          setError(null);
        } else if (state === 'connected') {
          setError(null);
        }
      });

      // Periodically update connection quality for local participant only
      const connectionQualityInterval = setInterval(() => {
        if (!room || room.state !== 'connected') {
          return;
        }

        const liveParticipant = room.localParticipant;
        const currentQuality = liveParticipant.connectionQuality;
        
        setRoomState((prev) => {
          // Always update if quality changed, or if it's still unknown (to keep trying)
          if (currentQuality !== prev.localConnectionQuality || currentQuality === 'unknown') {
            console.log(`Updating connection quality for local participant: ${prev.localConnectionQuality} -> ${currentQuality}`);
            return {
              ...prev,
              localConnectionQuality: currentQuality,
            };
          }
          return prev;
        });
      }, 3000); // Check every 3 seconds

      // Store interval reference for cleanup
      (room as any)._connectionQualityInterval = connectionQualityInterval;

      room.on(RoomEvent.Disconnected, () => {
        console.log("Disconnected from room");
        
        // Clean up connection quality interval
        if ((room as any)._connectionQualityInterval) {
          clearInterval((room as any)._connectionQualityInterval);
          (room as any)._connectionQualityInterval = null;
        }
        
        setConnectionState('disconnected');
        setRoomState({
          room: null,
          participants: [],
          isConnected: false,
          isVideoEnabled: true,
          isAudioEnabled: true,
        });
      });

      room.on(RoomEvent.MediaDevicesError, (error: Error) => {
        // Handle media device errors gracefully
        setError({ type: 'general', message: `Media device error: ${error.message}. Please check your camera and microphone permissions.` });
      });

      // Connect to the room
      await room.connect(url, token, {
        autoSubscribe: true,
      });

      // Try to start audio playback immediately after connection
      if (room.canPlaybackAudio !== undefined && !room.canPlaybackAudio) {
        console.log('Audio playback is restricted, will start on user interaction');
      } else {
        try {
          await room.startAudio();
          console.log('Audio playback started on connection');
        } catch (error) {
          console.warn('Could not start audio playback immediately:', error);
        }
      }

      // Remove automatic enabling of microphone and camera
      const localParticipant = room.localParticipant;
      const remoteParticipants = Array.from(room.remoteParticipants.values());

      setRoomState((prev) => ({
        ...prev,
        room,
        isConnected: true,
        isVideoEnabled: false, // Set to false by default
        isAudioEnabled: false, // Set to false by default
        localConnectionQuality: localParticipant.connectionQuality,
        participants: [
          {
            id: localParticipant.identity,
            name: localParticipant.identity,
            isLocal: true,
            participant: localParticipant,
            isVideoEnabled: false, // Set to false by default
            isAudioEnabled: false, // Set to false by default
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
      setConnectionState('disconnected');
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
      // Clean up connection quality interval
      if ((roomState.room as any)._connectionQualityInterval) {
        clearInterval((roomState.room as any)._connectionQualityInterval);
        (roomState.room as any)._connectionQualityInterval = null;
      }
      
      roomState.room.disconnect();
      setConnectionState('disconnected');
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

  // Device management functions
  const getAvailableDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const audioInputs: MediaDevice[] = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          groupId: device.groupId,
          kind: device.kind,
          label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`
        }));

      const videoInputs: MediaDevice[] = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          groupId: device.groupId,
          kind: device.kind,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`
        }));

      const audioOutputs: MediaDevice[] = devices
        .filter(device => device.kind === 'audiooutput')
        .map(device => ({
          deviceId: device.deviceId,
          groupId: device.groupId,
          kind: device.kind,
          label: device.label || `Speaker ${device.deviceId.slice(0, 8)}`
        }));

      return { audioInputs, videoInputs, audioOutputs };
    } catch (error) {
      console.error("Failed to get available devices:", error);
      return { audioInputs: [], videoInputs: [], audioOutputs: [] };
    }
  };

  const getCurrentDevices = async () => {
    if (!roomState.room) {
      return { audioInput: '', videoInput: '', audioOutput: '' };
    }

    try {
      const localParticipant = roomState.room.localParticipant;
      
      // Get current devices from LiveKit if available
      let audioInput = '';
      let videoInput = '';
      let audioOutput = '';

      // Try to get current device IDs from the local tracks
      const audioTrack = localParticipant.getTrackPublication(Track.Source.Microphone)?.track;
      const videoTrack = localParticipant.getTrackPublication(Track.Source.Camera)?.track;

      if (audioTrack && 'getDeviceId' in audioTrack) {
        audioInput = await (audioTrack as any).getDeviceId() || '';
      }

      if (videoTrack && 'getDeviceId' in videoTrack) {
        videoInput = await (videoTrack as any).getDeviceId() || '';
      }

      // Audio output device ID is typically stored differently
      // For now, return empty string as it's harder to detect
      audioOutput = '';

      return { audioInput, videoInput, audioOutput };
    } catch (error) {
      console.error("Failed to get current devices:", error);
      return { audioInput: '', videoInput: '', audioOutput: '' };
    }
  };

  const changeAudioInput = async (deviceId: string) => {
    if (roomState.room) {
      try {
        await roomState.room.switchActiveDevice('audioinput', deviceId);
      } catch (error) {
        console.error("Failed to change audio input device:", error);
      }
    }
  };

  const changeVideoInput = async (deviceId: string) => {
    if (roomState.room) {
      try {
        await roomState.room.switchActiveDevice('videoinput', deviceId);
      } catch (error) {
        console.error("Failed to change video input device:", error);
      }
    }
  };

  const changeAudioOutput = async (deviceId: string) => {
    if (roomState.room) {
      try {
        await roomState.room.switchActiveDevice('audiooutput', deviceId);
      } catch (error) {
        console.error("Failed to change audio output device:", error);
      }
    }
  };

  const clearError = () => {
    setError(null);
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
        clearError,
        error,
        isRetrying,
        connectionState,
        getAvailableDevices,
        getCurrentDevices,
        changeAudioInput,
        changeVideoInput,
        changeAudioOutput,
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
