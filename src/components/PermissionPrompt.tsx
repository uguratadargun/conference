import React, { useState } from 'react';

interface PermissionPromptProps {
  onGranted: () => void;
}

const PermissionPrompt: React.FC<PermissionPromptProps> = ({ onGranted }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [showContinueWithoutDevice, setShowContinueWithoutDevice] = useState(false);

  // Check permission status on mount
  React.useEffect(() => {
    async function checkPermissionStatus() {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const cameraPermission = await navigator.permissions.query({
            name: 'camera' as PermissionName,
          });
          const microphonePermission = await navigator.permissions.query({
            name: 'microphone' as PermissionName,
          });

          if (cameraPermission.state === 'denied' || microphonePermission.state === 'denied') {
            setPermissionDenied(true);
            setError(
              'İzinler reddedilmiş. Lütfen tarayıcı ayarlarından mikrofon ve kamera izinlerini etkinleştirin.'
            );
          }
        } catch (e) {
          // Permissions API not fully supported, continue normally
        }
      }
    }
    checkPermissionStatus();
  }, []);

  const handleRequest = async () => {
    setError('');
    setLoading(true);
    
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setLoading(false);
      setError('Tarayıcınız medya cihazlarına erişimi desteklemiyor.');
      return;
    }
    
    // Try to get both video and audio first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      // Stop all tracks immediately - we only needed to request permission
      stream.getTracks().forEach(track => {
        track.stop();
      });
      
      setLoading(false);
      onGranted();
      return;
    } catch (err: any) {
      // If it's NotFoundError and not permission denied, allow continuing without device
      if ((err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') && 
          err.name !== 'NotAllowedError' && err.name !== 'PermissionDeniedError') {
        // Try audio only first
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ 
            video: false, 
            audio: true 
          });
          
          audioStream.getTracks().forEach(track => track.stop());
          
          setLoading(false);
          onGranted();
          return;
        } catch (audioErr: any) {
          // If audio also fails, try video only
          try {
            const videoStream = await navigator.mediaDevices.getUserMedia({ 
              video: true, 
              audio: false 
            });
            
            videoStream.getTracks().forEach(track => track.stop());
            
            setLoading(false);
            onGranted();
            return;
          } catch (videoErr: any) {
            // All attempts failed with NotFoundError - allow continuing without device
            setLoading(false);
            setShowContinueWithoutDevice(true);
            setError('Kamera veya mikrofon bulunamadı. Cihaz olmadan devam edebilirsiniz.');
            return;
          }
        }
      }
      
      // For other errors, show the error message
      setLoading(false);
      
      let errorMessage = '';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        errorMessage = 'İzin verilmedi. Lütfen tarayıcı ayarlarından mikrofon ve kamera izni verin.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Kamera veya mikrofon başka bir uygulama tarafından kullanılıyor olabilir. Lütfen diğer uygulamaları kapatıp tekrar deneyin.';
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Cihaz gereksinimleri karşılanamıyor. Lütfen farklı bir kamera veya mikrofon deneyin.';
      } else {
        errorMessage = `İzin alınamadı: ${err.message || err.name}. Lütfen tarayıcı ayarlarından mikrofon ve kamera izni verin.`;
      }
      
      setError(errorMessage);
    }
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
        padding: 0,
      }}
    >
      <div
        style={{
          background: 'rgba(24,26,27,0.98)',
          borderRadius: 28,
          boxShadow: '0 8px 40px 0 rgba(0,0,0,0.18)',
          minWidth: 320,
          maxWidth: 420,
          width: '100%',
          padding: '48px 32px 40px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* Minimal illustration or emoji */}
        <div style={{ marginBottom: 24, fontSize: 54, lineHeight: 1 }}>
          <span role="img" aria-label="camera and mic">
            🎥🎤
          </span>
        </div>
        <div
          style={{
            color: '#fff',
            fontWeight: 700,
            fontSize: 22,
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          Kullanıcıların toplantıda sizi görmesini ve duymasını istiyor musunuz?
        </div>
        <div
          style={{
            color: '#bdbdbd',
            fontSize: 15,
            marginBottom: 28,
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          Toplantıda mikrofonunuzu ve kameranızı istediğiniz zaman
          kapatabilirsiniz.
        </div>
        <button
          type="button"
          onClick={handleRequest}
          disabled={loading}
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 14,
            background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 17,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: 10,
            boxShadow: '0 2px 12px 0 rgba(59,130,246,0.10)',
            letterSpacing: 0.2,
            transition: 'background 0.2s',
            outline: 'none',
          }}
        >
          {loading ? 'Bekleyin...' : 'Mikrofon ve kamerayı kullan'}
        </button>
        {error && (
          <div
            style={{
              color: showContinueWithoutDevice ? '#fbbf24' : '#ef4444',
              marginTop: 8,
              marginBottom: showContinueWithoutDevice ? 12 : 0,
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}
        {showContinueWithoutDevice && (
          <button
            type="button"
            onClick={() => {
              setError('');
              setShowContinueWithoutDevice(false);
              onGranted();
            }}
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 14,
              background: '#1e293b',
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              border: '1.5px solid #334155',
              cursor: 'pointer',
              marginTop: 8,
              boxShadow: 'none',
              letterSpacing: 0.1,
              transition: 'background 0.2s, border 0.2s',
              outline: 'none',
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#334155')}
            onMouseOut={e => (e.currentTarget.style.background = '#1e293b')}
          >
            Cihaz olmadan devam et
          </button>
        )}
      </div>
    </div>
  );
};

export default PermissionPrompt;
