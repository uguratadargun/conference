import React from 'react';
import { Participant } from 'livekit-client';
import CustomParticipantTile from './CustomParticipantTile';

const getGridClassName = (count: number) => {
  if (count === 1) return 'grid-1';
  if (count === 2) return 'grid-2';
  if (count === 3) return 'grid-3';
  if (count === 4) return 'grid-4';
  if (count <= 6) return 'grid-6';
  if (count <= 9) return 'grid-9';
  if (count <= 12) return 'grid-12';
  if (count <= 15) return 'grid-default';
  return 'grid-scroll';
};

interface VideoGridProps {
  participants: Participant[];
  onEnterFullScreen: (participantId: string) => void;
}

const VideoGrid: React.FC<VideoGridProps> = ({
  participants,
  onEnterFullScreen,
}) => {
  const gridClassName = getGridClassName(participants.length);

  return (
    <div className={`participants-grid ${gridClassName}`}>
      {participants.map((participant, idx) => (
        <div key={participant.identity} className="size-full">
          <CustomParticipantTile
            participant={participant}
            idx={idx}
            onMaximize={() => onEnterFullScreen(participant.identity)}
          />
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;
