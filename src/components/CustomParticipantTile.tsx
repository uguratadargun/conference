import React from 'react';
import { Participant, Track } from 'livekit-client';
import CustomTracks from './CustomTracks';
import { IconMicrophoneOff, IconScreenShare } from '@tabler/icons-react';

// Define the color arrays
const BORDER_COLORS = [
  '#FFB199',
  '#A3FFB1',
  '#FFD699',
  '#B1C6FF',
  '#FFB1E1',
  '#B1FFD6',
  '#FFF7B1',
  '#B1E1FF',
  '#FF9999',
  '#99FFB3',
  '#FFE599',
  '#99B3FF',
  '#FF99E5',
  '#99FFE5',
  '#FFFF99',
  '#99E5FF',
  '#FFCC99',
  '#CCFF99',
  '#FFBF99',
  '#99FFCC',
  '#FFB3CC',
  '#B3FFCC',
  '#FFCCB3',
  '#CCB3FF',
];

const NAME_COLORS = [
  '#FFB199',
  '#A3FFB1',
  '#FFD699',
  '#B1C6FF',
  '#FFB1E1',
  '#B1FFD6',
  '#FFF7B1',
  '#B1E1FF',
  '#FF9999',
  '#99FFB3',
  '#FFE599',
  '#99B3FF',
  '#FF99E5',
  '#99FFE5',
  '#FFFF99',
  '#99E5FF',
  '#FFCC99',
  '#CCFF99',
  '#FFBF99',
  '#99FFCC',
  '#FFB3CC',
  '#B3FFCC',
  '#FFCCB3',
  '#CCB3FF',
];

// Function to get a consistent color index based on participant identity
const getParticipantColorIndex = (participantIdentity: string): number => {
  let hash = 0;
  for (let i = 0; i < participantIdentity.length; i++) {
    const char = participantIdentity.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

// CustomParticipantTile Component
const CustomParticipantTile: React.FC<{
  participant: Participant;
  idx: number;
  onMaximize?: () => void;
  isThumbnail?: boolean;
  sizeVariant?: 'small' | 'medium' | 'large' | 'xlarge';
}> = ({ participant, idx, onMaximize, isThumbnail = false, sizeVariant }) => {
  // Use participant identity for consistent colors instead of index
  const colorIndex = getParticipantColorIndex(participant.identity);
  const borderColor = BORDER_COLORS[colorIndex % BORDER_COLORS.length];
  const nameColor = NAME_COLORS[colorIndex % NAME_COLORS.length];

  const displayName = participant.name || participant.identity;
  const department = participant?.department || '';
  const title = participant?.title || '';
  const initials = displayName
    .split(' ')
    .map(n => n[0]?.toUpperCase())
    .join('')
    .slice(0, 2);

  // Check if participant is sharing screen
  const isScreenSharing = participant
    .getTrackPublications()
    .some(
      track => track.source === Track.Source.ScreenShare && track.isSubscribed
    );

  // Hide avatar and info when video or screen is active
  const showInfo = !participant.isCameraEnabled && !isScreenSharing;

  // Show name in bottom left if camera is on or screen sharing
  const showNameBottomLeft = participant.isCameraEnabled || isScreenSharing;

  return (
    <div
      className={`size-full participant ${
        participant.isSpeaking ? 'speaking' : ''
      }`}
      style={{
        borderColor: participant.isSpeaking ? borderColor : 'transparent',
        cursor: onMaximize ? 'pointer' : 'default',
      }}
      onClick={onMaximize}
    >
      {/* Show screen share track if available */}
      {isScreenSharing && (
        <CustomTracks
          participant={participant}
          source={Track.Source.ScreenShare}
        />
      )}

      {/* Show camera track if not screen sharing or if in thumbnail mode */}
      {(!isScreenSharing || isThumbnail) && (
        <CustomTracks participant={participant} source={Track.Source.Camera} />
      )}

      <div className="participant-content-container">
        <div
          className="participant-name"
          style={{
            color: nameColor,
            display: showInfo ? 'flex' : 'none',
          }}
        >
          <div className="name-container">
            <div
              className={`participant-info${sizeVariant ? ` size-${sizeVariant}` : ''}`}
            >
              <div className="display-name">{displayName}</div>
              {!isThumbnail && (
                <>
                  <div className="participant-title">{title}</div>
                  <div className="participant-department">{department}</div>
                </>
              )}
            </div>
          </div>
        </div>

        <div
          className="avatar-container"
          style={{ display: showInfo ? 'flex' : 'none' }}
        >
          <span className="avatar-initials" style={{ color: nameColor }}>
            {initials}
          </span>
        </div>

        {/* Name in bottom left if camera is on or screen sharing */}
        {showNameBottomLeft &&
          (isThumbnail ? (
            <div className="participant-name">{displayName}</div>
          ) : (
            <div className="participant-name-bottom-left">{displayName}</div>
          ))}

        {!isThumbnail && showInfo && participant.isSpeaking && (
          <div
            className={`audio-waveform-container${
              participant.isSpeaking ? ' speaking' : ' silent'
            }`}
            style={{ display: 'flex' }}
          >
            <div className="audio-waveform">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="waveform-bar"
                  style={{ backgroundColor: nameColor }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {!participant.isMicrophoneEnabled && (
        <div className="audio-muted-indicator">
          <IconMicrophoneOff size={18} />
        </div>
      )}

      {isScreenSharing && (
        <div className="screen-share-indicator">
          <IconScreenShare size={18} color="#3b82f6" />
        </div>
      )}
    </div>
  );
};

export default CustomParticipantTile;
