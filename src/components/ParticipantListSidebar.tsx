import React, { useRef } from 'react';
import { Participant } from 'livekit-client';
import { Button } from 'primereact/button';

interface ParticipantListSidebarProps {
  visible: boolean;
  onHide: () => void;
  participants: Participant[];
}

// Helper function to get display name
const getDisplayName = (participant: Participant): string => {
  if (!participant.name) return 'Anonymous';

  // If it's a full name with spaces, return as is
  if (participant.name.includes(' ')) return participant.name;

  // If it's a simple name, return as is
  if (participant.name.length < 15) return participant.name;

  // If it's a long string (like an ID), try to make it shorter
  return participant.name.substring(0, 12) + '...';
};

const ParticipantListSidebar: React.FC<ParticipantListSidebarProps> = ({
  visible,
  onHide,
  participants,
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);

  if (!visible) return null;

  return (
    <div className="participant-sidebar-container">
      <div className="participant-sidebar" ref={sidebarRef}>
        <div className="participant-sidebar-content">
          <div className="sidebar-header">
            <div className="icon-circle">
              <span className="material-icons">people</span>
            </div>
            <h2 className="sidebar-title">Group voice call</h2>
            <div className="participant-count">
              {participants.length} Connected
            </div>
            <Button className="close-sidebar-button" onClick={onHide}>
              <span className="material-icons">close</span>
            </Button>
          </div>

          <div className="add-people-section">
            <Button className="add-people-button">
              <span className="material-icons">person_add</span>
              <span>Add people...</span>
            </Button>
          </div>

          <div className="participant-section">
            <div className="section-title">In this call</div>
            <div className="participant-list">
              {participants.map(participant => {
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
                        className={`material-icons status-icon ${
                          participant.isMicrophoneEnabled
                            ? 'active'
                            : 'inactive'
                        }`}
                      >
                        {participant.isMicrophoneEnabled ? 'mic' : 'mic_off'}
                      </span>
                      <span
                        className={`material-icons status-icon ${
                          participant.isCameraEnabled ? 'active' : 'inactive'
                        }`}
                      >
                        {participant.isCameraEnabled
                          ? 'videocam'
                          : 'videocam_off'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantListSidebar;
