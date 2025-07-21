import React from 'react';
import {
  LocalParticipant,
  Participant,
  RemoteParticipant,
  Track,
} from 'livekit-client';
import { Button } from 'primereact/button';
import {
  IconUsers,
  IconX,
  IconUserPlus,
  IconMicrophone,
  IconMicrophoneOff,
  IconVideo,
  IconVideoOff,
  IconPhone,
  IconDeviceDesktop,
  IconScreenShare,
} from '@tabler/icons-react';

// Participant status type
type ParticipantStatus =
  | 'active'
  | 'ringing'
  | 'denied'
  | 'busy'
  | 'left'
  | 'noAnswer'
  | 'notReachable';

interface ParticipantWithStatus {
  participant: Participant;
  status: ParticipantStatus;
}

interface GroupedParticipant {
  baseIdentity: string;
  displayName: string;
  department: string;
  title: string;
  devices: {
    phone?: ParticipantWithStatus;
    desktop?: ParticipantWithStatus;
  };
  status: ParticipantStatus; // Overall status (prioritized)
}

interface ParticipantListSidebarProps {
  visible: boolean;
  onHide: () => void;
  ringingParticipants: RemoteParticipant[];
  deniedParticipants: RemoteParticipant[];
  busyParticipants: RemoteParticipant[];
  leftParticipants: RemoteParticipant[];
  noAnswerParticipants: RemoteParticipant[];
  notReachableParticipants: RemoteParticipant[];
  activeParticipants: RemoteParticipant[];
  onCallParticipant?: (participant: RemoteParticipant) => void;
  inviteUrl: string;
  onInviteCopy: () => void;
  inviteCopied: boolean;
}

const ParticipantListSidebar: React.FC<ParticipantListSidebarProps> = ({
  visible,
  onHide,
  ringingParticipants,
  deniedParticipants,
  busyParticipants,
  leftParticipants,
  noAnswerParticipants,
  notReachableParticipants,
  activeParticipants,
  onCallParticipant,
  inviteUrl,
  onInviteCopy,
  inviteCopied,
}) => {
  if (!visible) return null;

  const getDisplayName = (participant: Participant): string => {
    return participant.name || participant.identity || 'Anonymous';
  };

  const getParticipantInfo = (participant: Participant) => {
    const displayName = getDisplayName(participant);
    const department = participant?.department || '';
    const title = participant?.title || '';
    return { displayName, department, title };
  };

  const getBaseIdentity = (identity: string): string => {
    // Remove .1 or .2 suffix if exists
    if (identity.endsWith('.1') || identity.endsWith('.2')) {
      return identity.slice(0, -2);
    }
    return identity;
  };

  const getDeviceType = (identity: string): 'phone' | 'desktop' | null => {
    if (identity.endsWith('.1')) return 'phone';
    if (identity.endsWith('.2')) return 'desktop';
    return null;
  };

  const getPriorityStatus = (
    statuses: ParticipantStatus[]
  ): ParticipantStatus => {
    // Priority order: active > ringing > busy > denied > left > noAnswer > notReachable
    if (statuses.includes('active')) return 'active';
    if (statuses.includes('ringing')) return 'ringing';
    if (statuses.includes('busy')) return 'busy';
    if (statuses.includes('denied')) return 'denied';
    if (statuses.includes('noAnswer')) return 'noAnswer';
    if (statuses.includes('notReachable')) return 'notReachable';
    return 'left';
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
    ...noAnswerParticipants.map(p => ({
      participant: p,
      status: 'noAnswer' as ParticipantStatus,
    })),
    ...notReachableParticipants.map(p => ({
      participant: p,
      status: 'notReachable' as ParticipantStatus,
    })),
  ];

  // Group participants by base identity
  const groupedParticipants: GroupedParticipant[] = [];
  const processedIdentities = new Set<string>();

  allParticipants.forEach(participantWithStatus => {
    const { participant } = participantWithStatus;
    const baseIdentity = getBaseIdentity(participant.identity);
    const deviceType = getDeviceType(participant.identity);

    if (processedIdentities.has(baseIdentity)) {
      // Find existing group and add device
      const existingGroup = groupedParticipants.find(
        g => g.baseIdentity === baseIdentity
      );
      if (existingGroup && deviceType) {
        existingGroup.devices[deviceType] = participantWithStatus;
        // Update overall status based on priority
        const allStatuses = Object.values(existingGroup.devices).map(
          d => d!.status
        );
        existingGroup.status = getPriorityStatus(allStatuses);
      }
    } else {
      // Create new group
      processedIdentities.add(baseIdentity);
      const { displayName, department, title } =
        getParticipantInfo(participant);

      const groupedParticipant: GroupedParticipant = {
        baseIdentity,
        displayName,
        department,
        title,
        devices: {},
        status: participantWithStatus.status,
      };

      if (deviceType) {
        groupedParticipant.devices[deviceType] = participantWithStatus;
      }

      groupedParticipants.push(groupedParticipant);
    }
  });

  // Sort grouped participants by status priority
  const getStatusPriority = (status: ParticipantStatus): number => {
    switch (status) {
      case 'active':
        return 0;
      case 'ringing':
        return 1;
      case 'denied':
        return 2;
      case 'busy':
        return 3;
      case 'left':
        return 4;
      case 'noAnswer':
        return 5;
      case 'notReachable':
        return 6;
      default:
        return 7;
    }
  };

  groupedParticipants.sort((a, b) => {
    return getStatusPriority(a.status) - getStatusPriority(b.status);
  });

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
      case 'noAnswer':
        return 'No answer';
      case 'notReachable':
        return 'Not reachable';
      default:
        return 'In call';
    }
  };

  const renderCallButton = (groupedParticipant: GroupedParticipant) => {
    const { status, devices } = groupedParticipant;

    if (status === 'active' || status === 'ringing') {
      return null; // No call button for active or ringing participants
    }

    // Use the first available participant for calling
    const participant =
      devices.phone?.participant || devices.desktop?.participant;
    if (!participant) return null;

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

  const renderDeviceIcons = (devices: GroupedParticipant['devices']) => {
    const hasPhone = !!devices.phone;
    const hasDesktop = !!devices.desktop;

    if (!hasPhone && !hasDesktop) return null;

    return (
      <div className="device-icons">
        {hasPhone && <IconPhone size={12} className="device-icon phone-icon" />}
        {hasDesktop && (
          <IconDeviceDesktop size={12} className="device-icon desktop-icon" />
        )}
      </div>
    );
  };

  const getActiveParticipantForControls = (
    devices: GroupedParticipant['devices']
  ) => {
    // Return the active participant for showing mic/video controls
    return devices.phone?.status === 'active'
      ? devices.phone.participant
      : devices.desktop?.status === 'active'
        ? devices.desktop.participant
        : null;
  };

  const renderActiveParticipantControls = (participant: Participant) => {
    if (!participant) return null;

    const isScreenSharing = !!participant.getTrackPublication(
      Track.Source.ScreenShare
    );

    return (
      <div className="active-participant-controls">
        <div className="participant-status-icon">
          {participant.isMicrophoneEnabled ? (
            <IconMicrophone size={16} color="#22c55e" />
          ) : (
            <IconMicrophoneOff size={16} color="#ef4444" />
          )}
        </div>
        <div className="participant-status-icon">
          {participant.isCameraEnabled ? (
            <IconVideo size={16} color="#22c55e" />
          ) : (
            <IconVideoOff size={16} color="#ef4444" />
          )}
        </div>
        {isScreenSharing && (
          <div className="participant-status-icon screen-share">
            <IconScreenShare size={16} color="#22c55e" />
          </div>
        )}
      </div>
    );
  };

  const renderParticipant = (groupedParticipant: GroupedParticipant) => {
    const { baseIdentity, displayName, department, title, devices, status } =
      groupedParticipant;
    const initial = displayName.charAt(0).toUpperCase();
    const activeParticipant = getActiveParticipantForControls(devices);

    return (
      <div key={baseIdentity} className="participant-item">
        <div className="participant-avatar-container">
          <div className="participant-avatar">{initial}</div>
          {renderDeviceIcons(devices)}
        </div>
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
          {status === 'active' && activeParticipant && (
            <>{renderActiveParticipantControls(activeParticipant)}</>
          )}

          {/* Show call again button for denied/busy/left participants */}
          {renderCallButton(groupedParticipant)}
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

          {/* Invite People Section */}
          <div
            className="add-people-section"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Button className="add-people-button" onClick={onInviteCopy}>
              <IconUserPlus size={20} />
              <span>İnsanları davet et</span>
            </Button>
            {inviteCopied && (
              <div style={{ color: '#22c55e', fontWeight: 600, marginTop: 4 }}>
                Davet bağlantısı kopyalandı!
              </div>
            )}
          </div>

          {/* All Participants List */}
          <div className="participant-section">
            <h3 className="section-title">Participants</h3>
            <div className="participant-list">
              {groupedParticipants.length === 0 ? (
                <div className="no-participants">No participants</div>
              ) : (
                groupedParticipants.map(renderParticipant)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantListSidebar;
