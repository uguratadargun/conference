import React, { useState } from 'react';

interface PermissionPromptProps {
  onGranted: () => void;
}

const PermissionPrompt: React.FC<PermissionPromptProps> = ({ onGranted }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setError('');
    setLoading(true);
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLoading(false);
      onGranted();
    } catch {
      setLoading(false);
      setError(
        'İzin verilmedi. Lütfen tarayıcı ayarlarından mikrofon ve kamera izni verin.'
      );
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
              color: '#ef4444',
              marginTop: 8,
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default PermissionPrompt;
