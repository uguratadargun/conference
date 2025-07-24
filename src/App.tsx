import { LiveKitProvider } from './context/LiveKitContext';
import RoomComponent from './components/RoomComponent';
import 'primereact/resources/themes/lara-dark-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import React, { useState, useEffect } from 'react';
import WelcomePage from './components/WelcomePage';
import PermissionPrompt from './components/PermissionPrompt';

function getRoomNameFromUrl() {
  const path = window.location.pathname.replace(/^\//, '');
  return path || null;
}

const LandingPage: React.FC<{
  onCreateLink: (room: string) => void;
  onStartMeeting: (room: string) => void;
}> = ({ onCreateLink, onStartMeeting }) => {
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateRoomName = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  };

  const handleCreateLink = async () => {
    setCopied(false);
    const room = generateRoomName();
    const link = `${window.location.origin}/${room}`;
    setCreatedLink(link);
    onCreateLink(room);
    // Clipboard API fallback for better compatibility
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    } else {
      // fallback for insecure context or older browsers
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
      document.body.removeChild(textArea);
    }
  };

  const handleStartMeeting = () => {
    const room = generateRoomName();
    onStartMeeting(room);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 32,
      }}
    >
      <div
        style={{
          background: 'rgba(24,26,27,0.98)',
          borderRadius: 24,
          boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
          minWidth: 320,
          maxWidth: 380,
          width: '100%',
          padding: '40px 32px 32px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <h1
          style={{
            color: '#fff',
            fontWeight: 800,
            fontSize: 28,
            marginBottom: 24,
          }}
        >
          <img
            src="https://ordulu.com/lib/images/logo.png"
            alt="Ordulu Logo"
            style={{
              maxWidth: '100%',
              height: 'auto',
              marginBottom: 16,
              display: 'block',
            }}
          />
        </h1>
        <div
          style={{
            color: '#bdbdbd',
            fontSize: 15,
            marginBottom: 24,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          <b>Toplantı planla:</b> Bir toplantı odası linki oluşturur ve linki
          kopyalar. Bu linki başkalarıyla paylaşarak toplantıya davet
          edebilirsiniz. Toplantı zamanı geldiğinde katılımcılar bu linke
          tıklayarak toplantıya katılabilirler.
        </div>
        <button
          style={{
            width: '100%',
            padding: '12px 0',
            borderRadius: 6,
            background: '#1e293b',
            color: '#fff',
            fontWeight: 600,
            fontSize: 17,
            border: '1.5px solid #334155',
            cursor: 'pointer',
            marginBottom: 16,
            boxShadow: 'none',
            letterSpacing: 0.1,
            transition: 'background 0.2s, border 0.2s',
          }}
          onClick={handleCreateLink}
          onMouseOver={e => (e.currentTarget.style.background = '#334155')}
          onMouseOut={e => (e.currentTarget.style.background = '#1e293b')}
        >
          Toplantıyı Planla
        </button>
        {createdLink && (
          <div
            style={{
              color: '#22c55e',
              fontWeight: 600,
              marginTop: 8,
              wordBreak: 'break-all',
              textAlign: 'center',
            }}
          >
            Bağlantı:{' '}
            <a href={createdLink} style={{ color: '#3b82f6' }}>
              {createdLink}
            </a>
            <div
              style={{
                color: '#16a34a',
                fontWeight: 500,
                marginTop: 4,
                fontSize: 15,
              }}
            >
              {copied ? 'Bağlantı kopyalandı!' : ''}
            </div>
          </div>
        )}
        <div
          style={{
            color: '#bdbdbd',
            fontSize: 15,
            marginBottom: 24,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          <b>Şimdi başlat:</b> Hemen yeni bir toplantı başlatır ve sizi toplantı
          odasına yönlendirir. Toplantı başladıktan sonra davet linki
          oluşturabilirsiniz.
        </div>
        <button
          style={{
            width: '100%',
            padding: '12px 0',
            borderRadius: 6,
            background: '#3566a3',
            color: '#fff',
            fontWeight: 600,
            fontSize: 17,
            border: '1.5px solid #2a4d7a',
            cursor: 'pointer',
            marginTop: 16,
            boxShadow: 'none',
            letterSpacing: 0.1,
            transition: 'background 0.2s, border 0.2s',
          }}
          onClick={handleStartMeeting}
          onMouseOver={e => (e.currentTarget.style.background = '#2a4d7a')}
          onMouseOut={e => (e.currentTarget.style.background = '#3566a3')}
        >
          Şimdi başlat
        </button>
      </div>
    </div>
  );
};

function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState<boolean>(false);
  const [micOn, setMicOn] = useState<boolean>(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [checkedPermission, setCheckedPermission] = useState(false);
  const [roomName, setRoomName] = useState<string | null>(() =>
    getRoomNameFromUrl()
  );

  useEffect(() => {
    // Check camera and mic permissions
    async function checkPermissions() {
      try {
        const cam = await navigator.permissions.query({
          name: 'camera' as PermissionName,
        });
        const mic = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        });
        if (cam.state === 'granted' && mic.state === 'granted') {
          setPermissionGranted(true);
        }
      } catch {}
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

  const handleCreateLink = (room: string) => {
    // Only show the link, do not navigate
  };

  const handleStartMeeting = (room: string) => {
    window.history.pushState({}, '', `/${room}`);
    setRoomName(room);
  };

  if (!checkedPermission) return null;

  return (
    <LiveKitProvider>
      {!permissionGranted ? (
        <PermissionPrompt onGranted={() => setPermissionGranted(true)} />
      ) : !roomName ? (
        <LandingPage
          onCreateLink={handleCreateLink}
          onStartMeeting={handleStartMeeting}
        />
      ) : username ? (
        <RoomComponent username={username} cameraOn={cameraOn} micOn={micOn} />
      ) : (
        <WelcomePage
          onJoin={(name: string, camera: boolean, mic: boolean) => {
            setUsername(name);
            setCameraOn(camera);
            setMicOn(mic);
          }}
        />
      )}
    </LiveKitProvider>
  );
}

export default App;
