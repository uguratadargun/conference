import React, { useMemo } from 'react';
import { ConnectionState, Participant } from 'livekit-client';
import { Button } from 'primereact/button';
import {
  IconWifi,
  IconRefresh,
  IconWifiOff,
  IconUsers,
} from '@tabler/icons-react';

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
  // Detect if device is touch-enabled (mobile)
  const isTouchDevice = useMemo(() => {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore
      navigator.msMaxTouchPoints > 0
    );
  }, []);

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
        {connectionState === ConnectionState.Connected ? (
          <IconWifi size={18} />
        ) : connectionState === ConnectionState.Connecting ||
          connectionState === ConnectionState.Reconnecting ? (
          <IconRefresh size={18} className="rotating" />
        ) : (
          <IconWifiOff size={18} />
        )}
        <span>
          {connectionState === ConnectionState.Connected
            ? 'Bağlandı'
            : connectionState === ConnectionState.Connecting ||
                connectionState === ConnectionState.Reconnecting
              ? 'Bağlanıyor...'
              : 'Bağlantı kesildi'}
        </span>
      </div>

      {/* Participant List Button */}
      {!showParticipantList && (
        <div className="status-item participant-list-button">
          <Button
            icon={<IconUsers size={18} />}
            onClick={onShowParticipantList}
            className="p-button-text"
            tooltipOptions={
              isTouchDevice
                ? undefined
                : { position: 'bottom', event: 'hover', hideDelay: 200 }
            }
            label={`${participants.length} katılımcı`}
          />
        </div>
      )}
    </div>
  );
};

export default TopStatusBar;
