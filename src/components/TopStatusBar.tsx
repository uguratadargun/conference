import React from 'react';
import { ConnectionState, Participant } from 'livekit-client';
import { Button } from 'primereact/button';

interface TopStatusBarProps {
  connectionState: ConnectionState;
  participants: Participant[];
  showParticipantList: boolean;
  onShowParticipantList: () => void;
}

const TopStatusBar: React.FC<TopStatusBarProps> = ({
  connectionState,
  participants,
  showParticipantList,
  onShowParticipantList,
}) => {
  return (
    <div className="top-status-bar">
      <div
        className={`status-item connection-status ${
          connectionState === ConnectionState.Connected
            ? 'connected'
            : connectionState === ConnectionState.Connecting ||
                connectionState === ConnectionState.Reconnecting
              ? 'connecting'
              : 'disconnected'
        }`}
      >
        <span className="material-icons">
          {connectionState === ConnectionState.Connected
            ? 'wifi'
            : connectionState === ConnectionState.Connecting ||
                connectionState === ConnectionState.Reconnecting
              ? 'sync'
              : 'wifi_off'}
        </span>
        <span>
          {connectionState === ConnectionState.Connected
            ? 'Connected'
            : connectionState === ConnectionState.Connecting ||
                connectionState === ConnectionState.Reconnecting
              ? 'Connecting...'
              : 'Disconnected'}
        </span>
      </div>

      {/* Participant List Button */}
      {!showParticipantList && (
        <div className="status-item participant-list-button">
          <Button
            icon={<span className="material-icons">people_alt</span>}
            onClick={onShowParticipantList}
            className="p-button-text"
            tooltipOptions={{ position: 'bottom' }}
            label={`${participants.length} participant${
              participants.length !== 1 ? 's' : ''
            }`}
          />
        </div>
      )}
    </div>
  );
};

export default TopStatusBar;
