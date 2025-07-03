import React, { useEffect, useState } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import { useLiveKit } from '../context/LiveKitContext';
import ConferenceComponent from './ConferenceComponent';
import { Button } from 'primereact/button';
import { IconRefresh, IconAlertCircle } from '@tabler/icons-react';

// Main ConferenceCall Component with LiveKitRoom wrapper
const RoomComponent: React.FC = () => {
  const { generateToken } = useLiveKit();
  const [connectionData, setConnectionData] = useState<{
    url: string;
    token: string;
    roomId: string;
    identity: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sendDenyCallRequest = async (
    url: string,
    roomId: string,
    identity: string,
    token: string
  ) => {
    try {
      const response = await fetch(
        `http://${url}/twirp/livekit.RoomService/DenyCall`,
        {
          method: 'POST',
          body: JSON.stringify({
            roomId,
            identity,
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error('Failed to send deny call request:', error);
    }
  };

  useEffect(() => {
    const connectToRoom = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await generateToken();
        setConnectionData(data);
      } catch (err) {
        console.error('Failed to get connection data:', err);
        setError('Failed to connect to the room. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    connectToRoom();
  }, [generateToken]);

  if (isLoading) {
    return (
      <div className="conference-container">
        <div className="loading-container">
          <IconRefresh size={24} className="rotating" />
          <span>Connecting to room...</span>
        </div>
      </div>
    );
  }

  if (error || !connectionData) {
    return (
      <div className="conference-container">
        <div className="error-container">
          <IconAlertCircle size={24} />
          <span>{error || 'Failed to get connection data'}</span>
          <Button
            label="Retry"
            onClick={() => window.location.reload()}
            className="retry-button"
          />
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={`ws://${connectionData.url}`}
      token={connectionData.token}
      connectOptions={{
        autoSubscribe: true,
      }}
      options={{
        publishDefaults: {
          videoCodec: 'h264',
        },
      }}
      startAsActive={true}
    >
      <ConferenceComponent
        hangup={() => {
          if (connectionData) {
            sendDenyCallRequest(
              connectionData.url,
              connectionData.roomId,
              connectionData.identity,
              connectionData.token
            );
          }
        }}
      />
    </LiveKitRoom>
  );
};

export default RoomComponent;
