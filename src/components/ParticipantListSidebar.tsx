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
  IconPhoneCall,
  IconPhoneX,
  IconClock,
  IconUserMinus,
  IconLoader2,
} from '@tabler/icons-react';

// Participant status type
type ParticipantStatus = 'active' | 'ringing' | 'denied' | 'busy' | 'left';

interface ParticipantWithStatus {
  participant: Participant;
  status: ParticipantStatus;
}

interface ParticipantListSidebarProps {
  visible: boolean;
  onHide: () => void;
  ringingParticipants: RemoteParticipant[];
  deniedParticipants: RemoteParticipant[];
  busyParticipants: RemoteParticipant[];
  leftParticipants: RemoteParticipant[];
  activeParticipants: RemoteParticipant[];
  onCallParticipant?: (participant: Participant) => void;
}

const ParticipantListSidebar: React.FC<ParticipantListSidebarProps> = ({
  visible,
  onHide,
  ringingParticipants,
  deniedParticipants,
  busyParticipants,
  leftParticipants,
  activeParticipants,
  onCallParticipant,
}) => {
  if (!visible) return null;

  const getDisplayName = (participant: Participant): string => {
    return participant.name || participant.identity || 'Anonymous';
  };

  const getParticipantInfo = (participant: Participant) => {
    const displayName = getDisplayName(participant);
    const department = participant.attributes?.department || 'Ulak';
    const title = participant.attributes?.title || 'Takim Lideri';
    return { displayName, department, title };
  };

  // Combine all participants with their status
  const allParticipants: ParticipantWithStatus[] = [
    ...activeParticipants.map(p => ({
      participant: p,
      status: 'active' as ParticipantStatus,
    })),
    ...ringingParticipants.map(p => ({
      participant: p,
      status: 'ringing' as ParticipantStatus,
    })),
    ...deniedParticipants.map(p => ({
      participant: p,
      status: 'denied' as ParticipantStatus,
    })),
    ...busyParticipants.map(p => ({
      participant: p,
      status: 'busy' as ParticipantStatus,
    })),
    ...leftParticipants.map(p => ({
      participant: p,
      status: 'left' as ParticipantStatus,
    })),
  ];

  const getStatusIcon = (status: ParticipantStatus) => {
    switch (status) {
      case 'ringing':
        return (
          <IconLoader2 size={16} className="status-icon ringing animate-spin" />
        );
      case 'denied':
        return <IconPhoneX size={16} className="status-icon denied" />;
      case 'busy':
        return <IconClock size={16} className="status-icon busy" />;
      case 'left':
        return <IconUserMinus size={16} className="status-icon left" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: ParticipantStatus) => {
    switch (status) {
      case 'ringing':
        return (
          <div className="ringing-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        );
      case 'denied':
        return 'Denied';
      case 'busy':
        return 'Busy';
      case 'left':
        return 'Left';
      default:
        return 'In call';
    }
  };

  const renderCallButton = (participantWithStatus: ParticipantWithStatus) => {
    const { participant, status } = participantWithStatus;

    if (status === 'active' || status === 'ringing') {
      return null; // No call button for active or ringing participants
    }

    return (
      <Button
        className="call-again-button"
        size="small"
        onClick={() => onCallParticipant?.(participant)}
        title="Call again"
      >
        Ring
      </Button>
    );
  };

  const renderParticipant = (participantWithStatus: ParticipantWithStatus) => {
    const { participant, status } = participantWithStatus;
    const { displayName, department, title } = getParticipantInfo(participant);
    const initial = displayName.charAt(0).toUpperCase();

    return (
      <div
        key={`${participant.identity}-${status}`}
        className="participant-item"
      >
        <div className="participant-avatar">{initial}</div>
        <div className="participant-info">
          <div className="participant-list-name">{displayName}</div>
          <div className="participant-list-title">{title}</div>
          <div className="participant-list-department">{department}</div>
        </div>
        <div className="participant-controls">
          {/* Show status text only for non-active participants */}
          {status !== 'active' && (
            <div className="participant-status-text">
              {getStatusText(status)}
            </div>
          )}

          {/* Show mic/video icons only for active participants */}
          {status === 'active' && (
            <>
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
            </>
          )}

          {/* Show call again button for denied/busy/left participants */}
          {renderCallButton(participantWithStatus)}
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

          {/* All Participants List */}
          <div className="participant-section">
            <h3 className="section-title">Participants</h3>
            <div className="participant-list">
              {allParticipants.length === 0 ? (
                <div className="no-participants">No participants</div>
              ) : (
                allParticipants.map(renderParticipant)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantListSidebar;
