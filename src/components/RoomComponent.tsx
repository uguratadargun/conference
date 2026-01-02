import React, { useEffect, useState } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import { useLiveKit } from '../context/LiveKitContext';
import ConferenceComponent from './ConferenceComponent';
import { Button } from 'primereact/button';
import { IconRefresh, IconAlertCircle } from '@tabler/icons-react';

const generateRandomRoomName = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'room_';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

function getRoomNameFromUrl() {
  const path = window.location.pathname.replace(/^\//, '');
  return path || null;
}

// Main ConferenceCall Component with LiveKitRoom wrapper
const RoomComponent: React.FC<{
  username: string;
  cameraOn: boolean;
  micOn: boolean;
  onDisconnect?: () => void;
}> = ({ username, cameraOn, micOn, onDisconnect }) => {
  const { generateToken } = useLiveKit();
  const [connectionData, setConnectionData] = useState<{
    url: string;
    token: string;
    roomId: string;
    identity: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string>(() => {
    const fromUrl = getRoomNameFromUrl();
    if (fromUrl) return fromUrl;
    const generated = generateRandomRoomName();
    window.history.replaceState({}, '', `/${generated}`);
    return generated;
  });

  useEffect(() => {
    const connectToRoom = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await generateToken(username, roomName);
        setConnectionData(data);
      } catch (err) {
        console.error('Failed to get connection data:', err);
        setError('Failed to connect to the room. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    if (username && roomName) {
      connectToRoom();
    }
  }, [generateToken, username, roomName]);

  if (isLoading) {
    return (
      <div className="conference-container">
        <div className="loading-container">
          <IconRefresh size={24} className="rotating" />
          <span>Odaya bağlanıyor...</span>
        </div>
      </div>
    );
  }

  if (error || !connectionData) {
    return (
      <div className="conference-container">
        <div className="error-container">
          <IconAlertCircle size={24} />
          <span>{error || 'Bağlantı verisi alınamadı'}</span>
          <Button
            label="Tekrar dene"
            onClick={() => window.location.reload()}
            className="retry-button"
          />
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
        roomName={roomName}
        onDisconnect={onDisconnect}
      />
    </LiveKitRoom>
  );
};

export default RoomComponent;
export function getCurrentRoomName() {
  const path = window.location.pathname.replace(/^\//, '');
  return path || null;
}
