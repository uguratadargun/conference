import { LiveKitProvider } from './context/LiveKitContext';
import RoomComponent from './components/RoomComponent';
import 'primereact/resources/themes/lara-dark-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import React, { useState, useEffect } from 'react';
import WelcomePage from './components/WelcomePage';
import PermissionPrompt from './components/PermissionPrompt';
import {
  IconLinkOff,
  IconVideo,
  IconUsers,
  IconShield,
  IconInfoCircle,
} from '@tabler/icons-react';

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

function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState<boolean>(false);
  const [micOn, setMicOn] = useState<boolean>(true);
  const [e2eePassword, setE2eePassword] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [checkedPermission, setCheckedPermission] = useState(false);
  const [roomName, setRoomName] = useState<string | null>(() =>
    getRoomNameFromUrl()
  );

  const [token, setToken] = useState<string | null>(null);

  // URL query'de (?token=...) JWT varsa ve decoded.member === true ise, kullanıcı adını sormadan otomatik bağlan
  useEffect(() => {
    try {
      const search = window.location.search || '';
      if (!search) return;

      const params = new URLSearchParams(search);
      const token = params.get('token');
      if (!token) return;
      setToken(token);
      const decoded: any = decodeJwt(token);

      if (decoded && decoded.member === true) {
        const identity =
          decoded.name ||
          decoded.identity ||
          decoded.sub ||
          (decoded.id && String(decoded.id));

        if (identity) {
          setUsername(identity);
        }

        if (decoded.video && typeof decoded.video.room === 'string') {
          setRoomName(decoded.video.room);
        }
      }
    } catch {
      // token yoksa ya da JWT değilse sessizce geç
    }
  }, []);

  useEffect(() => {
    // Check if permissions are already granted
    async function checkPermissions() {
      try {
        // Try to query permissions first (works in Chrome/Edge)
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const cam = await navigator.permissions.query({
              name: 'camera' as PermissionName,
            });
            const mic = await navigator.permissions.query({
              name: 'microphone' as PermissionName,
            });
            if (cam.state === 'granted' && mic.state === 'granted') {
              setPermissionGranted(true);
              setCheckedPermission(true);
              return;
            }
          } catch (e) {
            // Permissions API not fully supported, try getUserMedia
          }
        }

        // Fallback: Try to access media devices to check permissions
        // This won't show a prompt if permissions are already granted
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          // If we get here, permissions are granted
          stream.getTracks().forEach(track => track.stop());
          setPermissionGranted(true);
        } catch (e: any) {
          // Permission not granted or device not found
          // Only set as not granted if it's a permission error, not device error
          if (
            e.name === 'NotAllowedError' ||
            e.name === 'PermissionDeniedError'
          ) {
            setPermissionGranted(false);
          } else {
            // For other errors (like NotFoundError), we'll show the prompt
            // so user can choose to continue without device
            setPermissionGranted(false);
          }
        }
      } catch (e) {
        // If all checks fail, assume we need to ask
        setPermissionGranted(false);
      }
      setCheckedPermission(true);
    }
    checkPermissions();
  }, []);

  useEffect(() => {
    // Update roomName if URL changes
    const onPopState = () => {
      setRoomName(getRoomNameFromUrl());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Don't render until we've checked permissions
  if (!checkedPermission) {
    return null;
  }

  return (
    <LiveKitProvider>
      {!permissionGranted ? (
        <PermissionPrompt onGranted={() => setPermissionGranted(true)} />
      ) : !roomName ? (
        <div
          style={{
            minHeight: '100vh',
            width: '100vw',
            background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
          }}
        >
          <div
            style={{
              background: 'rgba(24, 26, 27, 0.98)',
              borderRadius: 24,
              padding: '48px 40px',
              maxWidth: 600,
              width: '100%',
              boxShadow: '0 8px 40px 0 rgba(0,0,0,0.5)',
              border: '1px solid rgba(148,163,184,0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: 32,
            }}
          >
            {/* Header Section */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.3) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(107, 114, 128, 0.4)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
              >
                <IconVideo size={40} style={{ color: '#9ca3af' }} />
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <h1
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#f3f4f6',
                    letterSpacing: '-0.02em',
                    margin: 0,
                  }}
                >
                  Video Konferans Platformu
                </h1>
                <p
                  style={{
                    fontSize: 16,
                    color: '#9ca3af',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Toplantıya katılmak için size gönderilen özel bağlantıyı
                  kullanmanız gerekmektedir.
                </p>
              </div>
            </div>

            {/* Info Cards */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  padding: '20px',
                  background: 'rgba(55, 65, 81, 0.15)',
                  borderRadius: 16,
                  border: '1px solid rgba(107, 114, 128, 0.3)',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(75, 85, 99, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconLinkOff size={20} style={{ color: '#9ca3af' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#f3f4f6',
                      margin: '0 0 6px 0',
                    }}
                  >
                    Toplantı Bağlantısı Gerekli
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: '#9ca3af',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    Bu sayfaya doğrudan erişim sağlanamaz. Lütfen size
                    gönderilen toplantı linkini kullanarak katılım sağlayın.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  padding: '20px',
                  background: 'rgba(148, 163, 184, 0.05)',
                  borderRadius: 16,
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(148, 163, 184, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconUsers size={20} style={{ color: '#94a3b8' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#f3f4f6',
                      margin: '0 0 6px 0',
                    }}
                  >
                    Güvenli Katılım
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: '#9ca3af',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    Tüm toplantılar şifreli ve güvenli bir şekilde
                    gerçekleştirilmektedir. Sadece davet edilen katılımcılar
                    toplantıya erişebilir.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  padding: '20px',
                  background: 'rgba(148, 163, 184, 0.05)',
                  borderRadius: 16,
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(148, 163, 184, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IconShield size={20} style={{ color: '#94a3b8' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#f3f4f6',
                      margin: '0 0 6px 0',
                    }}
                  >
                    Gizlilik ve Güvenlik
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: '#9ca3af',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    Toplantılarınız end-to-end şifreleme ile korunmaktadır.
                    Verileriniz güvende.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '16px',
                background: 'rgba(148, 163, 184, 0.05)',
                borderRadius: 12,
                border: '1px solid rgba(148, 163, 184, 0.1)',
              }}
            >
              <IconInfoCircle size={18} style={{ color: '#94a3b8' }} />
              <p
                style={{
                  fontSize: 13,
                  color: '#9ca3af',
                  margin: 0,
                  textAlign: 'center',
                }}
              >
                Toplantı linkiniz yok mu? Lütfen toplantı organizatörü ile
                iletişime geçin.
              </p>
            </div>
          </div>
        </div>
      ) : username ? (
        <RoomComponent
          username={username}
          cameraOn={cameraOn}
          micOn={micOn}
          token={token}
          roomName={roomName}
          e2eePassword={e2eePassword}
          onDisconnect={() => {
            setUsername(null);
            setRoomName(null);
            setE2eePassword(null);
            window.history.pushState({}, '', '/');
          }}
        />
      ) : (
        <WelcomePage
          onJoin={(
            name: string,
            camera: boolean,
            mic: boolean,
            password?: string
          ) => {
            setUsername(name);
            setCameraOn(camera);
            setMicOn(mic);
            setE2eePassword(password || null);
          }}
        />
      )}
    </LiveKitProvider>
  );
}

export default App;
