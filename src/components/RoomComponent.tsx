import React, { useEffect, useState, useMemo } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import ConferenceComponent from './ConferenceComponent';
import { Button } from 'primereact/button';
import { IconRefresh, IconAlertCircle } from '@tabler/icons-react';
import { getLivekitConfig, getTokenFromServer } from '../utils/livekit-token';
import { generateAndSendE2EEKey, hexToKey } from '../utils/e2ee';
import { ExternalE2EEKeyProvider } from 'livekit-client';

function getRoomNameFromUrl() {
  const path = window.location.pathname.replace(/^\//, '');
  return path || null;
}

function decodeJwt(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }

  const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');

  const json = atob(payload);
  return JSON.parse(json);
}

// Main ConferenceCall Component with LiveKitRoom wrapper
const RoomComponent: React.FC<{
  username: string;
  cameraOn: boolean;
  micOn: boolean;
  token: string | null;
  roomName: string | null;
  e2eePassword?: string | null;
  onDisconnect?: () => void;
}> = ({
  username,
  cameraOn,
  micOn,
  token,
  roomName,
  e2eePassword,
  onDisconnect,
}) => {
  const [connectionData, setConnectionData] = useState<{
    url: string;
    token: string;
    roomId: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomNameLocal] = useState<string>(
    () => roomName || getRoomNameFromUrl() || ''
  );
  const [isMember, setIsMember] = useState(false);
  const [e2eeRawKey, setE2eeRawKey] = useState<string | null>(null);
  const e2eeKeyProvider = useMemo(() => new ExternalE2EEKeyProvider(), []);

  useEffect(() => {
    const rawKey = e2eeRawKey || e2eePassword;
    if (!rawKey) return;
    const hexCandidate = rawKey.trim();
    if (!/^[0-9a-fA-F]+$/.test(hexCandidate) || hexCandidate.length % 2 !== 0) {
      console.error('E2EE key must be an even-length hex string.');
      return;
    }
    if (hexCandidate.length !== 64) {
      console.error(
        'E2EE key must be 32 bytes (64 hex chars). Current length:',
        hexCandidate.length
      );
      return;
    }
    e2eeKeyProvider.setKey(hexToKey(hexCandidate), 0);
  }, [e2eeKeyProvider, e2eePassword, e2eeRawKey]);

  useEffect(() => {
    const connectToRoom = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const urlToken = token;

        // 1) Eğer URL'de token varsa ve decoded.member === true ise, gelen token ile bağlan
        if (urlToken) {
          try {
            const decoded: any = decodeJwt(urlToken);
            console.log('Decoded LiveKit token from URL:', decoded);

            if (decoded && decoded.member === true) {
              setIsMember(true);
              const livekitConfig = await getLivekitConfig();

              setConnectionData({
                url: livekitConfig.url,
                token: urlToken,
                roomId: roomNameLocal,
              });

              return; // member ise generateToken'a düşme
            }
          } catch (decodeError) {
            console.error(
              'Failed to decode LiveKit token from URL:',
              decodeError
            );
            // decode edilemese bile aşağıda generateToken ile devam etsin
          }
        }

        setIsMember(false);
        // 2) Diğer tüm durumlarda (member değil veya token yok), sunucudan token al
        const data = await getTokenFromServer(
          username,
          roomNameLocal,
          e2eePassword || ''
        );
        setConnectionData(data);
      } catch (err) {
        console.error('Failed to get connection data:', err);
        setError('Failed to connect to the room. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    if (username && roomNameLocal) {
      connectToRoom();
    }
  }, [username, roomNameLocal, token, e2eePassword]);

  useEffect(() => {
    if (!e2eePassword) return;
  }, [e2eePassword]);

  // Member olduğunda E2EE key üret, hash'le ve sunucuya gönder
  useEffect(() => {
    if (isMember && connectionData && token) {
      try {
        const decoded: any = decodeJwt(token);
        const identity = decoded?.sub || decoded?.identity || '';

        if (identity) {
          generateAndSendE2EEKey(connectionData.roomId, token)
            .then(result => {
              if (result) {
                setE2eeRawKey(result.rawKey);
                console.log('E2EE key generated and sent:', result.keyHash);
              } else {
                console.warn('Failed to generate or send E2EE key hash');
              }
            })
            .catch(error => {
              console.error('Error in E2EE key generation process:', error);
            });
        } else {
          console.warn('Could not extract identity from token');
        }
      } catch (error) {
        console.error('Failed to decode token for identity:', error);
      }
    }
  }, [isMember, connectionData, token]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <div
          style={{
            background: 'rgba(24, 26, 27, 0.98)',
            borderRadius: 24,
            padding: '48px 40px',
            maxWidth: 400,
            width: '100%',
            boxShadow: '0 8px 40px 0 rgba(0,0,0,0.5)',
            border: '1px solid rgba(148,163,184,0.35)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
          }}
        >
          {/* Loading Spinner */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(59, 130, 246, 0.3)',
              position: 'relative',
            }}
          >
            <IconRefresh
              size={40}
              color="#3b82f6"
              style={{
                animation: 'spin 1s linear infinite',
              }}
            />
            <style>
              {`
                @keyframes spin {
                  from {
                    transform: rotate(0deg);
                  }
                  to {
                    transform: rotate(360deg);
                  }
                }
              `}
            </style>
          </div>

          {/* Loading Text */}
          <div>
            <h2
              style={{
                color: '#fff',
                fontWeight: 700,
                fontSize: 24,
                marginBottom: 8,
                margin: 0,
              }}
            >
              Odaya Bağlanıyor
            </h2>
            <p
              style={{
                color: '#bdbdbd',
                fontSize: 16,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Lütfen bekleyin...
            </p>
          </div>

          {/* Loading Dots Animation */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#3b82f6',
                  animation: `pulse 1.4s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
            <style>
              {`
                @keyframes pulse {
                  0%, 80%, 100% {
                    opacity: 0.3;
                    transform: scale(0.8);
                  }
                  40% {
                    opacity: 1;
                    transform: scale(1);
                  }
                }
              `}
            </style>
          </div>
        </div>
      </div>
    );
  }

  if (error || !connectionData) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <div
          style={{
            background: 'rgba(24, 26, 27, 0.98)',
            borderRadius: 24,
            padding: '48px 40px',
            maxWidth: 500,
            width: '100%',
            boxShadow: '0 8px 40px 0 rgba(0,0,0,0.5)',
            border: '1px solid rgba(148,163,184,0.35)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
          }}
        >
          {/* Error Icon */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <IconAlertCircle size={40} color="#ef4444" />
          </div>

          {/* Error Title */}
          <div>
            <h2
              style={{
                color: '#fff',
                fontWeight: 700,
                fontSize: 24,
                marginBottom: 8,
                margin: 0,
              }}
            >
              Bağlantı Hatası
            </h2>
            <p
              style={{
                color: '#bdbdbd',
                fontSize: 16,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {error || 'Bağlantı verisi alınamadı'}
            </p>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              width: '100%',
              flexDirection: 'column',
            }}
          >
            <Button
              label="Tekrar Dene"
              onClick={() => window.location.reload()}
              style={{
                width: '100%',
                background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
                border: 'none',
                color: '#fff',
                fontWeight: 600,
                padding: '14px 24px',
                borderRadius: 12,
                fontSize: 16,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity = '0.9';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            />
            <Button
              label="Ana Sayfaya Dön"
              onClick={() => {
                window.location.href = '/';
              }}
              className="p-button-secondary"
              style={{
                width: '100%',
                background: 'transparent',
                border: '1px solid #555',
                color: '#bdbdbd',
                fontWeight: 600,
                padding: '14px 24px',
                borderRadius: 12,
                fontSize: 16,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = '#777';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = '#555';
              }}
            />
          </div>

          {/* Help Text */}
          <p
            style={{
              color: '#888',
              fontSize: 13,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Sorun devam ederse lütfen sayfayı yenileyin veya daha sonra tekrar
            deneyin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={`ws://${connectionData.url}`} // TODO - ugur: wss:// olarak değiştirilecek
      token={connectionData.token}
      connectOptions={{
        autoSubscribe: true,
      }}
      options={{
        publishDefaults: {
          videoCodec: 'h264',
        },
        adaptiveStream: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        e2ee: {
          keyProvider: e2eeKeyProvider,
          worker: new Worker(
            new URL('livekit-client/e2ee-worker', import.meta.url),
            { type: 'module' }
          ),
        },
      }}
      video={cameraOn}
      audio={micOn}
    >
      <ConferenceComponent
        hangup={() => {
          if (connectionData) {
            console.log('hangup');
          }
        }}
        roomName={roomNameLocal}
        onDisconnect={onDisconnect}
        isMember={isMember}
        e2eeRawKey={e2eeRawKey}
        e2eePassword={e2eePassword}
      />
    </LiveKitRoom>
  );
};

export default RoomComponent;
export function getCurrentRoomName() {
  const path = window.location.pathname.replace(/^\//, '');
  return path || null;
}
