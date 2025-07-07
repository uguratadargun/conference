import React, { useState } from 'react';
import { Participant } from 'livekit-client';
import CustomParticipantTile from './CustomParticipantTile';
import { Button } from 'primereact/button';
import { IconGridDots, IconPhone, IconPhoneOff } from '@tabler/icons-react';

// Interface for calling participant info
interface CallingParticipantInfo {
  name: string;
  title: string;
  department: string;
  identity: string;
}

interface OneToOneCallViewProps {
  remoteParticipant: Participant;
  localParticipant: Participant;
  isCalling?: boolean;
  callingParticipantInfo?: CallingParticipantInfo | null;
}

type LayoutType = 'standard' | 'focus' | 'no-video';

const OneToOneCallView: React.FC<OneToOneCallViewProps> = ({
  remoteParticipant,
  localParticipant,
  isCalling = false,
  callingParticipantInfo = null,
}) => {
  const [layout, setLayout] = useState<LayoutType>('no-video');
  // State to track if participants are swapped
  const [isSwapped, setIsSwapped] = useState(false);

  const toggleLayout = () => {
    // Cycle through layouts: standard -> focus -> no-video -> standard
    if (layout === 'standard') {
      setLayout('focus');
    } else if (layout === 'focus') {
      setLayout('no-video');
    } else {
      setLayout('standard');
    }
  };

  // Function to swap positions
  const swapParticipants = () => {
    setIsSwapped(!isSwapped);
  };

  // Get the main and secondary participants based on swap state
  const mainParticipant = isSwapped ? localParticipant : remoteParticipant;
  const secondaryParticipant = isSwapped ? remoteParticipant : localParticipant;

  // Render calling UI when isCalling is true
  const renderCallingUI = () => {
    if (!callingParticipantInfo) return null;

    return (
      <div className="calling-container">
        <div className="calling-background">
          <div className="calling-content">
            {/* Profile placeholder or avatar */}
            <div className="calling-avatar">
              <div className="calling-avatar-placeholder">
                {callingParticipantInfo.name.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Participant info */}
            <div className="calling-info">
              <h2 className="calling-name">{callingParticipantInfo.name}</h2>
              <p className="calling-title">{callingParticipantInfo.title}</p>
              <p className="calling-department">
                {callingParticipantInfo.department}
              </p>
            </div>

            {/* Calling status text only */}
            <div className="calling-status">
              <p className="calling-text">Aranıyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Return different layouts based on the selected type
  const renderLayout = () => {
    switch (layout) {
      case 'focus':
        return (
          <div className="one-to-one-focus">
            <div className="one-to-one-focus-remote">
              <CustomParticipantTile
                participant={mainParticipant}
                idx={0}
                onMaximize={swapParticipants}
              />
            </div>
            <div className="one-to-one-focus-local">
              <CustomParticipantTile
                participant={secondaryParticipant}
                idx={1}
                onMaximize={swapParticipants}
              />
            </div>
          </div>
        );
      case 'no-video':
        return (
          <div className="one-to-one-no-video">
            <div className="one-to-one-remote-only">
              <CustomParticipantTile
                participant={remoteParticipant}
                idx={0}
                onMaximize={swapParticipants}
              />
            </div>
          </div>
        );
      case 'standard':
      default:
        return (
          <>
            <div className="one-to-one-remote">
              <CustomParticipantTile
                participant={mainParticipant}
                idx={0}
                onMaximize={swapParticipants}
              />
            </div>
            <div className="one-to-one-local">
              <CustomParticipantTile
                participant={secondaryParticipant}
                idx={1}
                onMaximize={swapParticipants}
              />
            </div>
          </>
        );
    }
  };

  // If in calling mode, show calling UI
  if (isCalling) {
    return renderCallingUI();
  }

  return (
    <div className={`one-to-one-container one-to-one-layout-${layout}`}>
      {renderLayout()}

      {/* Layout toggle button */}
      <Button
        icon={<IconGridDots size={20} />}
        onClick={toggleLayout}
        className="layout-toggle-button"
        tooltip={
          layout === 'standard'
            ? 'Change to focus layout'
            : layout === 'focus'
              ? 'Change to no-video layout'
              : 'Change to standard layout'
        }
        tooltipOptions={{ position: 'left' }}
      />
    </div>
  );
};

export default OneToOneCallView;
