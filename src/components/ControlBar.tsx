import React, { useMemo } from 'react';
import { Button } from 'primereact/button';
import { Participant } from 'livekit-client';
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconVideo,
  IconVideoOff,
  IconPhone,
  IconSettings,
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
  // Detect if device is touch-enabled (mobile)
  const isTouchDevice = useMemo(() => {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore
      navigator.msMaxTouchPoints > 0
    );
  }, []);

  // Tooltip options: disable on touch devices to prevent them from staying open
  const tooltipOptions = useMemo(
    () => ({
      position: 'top' as const,
      event: isTouchDevice ? ('focus' as const) : ('hover' as const),
      hideDelay: isTouchDevice ? 0 : 200,
      showDelay: isTouchDevice ? 0 : 0,
    }),
    [isTouchDevice]
  );

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
              isTouchDevice
                ? undefined
                : localParticipant?.isMicrophoneEnabled
                  ? 'Sesi Kapat'
                  : 'Sesi Aç'
            }
            tooltipOptions={tooltipOptions}
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
              isTouchDevice
                ? undefined
                : localParticipant?.isCameraEnabled
                  ? 'Kamerayı Kapat'
                  : 'Kamerayı Aç'
            }
            tooltipOptions={tooltipOptions}
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
              isTouchDevice
                ? undefined
                : isScreenShareEnabled
                  ? 'Ekran Paylaşımını Durdur'
                  : 'Ekran Paylaş'
            }
            tooltipOptions={tooltipOptions}
          />
        </div>

        <div className="control-group">
          <Button
            icon={<IconPhone size={20} />}
            onClick={disconnect}
            className="control-button hang-up-button"
            tooltip={isTouchDevice ? undefined : 'Görüşmeden Ayrıl'}
            tooltipOptions={tooltipOptions}
          />
        </div>

        <div className="control-group">
          <Button
            icon={<IconSettings size={20} />}
            onClick={openSettings}
            className="control-button settings-button"
            tooltip={isTouchDevice ? undefined : 'Ayarlar'}
            tooltipOptions={tooltipOptions}
          />
        </div>

        {/* <div className="control-group">
          <Button
            icon={<IconCheck size={20} />}
            onClick={setActive}
            className="control-button settings-button"
            tooltip="Görüşmeyi Kabul Et"
            tooltipOptions={{ position: 'top' }}
          />
        </div>

        <div className="control-group">
          <Button
            icon={<IconX size={20} />}
            onClick={hangup}
            className="control-button hang-up-button"
            tooltip="Görüşmeyi Reddet"
            tooltipOptions={{ position: 'top' }}
          />
        </div> */}
      </div>
    </div>
  );
};

export default ControlBar;
