import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  RoomAudioRenderer,
  useLocalParticipant,
  useParticipants,
  useConnectionState,
  useRoomContext,
} from '@livekit/components-react';
import { sortParticipants } from '@livekit/components-core';
import {
  ConnectionState,
  Participant,
  RemoteParticipant,
} from 'livekit-client';
import { Button } from 'primereact/button';
import {
  IconX,
  IconCopy,
  IconCheck,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react';
import CustomParticipantTile from './CustomParticipantTile';
import SettingsDialog from './SettingsDialog';
import ParticipantListSidebar from './ParticipantListSidebar';
import ControlBar from './ControlBar';
import OneToOneCallView from './OneToOneCallView';
import TopStatusBar from './TopStatusBar';
import ThumbnailsContainer from './ThumbnailsContainer';
// Grid layout helpers
const getGridClassName = (count: number) => {
  if (count === 1) return 'grid-1';
  if (count === 2) return 'grid-2';
  if (count === 3) return 'grid-3';
  if (count === 4) return 'grid-4';
  if (count <= 6) return 'grid-6';
  if (count <= 9) return 'grid-9';
  if (count <= 12) return 'grid-12';
  if (count <= 15) return 'grid-default';
  return 'grid-scroll';
};

// Interface for calling participant info
export interface CallingParticipantInfo {
  name: string;
  title: string;
  department: string;
  identity: string;
}

// Main Room Component that uses LiveKit hooks
const ConferenceComponent: React.FC<{
  hangup: () => void;
  roomName: string;
  onDisconnect?: () => void;
  isMember?: boolean;
  e2eeRawKey?: string | null;
  e2eePassword?: string | null;
}> = ({
  hangup,
  roomName,
  onDisconnect,
  isMember = false,
  e2eeRawKey,
  e2eePassword,
}) => {
  const participants = useParticipants();
  const connectionState = useConnectionState();
  const { localParticipant, isScreenShareEnabled } = useLocalParticipant();
  const [fullScreenParticipant, setFullScreenParticipant] = useState<
    string | null
  >(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipantList, setShowParticipantList] = useState(false);
  // State to track one-to-one view mode
  const [isOneToOneView, setIsOneToOneView] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteInfo, setInviteInfo] = useState<{
    url: string;
    password: string;
  } | null>(null);
  const [urlCopied, setUrlCopied] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [showUrl, setShowUrl] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const inviteUrl = `${window.location.origin}/${roomName}`;
  // State to track showing thumbnails sidebar
  const [showThumbnailsSidebar, setShowThumbnailsSidebar] = useState(false);
  // State for screen share error
  const [screenShareError, setScreenShareError] = useState<string | null>(null);

  const callParticipantInfo: CallingParticipantInfo = {
    name: 'Ahmet Emre Zengin',
    title: 'Software Engineer',
    department: 'Software Development',
    identity: 'ahmet.emre.zengin',
  };
  // State to track calling mode
  const [isCalling, setIsCalling] = useState(false);
  // State to store calling participant info
  const [callingParticipantInfo, setCallingParticipantInfo] =
    useState<CallingParticipantInfo | null>(callParticipantInfo);

  // Check if we should use one-to-one view (exactly 2 participants)
  // useEffect(() => {
  //   setIsOneToOneView(participants.length === 2);
  // }, [participants.length]);

  const enterFullScreen = useCallback((participantId: string) => {
    setFullScreenParticipant(participantId);
  }, []);

  const exitFullScreen = useCallback(() => {
    setFullScreenParticipant(null);
  }, []);

  // ESC key listener for exiting fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && fullScreenParticipant) {
        exitFullScreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [fullScreenParticipant, exitFullScreen]);

  const toggleVideo = useCallback(async () => {
    if (localParticipant) {
      await localParticipant.setCameraEnabled(
        !localParticipant.isCameraEnabled
      );
    }
  }, [localParticipant]);

  const toggleAudio = useCallback(async () => {
    if (localParticipant) {
      await localParticipant.setMicrophoneEnabled(
        !localParticipant.isMicrophoneEnabled
      );
    }
  }, [localParticipant]);

  const toggleScreenShare = useCallback(async () => {
    if (localParticipant) {
      setScreenShareError(null);
      try {
        // Toggle screen sharing
        // LiveKit will use the room's publishDefaults for codec
        await localParticipant.setScreenShareEnabled(!isScreenShareEnabled, {
          audio: true,
        });
      } catch (error: any) {
        let errorMessage = 'Ekran paylaşımı başlatılamadı. ';

        if (
          error.name === 'NotAllowedError' ||
          error.name === 'PermissionDeniedError'
        ) {
          errorMessage +=
            'Ekran paylaşımı izni verilmedi. Lütfen tarayıcı ayarlarından izin verin.';
        } else if (
          error.name === 'NotReadableError' ||
          error.name === 'TrackStartError'
        ) {
          errorMessage +=
            'Ekran paylaşımı başlatılamadı. Ekran başka bir uygulama tarafından kullanılıyor olabilir.';
        } else if (
          error.name === 'AbortError' ||
          error.name === 'NotSupportedError'
        ) {
          errorMessage += 'Tarayıcınız ekran paylaşımını desteklemiyor.';
        } else {
          errorMessage += error.message || 'Bilinmeyen bir hata oluştu.';
        }

        setScreenShareError(errorMessage);
        // Clear error after 5 seconds
        setTimeout(() => setScreenShareError(null), 5000);
      }
    }
  }, [localParticipant, isScreenShareEnabled]);

  const room = useRoomContext();

  // Room creation time için state
  const [roomStartTime, setRoomStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // Room'un creationTime'ını al veya bağlantı zamanını kullan
  useEffect(() => {
    if (connectionState === ConnectionState.Disconnected) {
      // Bağlantı kesildiğinde sayacı sıfırla
      setRoomStartTime(null);
      setElapsedTime(0);
      return;
    }

    if (
      room &&
      connectionState === ConnectionState.Connected &&
      !roomStartTime
    ) {
      // room.roomInfo içindeki creationTime veya creationTimeMs'i kontrol et
      const roomInfo = (room as any).roomInfo;
      const creationTimeMs = roomInfo?.creationTimeMs;
      const creationTime = roomInfo?.creationTime;

      if (creationTimeMs) {
        // creationTimeMs milisaniye cinsinden timestamp (BigInt olabilir, Number'a çevir)
        const startTime =
          typeof creationTimeMs === 'bigint'
            ? Number(creationTimeMs)
            : typeof creationTimeMs === 'number'
              ? creationTimeMs
              : Number(creationTimeMs);
        setRoomStartTime(Number(startTime)); // Ekstra güvenlik için Number() ile sarmala
      } else if (creationTime) {
        // creationTime varsa, timestamp ise direkt kullan, değilse Date objesi ise getTime() kullan
        const startTime =
          typeof creationTime === 'bigint'
            ? Number(creationTime)
            : typeof creationTime === 'number'
              ? creationTime
              : creationTime instanceof Date
                ? creationTime.getTime()
                : Number(new Date(creationTime).getTime());
        setRoomStartTime(Number(startTime)); // Ekstra güvenlik için Number() ile sarmala
      } else {
        // creationTime yoksa bağlantı zamanını kullan
        setRoomStartTime(Date.now());
      }
    }
  }, [room, connectionState, roomStartTime]);

  // Sayaç güncellemesi
  useEffect(() => {
    if (!roomStartTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      // roomStartTime'ı Number'a çevir (BigInt olabilir)
      const startTime =
        typeof roomStartTime === 'bigint'
          ? Number(roomStartTime)
          : Number(roomStartTime);
      const elapsed = Math.floor((now - startTime) / 1000); // saniye cinsinden
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [roomStartTime]);

  // E2EE'yi aktif et (eğer key varsa ve room bağlandıysa)
  useEffect(() => {
    if (room && connectionState === ConnectionState.Connected) {
      // E2EE key varsa (member için e2eeRawKey, guest için e2eePassword)
      const hasE2EEKey =
        (isMember && e2eeRawKey) || (!isMember && e2eePassword);

      if (hasE2EEKey) {
        // E2EE options zaten RoomComponent'te ayarlanıyor,
        // ama room bağlandıktan sonra E2EE'yi açıkça enable etmek gerekebilir
        try {
          // E2EE durumunu kontrol et
          const e2eeManager = (room as any).e2eeManager;
          console.log('E2EE Manager:', e2eeManager);
          console.log('Room options:', (room as any).options);

          // LiveKit Room API'sinde setE2EEEnabled metodu var
          if (typeof (room as any).setE2EEEnabled === 'function') {
            (room as any).setE2EEEnabled(true);
            console.log('setE2EEEnabled(true) called');

            // E2EE'nin gerçekten aktif olup olmadığını kontrol et
            setTimeout(() => {
              const isE2eeEnabled = (room as any).isE2eeEnabled;
              const e2eeManagerAfter = (room as any).e2eeManager;
              console.log('E2EE status check:', {
                isE2eeEnabled,
                hasE2eeManager: !!e2eeManagerAfter,
                e2eeManager: e2eeManagerAfter,
              });

              if (isE2eeEnabled || e2eeManagerAfter) {
                console.log('E2EE is enabled and active');
              } else {
                console.warn(
                  'E2EE was set but is not enabled. Check E2EE configuration.',
                  'Make sure e2ee options are passed correctly in RoomComponent.'
                );
              }
            }, 2000);
          } else {
            console.warn('setE2EEEnabled method not found on room object');
          }
        } catch (error) {
          console.error('Error enabling E2EE:', error);
        }
      } else {
        console.warn(
          'E2EE key not available. Connection will not be encrypted.',
          {
            isMember,
            hasE2eeRawKey: !!e2eeRawKey,
            hasE2eePassword: !!e2eePassword,
          }
        );
      }
    }
  }, [room, connectionState, e2eeRawKey, e2eePassword, isMember]);

  const disconnect = useCallback(() => {
    // The LiveKitRoom component handles disconnection
    if (room) {
      room.disconnect();
    }
  }, [room]);

  // Watch for disconnection and redirect to home page
  // Only trigger onDisconnect when transitioning from Connected/Connecting to Disconnected
  const prevConnectionStateRef = useRef<ConnectionState | null>(null);
  const hasTriggeredDisconnectRef = useRef(false);

  useEffect(() => {
    const prevState = prevConnectionStateRef.current;
    prevConnectionStateRef.current = connectionState;

    // Only trigger onDisconnect if we were previously connected/connecting and now disconnected
    // And only trigger once
    if (
      !hasTriggeredDisconnectRef.current &&
      prevState !== null &&
      prevState !== ConnectionState.Disconnected &&
      connectionState === ConnectionState.Disconnected &&
      onDisconnect
    ) {
      hasTriggeredDisconnectRef.current = true;
      onDisconnect();
    }
  }, [connectionState, onDisconnect]);

  const openSettings = useCallback(() => {
    setShowParticipantList(false);
    setShowSettings(true);
  }, []);

  const onShowParticipantList = useCallback(() => {
    setShowSettings(false);
    setShowParticipantList(true);
  }, []);

  const setActive = () => {
    // Note: setActive method is not available in Room API
    // This is kept for compatibility with ControlBar component
  };

  const handleCallParticipant = useCallback((participant: any) => {
    // Implement call participant logic here
    // You can add your specific logic to initiate a call to this participant
  }, []);

  const gridClassName = getGridClassName(participants.length);
  const fullscreenParticipant = participants.find(
    p => p.identity === fullScreenParticipant
  );

  // Get remote participant in one-to-one view
  const remoteParticipant = participants.find(
    p => !p.isLocal
  ) as RemoteParticipant;
  // Get local participant in one-to-one view
  const localParticipantObj = participants.find(p => p.isLocal);

  // Use LiveKit's built-in sorting which handles speaking participants
  // and keeps recently spoken participants at the front using lastSpokeAt
  const sortedParticipants = sortParticipants(participants);

  const otherParticipants = sortedParticipants.filter(
    p => p.identity !== fullScreenParticipant
  );

  // Use sorted participants when scroll is active (more than 15 participants)
  const participantsToRender =
    participants.length > 15 ? sortedParticipants : participants;

  return (
    <div
      className={`conference-container${
        showParticipantList || showSettings ? ' sidebar-right-open' : ''
      }${fullscreenParticipant ? ' sidebar-left-open' : ''}`}
    >
      {/* Top Status Bar */}
      <TopStatusBar
        connectionState={connectionState as ConnectionState}
        participants={participants}
        showParticipantList={showParticipantList}
        onShowParticipantList={onShowParticipantList}
        elapsedTime={elapsedTime}
      />

      {/* Screen Share Error Toast */}
      {screenShareError && (
        <div
          style={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(239, 68, 68, 0.95)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 10000,
            maxWidth: '90%',
            width: 'auto',
            fontSize: 14,
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          {screenShareError}
        </div>
      )}

      {/* Thumbnails Sidebar (left) */}
      {fullscreenParticipant && (
        <ThumbnailsContainer
          otherParticipants={otherParticipants}
          enterFullScreen={enterFullScreen}
        />
      )}

      {/* Main Video Area */}
      {fullscreenParticipant ? (
        <div className="fullscreen-container">
          <CustomParticipantTile participant={fullscreenParticipant} idx={0} />
          <Button
            icon={<IconX size={20} />}
            onClick={exitFullScreen}
            className="exit-fullscreen-button"
            title="Tam ekrandan çık"
          />
        </div>
      ) : (isOneToOneView && remoteParticipant && localParticipantObj) ||
        isCalling ? (
        <OneToOneCallView
          remoteParticipant={remoteParticipant || ({} as Participant)}
          localParticipant={localParticipantObj || ({} as Participant)}
          isCalling={isCalling}
          callingParticipantInfo={callingParticipantInfo}
        />
      ) : (
        <div className={`participants-grid ${gridClassName}`}>
          {participantsToRender.map((participant, idx) => (
            <div key={participant.identity} className="size-full">
              <CustomParticipantTile
                participant={participant}
                idx={idx}
                onMaximize={() => enterFullScreen(participant.identity)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <ControlBar
        localParticipant={localParticipant}
        toggleAudio={toggleAudio}
        toggleVideo={toggleVideo}
        toggleScreenShare={toggleScreenShare}
        isScreenShareEnabled={isScreenShareEnabled}
        disconnect={disconnect}
        openSettings={openSettings}
        setActive={setActive}
        hangup={hangup}
      />

      {/* Audio Renderer for spatial audio */}
      <RoomAudioRenderer />

      {/* Settings Dialog */}
      <SettingsDialog
        visible={showSettings}
        onHide={() => setShowSettings(false)}
      />

      {/* Participant List Sidebar */}
      <ParticipantListSidebar
        visible={showParticipantList}
        onHide={() => setShowParticipantList(false)}
        ringingParticipants={[]}
        deniedParticipants={[]}
        busyParticipants={[]}
        leftParticipants={[]}
        noAnswerParticipants={[]}
        notReachableParticipants={[]}
        activeParticipants={participants as any}
        onCallParticipant={handleCallParticipant}
        inviteUrl={inviteUrl}
        onInviteCopy={() => {
          if (isMember && e2eeRawKey) {
            // Member ise mevcut E2EE key'i kullan
            // URL'ye password parametresi ekleme, sadece modal'da göster

            // Modal'da göster
            setInviteInfo({
              url: inviteUrl,
              password: e2eeRawKey,
            });
            setShowInviteModal(true);
          } else {
            // Member değilse veya key yoksa sadece linki göster
            setInviteInfo({
              url: inviteUrl,
              password: '',
            });
            setShowInviteModal(true);
          }
        }}
        inviteCopied={false}
      />

      {/* Invite Modal */}
      {showInviteModal && inviteInfo && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 20,
          }}
          onClick={() => setShowInviteModal(false)}
        >
          <div
            style={{
              background: 'rgba(24, 26, 27, 0.98)',
              borderRadius: 20,
              padding: '32px',
              maxWidth: 500,
              width: '100%',
              boxShadow: '0 8px 40px 0 rgba(0,0,0,0.5)',
              border: '1px solid rgba(148,163,184,0.35)',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Kapat butonu - sağ üstte X */}
            <Button
              icon={<IconX size={20} />}
              onClick={() => setShowInviteModal(false)}
              className="p-button-text p-button-rounded"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 36,
                height: 36,
                background: 'transparent',
                border: 'none',
                color: '#bdbdbd',
                padding: 0,
                minWidth: 36,
              }}
              title="Kapat"
            />

            <h2
              style={{
                color: '#fff',
                fontWeight: 700,
                fontSize: 24,
                marginBottom: 24,
                paddingRight: 40,
              }}
            >
              Davet Bilgileri
            </h2>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  color: '#bdbdbd',
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Bağlantı Linki:
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <input
                  type={showUrl ? 'text' : 'password'}
                  value={inviteInfo.url}
                  readOnly
                  onClick={async e => {
                    (e.target as HTMLInputElement).select();
                    await navigator.clipboard.writeText(inviteInfo.url);
                    setUrlCopied(true);
                    setTimeout(() => setUrlCopied(false), 2000);
                  }}
                  style={{
                    flex: 1,
                    background: '#161818',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid #333',
                    color: '#fff',
                    fontSize: 14,
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                />
                <Button
                  icon={
                    showUrl ? <IconEyeOff size={18} /> : <IconEye size={18} />
                  }
                  onClick={() => setShowUrl(!showUrl)}
                  style={{
                    background: '#555',
                    border: 'none',
                    color: '#fff',
                    minWidth: 44,
                    height: 44,
                  }}
                  title={showUrl ? 'Gizle' : 'Göster'}
                />
                <Button
                  icon={
                    urlCopied ? <IconCheck size={18} /> : <IconCopy size={18} />
                  }
                  onClick={async () => {
                    await navigator.clipboard.writeText(inviteInfo.url);
                    setUrlCopied(true);
                    setTimeout(() => setUrlCopied(false), 2000);
                  }}
                  style={{
                    background: urlCopied ? '#22c55e' : '#3b82f6',
                    border: 'none',
                    color: '#fff',
                    minWidth: 44,
                    height: 44,
                  }}
                  title={urlCopied ? 'Kopyalandı!' : 'Kopyala'}
                />
              </div>
            </div>

            {inviteInfo.password && (
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: 'block',
                    color: '#bdbdbd',
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  Şifre:
                </label>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={inviteInfo.password}
                    readOnly
                    onClick={async e => {
                      (e.target as HTMLInputElement).select();
                      await navigator.clipboard.writeText(inviteInfo.password);
                      setPasswordCopied(true);
                      setTimeout(() => setPasswordCopied(false), 2000);
                    }}
                    style={{
                      flex: 1,
                      background: '#161818',
                      padding: '12px 16px',
                      borderRadius: 8,
                      border: '1px solid #333',
                      color: '#fff',
                      fontSize: 14,
                      wordBreak: 'break-all',
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  />
                  <Button
                    icon={
                      showPassword ? (
                        <IconEyeOff size={18} />
                      ) : (
                        <IconEye size={18} />
                      )
                    }
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: '#555',
                      border: 'none',
                      color: '#fff',
                      minWidth: 44,
                      height: 44,
                    }}
                    title={showPassword ? 'Gizle' : 'Göster'}
                  />
                  <Button
                    icon={
                      passwordCopied ? (
                        <IconCheck size={18} />
                      ) : (
                        <IconCopy size={18} />
                      )
                    }
                    onClick={async () => {
                      await navigator.clipboard.writeText(inviteInfo.password);
                      setPasswordCopied(true);
                      setTimeout(() => setPasswordCopied(false), 2000);
                    }}
                    style={{
                      background: passwordCopied ? '#22c55e' : '#3b82f6',
                      border: 'none',
                      color: '#fff',
                      minWidth: 44,
                      height: 44,
                    }}
                    title={passwordCopied ? 'Kopyalandı!' : 'Kopyala'}
                  />
                </div>
              </div>
            )}

            {/* Tüm bilgileri kopyala butonu */}
            {inviteInfo.password && (
              <div
                style={{
                  marginBottom: 20,
                  padding: '16px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: 12,
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                <Button
                  icon={
                    inviteCopied ? (
                      <IconCheck size={18} />
                    ) : (
                      <IconCopy size={18} />
                    )
                  }
                  label={
                    inviteCopied ? 'Kopyalandı!' : 'Davet Mesajını Kopyala'
                  }
                  onClick={async () => {
                    const inviteText = `TOPLANTI DAVETİ

Sayın Katılımcı,

Aşağıdaki bağlantıyı kullanarak toplantıya katılabilirsiniz:

Bağlantı Linki: ${inviteInfo.url}
Şifre: ${inviteInfo.password}`;
                    await navigator.clipboard.writeText(inviteText);
                    setInviteCopied(true);
                    setTimeout(() => setInviteCopied(false), 2000);
                  }}
                  style={{
                    width: '100%',
                    background: inviteCopied
                      ? '#22c55e'
                      : 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 600,
                    padding: '12px 20px',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConferenceComponent;
