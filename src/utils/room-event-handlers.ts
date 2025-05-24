import React from "react";
import { 
  Room,
  RoomEvent,
  RemoteParticipant,
  Track,
  TrackPublication,
  ConnectionQuality
} from "livekit-client";
import type { RoomState, ErrorState } from "../types/livekit";
import { debugAudioState, tryStartAudio } from "./audio-utils";
import { INTERVALS } from "../config/livekit";

type SetRoomState = React.Dispatch<React.SetStateAction<RoomState>>;
type SetError = React.Dispatch<React.SetStateAction<ErrorState | null>>;
type SetIsRetrying = React.Dispatch<React.SetStateAction<boolean>>;
type SetConnectionState = React.Dispatch<React.SetStateAction<string>>;
type SetAudioStartAttempted = React.Dispatch<React.SetStateAction<boolean>>;

export const setupRoomEventHandlers = (
  room: Room,
  setRoomState: SetRoomState,
  setError: SetError,
  setIsRetrying: SetIsRetrying,
  setConnectionState: SetConnectionState,
  setAudioStartAttempted: SetAudioStartAttempted
) => {
  // Helper function to update participant state
  const updateParticipantState = (participant: any, isLocal: boolean = false) => {
    setRoomState((prev) => {
      const existingParticipant = prev.participants.find(
        (p) => p.id === participant.identity
      );
      const newVideoEnabled = participant.isCameraEnabled;
      const newAudioEnabled = participant.isMicrophoneEnabled;

      if (
        existingParticipant &&
        existingParticipant.isVideoEnabled === newVideoEnabled &&
        existingParticipant.isAudioEnabled === newAudioEnabled &&
        (!isLocal ||
          (prev.isVideoEnabled === newVideoEnabled &&
            prev.isAudioEnabled === newAudioEnabled))
      ) {
        return prev;
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
        ...(isLocal
          ? {
              isVideoEnabled: newVideoEnabled,
              isAudioEnabled: newAudioEnabled,
            }
          : {}),
      };
    });
  };

  // Participant events
  room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
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
  });

  room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
    setRoomState((prev) => ({
      ...prev,
      participants: prev.participants.filter(
        (p) => p.id !== participant.identity
      ),
    }));
  });

  // Track events
  room.on(RoomEvent.TrackMuted, (publication: TrackPublication, participant: any) => {
    console.log(`Track muted: ${publication.kind} for participant ${participant.identity}`);
    updateParticipantState(participant, participant.isLocal);
  });

  room.on(RoomEvent.TrackUnmuted, (publication: TrackPublication, participant: any) => {
    console.log(`Track unmuted: ${publication.kind} for participant ${participant.identity}`);
    updateParticipantState(participant, participant.isLocal);
  });

  room.on(RoomEvent.TrackPublished, (publication: TrackPublication, participant: any) => {
    console.log(`Track published: ${publication.kind} for participant ${participant.identity}`);
    updateParticipantState(participant, participant.isLocal);
  });

  room.on(RoomEvent.TrackUnpublished, (publication: TrackPublication, participant: any) => {
    console.log(`Track unpublished: ${publication.kind} for participant ${participant.identity}`);
    updateParticipantState(participant, participant.isLocal);
  });

  room.on(RoomEvent.LocalTrackPublished, (publication: TrackPublication, participant: any) => {
    console.log(`Local track published: ${publication.kind}`);
    updateParticipantState(participant, true);
  });

  room.on(RoomEvent.LocalTrackUnpublished, (publication: TrackPublication, participant: any) => {
    console.log(`Local track unpublished: ${publication.kind}`);
    updateParticipantState(participant, true);
  });

  room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
    console.log(`✅ Track subscribed: ${track.kind} from ${participant.identity}`);
    
    setRoomState((prev) => {
      const existingParticipant = prev.participants.find(p => p.id === participant.identity);
      const newVideoEnabled = participant.isCameraEnabled;
      const newAudioEnabled = participant.isMicrophoneEnabled;
      
      if (existingParticipant && 
          existingParticipant.isVideoEnabled === newVideoEnabled && 
          existingParticipant.isAudioEnabled === newAudioEnabled) {
        return prev;
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
        )
      };
    });

    // Handle audio track subscription
    if (track.kind === Track.Kind.Audio && !participant.isLocal) {
      console.log(`🎵 Audio track subscribed from ${participant.identity}`);
      
      // Audio track için stabilite artırıcı ayarlar
      if (track.mediaStreamTrack) {
        const audioTrack = track.mediaStreamTrack as MediaStreamTrack;
        if (audioTrack.getSettings) {
          console.log('Audio track settings:', audioTrack.getSettings());
        }
      }
      
      setTimeout(() => debugAudioState(room), 100);
    }
  });

  room.on(RoomEvent.TrackUnsubscribed, (track, _publication, participant) => {
    console.log(`Track unsubscribed: ${track.kind} for participant ${participant.identity}`);
    
    if (track.kind === Track.Kind.Audio) {
      // Audio track'i temizle
      try {
        track.detach();
        console.log(`🔇 Audio track properly detached for ${participant.identity}`);
      } catch (error) {
        console.warn(`Failed to detach audio track for ${participant.identity}:`, error);
      }
    } else if (track.kind === Track.Kind.Video) {
      updateParticipantState(participant, participant.isLocal);
    }
  });

  // Audio events
  room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
    console.log('Audio playback status changed. Can play audio:', room?.canPlaybackAudio);
    if (room && !room.canPlaybackAudio) {
      console.warn('Audio playback is blocked. User interaction required.');
    }
  });

  // Connection events
  room.on(RoomEvent.Reconnecting, () => {
    setError({ type: 'connection', message: 'Connection lost, reconnecting...' });
    setIsRetrying(true);
    setRoomState((prev) => ({ ...prev, isReconnecting: true }));
  });

  room.on(RoomEvent.Reconnected, () => {
    setError(null);
    setIsRetrying(false);
    setRoomState((prev) => ({ ...prev, isReconnecting: false }));
  });

  room.on(RoomEvent.Connected, async () => {
    setError(null);
    setIsRetrying(false);
    setRoomState((prev) => ({ ...prev, isConnected: true, isReconnecting: false }));

    // Try to start audio playback immediately after connection
    console.log('🔍 Checking initial audio state after connection...');
    debugAudioState(room);
    
    if (room.canPlaybackAudio !== undefined && !room.canPlaybackAudio) {
      console.log('⚠️ Audio playback is restricted, will start on user interaction');
    } else {
      const audioStarted = await tryStartAudio(room);
      setAudioStartAttempted(audioStarted);
    }
  });

  room.on(RoomEvent.Disconnected, () => {
    console.log("Disconnected from room");
    
    setConnectionState('disconnected');
    setRoomState({
      room: null,
      participants: [],
      isConnected: false,
      isVideoEnabled: true,
      isAudioEnabled: true,
    });
  });

  room.on(RoomEvent.ConnectionStateChanged, (state) => {
    setConnectionState(state);
    setRoomState((prev) => ({ ...prev, connectionState: state }));
    
    if (state === 'disconnected') {
      setError({ type: 'connection', message: 'Connection lost' });
    } else if (state === 'connecting') {
      setError(null);
    } else if (state === 'connected') {
      setError(null);
    }
  });

  // Quality and performance events
  room.on(RoomEvent.ConnectionQualityChanged, (quality: ConnectionQuality, participant) => {
    if (participant.isLocal) {
      console.log(`🔄 Connection quality changed for local participant: ${quality}`);
      setRoomState((prev) => ({ ...prev, localConnectionQuality: quality }));
    }
  });

  room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
    const activeSpeakerIds = speakers.map(p => p.identity);
    
    setRoomState((prev) => {
      const hasChanges = prev.participants.some(p => {
        const wasSpeaking = p.isSpeaking || false;
        const isSpeaking = activeSpeakerIds.includes(p.id);
        return wasSpeaking !== isSpeaking;
      });
      
      if (!hasChanges) {
        return prev;
      }
      
      return {
        ...prev,
        participants: prev.participants.map((p) => ({
          ...p,
          isSpeaking: activeSpeakerIds.includes(p.id),
        }))
      };
    });
  });

  // Other events
  room.on(RoomEvent.ParticipantPermissionsChanged, (_prevPermissions: any, participant: any) => {
    setRoomState((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.id === participant.identity
          ? { ...p, permissions: participant.permissions }
          : p
      )
    }));
  });

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

  room.on(RoomEvent.ParticipantMetadataChanged, (_prevMetadata, participant) => {
    setRoomState((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.id === participant.identity
          ? { ...p, metadata: participant.metadata }
          : p
      )
    }));
  });

  room.on(RoomEvent.RoomMetadataChanged, (metadata) => {
    setRoomState((prev) => ({ ...prev, roomMetadata: metadata }));
  });

  room.on(RoomEvent.RecordingStatusChanged, (isRecording) => {
    setRoomState((prev) => ({ ...prev, isRecording: isRecording }));
  });

  room.on(RoomEvent.TrackSubscriptionFailed, (_trackSid, participant) => {
    setError({ 
      type: 'general', 
      message: `Failed to load media from ${participant.identity}. Connection may be unstable.` 
    });
    
    setRoomState((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.id === participant.identity
          ? { ...p, hasConnectionIssues: true }
          : p
      )
    }));
  });

  room.on(RoomEvent.TrackStreamStateChanged, (_pub, streamState, participant) => {
    setRoomState((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.id === participant.identity
          ? { ...p, streamState: streamState }
          : p
      )
    }));
  });

  room.on(RoomEvent.MediaDevicesError, (error: Error) => {
    setError({ 
      type: 'general', 
      message: `Media device error: ${error.message}. Please check your camera and microphone permissions.` 
    });
  });

  room.on(RoomEvent.EncryptionError, (error: Error) => {
    console.error('Encryption error:', error);
    setError({ 
      type: 'general', 
      message: 'Encryption error occurred. Please reconnect.' 
    });
  });
}; 