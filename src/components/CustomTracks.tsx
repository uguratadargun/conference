import React, { useMemo } from 'react';
import { Track, Participant } from 'livekit-client';
import { VideoTrack, AudioTrack } from '@livekit/components-react';
import type { TrackReference } from '@livekit/components-core';

// Video Component using LiveKit's VideoTrack and AudioTrack components
const CustomTracks: React.FC<{
  participant: Participant;
  source: Track.Source;
}> = ({ participant, source }) => {
  // Create trackRef for video
  const videoTrackRef: TrackReference | undefined = useMemo(() => {
    const publication = participant.getTrackPublication(source);
    if (publication) {
      return {
        participant,
        publication,
        source,
      };
    }
    return undefined;
  }, [participant, source]);

  // Create trackRef for audio (microphone)
  const audioTrackRef: TrackReference | undefined = useMemo(() => {
    if (participant.isLocal) return undefined; // No audio for local participant

    const publication = participant.getTrackPublication(
      Track.Source.Microphone
    );
    if (publication) {
      return {
        participant,
        publication,
        source: Track.Source.Microphone,
      };
    }
    return undefined;
  }, [participant]);

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
