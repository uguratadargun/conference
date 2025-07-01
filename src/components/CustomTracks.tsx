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
  const { cameraTrack } = useLocalParticipant();

  // Use LiveKit's hook for remote participants
  const videoTracks = useParticipantTracks(
    [source],
    participant.isLocal ? '' : participant.identity
  );
  const audioTracks = useParticipantTracks(
    [Track.Source.Microphone],
    participant.isLocal ? '' : participant.identity
  );

  // Get track references based on participant type
  const videoTrackRef = participant.isLocal
    ? source === Track.Source.Camera && cameraTrack
      ? { participant, publication: cameraTrack, source }
      : undefined
    : videoTracks[0];

  const audioTrackRef = participant.isLocal
    ? undefined // No audio for local participant
    : audioTracks[0];

  return (
    <div>
      {videoTrackRef && (
        <VideoTrack
          trackRef={videoTrackRef}
          className="participant-video"
          autoPlay
          playsInline
          muted={participant.isLocal}
          style={{
            display: participant.isCameraEnabled ? 'block' : 'none',
          }}
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
