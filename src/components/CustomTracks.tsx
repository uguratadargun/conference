import React, { useEffect, useRef } from 'react';
import { Track, Participant, RemoteTrackPublication } from 'livekit-client';
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
  const remoteIdentity = participant.isLocal ? '' : participant.identity;
  const videoTracks = useParticipantTracks([source], remoteIdentity);
  const audioTracks = useParticipantTracks(
    [Track.Source.Microphone],
    remoteIdentity
  );

  let trackRef: TrackReference | undefined;
  if (participant.isLocal) {
    const publication = localParticipant?.getTrackPublication(source);
    if (publication) {
      trackRef = { participant, publication, source };
    }
  } else {
    trackRef = videoTracks[0];
  }

  const publication = trackRef?.publication;

  // autoSubscribe normally handles this; nudge the server if a publication we
  // want to render is still unsubscribed.
  useEffect(() => {
    if (
      publication instanceof RemoteTrackPublication &&
      !publication.isSubscribed
    ) {
      publication.setSubscribed(true);
    }
  }, [publication]);

  // Only mount the <video> when there is an actual, unmuted track to play.
  // A display:none <video> that stays attached makes adaptiveStream report the
  // element as invisible and 0x0, which tells the SFU to stop sending the track.
  // Resuming then depends on IntersectionObserver/ResizeObserver firing after
  // React flips the style back - which is exactly what intermittently fails and
  // leaves a blank tile while the sender's camera is on.
  const hasVideo = !!publication?.track && !publication.isMuted;

  const audioTrackRef = participant.isLocal
    ? undefined // No audio for local participant
    : audioTracks[0];

  return (
    <div>
      {hasVideo && trackRef && (
        <CustomVideoTrack
          trackRef={trackRef}
          participant={participant}
          className="participant-video"
          style={
            source === Track.Source.ScreenShare
              ? { objectFit: 'contain' }
              : undefined
          }
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
  const track = trackRef.publication?.track;

  // Attach and detach the LiveKit track manually to avoid state updates after unmount
  useEffect(() => {
    const element = videoEl.current;

    if (!element || !track) {
      return;
    }

    track.attach(element);
    return () => {
      track.detach(element);
      element.srcObject = null;
    };
  }, [track]);

  return (
    <video
      ref={videoEl}
      muted={participant.isLocal}
      autoPlay
      playsInline
      className={className}
      style={style}
    />
  );
};

export default CustomTracks;
