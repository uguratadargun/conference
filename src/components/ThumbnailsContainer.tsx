import React from 'react';
import { Participant } from 'livekit-client';
import CustomParticipantTile from './CustomParticipantTile';

interface ThumbnailsContainerProps {
  otherParticipants: Participant[];
  enterFullScreen: (participantId: string) => void;
}

const ThumbnailsContainer: React.FC<ThumbnailsContainerProps> = ({
  otherParticipants,
  enterFullScreen,
}) => {
  if (otherParticipants.length === 0) return null;

  return (
    <div className="thumbnails-container">
      {otherParticipants.map((participant, idx) => (
        <div key={participant.identity} className="thumbnail-wrapper">
          <CustomParticipantTile
            participant={participant}
            idx={idx + 1}
            onMaximize={() => enterFullScreen(participant.identity)}
            showVoiceIndicator={false}
          />
        </div>
      ))}
    </div>
  );
};

export default ThumbnailsContainer;
