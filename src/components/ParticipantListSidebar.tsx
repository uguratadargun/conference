import React from 'react';
import { Participant, RemoteParticipant } from 'livekit-client';
import { Button } from 'primereact/button';

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
          <span
            className={`material-icons status-icon ${participant.isMicrophoneEnabled ? 'active' : 'inactive'}`}
          >
            {participant.isMicrophoneEnabled ? 'mic' : 'mic_off'}
          </span>
          <span
            className={`material-icons status-icon ${participant.isCameraEnabled ? 'active' : 'inactive'}`}
          >
            {participant.isCameraEnabled ? 'videocam' : 'videocam_off'}
          </span>
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
              <span className="material-icons">people</span>
            </div>
            <h2 className="sidebar-title">Group voice call</h2>
            <div className="participant-count">
              {activeParticipants.length} Connected
            </div>
            <Button className="close-sidebar-button" onClick={onHide}>
              <span className="material-icons">close</span>
            </Button>
          </div>

          {/* Add People Section */}
          <div className="add-people-section">
            <Button className="add-people-button">
              <span className="material-icons">person_add</span>
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
