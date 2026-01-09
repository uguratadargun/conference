import React, { useState, useRef, useEffect } from 'react';
import { IconUser } from '@tabler/icons-react';

interface WelcomePageProps {
  onJoin: (
    username: string,
    cameraOn: boolean,
    micOn: boolean,
    password?: string
  ) => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onJoin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [micOn, setMicOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Mic test state
  const [micLevel, setMicLevel] = useState(0);
  const [echoTest, setEchoTest] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Mic level meter setup
  useEffect(() => {
    if (stream && micOn) {
      const audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const update = () => {
        analyser.getByteTimeDomainData(dataArray);
        // Calculate RMS
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const val = (dataArray[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        setMicLevel(rms);
        animationRef.current = requestAnimationFrame(update);
      };
      update();
      return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        analyser.disconnect();
        source.disconnect();
        audioContext.close();
      };
    } else {
      setMicLevel(0);
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  }, [stream, micOn]);

  // Echo test: play mic audio to user
  useEffect(() => {
    if (echoTest && stream && micOn) {
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        audioRef.current.play();
      }
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.srcObject = null;
    }
  }, [echoTest, stream, micOn]);

  // Clean up stream on unmount or when camera is closed
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream]);

  // Open camera (with audio)
  const handleOpenCamera = async () => {
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);
      setCameraOpen(true);
      if (!micOn) setMicOn(true); // Kamera açınca mikrofon da açılır
    } catch {
      setError('Kamera veya mikrofon erişimi reddedildi.');
    }
  };

  // Close camera (keep audio if mic is on)
  const handleCloseCamera = async () => {
    setCameraOpen(false);
    if (micOn) {
      // Kamera kapandı, mikrofon açıksa sadece audio stream başlat
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setStream(audioStream);
      } catch {
        setError('Mikrofon erişimi reddedildi.');
        setStream(null);
      }
    } else {
      // Kamera ve mikrofon kapalıysa streami kapat
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  // Toggle mic (audio-only if camera is off)
  const handleToggleMic = async () => {
    if (!micOn) {
      // Mikrofon açılıyor
      setMicOn(true);
      if (!stream) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          setStream(audioStream);
        } catch {
          setError('Mikrofon erişimi reddedildi.');
        }
      }
    } else {
      // Mikrofon kapanıyor
      setMicOn(false);
      if (!cameraOpen && stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Lütfen bir kullanıcı adı girin.');
      return;
    }

    setError('');
    // Password'u kullanıcı manuel girdiği için direkt geçir
    const passwordToPass = password.trim() || undefined;
    onJoin(username.trim(), cameraOpen, micOn, passwordToPass);
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
      <form
        onSubmit={handleSubmit}
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
            marginBottom: 8,
            letterSpacing: 0.5,
          }}
        >
          Konferansa Katıl
        </h1>
        <div
          style={{
            color: '#bdbdbd',
            fontSize: 15,
            marginBottom: 28,
            textAlign: 'center',
          }}
        >
          Görüşmeye katılmadan önce adınızı girin ve kameranızı kontrol edin.
        </div>
        <div
          style={{
            marginBottom: 28,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 260,
              height: 160,
              borderRadius: 16,
              background:
                cameraOpen && stream
                  ? 'rgba(0,0,0,0.7)'
                  : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              boxShadow: '0 4px 24px 0 rgba(59,130,246,0.15)',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              border: cameraOpen && stream ? '2px solid #3b82f6' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {cameraOpen && stream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 16,
                }}
              />
            ) : (
              <IconUser size={64} color="#fff" style={{ opacity: 0.7 }} />
            )}
          </div>
        </div>
        <div style={{ width: '100%', marginBottom: 18, position: 'relative' }}>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '18px 14px 10px 14px',
              borderRadius: 12,
              border: '1.5px solid #333',
              background: '#161818',
              color: '#fff',
              fontSize: 17,
              outline: 'none',
              fontWeight: 500,
              boxSizing: 'border-box',
              transition: 'border 0.2s',
              boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08)',
            }}
            autoFocus
            placeholder=" "
          />
          <label
            htmlFor="username"
            style={{
              position: 'absolute',
              left: 18,
              top: username ? 4 : 18,
              fontSize: username ? 12 : 16,
              color: username ? '#3b82f6' : '#bdbdbd',
              background: 'rgba(24,26,27,0.98)',
              padding: '0 4px',
              borderRadius: 4,
              pointerEvents: 'none',
              transition: 'all 0.2s',
              fontWeight: 500,
            }}
          >
            Kullanıcı Adı
          </label>
        </div>
        {/* Password input - her zaman göster (kullanıcı manuel girecek) */}
        <div style={{ width: '100%', marginBottom: 18, position: 'relative' }}>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{
              width: '100%',
              padding: '18px 14px 10px 14px',
              borderRadius: 12,
              border: '1.5px solid #333',
              background: '#161818',
              color: '#fff',
              fontSize: 17,
              outline: 'none',
              fontWeight: 500,
              boxSizing: 'border-box',
              transition: 'border 0.2s',
              boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08)',
            }}
            placeholder=" "
          />
          <label
            htmlFor="password"
            style={{
              position: 'absolute',
              left: 18,
              top: password ? 4 : 18,
              fontSize: password ? 12 : 16,
              color: password ? '#3b82f6' : '#bdbdbd',
              background: 'rgba(24,26,27,0.98)',
              padding: '0 4px',
              borderRadius: 4,
              pointerEvents: 'none',
              transition: 'all 0.2s',
              fontWeight: 500,
            }}
          >
            Şifre
          </label>
        </div>
        {/* Camera/Mic controls below input, above join button */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            width: '100%',
            justifyContent: 'center',
            marginBottom: 18,
          }}
        >
          {cameraOpen && stream ? (
            <button
              type="button"
              onClick={handleCloseCamera}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '10px 22px',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              Kamerayı Kapat
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenCamera}
              style={{
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '10px 22px',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              Kamerayı Aç
            </button>
          )}
          <button
            type="button"
            onClick={handleToggleMic}
            style={{
              background: micOn ? '#22c55e' : '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '10px 22px',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {micOn ? 'Mikrofon Açık' : 'Mikrofon Kapalı'}
          </button>
        </div>
        {/* Mic test UI */}
        {micOn && stream && (
          <div
            style={{
              width: '100%',
              marginBottom: 18,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {/* Level bar */}
            <div
              style={{
                width: 180,
                height: 12,
                background: '#222',
                borderRadius: 8,
                overflow: 'hidden',
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, Math.round(micLevel * 100))}%`,
                  height: '100%',
                  background: micLevel > 0.05 ? '#22c55e' : '#888',
                  transition: 'width 0.1s',
                }}
              />
            </div>
            <div style={{ fontSize: 13, color: '#bdbdbd' }}>
              Mikrofon seviyesi
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {!echoTest ? (
                <button
                  type="button"
                  onClick={() => setEchoTest(true)}
                  style={{
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 18px',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  Sesimi Dinle
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEchoTest(false)}
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 18px',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  Durdur
                </button>
              )}
              <audio ref={audioRef} style={{ display: 'none' }} autoPlay />
            </div>
          </div>
        )}
        {error && (
          <div style={{ color: '#ef4444', marginBottom: 16, fontWeight: 500 }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 14,
            background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 18,
            border: 'none',
            cursor: 'pointer',
            marginTop: 8,
            boxShadow: '0 2px 12px 0 rgba(59,130,246,0.10)',
            letterSpacing: 0.2,
            transition: 'background 0.2s',
          }}
        >
          Odaya Katıl
        </button>
      </form>
    </div>
  );
};

export default WelcomePage;
