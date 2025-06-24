import React from 'react';
import { Button } from 'primereact/button';
import { Participant } from 'livekit-client';

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
                <span className="material-icons">mic</span>
              ) : (
                <span className="material-icons">mic_off</span>
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
                <span className="material-icons">videocam</span>
              ) : (
                <span className="material-icons">videocam_off</span>
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
            icon={<span className="material-icons">call_end</span>}
            onClick={disconnect}
            className="control-button hang-up-button"
            tooltip="Leave Call"
            tooltipOptions={{ position: 'top' }}
          />
        </div>

        <div className="control-group">
          <Button
            icon={<span className="material-icons">settings</span>}
            onClick={openSettings}
            className="control-button settings-button"
            tooltip="Settings"
            tooltipOptions={{ position: 'top' }}
          />
        </div>

        <div className="control-group">
          <Button
            icon={<span className="material-icons">check_circle</span>}
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
