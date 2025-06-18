import React, { useEffect, useState, useCallback } from 'react';
import {
  RoomAudioRenderer,
  useLocalParticipant,
  useParticipants,
  useConnectionState,
  useRoomContext,
} from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { Button } from 'primereact/button';
import CustomParticipantTile from './CustomParticipantTile';
import SettingsDialog from './SettingsDialog';
import ParticipantListSidebar from './ParticipantListSidebar';
import ControlBar from './ControlBar';
import OneToOneCallView from './OneToOneCallView';

// Grid layout helpers
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

// Main Room Component that uses LiveKit hooks
const ConferenceComponent: React.FC = () => {
  const participants = useParticipants();
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const [fullScreenParticipant, setFullScreenParticipant] = useState<
    string | null
  >(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipantList, setShowParticipantList] = useState(false);
  // State to track one-to-one view mode
  const [isOneToOneView, setIsOneToOneView] = useState(false);

  // Check if we should use one-to-one view (exactly 2 participants)
  useEffect(() => {
    setIsOneToOneView(participants.length === 2);
  }, [participants.length]);

  const enterFullScreen = useCallback((participantId: string) => {
    setFullScreenParticipant(participantId);
  }, []);

  const exitFullScreen = useCallback(() => {
    setFullScreenParticipant(null);
  }, []);

  // ESC key listener for exiting fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && fullScreenParticipant) {
        exitFullScreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [fullScreenParticipant, exitFullScreen]);

  const toggleVideo = useCallback(async () => {
    if (localParticipant) {
      await localParticipant.setCameraEnabled(
        !localParticipant.isCameraEnabled
      );
    }
  }, [localParticipant]);

  const toggleAudio = useCallback(async () => {
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(
        !localParticipant.isMicrophoneEnabled
      );
    }
  }, [localParticipant]);

  const room = useRoomContext();

  const disconnect = useCallback(() => {
    // The LiveKitRoom component handles disconnection
    if (room) {
      room.disconnect();
    }
  }, [room]);

  const openSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const gridClassName = getGridClassName(participants.length);
  const fullscreenParticipant = participants.find(
    p => p.identity === fullScreenParticipant
  );
  const otherParticipants = participants.filter(
    p => p.identity !== fullScreenParticipant
  );

  // Get remote participant in one-to-one view
  const remoteParticipant = participants.find(p => !p.isLocal);
  // Get local participant in one-to-one view
  const localParticipantObj = participants.find(p => p.isLocal);

  return (
    <div
      className={`conference-container ${
        showParticipantList ? 'sidebar-open' : ''
      }`}
    >
      {/* Top Status Bar */}
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
              onClick={() => setShowParticipantList(true)}
              className="p-button-text"
              tooltipOptions={{ position: 'bottom' }}
              label={`${participants.length} participant${
                participants.length !== 1 ? 's' : ''
              }`}
            />
          </div>
        )}
      </div>

      {/* Main Video Area */}
      {fullscreenParticipant ? (
        <div className="fullscreen-container">
          <CustomParticipantTile participant={fullscreenParticipant} idx={0} />
          <Button
            icon={<span className="material-icons">close</span>}
            onClick={exitFullScreen}
            className="exit-fullscreen-button"
            title="Exit fullscreen"
          />
          {otherParticipants.length > 0 && (
            <div className="thumbnails-container">
              {otherParticipants.map((participant, idx) => (
                <div key={participant.identity} className="thumbnail-wrapper">
                  <CustomParticipantTile
                    participant={participant}
                    idx={idx + 1}
                    onMaximize={() => enterFullScreen(participant.identity)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : isOneToOneView && remoteParticipant && localParticipantObj ? (
        <OneToOneCallView
          remoteParticipant={remoteParticipant}
          localParticipant={localParticipantObj}
        />
      ) : (
        <div className={`participants-grid ${gridClassName}`}>
          {participants.map((participant, idx) => (
            <div key={participant.identity} className="size-full">
              <CustomParticipantTile
                participant={participant}
                idx={idx}
                onMaximize={() => enterFullScreen(participant.identity)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <ControlBar
        localParticipant={localParticipant}
        toggleAudio={toggleAudio}
        toggleVideo={toggleVideo}
        disconnect={disconnect}
        openSettings={openSettings}
      />

      {/* Audio Renderer for spatial audio */}
      <RoomAudioRenderer />

      {/* Settings Dialog */}
      <SettingsDialog
        visible={showSettings}
        onHide={() => setShowSettings(false)}
      />

      {/* Participant List Sidebar */}
      <ParticipantListSidebar
        visible={showParticipantList}
        onHide={() => setShowParticipantList(false)}
        participants={participants}
      />
    </div>
  );
};

export default ConferenceComponent;
