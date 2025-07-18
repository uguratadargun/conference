import React from 'react';
import { Track, Participant } from 'livekit-client';
import {
  VideoTrack,
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
        <VideoTrack
          trackRef={trackRef}
          className="participant-video"
          autoPlay
          playsInline
          muted={participant.isLocal}
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

export default CustomTracks;
