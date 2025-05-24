import { Room } from "livekit-client";

export const initializeAudioContext = async (): Promise<void> => {
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
};

export const tryStartAudio = async (room: Room): Promise<boolean> => {
  try {
    await room.startAudio();
    console.log('✅ Audio playback started successfully');
    
    // Audio stabilite kontrolü
    await ensureAudioStability(room);
    
    return true;
  } catch (error) {
    console.warn('⚠️ Audio could not be started automatically:', error);
    return false;
  }
};

// Yeni fonksiyon: Audio stabiliteyi sağlar
export const ensureAudioStability = async (room: Room): Promise<void> => {
  try {
    // Audio track'lerin stabiliteyi kontrol et
    room.remoteParticipants.forEach((participant) => {
      const audioTracks = participant.getTrackPublications().filter(pub => pub.kind === 'audio');
      audioTracks.forEach((trackPub) => {
        if (trackPub.track && trackPub.isSubscribed) {
          console.log(`🔊 Ensuring audio stability for ${participant.identity}`);
          
          // Audio track için ek stabilite ayarları
          if (trackPub.track.mediaStreamTrack) {
            const audioTrack = trackPub.track.mediaStreamTrack as MediaStreamTrack;
            
            // Audio track'in enabled olduğundan emin ol
            if (!audioTrack.enabled) {
              audioTrack.enabled = true;
              console.log(`🔊 Re-enabled audio track for ${participant.identity}`);
            }
          }
        }
      });
    });
  } catch (error) {
    console.warn('Audio stability check failed:', error);
  }
};

export const debugAudioState = (room: Room): void => {
  console.log('🔊 Audio State Debug:', {
    canPlaybackAudio: room.canPlaybackAudio,
    audioContext: typeof window !== 'undefined' && window.AudioContext ? 'available' : 'not available',
    participants: room.remoteParticipants.size,
    localParticipant: {
      audioTracks: Array.from(room.localParticipant.getTrackPublications().values())
        .filter(pub => pub.kind === 'audio')
        .map(pub => ({ 
          sid: pub.trackSid, 
          hasTrack: !!pub.track,
          muted: pub.isMuted,
          enabled: pub.track?.mediaStreamTrack?.enabled
        }))
    },
    remoteParticipants: Array.from(room.remoteParticipants.values()).map(p => ({
      identity: p.identity,
      audioTracks: Array.from(p.getTrackPublications().values())
        .filter(pub => pub.kind === 'audio')
        .map(pub => ({ 
          sid: pub.trackSid, 
          subscribed: pub.isSubscribed,
          hasTrack: !!pub.track,
          muted: pub.isMuted,
          enabled: pub.track?.mediaStreamTrack?.enabled
        }))
    }))
  });
}; 