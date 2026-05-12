import React from 'react';
import { Participant } from 'livekit-client';
import { Button } from 'primereact/button';
import { IconEye, IconEyeOff, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import CustomParticipantTile from './CustomParticipantTile';

interface FullscreenViewProps {
  participant: Participant;
  hasOtherParticipants: boolean;
  showThumbnailsSidebar: boolean;
  onToggleThumbnails: () => void;
  onExitFullScreen: () => void;
}

const FullscreenView: React.FC<FullscreenViewProps> = ({
  participant,
  hasOtherParticipants,
  showThumbnailsSidebar,
  onToggleThumbnails,
  onExitFullScreen,
}) => {
  const { t } = useTranslation();

  return (
    <div className="fullscreen-container">
      <CustomParticipantTile participant={participant} idx={0} />
      {hasOtherParticipants && (
        <Button
          icon={
            showThumbnailsSidebar ? (
              <IconEyeOff size={20} />
            ) : (
              <IconEye size={20} />
            )
          }
          onClick={onToggleThumbnails}
          className="thumbnails-toggle-button"
          title={
            showThumbnailsSidebar
              ? t('conference.thumbnailsToggle.hide')
              : t('conference.thumbnailsToggle.show')
          }
        />
      )}
      <Button
        icon={<IconX size={20} />}
        onClick={onExitFullScreen}
        className="exit-fullscreen-button"
        title={t('conference.exitFullscreen')}
      />
    </div>
  );
};

export default FullscreenView;
