import React from 'react';
import { Participant, Track } from 'livekit-client';
import CustomTracks from './CustomTracks';
import { IconMicrophoneOff } from '@tabler/icons-react';

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
  showVoiceIndicator?: boolean;
}> = ({ participant, idx, onMaximize, showVoiceIndicator = true }) => {
  // Use participant identity for consistent colors instead of index
  const colorIndex = getParticipantColorIndex(participant.identity);
  const borderColor = BORDER_COLORS[colorIndex % BORDER_COLORS.length];
  const nameColor = NAME_COLORS[colorIndex % NAME_COLORS.length];

  const displayName = participant.name || participant.identity;

  const initials = displayName
    .split(' ')
    .map(n => n[0]?.toUpperCase())
    .join('')
    .slice(0, 2);

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
      <CustomTracks participant={participant} source={Track.Source.Camera} />

      <div className="participant-content-container">
        <div
          className="participant-name"
          style={{
            color: nameColor,
            display: !participant.isCameraEnabled ? 'flex' : 'none',
          }}
        >
          <div className="name-container">{displayName}</div>
        </div>

        <div
          className="avatar-container"
          style={{ display: !participant.isCameraEnabled ? 'flex' : 'none' }}
        >
          <span className="avatar-initials" style={{ color: nameColor }}>
            {initials}
          </span>
        </div>

        {showVoiceIndicator && !participant.isCameraEnabled && (
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
    </div>
  );
};

export default CustomParticipantTile;
