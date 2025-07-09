import React from 'react';
import { Button } from 'primereact/button';
import { Participant } from 'livekit-client';
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconVideo,
  IconVideoOff,
  IconPhone,
  IconSettings,
  IconCheck,
  IconX,
  IconScreenShare,
  IconScreenShareOff,
} from '@tabler/icons-react';

interface ControlBarProps {
  localParticipant: Participant | undefined;
  toggleAudio: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  isScreenShareEnabled: boolean;
  disconnect: () => void;
  openSettings: () => void;
  setActive: () => void;
  hangup: () => void;
}

const ControlBar: React.FC<ControlBarProps> = ({
  localParticipant,
  toggleAudio,
  toggleVideo,
  toggleScreenShare,
  isScreenShareEnabled,
  disconnect,
  openSettings,
  setActive,
  hangup,
}) => {
  return (
    <div className="controls-container">
      <div className="controls-panel">
        <div className="control-group">
          <Button
            icon={
              localParticipant?.isMicrophoneEnabled ? (
                <IconMicrophone size={20} />
              ) : (
                <IconMicrophoneOff size={20} />
              )
            }
            onClick={toggleAudio}
            className={`control-button audio-button ${
              !localParticipant?.isMicrophoneEnabled ? 'disabled' : ''
            }`}
            tooltip={
              localParticipant?.isMicrophoneEnabled
                ? 'Mute Audio'
                : 'Unmute Audio'
            }
            tooltipOptions={{ position: 'top' }}
          />
        </div>

        <div className="control-group">
          <Button
            icon={
              localParticipant?.isCameraEnabled ? (
                <IconVideo size={20} />
              ) : (
                <IconVideoOff size={20} />
              )
            }
            onClick={toggleVideo}
            className={`control-button video-button ${
              !localParticipant?.isCameraEnabled ? 'disabled' : ''
            }`}
            tooltip={
              localParticipant?.isCameraEnabled
                ? 'Turn Off Camera'
                : 'Turn On Camera'
            }
            tooltipOptions={{ position: 'top' }}
          />
        </div>

        <div className="control-group">
          <Button
            icon={
              isScreenShareEnabled ? (
                <IconScreenShareOff size={20} />
              ) : (
                <IconScreenShare size={20} />
              )
            }
            onClick={toggleScreenShare}
            className={`control-button screen-share-button ${
              isScreenShareEnabled ? 'active' : ''
            }`}
            tooltip={
              isScreenShareEnabled ? 'Stop Screen Sharing' : 'Share Screen'
            }
            tooltipOptions={{ position: 'top' }}
          />
        </div>

        <div className="control-group">
          <Button
            icon={<IconPhone size={20} />}
            onClick={disconnect}
            className="control-button hang-up-button"
            tooltip="Leave Call"
            tooltipOptions={{ position: 'top' }}
          />
        </div>

        <div className="control-group">
          <Button
            icon={<IconSettings size={20} />}
            onClick={openSettings}
            className="control-button settings-button"
            tooltip="Settings"
            tooltipOptions={{ position: 'top' }}
          />
        </div>

        <div className="control-group">
          <Button
            icon={<IconCheck size={20} />}
            onClick={setActive}
            className="control-button settings-button"
            tooltip="Accept Call"
            tooltipOptions={{ position: 'top' }}
          />
        </div>

        <div className="control-group">
          <Button
            icon={<IconX size={20} />}
            onClick={hangup}
            className="control-button hang-up-button"
            tooltip="Deny Call"
            tooltipOptions={{ position: 'top' }}
          />
        </div>
      </div>
    </div>
  );
};

export default ControlBar;
