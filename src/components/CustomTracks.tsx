import React, { useEffect, useRef } from 'react';
import { Track, Participant } from 'livekit-client';
import type { TrackReference } from '@livekit/components-core';
import {
  AudioTrack,
  useParticipantTracks,
  useLocalParticipant,
} from '@livekit/components-react';

// Video Component using LiveKit's hooks for automatic track state updates
const CustomTracks: React.FC<{
  participant: Participant;
  source: Track.Source;
}> = ({ participant, source }) => {
  // Handle local participant tracks differently
  const { localParticipant } = useLocalParticipant();

  // Use LiveKit's hook for remote participants
  const videoTracks = useParticipantTracks(
    [source],
    participant.isLocal ? '' : participant.identity
  );
  const audioTracks = useParticipantTracks(
    [Track.Source.Microphone],
    participant.isLocal ? '' : participant.identity
  );

  // Get screen share tracks
  const screenShareTracks = useParticipantTracks(
    [Track.Source.ScreenShare],
    participant.isLocal ? '' : participant.identity
  );

  // Get track references based on participant type and source
  let trackRef;
  if (participant.isLocal) {
    if (source === Track.Source.Camera) {
      const publication = localParticipant?.getTrackPublication(
        Track.Source.Camera
      );
      if (publication?.track) {
        trackRef = { participant, publication, source };
      }
    } else if (source === Track.Source.ScreenShare) {
      const publication = localParticipant?.getTrackPublication(
        Track.Source.ScreenShare
      );
      if (publication?.track) {
        trackRef = { participant, publication, source };
      }
    }
  } else {
    if (source === Track.Source.Camera) {
      trackRef = videoTracks[0];
    } else if (source === Track.Source.ScreenShare) {
      trackRef = screenShareTracks[0];
    }
  }

  const audioTrackRef = participant.isLocal
    ? undefined // No audio for local participant
    : audioTracks[0];

  // Determine if we're displaying a screen share track
  const isScreenShare = source === Track.Source.ScreenShare;

  // Define different styling for screen share vs camera tracks
  const videoStyle = isScreenShare
    ? {
        objectFit: 'contain' as const,
        display: trackRef ? 'block' : 'none',
      }
    : {
        display: participant.isCameraEnabled ? 'block' : 'none',
      };

  return (
    <div>
      {trackRef && (
        <CustomVideoTrack
          trackRef={trackRef}
          participant={participant}
          className="participant-video"
          style={videoStyle}
        />
      )}
      {audioTrackRef && (
        <AudioTrack
          trackRef={audioTrackRef}
          autoPlay
          style={{ display: 'none' }}
        />
      )}
    </div>
  );
};

const CustomVideoTrack: React.FC<{
  trackRef: TrackReference;
  participant: Participant;
  className?: string;
  style?: React.CSSProperties;
}> = ({ trackRef, participant, className, style }) => {
  const videoEl = useRef<HTMLVideoElement | null>(null);
  const publication = trackRef.publication;
  const track = publication?.track;
  const trackSid = publication?.trackSid;

  // Ensure remote tracks are subscribed
  useEffect(() => {
    if (!participant.isLocal && publication && !publication.isSubscribed) {
      publication.setSubscribed(true);
    }
  }, [participant.isLocal, trackSid, publication]);

  // Attach and detach the LiveKit track manually to avoid state updates after unmount
  useEffect(() => {
    const element = videoEl.current;

    if (!element || !track) {
      if (element) {
        element.srcObject = null;
      }
      return;
    }

    track.attach(element);
    return () => {
      track.detach(element);
      element.srcObject = null;
    };
  }, [track]);

  const mergedStyle = {
    ...style,
    display:
      style?.display !== undefined ? style.display : track ? 'block' : 'none',
  };

  return (
    <video
      ref={videoEl}
      muted={participant.isLocal}
      autoPlay
      playsInline
      className={className}
      style={mergedStyle}
    />
  );
};

export default CustomTracks;
