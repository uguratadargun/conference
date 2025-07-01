import React from 'react';
import { Participant, RemoteParticipant } from 'livekit-client';
import { Button } from 'primereact/button';
import {
  IconUsers,
  IconX,
  IconUserPlus,
  IconMicrophone,
  IconMicrophoneOff,
  IconVideo,
  IconVideoOff,
} from '@tabler/icons-react';

interface ParticipantListSidebarProps {
  visible: boolean;
  onHide: () => void;
  ringingParticipants: RemoteParticipant[];
  deniedParticipants: RemoteParticipant[];
  busyParticipants: RemoteParticipant[];
  leftParticipants: RemoteParticipant[];
  activeParticipants: RemoteParticipant[];
}

const ParticipantListSidebar: React.FC<ParticipantListSidebarProps> = ({
  visible,
  onHide,
  ringingParticipants,
  deniedParticipants,
  busyParticipants,
  leftParticipants,
  activeParticipants,
}) => {
  if (!visible) return null;

  const getDisplayName = (participant: Participant): string => {
    return participant.identity || 'Anonymous';
  };

  const renderParticipant = (participant: Participant) => {
    const displayName = getDisplayName(participant);
    const initial = displayName.charAt(0).toUpperCase();

    return (
      <div key={participant.identity} className="participant-item">
        <div className="participant-avatar">{initial}</div>
        <div className="participant-info">
          <div className="participant-list-name">{displayName}</div>
        </div>
        <div className="participant-controls">
          {participant.isMicrophoneEnabled ? (
            <IconMicrophone size={16} className="status-icon active" />
          ) : (
            <IconMicrophoneOff size={16} className="status-icon inactive" />
          )}
          {participant.isCameraEnabled ? (
            <IconVideo size={16} className="status-icon active" />
          ) : (
            <IconVideoOff size={16} className="status-icon inactive" />
          )}
        </div>
      </div>
    );
  };

  const renderSection = (
    title: string,
    participantList: Participant[],
    emptyMessage: string
  ) => {
    return (
      <div className="participant-section">
        <h3 className="section-title">{title}</h3>
        <div className="participant-list">
          {participantList.length === 0 ? (
            <div className="no-participants">{emptyMessage}</div>
          ) : (
            participantList.map(renderParticipant)
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="participant-sidebar-container">
      <div className="participant-sidebar">
        <div className="participant-sidebar-content">
          {/* Header */}
          <div className="sidebar-header">
            <div className="icon-circle">
              <IconUsers size={24} />
            </div>
            <h2 className="sidebar-title">Group voice call</h2>
            <div className="participant-count">
              {activeParticipants.length} Connected
            </div>
            <Button className="close-sidebar-button" onClick={onHide}>
              <IconX size={20} />
            </Button>
          </div>

          {/* Add People Section */}
          <div className="add-people-section">
            <Button className="add-people-button">
              <IconUserPlus size={20} />
              <span>Add people...</span>
            </Button>
          </div>

          {/* Participant Sections */}
          {activeParticipants.length > 0 &&
            renderSection(
              'In this call',
              activeParticipants,
              'No participants in the call'
            )}
          {ringingParticipants.length > 0 &&
            renderSection(
              'Ringing',
              ringingParticipants,
              'No participants ringing'
            )}
          {deniedParticipants.length > 0 &&
            renderSection(
              'Denied',
              deniedParticipants,
              'No denied participants'
            )}
          {busyParticipants.length > 0 &&
            renderSection('Busy', busyParticipants, 'No busy participants')}
          {leftParticipants.length > 0 &&
            renderSection(
              'Left',
              leftParticipants,
              'No participants have left'
            )}
        </div>
      </div>
    </div>
  );
};

export default ParticipantListSidebar;
