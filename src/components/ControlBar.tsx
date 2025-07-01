import React from 'react';
import { Button } from 'primereact/button';
import { Participant } from 'livekit-client';
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconVideo,
  IconVideoOff,
  IconPhoneOff,
  IconSettings,
  IconCheck,
} from '@tabler/icons-react';

interface ControlBarProps {
  localParticipant: Participant | undefined;
  toggleAudio: () => void;
  toggleVideo: () => void;
  disconnect: () => void;
  openSettings: () => void;
  setActive: () => void;
}

const ControlBar: React.FC<ControlBarProps> = ({
  localParticipant,
  toggleAudio,
  toggleVideo,
  disconnect,
  openSettings,
  setActive,
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
            icon={<IconPhoneOff size={20} />}
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
            tooltip="Settings"
            tooltipOptions={{ position: 'top' }}
          />
        </div>
      </div>
    </div>
  );
};

export default ControlBar;
